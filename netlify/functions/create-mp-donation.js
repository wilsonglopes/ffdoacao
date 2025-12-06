const { MercadoPagoConfig, Preference } = require('mercadopago');

exports.handler = async function(event, context) {
  // 1. Verifica se a chave de acesso foi configurada no Netlify
  if (!process.env.MP_ACCESS_TOKEN) {
    console.error("Erro: MP_ACCESS_TOKEN não está definido nas variáveis de ambiente.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Configuração de servidor ausente (Token)." }),
    };
  }

  // 2. Configura o cliente do Mercado Pago (Versão 2.0)
  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

  try {
    // 3. Lê o valor enviado pelo site (frontend)
    // Se não vier nada, assume R$ 10,00 como segurança
    const payload = JSON.parse(event.body || '{}');
    const amount = parseFloat(payload.amount) || 10; 

    // 4. Cria a preferência de pagamento
    const preference = new Preference(client);
    const body = {
      items: [
        {
          id: 'doacao-feltro-facil',
          title: 'Doação Feltro Fácil',
          quantity: 1,
          unit_price: amount,
          currency_id: 'BRL',
        },
      ],
      // Opcional: Redirecionar o usuário após o pagamento
      // back_urls: {
      //   success: "https://seusite.com/obrigado",
      //   failure: "https://seusite.com/erro",
      //   pending: "https://seusite.com/pendente"
      // },
      // auto_return: "approved",
    };

    const result = await preference.create({ body });

    // 5. Retorna o ID para o site
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Importante para evitar erro de CORS
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ preferenceId: result.id }),
    };

  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
