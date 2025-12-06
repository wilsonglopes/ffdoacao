

const mercadopago = require('mercadopago');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Configura com a chave de ACESSO (Access Token) que estará nas variáveis de ambiente
  mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

  try {
    const { amount } = JSON.parse(event.body);

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
        installments: 1 // Doação geralmente é à vista, mas pode mudar para 12 se quiser
      },
      back_urls: {
        success: "https://feltrofacil.com.br/obrigado", // Crie esta página no seu site WordPress depois
        failure: "https://feltrofacil.com.br/erro",
        pending: "https://feltrofacil.com.br/pendente"
      },
      auto_return: "approved",
      statement_descriptor: "FELTROFACIL"
    };

    const response = await mercadopago.preferences.create(preference);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        id: response.body.id, 
        init_point: response.body.init_point 
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
