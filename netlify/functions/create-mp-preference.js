exports.handler = async function(event, context) {
  // Headers para evitar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { amount } = JSON.parse(event.body);
    const baseUrl = process.env.URL || "http://localhost:8888";

    // Dados da preferência
    const preferenceData = {
      items: [
        {
          title: 'Contribuição Feltro Fácil',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: parseFloat(amount)
        }
      ],
      back_urls: {
        success: `${baseUrl}/obrigado.html?amount=${amount}`,
        failure: `${baseUrl}/index.html`,
        pending: `${baseUrl}/index.html`
      },
      auto_return: "approved",
      binary_mode: true,
      statement_descriptor: "FELTROFACIL"
    };

    // Chamada direta à API do Mercado Pago (sem usar a biblioteca pesada)
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        id: data.id // Retorna o ID para o Frontend
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
