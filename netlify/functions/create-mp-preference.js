const mercadopago = require('mercadopago');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Configura com a chave de ACESSO (Access Token) das variáveis de ambiente
  mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

  try {
    const { amount } = JSON.parse(event.body);

    // --- CONFIGURAÇÃO DA URL ---
    // O Netlify preenche 'process.env.URL' automaticamente.
    // Localmente usa localhost.
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
      payment_methods: {
        excluded_payment_types: [],
        installments: 1
      },
      // URLs para onde o Mercado Pago vai redirecionar dentro do iframe
      back_urls: {
        success: `${baseUrl}/obrigado.html?amount=${amount}`,
        failure: `${baseUrl}/index.html`,
        pending: `${baseUrl}/index.html`
      },
      auto_return: "approved",
      // ADICIONADO: Força aprovação ou rejeição imediata (sem pendente)
      // Melhora a experiência dentro do Modal
      binary_mode: true 
    };

    const response = await mercadopago.preferences.create(preference);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        // Retornamos o init_point para colocar no src do iframe
        init_point: response.body.init_point,
        id: response.body.id
      }),
    };
  } catch (error) {
    console.error('Erro MP:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao criar pagamento' }),
    };
  }
};
