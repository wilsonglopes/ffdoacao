exports.handler = async function(event, context) {
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
      payment_methods: {
        excluded_payment_types: [],
        installments: 1
      },
      back_urls: {
        success: `${baseUrl}/obrigado.html?amount=${amount}`,
        failure: `${baseUrl}/index.html`,
        pending: `${baseUrl}/index.html`
      },
      auto_return: "approved",
      // binary_mode true ajuda a evitar pagamentos pendentes
      binary_mode: true 
    };

    // Chamada nativa (Fetch) - Leve e à prova de falhas de deploy
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
      console.error('Erro API MP:', data);
      throw new Error(JSON.stringify(data));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        // Retornamos o init_point para o Iframe
        init_point: data.init_point 
      }),
    };

  } catch (error) {
    console.error('Erro Função:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro ao criar preferência MP' }),
    };
  }
};
