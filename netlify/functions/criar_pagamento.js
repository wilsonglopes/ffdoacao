const { MercadoPagoConfig, Payment } = require("mercadopago");

exports.handler = async function (event) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) throw new Error("Token MP faltando");

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const body = JSON.parse(event.body || "{}");

    const result = await payment.create({
      body: {
        transaction_amount: Number(body.transaction_amount),
        description: "Doação Feltro Fácil",
        payment_method_id: body.payment_method,
        payer: body.payer,
      }
    });

    return {
      statusCode: 200,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(result)
    };

  } catch (err) {
    console.error("Erro criar pagamento:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
