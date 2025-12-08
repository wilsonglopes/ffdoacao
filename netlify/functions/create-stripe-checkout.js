const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event, context) {
  // Cabeçalhos para evitar erro de CORS se necessário
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { amount } = JSON.parse(event.body);

    // --- CONFIGURAÇÃO DA URL (Crítico para o Stripe Embedded) ---
    // Se process.env.URL não existir (local), usa localhost.
    // O Stripe EXIGE uma URL absoluta válida para o return_url.
    const baseUrl = process.env.URL || "http://localhost:8888";

    // Converte para centavos
    const amountInCents = Math.round(parseFloat(amount) * 100);

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded', // OBRIGATÓRIO para o modal funcionar
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Contribuição Feltro Fácil',
              images: [`${baseUrl}/images/logo.png`],
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // return_url é obrigatório no modo embedded
      return_url: `${baseUrl}/obrigado.html?session_id={CHECKOUT_SESSION_ID}&amount=${amount}`,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        clientSecret: session.client_secret // O Frontend precisa EXATAMENTE disso
      }),
    };

  } catch (error) {
    console.error('Erro Stripe:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
