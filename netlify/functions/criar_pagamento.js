const { MercadoPagoConfig, Payment } = require("mercadopago");

exports.handler = async (event) => {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const body = JSON.parse(event.body);

    const result = await payment.create({
      body: {
        transaction_amount: body.amount,
        description: "Doação Feltro Fácil",
        payment_method_id: body.payment_method_id,
        payer: { email: body.email }
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
