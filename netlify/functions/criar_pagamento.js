const { MercadoPagoConfig, Payment } = require("mercadopago");

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN
    });

    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: data.amount,
        payment_method_id: data.payment_method_id,
        payer: {
          email: data.email
        }
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
