const mercadopago = require('mercadopago');

exports.handler = async function(event) {
  // Configura o Token
  mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

  const { preferenceId } = event.queryStringParameters;

  if (!preferenceId) {
    return { statusCode: 400, body: "ID da preferência é obrigatório" };
  }

  try {
    // Busca se existe algum pagamento APROVADO ligado a esta preferência
    const searchResult = await mercadopago.payment.search({
      qs: {
        preference_id: preferenceId,
        status: 'approved'
      }
    });

    // Se a lista de pagamentos aprovados for maior que 0, significa que pagou!
    if (searchResult.body.results && searchResult.body.results.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'approved' })
      };
    }

    // Se não achou nada aprovado ainda
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'pending' })
    };

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
