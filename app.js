document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let currentRate = 0;
    let feePercentage = 0.01; // 1% fee
    const API_URL = "https://api.exchangerate-api.com/v4/latest/"; // Free public API (no key needed for basic usage)

    // --- DOM Elements ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    const senderCountry = document.getElementById('sender-country');
    const receiverCountry = document.getElementById('receiver-country');
    const senderSymbol = document.getElementById('sender-symbol');
    const sendAmount = document.getElementById('send-amount');
    const paymentId = document.getElementById('payment-id');
    
    const displayRate = document.getElementById('display-rate');
    const displayFee = document.getElementById('display-fee');
    const displayConverted = document.getElementById('display-converted');
    const btnConfirm = document.getElementById('btn-confirm');
    
    const mainFlow = document.getElementById('main-flow');
    const loadingFlow = document.getElementById('loading-flow');
    const successFlow = document.getElementById('success-flow');
    
    const networkName = document.getElementById('network-name');
    const finalAmount = document.getElementById('final-amount');
    const finalId = document.getElementById('final-id');
    const finalNetwork = document.getElementById('final-network');
    const finalTx = document.getElementById('final-tx');
    const btnReset = document.getElementById('btn-reset');

    // Currency symbols mapping
    const symbols = {
        'USD': '$',
        'INR': '₹',
        'EUR': '€',
        'GBP': '£'
    };

    // Network mapping based on currency/region
    const networks = {
        'USD': 'ACH / FedNow (USA)',
        'INR': 'UPI (India)',
        'EUR': 'SEPA Instant (Europe)',
        'GBP': 'Faster Payments (UK)'
    };

    // --- Tab Switching ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    // --- Currency Conversion Logic ---
    const fetchExchangeRate = async (base, target) => {
        if (base === target) return 1;
        
        try {
            const res = await fetch(`${API_URL}${base}`);
            const data = await res.json();
            return data.rates[target] || 0;
        } catch (error) {
            console.error("Error fetching rates:", error);
            return 0; // Fallback or error handling
        }
    };

    const updateCalculations = async () => {
        const from = senderCountry.value;
        const to = receiverCountry.value;
        const amount = parseFloat(sendAmount.value);
        
        senderSymbol.textContent = symbols[from];

        if (isNaN(amount) || amount <= 0) {
            displayRate.textContent = '--';
            displayFee.textContent = '--';
            displayConverted.textContent = '--';
            btnConfirm.disabled = true;
            return;
        }

        // Show loading state for rate
        displayRate.textContent = 'Fetching...';
        
        currentRate = await fetchExchangeRate(from, to);
        
        if (currentRate === 0) {
            displayRate.textContent = 'Error';
            return;
        }

        const fee = amount * feePercentage;
        const netAmount = amount - fee;
        const converted = netAmount * currentRate;

        // Update UI
        displayRate.textContent = `1 ${from} = ${currentRate.toFixed(4)} ${to}`;
        displayFee.textContent = `${symbols[from]}${fee.toFixed(2)}`;
        displayConverted.textContent = `${symbols[to]}${converted.toFixed(2)}`;

        // Enable confirm if valid
        const targetId = paymentId.value.trim();
        const activeTab = document.querySelector('.tab-btn.active').dataset.target;
        
        if (activeTab === 'manual-entry' && !targetId) {
            btnConfirm.disabled = true;
        } else {
            btnConfirm.disabled = false;
        }
    };

    // --- Event Listeners for inputs ---
    let debounceTimer;
    const debounceUpdate = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updateCalculations, 500);
    };

    senderCountry.addEventListener('change', updateCalculations);
    receiverCountry.addEventListener('change', updateCalculations);
    sendAmount.addEventListener('input', debounceUpdate);
    paymentId.addEventListener('input', () => {
        if (parseFloat(sendAmount.value) > 0) updateCalculations();
    });

    // --- Mock Scanner ---
    const mockScanner = document.querySelector('.mock-scanner');
    mockScanner.addEventListener('click', () => {
        paymentId.value = "merchant@upi";
        // Auto-switch to manual entry to show it was "scanned"
        tabBtns[1].click();
        updateCalculations();
    });

    // --- Confirmation Flow ---
    btnConfirm.addEventListener('click', () => {
        const to = receiverCountry.value;
        const network = networks[to];
        
        // Hide Main Flow
        mainFlow.classList.add('hidden');
        
        // Show Loading
        loadingFlow.classList.remove('hidden');
        networkName.textContent = network;

        // Simulate Network Delay
        setTimeout(() => {
            loadingFlow.classList.add('hidden');
            showSuccessScreen(to, network);
        }, 3000);
    });

    const showSuccessScreen = (to, network) => {
        const activeTab = document.querySelector('.tab-btn.active').dataset.target;
        const targetStr = activeTab === 'manual-entry' ? paymentId.value : "Scanned QR Recipient";
        
        finalAmount.textContent = displayConverted.textContent;
        finalId.textContent = targetStr;
        finalNetwork.textContent = network;
        finalTx.textContent = "TX" + Math.random().toString(36).substr(2, 9).toUpperCase();

        successFlow.classList.remove('hidden');
    };

    // --- Reset Flow ---
    btnReset.addEventListener('click', () => {
        successFlow.classList.add('hidden');
        mainFlow.classList.remove('hidden');
        sendAmount.value = '';
        paymentId.value = '';
        updateCalculations();
    });
});
