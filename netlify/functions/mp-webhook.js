exports.handler = async function(event) {
    let paymentId = null;

    // --- LOG PARA DEBUG (Vai aparecer no painel do Netlify) ---
    console.log("[Webhook] Recebido! Verificando dados...");

    // 1. Tenta ler do "Corpo" (Formato JSON que vimos na sua imagem)
    try {
        if (event.body) {
            const body = JSON.parse(event.body);
            // O Mercado Pago manda em data.id
            paymentId = body.data?.id || body.id;
            console.log(`[Webhook] ID encontrado no Body: ${paymentId}`);
        }
    } catch (e) {
        console.log("[Webhook] Erro ao ler Body:", e.message);
    }

    // 2. Se não achou, tenta na URL (Só por garantia)
    if (!paymentId && event.queryStringParameters) {
        paymentId = event.queryStringParameters.id || event.queryStringParameters['data.id'];
        console.log(`[Webhook] ID encontrado na Query: ${paymentId}`);
    }

    // Se não achou ID nenhum, aborta
    if (!paymentId) {
        console.log("[Webhook] ERRO: Nenhum ID encontrado na notificação.");
        return { statusCode: 200, body: 'Ignored' };
    }

    // --- CONSULTA AO MERCADO PAGO ---
    try {
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
        });

        if (!mpResponse.ok) {
            console.log(`[Webhook] Erro na API do MP: ${mpResponse.status}`);
            return { statusCode: 200, body: 'MP Error' };
        }

        const payment = await mpResponse.json();
        console.log(`[Webhook] Status do pagamento: ${payment.status}`);

        // SÓ ENVIA SE ESTIVER APROVADO
        if (payment.status === 'approved') {
            const emailCliente = payment.payer.email;
            console.log(`[Webhook] Enviando e-mail para: ${emailCliente}`);

            const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: process.env.EMAILJS_SERVICE_ID,
                    template_id: process.env.EMAILJS_TEMPLATE_ID,
                    user_id: process.env.EMAILJS_PUBLIC_KEY,
                    accessToken: process.env.EMAILJS_PRIVATE_KEY,
                    template_params: {
                        to_email: emailCliente,
                        link_download: "https://lrbykdpwzixmgganirvo.supabase.co/storage/v1/object/public/produtos/crucifixo_feltro.pdf",
                        nome_produto: "Apostila Crucifixo em Feltro"
                    }
                })
            });

            if (emailRes.ok) {
                console.log('[Webhook] SUCESSO TOTAL! E-mail enviado.');
            } else {
                console.error('[Webhook] Falha no EmailJS:', await emailRes.text());
            }
        } else {
            console.log('[Webhook] Pagamento ainda não aprovado (status: ' + payment.status + ')');
        }

    } catch (error) {
        console.error('[Webhook] Erro fatal:', error);
    }

    return { statusCode: 200, body: 'OK' };
};
