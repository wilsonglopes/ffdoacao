const mercadopago = require('mercadopago');

exports.handler = async function(event, context) {
  // Configura os Cabeçalhos para evitar erro de CORS (Aquele erro vermelho do console)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Responde rápido se for apenas uma verificação do navegador
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Configura o Token do Mercado Pago
  mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

  try {
    // 1. AQUI É O SEGREDO: Recebe o e-mail que veio do site
    const { amount, email } = JSON.parse(event.body || '{}');

    // Se o preço não vier, usa o padrão
    const finalPrice = amount ? parseFloat(amount) : 6.97;
    const finalEmail = email || 'email_nao_informado@loja.com';

    const preferenceData = {
      items: [
        {
          title: 'Apostila Digital - Crucifixo em Feltro',
          description: 'Arquivo PDF enviado por e-mail',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: finalPrice
        }
      ],
      // 2. AQUI ENVIAMOS O E-MAIL PARA O MERCADO PAGO
      payer: {
        email: finalEmail
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: 1
      },
      back_urls: {
        success: "https://doe.feltrofacil.com.br/obrigado.html",
        failure: "https://doe.feltrofacil.com.br/",
        pending: "https://doe.feltrofacil.com.br/"
      },
      auto_return: "approved",
      binary_mode: true,
      statement_descriptor: "FELTROFACIL"
    };

    // Cria a preferência
    const response = await mercadopago.preferences.create(preferenceData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        init_point: response.body.init_point,
        id: response.body.id 
      }),
    };

  } catch (error) {
    console.error('Erro MP:', error);
    return {
      statusCode: 500,
      headers, // Importante retornar headers mesmo no erro
      body: JSON.stringify({ error: error.message }),
    };
  }
};
