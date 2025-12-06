<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apoie a Feltro Fácil - Doação Segura</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://sdk.mercadopago.com/js/v2"></script>
    <script src="https://js.stripe.com/v3/"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #FEF2F2; }
        .bg-feltro-purple { background-color: #800080; } 
        .text-feltro-purple { color: #800080; }
        .border-feltro-purple { border-color: #800080; }
        .selected-amount { background-color: #800080; color: white; border-color: #800080; }
        
        /* Animação de Loading */
        .loader { border-top-color: #800080; -webkit-animation: spinner 1.5s linear infinite; animation: spinner 1.5s linear infinite; }
        @keyframes spinner { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body class="text-stone-800">

    <header class="bg-white/90 backdrop-blur-lg shadow-sm sticky top-0 z-50">
        <nav class="container mx-auto px-4 py-4 flex justify-center items-center">
            <div class="flex items-center">
                <img src="logo-f.png" alt="Logo Feltro Fácil" class="h-12 w-auto" onerror="this.style.display='none'">
            </div>
        </nav>
    </header>

    <main class="container mx-auto px-4 py-10 max-w-2xl">
        <div class="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-stone-100 min-h-[400px]">
            
            <div id="step-1">
                <div class="text-center mb-8">
                    <h1 class="text-2xl md:text-3xl font-bold text-gray-800">Faça a sua contribuição</h1>
                    <p class="text-stone-600 mt-2">Escolha o valor e o método para continuar.</p>
                </div>

                <div class="mb-8">
                    <label class="block text-sm font-semibold text-stone-700 mb-3">1. Qual valor deseja doar?</label>
                    <div class="grid grid-cols-3 gap-4 mb-4">
                        <button onclick="selectAmount(10)" class="amount-btn border-2 border-stone-200 rounded-lg py-3 font-semibold text-stone-600 hover:border-feltro-purple transition-all">R$ 10</button>
                        <button onclick="selectAmount(30)" class="amount-btn border-2 border-stone-200 rounded-lg py-3 font-semibold text-stone-600 hover:border-feltro-purple transition-all">R$ 30</button>
                        <button onclick="selectAmount(50)" class="amount-btn border-2 border-stone-200 rounded-lg py-3 font-semibold text-stone-600 hover:border-feltro-purple transition-all">R$ 50</button>
                    </div>
                    <div class="relative">
                        <span class="absolute left-4 top-3.5 text-stone-500 font-semibold">R$</span>
                        <input type="number" id="custom-amount" placeholder="Outro valor (mínimo R$ 5)" 
                               class="w-full pl-12 pr-4 py-3 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-feltro-purple transition-colors"
                               oninput="selectAmount(this.value, true)">
                    </div>
                </div>

                <div class="mb-8">
                    <label class="block text-sm font-semibold text-stone-700 mb-3">2. Qual meio de pagamento?</label>
                    <div class="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
                        <button onclick="setMethod('mp')" id="btn-mp" class="flex-1 py-4 px-4 border-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all selected-amount">
                            🇧🇷 Brasil (Pix/Cartão)
                        </button>
                        <button onclick="setMethod('stripe')" id="btn-stripe" class="flex-1 py-4 px-4 border-2 border-stone-200 text-stone-600 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:border-gray-400">
                            🌍 Internacional (Stripe)
                        </button>
                    </div>
                </div>

                <button id="go-to-payment-btn" onclick="goToStep2()" class="w-full bg-feltro-purple text-white font-bold py-4 rounded-lg shadow-lg hover:bg-purple-800 transition-transform transform active:scale-95 text-lg flex justify-center items-center gap-2">
                    <span>Ir para Pagamento</span>
                    <div id="btn-spinner" class="hidden loader ease-linear rounded-full border-2 border-t-2 border-white h-5 w-5"></div>
                </button>
                
                <div id="error-message" class="hidden mt-4 bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-200"></div>
            </div>

            <div id="step-2" class="hidden fade-in">
                <div class="mb-6 flex items-center gap-2 text-stone-500 cursor-pointer hover:text-stone-800" onclick="backToStep1()">
                    <span>← Voltar</span>
                </div>
                
                <div class="text-center mb-6">
                    <h2 class="text-xl font-bold text-gray-800">Finalizar Doação</h2>
                    <p class="text-stone-600">Preencha os dados abaixo</p>
                </div>

                <div id="mercadopago-brick-container"></div>
                
                <form id="stripe-payment-form" class="hidden">
                    <div id="stripe-payment-element" class="mb-4"></div>
                    <button id="stripe-submit" class="w-full bg-slate-900 text-white font-bold py-3 rounded-md hover:bg-slate-800 transition-colors">
                        Pagar Agora
                    </button>
                </form>
            </div>

        </div>
        <div class="text-center mt-6 text-stone-500 text-xs">
            <p>Ambiente Seguro • Processado por MercadoPago e Stripe</p>
        </div>
    </main>

    <script>
        // CONFIGURAÇÃO
        const MP_PUBLIC_KEY = 'APP_USR-7c3fa8cf-7680-42a9-bcd7-388e72fbcfe6'; 
        const STRIPE_PUBLIC_KEY = 'pk_live_51SZGWH2Yql6uVgx9IxgMYgwkkE5nfQtrwjJxFosvO9VImC4ph66AkTcxzffPhKKyaUBzVHLJKonFEOCNMNByaqfq00rkKnjZJU'; 
        
        let currentAmount = 0;
        let currentMethod = 'mp';
        let mpInstance = null;
        let stripeInstance = null;
        let paymentBrickController = null;

        // Inicializa SDKs
        try {
            if(window.MercadoPago) mpInstance = new MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
            if(window.Stripe) stripeInstance = Stripe(STRIPE_PUBLIC_KEY);
        } catch(e) { console.error("Erro SDK:", e); }

        // --- LÓGICA DA UI (Passo 1) ---

        function selectAmount(val, isCustom = false) {
            currentAmount = parseFloat(val);
            document.querySelectorAll('.amount-btn').forEach(btn => {
                const btnVal = parseFloat(btn.innerText.replace('R$ ', ''));
                if (!isCustom && btnVal === currentAmount) {
                    btn.classList.add('selected-amount', 'border-feltro-purple');
                    btn.classList.remove('border-stone-200', 'text-stone-600');
                    document.getElementById('custom-amount').value = '';
                } else {
                    btn.classList.remove('selected-amount', 'border-feltro-purple');
                    btn.classList.add('border-stone-200', 'text-stone-600');
                }
            });
        }

        function setMethod(method) {
            currentMethod = method;
            const btnMp = document.getElementById('btn-mp');
            const btnStripe = document.getElementById('btn-stripe');

            if (method === 'mp') {
                btnMp.classList.add('selected-amount', 'border-feltro-purple');
                btnMp.classList.remove('border-stone-200', 'text-stone-600');
                btnStripe.classList.remove('selected-amount', 'bg-slate-800', 'border-slate-800');
                btnStripe.classList.add('border-stone-200', 'text-stone-600');
            } else {
                btnStripe.classList.add('selected-amount', 'bg-slate-800', 'border-slate-800');
                btnStripe.classList.remove('border-stone-200', 'text-stone-600');
                btnMp.classList.remove('selected-amount', 'border-feltro-purple');
                btnMp.classList.add('border-stone-200', 'text-stone-600');
            }
        }

        // --- LÓGICA DE TRANSIÇÃO (Passo 1 -> Passo 2) ---

        async function goToStep2() {
            const btn = document.getElementById('go-to-payment-btn');
            const spinner = document.getElementById('btn-spinner');
            const errorDiv = document.getElementById('error-message');
            
            errorDiv.classList.add('hidden');

            if (!currentAmount || isNaN(currentAmount) || currentAmount < 5) {
                errorDiv.innerText = "Por favor, escolha um valor mínimo de R$ 5,00.";
                errorDiv.classList.remove('hidden');
                return;
            }

            // Bloqueia botão e mostra loading
            btn.disabled = true;
            spinner.classList.remove('hidden');

            try {
                if (currentMethod === 'mp') {
                    await initMercadoPago();
                } else {
                    await initStripe();
                }
                
                // Se tudo der certo, troca de tela
                document.getElementById('step-1').classList.add('hidden');
                document.getElementById('step-2').classList.remove('hidden');

            } catch (error) {
                console.error(error);
                errorDiv.innerText = `Erro: ${error.message}`;
                errorDiv.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                spinner.classList.add('hidden');
            }
        }

        function backToStep1() {
            document.getElementById('step-2').classList.add('hidden');
            document.getElementById('step-1').classList.remove('hidden');
            
            // Limpa os formulários para recriar depois
            if(paymentBrickController) {
                paymentBrickController.unmount();
                paymentBrickController = null;
            }
            document.getElementById('mercadopago-brick-container').innerHTML = '';
            document.getElementById('stripe-payment-form').classList.add('hidden');
        }

        // --- INTEGRAÇÕES (Backend) ---

        async function initMercadoPago() {
            // 1. Chama backend para obter ID
            const response = await fetch('/.netlify/functions/create-mp-donation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: currentAmount })
            });

            if (!response.ok) throw new Error("Erro de comunicação com o servidor.");
            
            const data = await response.json();
            if (!data.preferenceId) throw new Error("ID de pagamento não gerado.");

            // 2. Inicializa o Brick com o ID já garantido
            const bricksBuilder = mpInstance.bricks();
            const settings = {
                initialization: {
                    preferenceId: data.preferenceId, // ID recebido do backend
                },
                customization: {
                    paymentMethods: {
                        bankTransfer: "all", // Pix
                        creditCard: "all",
                        debitCard: "all",
                        maxInstallments: 1
                    },
                    visual: {
                        style: { theme: 'bootstrap' } // Bootstrap visual (ok aqui pois Tailwind não interfere dentro do iframe)
                    }
                },
                callbacks: {
                    onReady: () => console.log('Brick pronto'),
                    onError: (error) => console.error(error),
                    onSubmit: () => { return new Promise(r => r()); }
                },
            };
            
            // Cria o formulário na div do Step 2
            paymentBrickController = await bricksBuilder.create('payment', 'mercadopago-brick-container', settings);
        }

        async function initStripe() {
            const response = await fetch("/.netlify/functions/create-stripe-donation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: currentAmount })
            });

            if (!response.ok) throw new Error("Erro de comunicação com o Stripe.");
            
            const { clientSecret } = await response.json();
            
            const stripeElements = stripeInstance.elements({ 
                appearance: { theme: 'stripe' }, 
                clientSecret 
            });
            
            const paymentElement = stripeElements.create("payment");
            paymentElement.mount("#stripe-payment-element");
            
            const form = document.getElementById('stripe-payment-form');
            form.classList.remove('hidden');
            
            form.onsubmit = async (e) => {
                e.preventDefault();
                const { error } = await stripeInstance.confirmPayment({
                    elements: stripeElements,
                    confirmParams: { return_url: window.location.origin + "/obrigado.html" },
                });
                if (error) alert(error.message);
            };
        }
    </script>
</body>
</html>
