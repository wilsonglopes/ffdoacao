const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { amount } = JSON.parse(event.body);

    // Converte para centavos (inteiro)
    const amountInCents = Math.round(parseFloat(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'brl',
      automatic_payment_methods: {
        enabled: true,
      },
      description: 'Doação Feltro Fácil',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
      }),
    };

  } catch (error) {
    console.error('Erro Stripe:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};