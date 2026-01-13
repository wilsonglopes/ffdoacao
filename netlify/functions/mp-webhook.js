exports.handler = async function(event) {
    // Pegamos os dados que o Mercado Pago envia na URL
    const { topic, id } = event.queryStringParameters;
    
    // Verificamos se é um aviso de pagamento
    if (topic === 'payment' && id) {
        try {
            // 1. Perguntamos ao Mercado Pago: "Quem pagou esse ID?"
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: { 
                    'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` 
                }
            });
            
            if (!mpResponse.ok) {
                throw new Error('Falha ao buscar dados no Mercado Pago');
            }

            const payment = await mpResponse.json();

            // 2. Se o pagamento foi APROVADO, enviamos o e-mail
            if (payment.status === 'approved') {
                const emailCliente = payment.payer.email;
                
                // Link do seu PDF (Você vai substituir aqui embaixo)
                const linkPDF = "https://lrbykdpwzixmgganirvo.supabase.co/storage/v1/object/public/produtos/crucifixo_feltro.pdf"; 

                console.log(`Pagamento aprovado. Enviando e-mail para: ${emailCliente}`);

                // 3. Envio via API da Resend
                const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'Feltro Fácil <onboarding@resend.dev>', // Use este remetente para testar ou configure seu domínio no Resend
                        to: emailCliente,
                        subject: 'Sua Apostila Chegou! ✝️ (Crucifixo em Feltro)',
                        html: `
                          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                            <h1 style="color: #800080;">Obrigado pela compra!</h1>
                            <p>Olá,</p>
                            <p>O pagamento da sua <strong>Apostila Digital (Crucifixo em Feltro)</strong> foi confirmado.</p>
                            <p>Você pode baixar o arquivo PDF clicando no botão abaixo:</p>
                            <br>
                            <div style="text-align: center;">
                                <a href="${linkPDF}" style="background-color: #800080; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                                  BAIXAR APOSTILA AGORA
                                </a>
                            </div>
                            <br>
                            <p style="font-size: 12px; color: #666;">Se o botão não funcionar, copie e cole este link no seu navegador: ${linkPDF}</p>
                          </div>
                        `
                    })
                });

                if (!emailResponse.ok) {
                    const emailError = await emailResponse.json();
                    console.error('Erro ao enviar e-mail:', emailError);
                } else {
                    console.log('E-mail enviado com sucesso!');
                }
            }
        } catch (error) {
            console.error('Erro no Webhook:', error);
            // Mesmo com erro interno nosso, retornamos 200 para o MP não ficar tentando reenviar infinitamente
            return { statusCode: 200, body: 'Erro processado' };
        }
    }

    // Retorna OK para o Mercado Pago saber que recebemos a mensagem
    return { statusCode: 200, body: 'OK' };
};
