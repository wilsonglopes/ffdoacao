exports.handler = async function(event) {
    const { preferenceId } = event.queryStringParameters;

    if (!preferenceId) {
        return { statusCode: 400, body: "ID faltando" };
    }

    try {
        // Usa FETCH nativo (não precisa de require 'mercadopago')
        const response = await fetch(`https://api.mercadopago.com/v1/payments/search?preference_id=${preferenceId}&status=approved`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` 
            }
        });
        
        const data = await response.json();

        // Se achou pagamento aprovado, libera!
        if (data.results && data.results.length > 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({ status: 'approved' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ status: 'pending' })
        };

    } catch (error) {
        console.error('Erro check-status:', error);
        // Retorna o erro para vermos no console se precisar
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
