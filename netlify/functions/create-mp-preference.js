const { MercadoPagoConfig, Preference } = require("mercadopago");

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN
    });

    const preference = new Preference(client);
    
    const result = await preference.create({
      body: {
        items: [{
          title: "Doação Feltro Fácil",
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(data.amount)
        }]
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        preferenceId: result.id
      })
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
