const { MercadoPagoConfig, Preference } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

// 1. Configurações Iniciais
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Inicializa o Mercado Pago (Versão 2.0)
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

exports.handler = async function(event, context) {
  console.log("Iniciando função de doação...");

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Verifica segurança básica
  if (!process.env.MP_ACCESS_TOKEN) {
    console.error("ERRO: MP_ACCESS_TOKEN não configurado.");
    return { statusCode: 500, body: JSON.stringify({ error: "Erro de configuração no servidor." }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const amount = parseFloat(payload.amount);

    if (!amount || amount < 1) {
      return { statusCode: 400, body: JSON.stringify({ error: "Valor inválido." }) };
    }

    // 2. Cria a Preferência (Versão 2.0)
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
        payment_methods: {
            excluded_payment_types: [
                { id: "ticket" } // Remove Boleto explicitamente no Backend também
            ],
            installments: 1
        },
        back_urls: {
            success: "https://ffdoacao.netlify.app/obrigado.html",
            failure: "https://ffdoacao.netlify.app/",
            pending: "https://ffdoacao.netlify.app/"
        },
        auto_return: "approved",
        statement_descriptor: "FELTROFACIL"
      }
    });

    console.log("Preferência criada:", result.id);

    // 3. Salva no Supabase (Para seu Dashboard funcionar)
    const { error: dbError } = await supabase
      .from('doacoes')
      .insert([
        { 
          amount: amount, 
          method: 'mercadopago', 
          external_id: result.id,
          status: 'pending' 
        }
      ]);

    if (dbError) console.error('Erro ao salvar no banco:', dbError);

    // 4. Retorna para o Frontend
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
