exports.handler = async function(event) {
    const { topic, id } = event.queryStringParameters;
    
    // Só processamos se for notificação de pagamento
    if (topic === 'payment') {
        try {
            // 1. Pergunta ao Mercado Pago quem pagou
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            });
            const payment = await mpResponse.json();

            // 2. Se aprovado, envia o e-mail
            if (payment.status === 'approved') {
                const emailCliente = payment.payer.email;
                
                // Envia via Resend (Você precisa da API Key no Netlify)
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'Feltro Fácil <onboarding@resend.dev>', // Ou seu domínio verificado
                        to: emailCliente,
                        subject: 'Sua Apostila Chegou! ✝️',
                        html: `
                          <div style="font-family: sans-serif; color: #333;">
                            <h1>Obrigado pela compra!</h1>
                            <p>Aqui está a sua <strong>Apostila Crucifixo em Feltro</strong>.</p>
                            <p>Clique no botão abaixo para baixar:</p>
                            <a href="LINK_DO_SEU_PDF_AQUI" style="background-color: #800080; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">BAIXAR APOSTILA AGORA</a>
                          </div>
                        `
                    })
                });
                console.log('Email enviado para:', emailCliente);
            }
        } catch (error) {
            console.error('Erro:', error);
            return { statusCode: 500, body: 'Erro interno' };
        }
    }
    return { statusCode: 200, body: 'OK' };
};
