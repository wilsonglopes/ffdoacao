exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    // Definimos a URL base (Local ou Produção)
    const baseUrl = process.env.URL || "http://localhost:8888";
    
    // PREÇO FIXO DO PRODUTO (Para segurança)
    const PRODUCT_PRICE = 6.97;

    // Dados da preferência
    const preferenceData = {
      items: [
        {
          title: 'Apostila Digital - Crucifixo em Feltro', // Nome correto do produto
          description: 'Arquivo PDF enviado por e-mail',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: PRODUCT_PRICE // Valor fixo
        }
      ],
      payment_methods: {
        excluded_payment_types: [],
        installments: 1 // Pagamento à vista (comum para valores baixos)
      },
      back_urls: {
        success: `${baseUrl}/obrigado.html`,
        failure: `${baseUrl}/index.html`,
        pending: `${baseUrl}/index.html`
      },
      auto_return: "approved",
      // binary_mode true evita pagamentos pendentes (bom para entrega digital)
      binary_mode: true,
      statement_descriptor: "FELTROFACIL" // Nome na fatura do cartão
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
        // Retornamos o init_point para abrir o Checkout
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
