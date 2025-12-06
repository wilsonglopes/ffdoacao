const mercadopago = require('mercadopago');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Configura com a chave de ACESSO (Access Token) das variáveis de ambiente
  mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

  try {
    const { amount } = JSON.parse(event.body);

    // --- CONFIGURAÇÃO DA URL ---
    // O Netlify preenche 'process.env.URL' automaticamente quando o site está no ar.
    // Se estiver testando localmente, ele usa localhost.
    // Se preferir, você pode apagar isso e colocar sua URL fixa: const baseUrl = "https://seu-site.netlify.app";
    const baseUrl = process.env.URL || "http://localhost:8888";

    const preference = {
      items: [
        {
          title: 'Contribuição Feltro Fácil',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: parseFloat(amount)
        }
      ],
      payment_methods: {
        excluded_payment_types: [],
        installments: 1
      },
      // --- AQUI ESTÁ A ALTERAÇÃO ---
      // Redireciona para obrigado.html levando o valor (amount) na URL
      back_urls: {
        success: `${baseUrl}/obrigado.html?amount=${amount}`,
        failure: `${baseUrl}/index.html`,
        pending: `${baseUrl}/index.html` // Pendente geralmente volta para a home ou uma tela de aviso
      },
      auto_return: "approved",
      statement_descriptor: "FELTROFACIL"
    };

    const response = await mercadopago.preferences.create(preference);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        id: response.body.id, 
        init_point: response.body.init_point 
      }),
    };
  } catch (error) {
    console.error('Erro MP:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao criar pagamento' }),
    };
  }
};
