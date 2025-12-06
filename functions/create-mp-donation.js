const mercadopago = require('mercadopago');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  // Configura com seu Access Token (variável de ambiente)
  mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

  try {
    const { amount, description } = JSON.parse(event.body);

    const preference = {
      items: [
        {
          title: description || 'Doação Feltro Fácil',
          unit_price: parseFloat(amount),
          quantity: 1,
        }
      ],
      back_urls: {
        success: "https://seusite.com/obrigado.html",
        failure: "https://seusite.com/doacao.html",
        pending: "https://seusite.com/doacao.html"
      },
      auto_return: "approved",
      statement_descriptor: "FELTROFACIL",
    };

    const response = await mercadopago.preferences.create(preference);

    return {
      statusCode: 200,
      body: JSON.stringify({ preferenceId: response.body.id }),
    };

  } catch (error) {
    console.error('Erro MP:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};