const { MercadoPagoConfig, Preference } = require('mercadopago');

exports.handler = async function(event, context) {
  // Configura com a chave que está nas variáveis do Netlify
  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  const preference = new Preference(client);

  try {
    // Cria a preferência de venda
    const body = {
      items: [
        {
          title: 'Doação Feltro Fácil',
          quantity: 1,
          unit_price: 50, // Você pode passar esse valor dinamicamente se quiser
          currency_id: 'BRL',
        },
      ],
    };

    const result = await preference.create({ body });

    return {
      statusCode: 200,
      body: JSON.stringify({ preferenceId: result.id }), // Retorna o ID que falta para o seu botão
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
