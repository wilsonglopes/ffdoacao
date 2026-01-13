exports.handler = async function(event) {
    let paymentId = null;

    // --- PARTE 1: Descobrir o ID do Pagamento (O Pulo do Gato) ---
    try {
        // Tenta ler do "Corpo" (Novo Webhook do Mercado Pago)
        if (event.body) {
            const body = JSON.parse(event.body);
            // Geralmente vem em body.data.id ou body.id
            paymentId = body.data?.id || body.id;
            console.log(`[Webhook] Recebido via Body. ID: ${paymentId}, Action: ${body.action}`);
        }
    } catch (e) {
        console.log("[Webhook] Erro ao ler Body:", e.message);
    }

    // Se não achou no corpo, tenta na "URL" (IPN Antigo)
    if (!paymentId && event.queryStringParameters) {
        paymentId = event.queryStringParameters.id || event.queryStringParameters['data.id'];
        console.log(`[Webhook] Recebido via Query. ID: ${paymentId}`);
    }

    // Se depois de tudo não tiver ID, paramos aqui
    if (!paymentId) {
        console.log("[Webhook] Ignorado: Nenhum ID de pagamento encontrado.");
        return { statusCode: 200, body: 'Ignored' };
    }

    // --- PARTE 2: Consultar e Enviar E-mail ---
    try {
        console.log(`[Webhook] Consultando pagamento ID: ${paymentId} no Mercado Pago...`);

        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
        });

        if (!mpResponse.ok) {
            console.log(`[Webhook] Erro MP: ${mpResponse.status} - ${mpResponse.statusText}`);
            throw new Error('Falha ao consultar Mercado Pago');
        }

        const payment = await mpResponse.json();
        console.log(`[Webhook] Status do pagamento: ${payment.status}`);

        // Só envia se estiver APROVADO
        if (payment.status === 'approved') {
            const emailCliente = payment.payer.email;
            console.log(`[Webhook] Cliente: ${emailCliente}. Preparando envio EmailJS...`);

            // Dados do EmailJS
            const emailData = {
                service_id: process.env.EMAILJS_SERVICE_ID,
                template_id: process.env.EMAILJS_TEMPLATE_ID,
                user_id: process.env.EMAILJS_PUBLIC_KEY,
                accessToken: process.env.EMAILJS_PRIVATE_KEY,
                template_params: {
                    to_email: emailCliente,
                    link_download: "https://lrbykdpwzixmgganirvo.supabase.co/storage/v1/object/public/produtos/crucifixo_feltro.pdf",
                    nome_produto: "Apostila Crucifixo em Feltro"
                }
            };

            const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailData)
            });

            if (emailRes.ok) {
                console.log('[Webhook] SUCESSO! E-mail enviado.');
            } else {
                const emailErr = await emailRes.text();
                console.error('[Webhook] Erro no EmailJS:', emailErr);
            }
        }
    } catch (error) {
        console.error('[Webhook] Erro fatal:', error);
        return { statusCode: 200, body: 'Erro processado' };
    }

    return { statusCode: 200, body: 'OK' };
};
