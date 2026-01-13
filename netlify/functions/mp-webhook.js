exports.handler = async function(event) {
    let paymentId = null;
    console.log("[Webhook] Recebido! Verificando dados...");

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
        console.log("[Webhook] Erro leitura:", e.message);
    }

    if (!paymentId) {
        return { statusCode: 200, body: 'Ignored' };
    }

    // 2. CONSULTA O MERCADO PAGO
    try {
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
        });

        if (!mpResponse.ok) {
            console.log(`[Webhook] Erro API MP: ${mpResponse.status}`);
            return { statusCode: 200, body: 'MP Error' };
        }

        const payment = await mpResponse.json();
        console.log(`[Webhook] ID: ${paymentId} | Status: ${payment.status}`);

        if (payment.status === 'approved') {
            // --- AQUI ESTÁ A CORREÇÃO BLINDADA ---
            // Tenta pegar do payer.email. Se falhar, pega do external_reference
            let emailCliente = payment.payer?.email;
            
            if (!emailCliente || emailCliente === 'null') {
                console.log("[Webhook] Email no payer vazio. Tentando external_reference...");
                emailCliente = payment.external_reference;
            }

            console.log(`[Webhook] Email Final para envio: ${emailCliente}`);

            // Se ainda assim não tiver email, aborta para não dar erro
            if (!emailCliente || !emailCliente.includes('@')) {
                console.error("[Webhook] ERRO CRÍTICO: Email não encontrado em lugar nenhum.");
                return { statusCode: 200, body: 'No Email Found' };
            }

            // Envia o E-mail
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
                console.log('[Webhook] SUCESSO! E-mail enviado.');
            } else {
                console.error('[Webhook] Falha no EmailJS:', await emailRes.text());
            }
        }
    } catch (error) {
        console.error('[Webhook] Erro fatal:', error);
    }

    return { statusCode: 200, body: 'OK' };
};
