// netlify/functions/create-mp-donation.js
const mercadopago = require("mercadopago");

exports.handler = async function(event, context) {
  // Permitir preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: ""
    };
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    console.error("MP_ACCESS_TOKEN não definido");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Configuração de servidor ausente (Token)." }),
    };
  }

  mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

  try {
    const payload = JSON.parse(event.body || "{}");
    const amount = parseFloat(payload.amount) || 10;

    const preference = {
      items: [
        {
          id: "doacao-feltro-facil",
          title: "Doação Feltro Fácil",
          quantity: 1,
          unit_price: amount,
          currency_id: "BRL",
        },
      ],
      // opcional: back_urls se quiser
      // back_urls: {...}, auto_return: 'approved'
    };

    const response = await mercadopago.preferences.create(preference);

    // response.body.id normalmente contém o id
    const preferenceId = response && response.body && (response.body.id || response.body.preference_id) ? (response.body.id || response.body.preference_id) : null;

    if (!preferenceId) {
      console.error("Resposta inesperada do MP:", response);
      throw new Error("Não foi possível gerar preferenceId");
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ preferenceId }),
    };

  } catch (err) {
    console.error("Erro ao criar preferência:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message || "Erro interno" }),
    };
  }
};
