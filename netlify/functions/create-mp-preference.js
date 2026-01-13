exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const baseUrl = process.env.URL || "http://localhost:8888";
    const PRODUCT_PRICE = 6.97;

    // --- MUDANÇA 1: Ler o e-mail que veio do Frontend ---
    // O site manda: { amount: 6.97, email: "cliente@gmail.com" }
    const { email } = JSON.parse(event.body || '{}');

    const preferenceData = {
      items: [
        {
          title: 'Apostila Digital - Crucifixo em Feltro',
          description: 'Arquivo PDF enviado por e-mail',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: PRODUCT_PRICE
        }
      ],
      // --- MUDANÇA 2: Enviar o e-mail para o Mercado Pago ---
      // Isso preenche o campo automaticamente e garante o envio do produto
      payer: {
        email: email || 'email_nao_informado@loja.com'
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: 1
      },
      back_urls: {
        success: `${baseUrl}/obrigado.html`,
        failure: `${baseUrl}/index.html`,
        pending: `${baseUrl}/index.html`
      },
      auto_return: "approved",
      binary_mode: true,
      statement_descriptor: "FELTROFACIL"
    };

    // Chamada nativa (Fetch) para a API do Mercado Pago
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
        init_point: data.init_point,
        id: data.id 
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
