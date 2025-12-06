const { MercadoPagoConfig, Preference } = require('mercadopago');

exports.handler = async function(event, context) {
  console.log("Iniciando função de doação...");

  // 1. Segurança: Verifica se a chave existe no Netlify
  if (!process.env.MP_ACCESS_TOKEN) {
    console.error("ERRO: MP_ACCESS_TOKEN não configurado.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro de configuração no servidor (Token ausente)." }),
    };
  }

  // 2. Configura Mercado Pago
  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

  try {
    const payload = JSON.parse(event.body || '{}');
    const amount = parseFloat(payload.amount);

    if (!amount || amount < 1) {
      return { statusCode: 400, body: JSON.stringify({ error: "Valor inválido." }) };
    }

    // 3. Cria a Preferência
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: 'doacao-unica',
            title: 'Doação Feltro Fácil',
            quantity: 1,
            unit_price: amount,
            currency_id: 'BRL',
          },
        ],
      }
    });

    console.log("Preferência criada com sucesso:", result.id);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferenceId: result.id }),
    };

  } catch (error) {
    console.error("Erro fatal no Mercado Pago:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
