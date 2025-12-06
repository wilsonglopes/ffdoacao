const { MercadoPagoConfig, Preference } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

exports.handler = async function(event, context) {
  // Cabeçalhos para evitar erro de CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  try {
    const { amount } = JSON.parse(event.body);

    // 1. Cria a preferência no Mercado Pago
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [{
            id: 'doacao',
            title: 'Doação Feltro Fácil',
            quantity: 1,
            unit_price: parseFloat(amount),
            currency_id: 'BRL'
        }],
        payment_methods: {
            excluded_payment_types: [{ id: "ticket" }], // Sem boleto
            installments: 1
        },
      }
    });

    // 2. Salva no Supabase (Opcional, não trava se der erro)
    try {
        await supabase.from('doacoes').insert([{ 
            amount: amount, method: 'mercadopago', external_id: result.id, status: 'pending' 
        }]);
    } catch (e) { console.log('Erro Supabase:', e); }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ preferenceId: result.id }),
    };

  } catch (error) {
    console.error("Erro Backend:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
