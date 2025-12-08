const mercadopago = require('mercadopago');

exports.handler = async function(event, context) {
  // Headers para evitar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  // Configura Token
  mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

  try {
    const { amount } = JSON.parse(event.body);
    const baseUrl = process.env.URL || "http://localhost:8888";

    const preference = {
      items: [
        {
          title: 'Contribuição Feltro Fácil',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: parseFloat(amount)
        }
      ],
      // URLs para onde o usuário vai APÓS o pagamento ser processado pelo Brick
      back_urls: {
        success: `${baseUrl}/obrigado.html?amount=${amount}`,
        failure: `${baseUrl}/index.html`,
        pending: `${baseUrl}/index.html`
      },
      auto_return: "approved",
      binary_mode: true, // Aprovação imediata (útil para doação)
      statement_descriptor: "FELTROFACIL"
    };

    const response = await mercadopago.preferences.create(preference);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        id: response.body.id // O Brick precisa EXATAMENTE deste ID
      }),
    };

  } catch (error) {
    console.error('Erro MP:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro ao criar preferência MP' }),
    };
  }
};
