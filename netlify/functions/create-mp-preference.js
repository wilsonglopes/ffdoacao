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
    
    // Tratamento rigoroso do email
    let finalEmail = 'email_nao_informado@loja.com';
    if (email && email.trim().length > 5 && email.includes('@')) {
        finalEmail = email.trim();
    }

    console.log(`[Create-Pref] Gravando Metadata: ${finalEmail}`);

    const preferenceData = {
      items: [
        {
          title: 'Apostila Digital - Crucifixo em Feltro',
          description: 'Arquivo PDF enviado por e-mail',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amount ? parseFloat(amount) : 4.99
        }
      ],
      payer: {
        email: finalEmail
      },
      // --- AQUI É A MUDANÇA: METADATA ---
      // O Mercado Pago obriga que seja snake_case (letras minusculas e underline)
      metadata: {
        user_email: finalEmail,
        id_interno: Date.now()
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


