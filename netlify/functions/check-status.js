exports.handler = async function(event) {
    const { preferenceId } = event.queryStringParameters;

    // Se não vier o ID, avisa o erro
    if (!preferenceId) {
        return { statusCode: 400, body: "ID da preferência é obrigatório" };
    }

    try {
        // Chamada direta à API do Mercado Pago (sem biblioteca)
        // Pergunta: "Tem algum pagamento APROVADO para essa preferência?"
        const response = await fetch(`https://api.mercadopago.com/v1/payments/search?preference_id=${preferenceId}&status=approved`, {
            headers: { 
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` 
            }
        });
        
        const data = await response.json();

        // Se a lista 'results' tiver algo, é porque pagou!
        if (data.results && data.results.length > 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({ status: 'approved' })
            };
        }

        // Se não, continua pendente
        return {
            statusCode: 200,
            body: JSON.stringify({ status: 'pending' })
        };

    } catch (error) {
        console.error('Erro no check-status:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
