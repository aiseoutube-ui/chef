// CusiCusa - Script Adaptado para la Nueva Interfaz

// --- ¡IMPORTANTE! Pega aquí la URL de tu Web App de Google Script ---
const googleWebAppUrl = "https://script.google.com/macros/s/AKfycbytqUkw9u2HQywOXlNcXsMpJaJZZlh4wXFuDwme3GFJdk-gKgT7JUkT0Cn9mpjQXOfX2A/exec";

// --- Referencias al DOM (actualizadas a la nueva estructura) ---
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const analyzeButton = document.getElementById('analyze-button');
const buttonText = document.getElementById('button-text');
const buttonLoader = document.getElementById('button-loader');
const locationStatusEl = document.getElementById('location-status');

// Vistas principales
const uploadView = document.getElementById('upload-view');
const loadingView = document.getElementById('loading-view');
const resultsContainer = document.getElementById('results-container');
const resultContent = document.getElementById('result-content');

// Elementos de Carga
const loaderAnimationContainer = document.getElementById('loader-animation-container');
const loadingMessageEl = document.getElementById('loading-message');

// Elementos de resultados
const dishNameEl = document.getElementById('dish-name');
const instructionListEl = document.getElementById('instruction-list');
const shareButtons = document.getElementById('share-buttons');
const cartListEl = document.getElementById('cart-list');
const totalCostEl = document.getElementById('total-cost');
const supermarketSectionEl = document.getElementById('supermarket-section');
const supermarketListEl = document.getElementById('supermarket-list');
const resetButton = document.getElementById('reset-button');
const copyButton = document.getElementById('copy-button');

// NUEVO: Referencias para Info Cards
const infoCardsContainer = document.getElementById('info-cards-container');
const infoTime = document.getElementById('info-time');
const infoTimeValue = document.getElementById('info-time-value');
const infoDifficulty = document.getElementById('info-difficulty');
const infoDifficultyValue = document.getElementById('info-difficulty-value');
const infoCalories = document.getElementById('info-calories');
const infoCaloriesValue = document.getElementById('info-calories-value');

// Elementos de error
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Referencias de Monetización y Estado
const counterFreeDisplay = document.getElementById('counter-free-display');
const adBonusDisplay = document.getElementById('ads-used-counter');
const cooldownTimer = document.getElementById('cooldown-timer');
const bonusButton = document.getElementById('bonus-button');
const limitModal = document.getElementById('limit-modal');
const closeModalButton = document.getElementById('close-modal-button');
const viewAdButton = document.getElementById('view-ad-button');
const adButtonLoader = document.getElementById('ad-button-loader');
const modalAdCounter = document.getElementById('modal-ad-counter');
const modalTitle = document.getElementById('modal-title');
const modalCooldownInfo = document.getElementById('modal-cooldown-info');

// Referencias para la cámara
const takePhotoButton = document.getElementById('take-photo-button');
const uploadOptionsContainer = document.getElementById('upload-options-container');
const imagePreviewContainer = document.getElementById('image-preview-container');
const changePhotoButton = document.getElementById('change-photo-button');
const cameraModal = document.getElementById('camera-modal');
const cameraFeed = document.getElementById('camera-feed');
const cameraCanvas = document.getElementById('camera-canvas');
const captureButton = document.getElementById('capture-button');
const closeCameraButton = document.getElementById('close-camera-button');
const switchCameraButton = document.getElementById('switch-camera-button');

// Referencias para la Tarjeta de Ofertas
const offerImageEl = document.getElementById('offer-image');
const offerTitleEl = document.getElementById('offer-title');
const offerDescriptionEl = document.getElementById('offer-description');
const offerButtonEl = document.getElementById('offer-button');


// --- Constantes ---
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutos

// --- Estado de la Aplicación ---
let baseRecipeForOne = null;
let imageBase64 = null;
let userLocation = null;
let userFingerprint = null;
let mediaStream = null;
let currentFacingMode = 'environment';
let countdownInterval = null;
let loadingAnimationInterval = null;
let loadingMessageInterval = null;

let usageStatus = { freeCount: 0, adCount: 0, lastAnalysisTimestamp: 0, isBonusActive: false, freeLimit: 3, adBonusLimit: 2 };

// ==========================================
// --- LÓGICA DE LA INTERFAZ (VISTAS Y MODALES) ---
// ==========================================

function showView(viewName) {
    uploadView.classList.add('hidden');
    loadingView.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    
    if (loadingAnimationInterval) clearInterval(loadingAnimationInterval);
    if (loadingMessageInterval) clearInterval(loadingMessageInterval);

    if (viewName === 'upload') uploadView.classList.remove('hidden');
    else if (viewName === 'loading') {
        loadingView.classList.remove('hidden');
        startLoadingAnimations();
    } else if (viewName === 'results') resultsContainer.classList.remove('hidden');
}

function launchConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    container.innerHTML = ''; 
    const confettiCount = 150;
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        const size = Math.random() * 8 + 4; 
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size * 2}px`;
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.backgroundColor = ['#667eea', '#764ba2', '#f472b6', '#34d399', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 6)];
        const duration = Math.random() * 3 + 4; 
        const delay = Math.random() * 2;
        confetti.style.animation = `fall ${duration}s linear ${delay}s forwards`;
        container.appendChild(confetti);
    }
}

function closePremiumModal() {
    limitModal.classList.add('hidden');
    if (countdownInterval) clearInterval(countdownInterval);
}

function showPremiumModal(isCooldown) {
    const { adCount, adBonusLimit, lastAnalysisTimestamp } = usageStatus;
    const remainingAdsClaimable = adBonusLimit - adCount;
    if (isCooldown) {
        modalTitle.textContent = "¡Salta la espera! ⏳";
        modalCooldownInfo.innerHTML = "Usa un bono para analizar ahora, o espera <span class=\"font-bold\" id=\"modal-cooldown-timer-text\">15 minutos</span>.";
        startCooldownTimer(lastAnalysisTimestamp + COOLDOWN_MS, document.getElementById('modal-cooldown-timer-text'));
    } else {
        modalTitle.textContent = "Se acabaron tus análisis de hoy 🎯";
        modalCooldownInfo.innerHTML = "Tu límite de 3 análisis gratis y 2 bonos ha sido alcanzado.";
        if (countdownInterval) clearInterval(countdownInterval);
    }
    viewAdButton.disabled = remainingAdsClaimable <= 0;
    modalAdCounter.textContent = `${adCount}/${adBonusLimit}`;
    viewAdButton.style.display = remainingAdsClaimable > 0 ? 'flex' : 'none';
    launchConfetti(); 
    limitModal.classList.remove('hidden');
}

// --- Inicialización y Event Listeners ---
window.onload = async function() {
    getLocation();
    userFingerprint = await getFingerprint();
    await getAnalysisStatus(); 
    startOfferRotation();

    analyzeButton.disabled = true;
    copyButton.addEventListener('click', copyToClipboard);
    fileInput.addEventListener('change', handleFileSelect);
    takePhotoButton.addEventListener('click', openCamera);
    closeCameraButton.addEventListener('click', closeCamera);
    captureButton.addEventListener('click', takePicture);
    switchCameraButton.addEventListener('click', switchCamera);
    resetButton.addEventListener('click', resetUI);
    changePhotoButton.addEventListener('click', () => {
        imagePreviewContainer.classList.add('hidden');
        uploadOptionsContainer.classList.remove('hidden');
        imageBase64 = null;
        updateDisplayAndControls();
    });
    viewAdButton.addEventListener('click', simulateAdView);
    closeModalButton.addEventListener('click', closePremiumModal);
    bonusButton.addEventListener('click', () => {
        showPremiumModal((Date.now() - usageStatus.lastAnalysisTimestamp) < COOLDOWN_MS);
    });
    cartListEl.addEventListener('click', (e) => {
        const targetLi = e.target.closest('li');
        if (targetLi) {
            const checkbox = targetLi.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;
            targetLi.classList.toggle('opacity-60');
            targetLi.classList.toggle('bg-gray-50');
            recalculateTotalCost();
        }
    });
};

// --- Lógica de Estado y Control ---
async function getFingerprint() {
    try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return result.visitorId;
    } catch (error) { return 'temp_user_' + Date.now(); }
}

async function getAnalysisStatus() {
    if (!userFingerprint) return;
    try {
        const payload = { action: 'get_status', userId: userFingerprint };
        const response = await fetch(googleWebAppUrl, { method: 'POST', body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } });
        const result = await response.json();
        if (result.success && result.status) usageStatus = result.status;
        updateDisplayAndControls();
    } catch (e) { /* error */ }
}

function updateDisplayAndControls() {
    const { freeCount, adCount, freeLimit, adBonusLimit, lastAnalysisTimestamp, isBonusActive } = usageStatus;
    const remainingFree = Math.max(0, freeLimit - freeCount);
    const remainingAdsClaimable = adBonusLimit - adCount;
    counterFreeDisplay.textContent = `${remainingFree}/${freeLimit}`;
    adBonusDisplay.textContent = `${adCount}/${adBonusLimit}`;
    modalAdCounter.textContent = `${adCount}/${adBonusLimit}`;
    const timeSinceLast = Date.now() - lastAnalysisTimestamp;
    let isCooldownActive = lastAnalysisTimestamp !== 0 && timeSinceLast < COOLDOWN_MS && !isBonusActive;
    if (isCooldownActive) {
        startCooldownTimer(lastAnalysisTimestamp + COOLDOWN_MS, cooldownTimer); 
    } else {
        if (countdownInterval) clearInterval(countdownInterval);
        cooldownTimer.textContent = 'Listo';
    }
    const hasUses = remainingFree > 0 || isBonusActive;
    analyzeButton.disabled = !imageBase64 || !hasUses || isCooldownActive;
    if (isCooldownActive) buttonText.textContent = `Enfriamiento activo`;
    else if (isBonusActive) buttonText.textContent = 'Analizar con Bono';
    else if (hasUses) buttonText.textContent = 'Generar Receta';
    else buttonText.textContent = 'Límite diario alcanzado';
    if (!imageBase64) buttonText.textContent = 'Selecciona una imagen';
    const canGetBonus = remainingAdsClaimable > 0;
    if ((isCooldownActive || (remainingFree <= 0 && !isBonusActive)) && canGetBonus) {
        bonusButton.classList.remove('hidden');
    } else {
        bonusButton.classList.add('hidden');
    }
}

function startCooldownTimer(targetTimestamp, element) {
    if (countdownInterval) clearInterval(countdownInterval);
    const update = () => {
        const diff = targetTimestamp - Date.now();
        if (diff <= 0) {
            clearInterval(countdownInterval);
            element.textContent = '¡Listo!';
            updateDisplayAndControls();
            return;
        }
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        element.textContent = `${m}m ${s.toString().padStart(2, '0')}s`;
    };
    update();
    countdownInterval = setInterval(update, 1000);
}

// --- Lógica de Anuncios ---
function simulateAdView() {
    if (usageStatus.adCount >= usageStatus.adBonusLimit) return;
    viewAdButton.disabled = true;
    viewAdButton.querySelector('#ad-button-text').textContent = "Cargando...";
    adButtonLoader.classList.remove('hidden');
    setTimeout(() => grantAdBonusFromAndroid(), 2000);
}
// REEMPLAZA TU FUNCIÓN ANTIGUA CON ESTA

async function grantAdBonusFromAndroid() {
    await claimAdBonus();
    closePremiumModal();

    if (viewAdButton) {
        // CORRECCIÓN: La variable aquí estaba mal escrita como "viewAd_button"
        const adButtonSpan = viewAdButton.querySelector('#ad-button-text');
        if (adButtonSpan) {
            adButtonSpan.innerHTML = `Ver anuncio → +1 análisis (Bonos: <span id="modal-ad-counter">${usageStatus.adCount}/${usageStatus.adBonusLimit}</span>)`;
        }
        viewAdButton.disabled = false;
    }

    if (adButtonLoader) {
        adButtonLoader.classList.add('hidden');
    }
}
async function claimAdBonus() {
    try {
        const payload = { action: 'claim_ad_bonus', userId: userFingerprint };
        const response = await fetch(googleWebAppUrl, { method: 'POST', body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } });
        const result = await response.json();
        if (result.success && result.status) {
            usageStatus = result.status;
            updateDisplayAndControls(); 
        }
    } catch (e) { /* error */ }
}

// --- Lógica Principal de Análisis ---
analyzeButton.addEventListener('click', () => { if (imageBase64) analyzeImage(imageBase64); });
async function analyzeImage(base64ImageData) {
    showView('loading');
    analyzeButton.disabled = true;
    buttonText.classList.add('hidden');
    buttonLoader.classList.remove('hidden');
    try {
        const payload = { action: 'analyze', imageData: base64ImageData, location: userLocation, userId: userFingerprint };
        const response = await fetch(googleWebAppUrl, { method: 'POST', body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } });
        if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);
        const result = await response.json();
        if (result.success) {
            baseRecipeForOne = result.data;
            usageStatus = result.status;
            displayResults(baseRecipeForOne);
        } else {
            usageStatus = result.status;
            updateDisplayAndControls();
            showPremiumModal(result.message === 'cooldown_active');
            showView('upload');
        }
    } catch (error) {
        showError(`Lo siento, hubo un error: ${error.message}`);
    } finally {
        buttonText.classList.remove('hidden');
        buttonLoader.classList.add('hidden');
        updateDisplayAndControls();
    }
}

// --- Funciones auxiliares ---
function getLocation() {
    navigator.geolocation?.getCurrentPosition(
        p => { userLocation = { lat: p.coords.latitude, lon: p.coords.longitude }; locationStatusEl.innerHTML = "✅ Ubicación obtenida"; },
        () => { locationStatusEl.innerHTML = "⚠️ No se pudo obtener la ubicación"; }
    );
}
function handleImageData(dataUrl) {
    imageBase64 = dataUrl.split(',')[1];
    imagePreview.src = dataUrl;
    uploadOptionsContainer.classList.add('hidden');
    imagePreviewContainer.classList.remove('hidden');
    updateDisplayAndControls();
}
function handleFileSelect(event) {
    if (event.target.files[0]) {
        const reader = new FileReader();
        reader.onload = e => handleImageData(e.target.result);
        reader.readAsDataURL(event.target.files[0]);
    }
}
async function openCamera() {
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode } });
        cameraFeed.srcObject = mediaStream;
        await cameraFeed.play();
        cameraModal.classList.remove('hidden');
    } catch (err) { alert("No se pudo acceder a la cámara."); }
}
function closeCamera() {
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    cameraModal.classList.add('hidden');
}
function takePicture() {
    const ctx = cameraCanvas.getContext('2d');
    cameraCanvas.width = cameraFeed.videoWidth;
    cameraCanvas.height = cameraFeed.videoHeight;
    ctx.drawImage(cameraFeed, 0, 0, cameraCanvas.width, cameraCanvas.height);
    handleImageData(cameraCanvas.toDataURL('image/jpeg', 0.9));
    closeCamera();
}
function switchCamera() {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    openCamera();
}

// --- Lógica de Resultados (Actualizada) ---
function displayResults(data) {
    showView('results');
    const currency = data.currencyCode || 'USD';
    dishNameEl.textContent = data.dishName || "Plato no identificado";
    cartListEl.innerHTML = '';
    instructionListEl.innerHTML = '';
    supermarketListEl.innerHTML = '';
    
    // Mostrar/Ocultar y poblar Info Cards
    infoTime.style.display = data.preparationTime ? 'flex' : 'none';
    infoTimeValue.textContent = data.preparationTime || '';
    infoDifficulty.style.display = data.difficulty ? 'flex' : 'none';
    infoDifficultyValue.textContent = data.difficulty || '';
    infoCalories.style.display = data.calories ? 'flex' : 'none';
    infoCaloriesValue.textContent = data.calories || '';
    infoCardsContainer.style.display = (data.preparationTime || data.difficulty || data.calories) ? 'flex' : 'none';

    data.ingredients.forEach(ing => {
        const itemPrice = ing.estimatedLocalPrice || 0;
        const li = document.createElement('li');
        li.className = 'grid grid-cols-[1fr_auto] items-start gap-4 bg-white p-3 rounded-lg border shadow-sm transition-all duration-200 cursor-pointer';
        li.dataset.price = itemPrice;
        
        // CORRECCIÓN: Usar parseFloat() para asegurar que la cantidad sea un número.
        const quantity = parseFloat(ing.quantity) || 0;
        
        li.innerHTML = `
            <div class="flex items-start">
                <input type="checkbox" class="h-5 w-5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange mr-4 mt-1 flex-shrink-0 pointer-events-none">
                <div>
                    <span class="font-semibold text-gray-800">${ing.name}</span>
                    <span class="block text-xs text-gray-500">${quantity.toFixed(2).replace(/\.00$/, '')} ${ing.unit}</span>
                </div>
            </div>
            <div class="bg-gray-100 p-2 rounded-md text-center w-[80px] flex-shrink-0">
                <p class="text-sm font-bold text-gray-800">${itemPrice > 0 ? itemPrice.toFixed(2) : '-'}</p>
                <p class="text-xs -mt-1 text-gray-500">${itemPrice > 0 ? currency : 'N/A'}</p>
            </div>`;
        cartListEl.appendChild(li);
    });

    recalculateTotalCost();
    
    data.instructions.forEach(step => { instructionListEl.innerHTML += `<li class="pl-2 leading-relaxed">${step}</li>`; });
    
    if (data.supermarketSuggestions?.length) {
        data.supermarketSuggestions.forEach(store => supermarketListEl.innerHTML += `<span class="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1.5 rounded-full">${store}</span>`);
        supermarketSectionEl.classList.remove('hidden');
    } else supermarketSectionEl.classList.add('hidden');
    
    resultContent.classList.remove('hidden');
    errorMessage.classList.add('hidden');
}

function recalculateTotalCost() {
    let newTotal = 0;
    cartListEl.querySelectorAll('li').forEach(li => {
        if (!li.querySelector('input[type="checkbox"]').checked) {
            newTotal += parseFloat(li.dataset.price);
        }
    });
    totalCostEl.textContent = `${newTotal.toFixed(2)} ${baseRecipeForOne.currencyCode || 'USD'}`;
}

function resetUI() {
    showView('upload');
    imageBase64 = null;
    imagePreview.src = "";
    uploadOptionsContainer.classList.remove('hidden');
    imagePreviewContainer.classList.add('hidden');
    updateDisplayAndControls();
}

function showError(message) {
    showView('results');
    resultContent.classList.add('hidden');
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

function generateShareableText(platform = 'clipboard') {
    if (!baseRecipeForOne) return "";
    const totalCost = baseRecipeForOne.ingredients.reduce((acc, ing) => acc + (ing.estimatedLocalPrice || 0), 0);
    const title = text => platform === 'whatsapp' ? `*${text}*` : text.toUpperCase();
    let shareText = `${title(baseRecipeForOne.dishName)}\n\n🛒 ${title("Lista de Compras")}\n`;
    baseRecipeForOne.ingredients.forEach(ing => {
        shareText += `- ${(parseFloat(ing.quantity) || 0).toFixed(2).replace(/\.00$/, '')} ${ing.unit} de ${ing.name} (aprox. ${(ing.estimatedLocalPrice || 0).toFixed(2)} ${baseRecipeForOne.currencyCode})\n`;
    });
    shareText += `\nCosto Total Estimado: ${totalCost.toFixed(2)} ${baseRecipeForOne.currencyCode}\n`;
    if (baseRecipeForOne.supermarketSuggestions?.length) shareText += `\n🏪 ${title("Puedes comprar en")}\n${baseRecipeForOne.supermarketSuggestions.join(', ')}\n`;
    shareText += `\n📝 ${title("Instrucciones")}\n`;
    baseRecipeForOne.instructions.forEach((step, i) => { shareText += `${i + 1}. ${step}\n`; });
    return shareText;
}

function copyToClipboard() {
    navigator.clipboard.writeText(generateShareableText('clipboard')).then(() => {
        const span = copyButton.querySelector('span');
        const originalText = span.textContent;
        span.textContent = '¡Copiado! ✅';
        setTimeout(() => { span.textContent = originalText; }, 2000);
    });
}

function share(platform) {
    if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(generateShareableText(platform))}`, '_blank');
}

// --- Lógica de la intro y ofertas ---
document.addEventListener('DOMContentLoaded', () => {
    const intro = document.getElementById('intro-overlay');
    setTimeout(() => intro.classList.add('opacity-0', 'pointer-events-none'), 3000);
});
const offers = [
    { image: "https://images.unsplash.com/photo-1518843875459-f738682238a6?q=80&w=2070&auto=format&fit=crop", title: "¡Conviértete en Chef Pro!", description: "Accede a funciones exclusivas y análisis ilimitados.", buttonText: "Ver Planes Pro", buttonClass: "bg-teal-500 hover:bg-teal-400" },
    { image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop", title: "Planifica tu Semana", description: "Genera un menú semanal completo con nuestra IA.", buttonText: "Crear Menú", buttonClass: "bg-blue-500 hover:bg-blue-400" },
    { image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop", title: "¡Comparte y Gana!", description: "Invita a un amigo y ambos obtienen 5 análisis extra.", buttonText: "Invitar Amigos", buttonClass: "bg-purple-500 hover:bg-purple-400" },
    { image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop", title: "¿Necesitas una dieta especial?", description: "Desbloquea recetas keto, veganas, y más.", buttonText: "Explorar Dietas", buttonClass: "bg-green-500 hover:bg-green-400" }
];
let currentOfferIndex = 0;
function updateOfferCard() {
    const offer = offers[currentOfferIndex];
    offerImageEl.src = offer.image;
    offerTitleEl.textContent = offer.title;
    offerDescriptionEl.textContent = offer.description;
    offerButtonEl.textContent = offer.buttonText;
    offerButtonEl.className = `mt-4 self-start text-white font-bold py-2 px-5 rounded-lg text-sm transition-all duration-300 shadow-md hover:shadow-lg ${offer.buttonClass}`;
}
function startOfferRotation() {
    updateOfferCard();
    setInterval(() => {
        currentOfferIndex = (currentOfferIndex + 1) % offers.length;
        updateOfferCard();
    }, 5000);
}

// --- Lógica para Animaciones de Carga ---
const LOADING_MESSAGES = [ "Analizando los sabores en tu foto...", "Consultando a nuestros chefs de IA...", "Calculando los costos locales...", "¡Casi listo! Dando los toques finales..." ];
const loaderAnimations = [
    `<svg class="w-24 h-24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><style>.steam{stroke:#F97316;stroke-width:2;stroke-linecap:round;animation:steam-animate 3s infinite ease-out;}@keyframes steam-animate{0%{stroke-dasharray:0 10;transform:translateY(15px);opacity:0;}20%{stroke-dasharray:5 5;transform:translateY(5px);opacity:1;}80%{stroke-dasharray:5 5;transform:translateY(-15px);opacity:1;}100%{stroke-dasharray:0 10;transform:translateY(-25px);opacity:0;}}.steam-1{animation-delay:0s;}.steam-2{animation-delay:0.5s;}.steam-3{animation-delay:1s;}.pot-lid{animation:lid-bounce 1.5s infinite ease-in-out;transform-origin:center;}@keyframes lid-bounce{0%,100%{transform:translateY(0) rotate(0);}25%{transform:translateY(-2px) rotate(-2deg);}50%{transform:translateY(0) rotate(0);}75%{transform:translateY(-2px) rotate(2deg);}}</style><path class="steam steam-1" d="M40 45 Q 42 35, 40 25" fill="none" /><path class="steam steam-2" d="M50 45 Q 52 35, 50 25" fill="none" /><path class="steam steam-3" d="M60 45 Q 58 35, 60 25" fill="none" /><path d="M20 50 H 80 V 80 A 10 10 0 0 1 70 90 H 30 A 10 10 0 0 1 20 80 Z" fill="#E5E7EB" /><path d="M22 55 H 78 V 80 A 8 8 0 0 1 70 88 H 30 A 8 8 0 0 1 22 80 Z" fill="#F3F4F6" /><circle cx="15" cy="60" r="5" fill="#D1D5DB" /><circle cx="85" cy="60" r="5" fill="#D1D5DB" /><g class="pot-lid"><path d="M30 48 C 30 42, 70 42, 70 48" fill="#E5E7EB" /><circle cx="50" cy="40" r="4" fill="#D1D5DB" /></g></svg>`,
    `<svg class="w-24 h-24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><style>.wok-group{animation:wok-toss 2.5s infinite ease-in-out;transform-origin:15% 75%;}@keyframes wok-toss{0%,100%{transform:rotate(0deg) translateY(0);}25%{transform:rotate(15deg) translateY(-8px);}50%{transform:rotate(-5deg);}75%{transform:rotate(15deg) translateY(-8px);}}.food-particle{animation:food-toss 2.5s infinite ease-out;opacity:0;}@keyframes food-toss{0%,10%,90%,100%{transform:translateY(0) rotate(0);opacity:0;}25%{transform:translateY(-25px) rotate(90deg);opacity:1;}50%{transform:translateY(-15px) rotate(180deg);opacity:1;}75%{transform:translateY(-25px) rotate(270deg);opacity:1;}}.food1{animation-delay:0s;}.food2{animation-delay:0.1s;}.food3{animation-delay:0.2s;}.flame{fill:#F97316;animation:flame-flicker 1.5s infinite ease-in-out;transform-origin:50% 100%;}@keyframes flame-flicker{0%,100%{transform:scaleY(1) skewX(0);opacity:0.9;}25%{transform:scaleY(1.2) skewX(8deg);opacity:1;}50%{transform:scaleY(0.8) skewX(-8deg);opacity:0.8;}75%{transform:scaleY(1.1) skewX(4deg);opacity:1;}}.flame-1{animation-delay:0s;}.flame-2{animation-delay:0.2s;}.flame-3{animation-delay:0.1s;}</style><g><path class="flame flame-1" d="M45,95 C 40,85 50,80 50,95 Z" /><path class="flame flame-2" d="M50,95 C 45,80 55,75 55,95 Z" /><path class="flame flame-3" d="M55,95 C 50,85 60,80 60,95 Z" /></g><g class="wok-group"><path d="M25 70 C 40 90, 60 90, 75 70 L 85 60 L 15 60 Z" fill="#6B7280" /><path d="M28 69 C 40 85, 60 85, 72 69 L 80 62 L 20 62 Z" fill="#9CA3AF" /><rect x="0" y="56" width="20" height="8" rx="4" fill="#4B5563" /><g><rect class="food-particle food1" x="45" y="60" width="5" height="5" rx="2" fill="#34D399" /><circle class="food-particle food2" cx="55" cy="62" r="3" fill="#F87171" /><rect class="food-particle food3" x="60" y="58" width="6" height="4" rx="2" fill="#FBBF24" /></g></g></svg>`,
    // CORRECCIÓN: Se eliminó el atributo `transform` conflictivo del SVG de los saleros.
    `<svg class="w-24 h-24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><style>.shaker{animation:shake 2s infinite ease-in-out;}.shaker-salt{transform-origin:bottom center;animation-delay:0s;}.shaker-pepper{transform-origin:bottom center;animation-delay:-1s;}@keyframes shake{0%,100%{transform:translateX(0) rotate(0);}25%{transform:translateX(-2px) rotate(-5deg);}75%{transform:translateX(2px) rotate(5deg);}}.particle{fill:#F97316;animation:fall 2s infinite linear;opacity:0;}@keyframes fall{0%{transform:translateY(0);opacity:0;}20%{opacity:1;}80%{transform:translateY(20px);opacity:1;}100%{transform:translateY(25px);opacity:0;}}.p1{animation-delay:0.1s;}.p2{animation-delay:0.6s;}.p3{animation-delay:1.1s;}.p4{animation-delay:1.6s;}.p5{animation-delay:0.3s;}.p6{animation-delay:1.3s;}</style><g class="shaker shaker-salt"><rect x="25" y="40" width="20" height="35" rx="5" fill="#F3F4F6" /><rect x="25" y="35" width="20" height="5" rx="2" fill="#D1D5DB" /><circle class="particle p1" cx="35" cy="45" r="1.5" /><circle class="particle p2" cx="32" cy="45" r="1.5" /><circle class="particle p3" cx="38" cy="45" r="1.5" /></g><g class="shaker shaker-pepper"><rect x="55" y="40" width="20" height="35" rx="5" fill="#E5E7EB" /><rect x="55" y="35" width="20" height="5" rx="2" fill="#9CA3AF" /><circle class="particle p4" cx="65" cy="45" r="1.5" /><circle class="particle p5" cx="62" cy="45" r="1.5" /><circle class="particle p6" cx="68" cy="45" r="1.5" /></g></svg>`
];
let animationIndex = 0;
let messageIndex = 0;
function startLoadingAnimations() {
    animationIndex = 0;
    loaderAnimationContainer.innerHTML = loaderAnimations[animationIndex];
    loadingAnimationInterval = setInterval(() => {
        animationIndex = (animationIndex + 1) % loaderAnimations.length;
        loaderAnimationContainer.innerHTML = loaderAnimations[animationIndex];
    }, 3000);
    messageIndex = 0;
    loadingMessageEl.textContent = LOADING_MESSAGES[messageIndex];
    loadingMessageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
        loadingMessageEl.textContent = LOADING_MESSAGES[messageIndex];
    }, 2500);
}