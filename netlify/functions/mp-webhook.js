exports.handler = async function(event) {
    const { topic, id } = event.queryStringParameters;
    
    // Verifica se é notificação de pagamento
    if (topic === 'payment' && id) {
        try {
            // 1. Consulta o Mercado Pago para saber quem pagou
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            });
            const payment = await mpResponse.json();

            // 2. Se o pagamento foi aprovado, prepara o envio
            if (payment.status === 'approved') {
                const emailCliente = payment.payer.email;
                
                // Link da sua apostila no Supabase
                const linkApostila = "https://lrbykdpwzixmgganirvo.supabase.co/storage/v1/object/public/produtos/crucifixo_feltro.pdf";

                console.log(`Pagamento Aprovado! Enviando via EmailJS para: ${emailCliente}`);

                // 3. Monta os dados para o EmailJS (usando as variáveis que configuramos no Netlify)
                const emailData = {
                    service_id: process.env.EMAILJS_SERVICE_ID,
                    template_id: process.env.EMAILJS_TEMPLATE_ID,
                    user_id: process.env.EMAILJS_PUBLIC_KEY,
                    accessToken: process.env.EMAILJS_PRIVATE_KEY,
                    template_params: {
                        to_email: emailCliente,   // Vai para o e-mail do cliente
                        link_download: linkApostila, // O link do PDF
                        nome_produto: "Apostila Crucifixo em Feltro" // O nome do produto
                    }
                };

                // 4. Envia o e-mail
                await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(emailData)
                });

                console.log('Email enviado com sucesso via EmailJS!');
            }
        } catch (error) {
            console.error('Erro:', error);
            // Retorna 200 para o Mercado Pago não ficar tentando reenviar infinitamente
            return { statusCode: 200, body: 'Erro processado' };
        }
    }
    return { statusCode: 200, body: 'OK' };
};
