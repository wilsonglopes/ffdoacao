// Inicializa o Stripe com a chave SECRETA (sk_live...)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { amount } = JSON.parse(event.body);

    // --- CONFIGURAÇÃO DA URL ---
    // Pega a URL do site automaticamente (Netlify ou Localhost)
    const baseUrl = process.env.URL || "http://localhost:8888";

    // O Stripe trabalha com centavos (R$ 10,00 = 1000 centavos)
    const amountInCents = Math.round(parseFloat(amount) * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Contribuição Feltro Fácil',
              // Ajuste do caminho da imagem: Removemos '/public' pois no site final ela fica na raiz
              images: [`${baseUrl}/images/logo.png`],
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // --- ALTERAÇÃO PRINCIPAL ---
      // Redireciona para obrigado.html levando o valor (amount) na URL
      success_url: `${baseUrl}/obrigado.html?amount=${amount}`,
      cancel_url: `${baseUrl}/index.html`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id }),
    };

  } catch (error) {
    console.error('Erro Stripe:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
