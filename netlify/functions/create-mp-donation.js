const { MercadoPagoConfig, Preference } = require("mercadopago");

exports.handler = async function (event) {
  try {
    // 1 - Token está correto (vem do Netlify)
    const accessToken = process.env.MP_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error("MP_ACCESS_TOKEN não configurado no Netlify.");
    }

    // 2 - Criar cliente usando a V2 (correto)
    const client = new MercadoPagoConfig({
      accessToken,
    });

    const preference = new Preference(client);

    const body = JSON.parse(event.body || "{}");
    const amount = parseFloat(body.amount) || 10;

    // 3 - Criar preferência no padrão V2
    const result = await preference.create({
      body: {
        items: [
          {
            id: "doacao-feltro-facil",
            title: "Doação Feltro Fácil",
            quantity: 1,
            unit_price: amount,
          },
        ],
      },
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        preferenceId: result.id,
      }),
    };
  } catch (err) {
    console.error("ERRO MP:", err);
    return {
      statusCode: 502,
      body: JSON.stringify({
        errorType: err.name,
        errorMessage: err.message,
        trace: err.stack,
      }),
    };
  }
};
