const mercadopago = require('mercadopago');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

  try {
    const { amount, email } = JSON.parse(event.body || '{}');
    const finalPrice = amount ? parseFloat(amount) : 6.97;
    // Garante que o email seja uma string válida
    const finalEmail = email && email.includes('@') ? email : 'email_nao_informado@loja.com';

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
      // 1. O CAMPO VISUAL (Para aparecer na tela do MP)
      payer: {
        email: finalEmail
      },
      // 2. O TRUQUE (Guardamos o email aqui também para garantir o retorno)
      external_reference: finalEmail, 
      
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
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
