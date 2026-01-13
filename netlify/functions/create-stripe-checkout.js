const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event, context) {
  // Cabeçalhos para evitar erro de CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    // URL base (Local ou Produção)
    const baseUrl = process.env.URL || "http://localhost:8888";

    // --- CONFIGURAÇÃO DE PREÇO FIXO ---
    // R$ 6,97 = 697 centavos (O Stripe trabalha com centavos inteiros)
    const UNIT_AMOUNT_CENTS = 697;

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded', // Modo embutido na página
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Apostila Digital - Crucifixo em Feltro',
              // Aponta para a imagem que você salvou em public/images/crucifixo.jpg
              images: [`${baseUrl}/images/crucifixo.jpg`],
            },
            unit_amount: UNIT_AMOUNT_CENTS, // Valor fixo
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Redirecionamento após o pagamento
      return_url: `${baseUrl}/obrigado.html?session_id={CHECKOUT_SESSION_ID}`,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        clientSecret: session.client_secret 
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
