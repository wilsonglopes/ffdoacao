exports.handler = async function(event) {
    let paymentId = null;

    // 1. TENTA LER O ID
    try {
        if (event.body) {
            const body = JSON.parse(event.body);
            paymentId = body.data?.id || body.id;
        }
        if (!paymentId && event.queryStringParameters) {
            paymentId = event.queryStringParameters.id || event.queryStringParameters['data.id'];
        }
    } catch (e) {
        console.log("[Webhook] Erro leitura body:", e.message);
    }

    if (!paymentId) {
        return { statusCode: 200, body: 'Ignored' };
    }

    // 2. CONSULTA O MERCADO PAGO
    try {
        console.log(`[Webhook] Consultando ID: ${paymentId}`);
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
        });

        if (!mpResponse.ok) {
            console.log(`[Webhook] Erro API MP: ${mpResponse.status}`);
            return { statusCode: 200, body: 'MP Error' };
        }

        const payment = await mpResponse.json();
        const status = payment.status;
        console.log(`[Webhook] Status: ${status}`);

        if (status === 'approved') {
            // --- ESTRATÉGIA METADATA ---
            // 1. Tenta Metadata (O Cofre)
            // 2. Tenta Payer (O Padrão)
            // 3. Tenta External Reference (O Backup)
            let emailCliente = payment.metadata?.user_email;

            if (!emailCliente) {
                 console.log("[Webhook] Metadata vazio. Tentando payer.email...");
                 emailCliente = payment.payer?.email;
            }
            
            if (!emailCliente) {
                console.log("[Webhook] Payer vazio. Tentando external_reference...");
                emailCliente = payment.external_reference;
            }

            console.log(`[Webhook] EMAIL RESGATADO: ${emailCliente}`);

            // Validação final antes de enviar
            if (!emailCliente || !emailCliente.includes('@') || emailCliente === 'email_nao_informado@loja.com') {
                console.error("[Webhook] ERRO FATAL: Email inválido ou não encontrado.");
                return { statusCode: 200, body: 'No valid email' };
            }

            // Envia EmailJS
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
                console.log('[Webhook] SUCESSO! E-mail disparado.');
            } else {
                console.error('[Webhook] Falha no EmailJS:', await emailRes.text());
            }
        }
    } catch (error) {
        console.error('[Webhook] Erro Catch:', error);
    }

    return { statusCode: 200, body: 'OK' };
};
