exports.handler = async function(event) {
    const { topic, id } = event.queryStringParameters;
    
    // Verifica se é notificação de pagamento
    if (topic === 'payment' && id) {
        try {
            // 1. Consulta o Mercado Pago
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            });
            const payment = await mpResponse.json();

            // 2. Se aprovado, envia e-mail
            if (payment.status === 'approved') {
                const emailCliente = payment.payer.email;
                const linkApostila = "https://lrbykdpwzixmgganirvo.supabase.co/storage/v1/object/public/produtos/crucifixo_feltro.pdf";

                console.log(`Pagamento Aprovado! Enviando via EmailJS para: ${emailCliente}`);

                const emailData = {
                    service_id: process.env.EMAILJS_SERVICE_ID,
                    template_id: process.env.EMAILJS_TEMPLATE_ID,
                    user_id: process.env.EMAILJS_PUBLIC_KEY,
                    accessToken: process.env.EMAILJS_PRIVATE_KEY,
                    template_params: {
                        to_email: emailCliente,
                        link_download: linkApostila,
                        nome_produto: "Apostila Crucifixo em Feltro"
                    }
                };

                await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(emailData)
                });

                console.log('Email enviado com sucesso via EmailJS!');
            }
        } catch (error) {
            console.error('Erro:', error);
            return { statusCode: 200, body: 'Erro processado' };
        }
    }
    return { statusCode: 200, body: 'OK' };
};
