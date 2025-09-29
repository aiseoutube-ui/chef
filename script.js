// En tu archivo script.js

// --- ¡IMPORTANTE! Pega aquí la URL de tu Web App de Google Script ---
// Reemplaza esta URL con la tuya después de desplegar el Apps Script (code.gs)
const googleWebAppUrl = "https://script.google.com/macros/s/AKfycbyFN497qqEALwinVyiUL2g3WUboa8bCoU2yg-yldirLT0RpCVNpXOgTgqeTGINnkQQD6Q/exec";

// --- Referencias al DOM (TODAS CORREGIDAS PARA INDEX.HTML) ---
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const analyzeButton = document.getElementById('analyze-button');
const buttonText = document.getElementById('button-text');
const buttonLoader = document.getElementById('button-loader');
const resultsContainer = document.getElementById('results-container');
const loader = document.getElementById('loader');
const resultContent = document.getElementById('result-content');
const errorMessage = document.getElementById('error-message');
const dishNameEl = document.getElementById('dish-name');
const instructionListEl = document.getElementById('instruction-list');
const shareButtons = document.getElementById('share-buttons');
const cartListEl = document.getElementById('cart-list');
const totalCostEl = document.getElementById('total-cost');
const locationStatusEl = document.getElementById('location-status');
const supermarketSectionEl = document.getElementById('supermarket-section');
const supermarketListEl = document.getElementById('supermarket-list');
const servingsSelector = document.getElementById('servings-selector');

// Nuevas referencias de Monetización
const counterFreeDisplay = document.getElementById('counter-free-display');
const adBonusDisplay = document.getElementById('ads-used-counter');
const cooldownTimer = document.getElementById('cooldown-timer'); // El temporizador en la pantalla principal
const premiumModal = document.getElementById('premium-modal');
const closeModalButton = document.getElementById('close-modal-button');
const viewAdButton = document.getElementById('view-ad-button');
const adButtonLoader = document.getElementById('ad-button-loader');
const modalAdCounter = document.getElementById('modal-ad-counter');
const adBanner = document.getElementById('ad-banner');
const modalCooldownTimerText = document.getElementById('modal-cooldown-timer-text'); // El temporizador dentro del modal


const copyButton = document.getElementById('copy-button');
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

// --- Constantes ---
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutos para análisis
// *** BYPASS DE PRUEBA: 1 milisegundo en lugar de 30 minutos ***
const AD_COOLDOWN_MS = 1;

// --- Estado de la Aplicación ---
let baseRecipeForOne = null;
let currentRecipeForDisplay = null;
let imageBase64 = null;
let userLocation = null;
let currentServings = 1;
let userFingerprint = null;
let mediaStream = null;
let currentFacingMode = 'environment';
let countdownInterval = null;

// Estado del límite (obtenido del backend)
let usageStatus = {
    freeCount: 0,
    adCount: 0,
    lastAnalysisTimestamp: 0,
    isBonusActive: false, // Bandera de bono activo
    freeLimit: 3,
    adBonusLimit: 2
};

// ==========================================
// --- FUNCIONES GLOBALES DEL MODAL (MOVIMIENTO CLAVE PARA EL FIX) ---
// ==========================================

function launchConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    container.innerHTML = ''; 
    const confettiCount = 150;
    const colors = ['#667eea', '#764ba2', '#f472b6', '#34d399', '#f59e0b', '#ef4444'];
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        const size = Math.random() * 8 + 4; 
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size * 2}px`;
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        const duration = Math.random() * 3 + 4; 
        const delay = Math.random() * 2;
        confetti.style.animation = `fall ${duration}s linear ${delay}s forwards`;
        container.appendChild(confetti);
    }
}

function closePremiumModal() {
    premiumModal.classList.remove('show');
    setTimeout(() => premiumModal.classList.add('hidden'), 300);
    if (countdownInterval) clearInterval(countdownInterval);
}

/**
 * Muestra el modal de límite/cooldown.
 * @param {boolean} isCooldown Indica si se muestra el mensaje por cooldown (true) o límite total (false).
 */
function showPremiumModal(isCooldown) {
    const modalTitle = document.getElementById('modal-title');
    const modalCooldownInfo = document.getElementById('modal-cooldown-info');
    const { adCount, adBonusLimit, lastAnalysisTimestamp } = usageStatus;
    const remainingAdsClaimable = adBonusLimit - adCount;

    if (isCooldown) {
        modalTitle.textContent = "¡Espera un momento! ⏳";
        modalCooldownInfo.innerHTML = "También puedes esperar <span class=\"font-bold\" id=\"modal-cooldown-timer-text\">15 minutos</span> para tu siguiente análisis gratis (hasta 3 al día).";
        
        // Calcular tiempo de espera restante
        const nextAnalysisTime = lastAnalysisTimestamp + COOLDOWN_MS;
        startCooldownTimer(nextAnalysisTime, modalCooldownTimerText); // Usamos el elemento dentro del modal
    } else {
        modalTitle.textContent = "Se acabaron tus análisis de hoy 🎯";
        modalCooldownInfo.innerHTML = "Tu límite de 3 análisis gratis y 2 bonos por anuncio ha sido alcanzado. Tu límite se reiniciará a medianoche.";
        if (countdownInterval) clearInterval(countdownInterval);
    }

    // Actualizar el botón de anuncio
    viewAdButton.disabled = remainingAdsClaimable <= 0;
    modalAdCounter.textContent = `${adCount}/${adBonusLimit}`;
    
    // Si ya se usaron los bonos por anuncio, solo queda la opción Premium
    viewAdButton.style.display = remainingAdsClaimable > 0 ? 'flex' : 'none';

    launchConfetti(); 
    premiumModal.classList.remove('hidden');
    setTimeout(() => premiumModal.classList.add('show'), 10);
}


// --- Inicialización y Event Listeners ---
window.onload = async function() {
    getLocation();
    userFingerprint = await getFingerprint();
    // Iniciar el chequeo de estado y el contador de cooldown
    await getAnalysisStatus(); 

    analyzeButton.disabled = true;
    copyButton.addEventListener('click', copyToClipboard);
    fileInput.addEventListener('change', handleFileSelect);
    takePhotoButton.addEventListener('click', openCamera);
    closeCameraButton.addEventListener('click', closeCamera);
    captureButton.addEventListener('click', takePicture);
    switchCameraButton.addEventListener('click', switchCamera);
    changePhotoButton.addEventListener('click', () => {
        imagePreviewContainer.classList.add('hidden');
        uploadOptionsContainer.classList.remove('hidden');
        imageBase64 = null;
        updateDisplayAndControls(); // Actualiza el estado al quitar la imagen
    });
    
    // Eventos de monetización
    viewAdButton.addEventListener('click', simulateAdView);
    adBanner.addEventListener('click', () => showPremiumModal(true)); // Abrir modal desde banner (para ver anuncio)
    closeModalButton.addEventListener('click', closePremiumModal);
    
    // Listener para el botón Premium dentro del modal (se abre la URL, no requiere JS complejo)
    document.getElementById('buy-premium-button').addEventListener('click', closePremiumModal);
};

// --- Lógica de Estado y Control ---

async function getFingerprint() {
    try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return result.visitorId;
    } catch (error) {
        console.error("Error al generar fingerprint:", error);
        return 'temp_user_' + Date.now(); 
    }
}

/**
 * Obtiene el estado de uso del backend e inicia los contadores.
 */
async function getAnalysisStatus() {
    if (!userFingerprint) return;
    try {
        const payload = {
            action: 'get_status',
            userId: userFingerprint
        };
        const response = await fetch(googleWebAppUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });

        const result = await response.json();
        if (result.success && result.status) {
            usageStatus = result.status;
        } else {
            console.error("No se pudo obtener el estado inicial.");
        }
        updateDisplayAndControls();
    } catch (e) {
        console.error("Error al obtener el estado:", e);
    }
}

/**
 * Actualiza la UI (contadores y botones) basado en usageStatus.
 */
function updateDisplayAndControls() {
    const { freeCount, adCount, freeLimit, adBonusLimit, lastAnalysisTimestamp, isBonusActive } = usageStatus;
    const remainingFree = freeLimit - freeCount;
    const remainingAdsClaimable = adBonusLimit - adCount;
    const remainingTotal = remainingFree + remainingAdsClaimable;
    
    // 1. Actualizar Contadores Visibles
    
    // Si quedan gratis: muestra el conteo gratis. Si no, muestra 0.
    const displayCount = remainingFree > 0 ? remainingFree : 0;
    counterFreeDisplay.textContent = `Análisis disponibles: ${displayCount} / ${freeLimit} gratis hoy`;
    adBonusDisplay.textContent = `${adCount}/${adBonusLimit}`;
    modalAdCounter.textContent = `${adCount}/${adBonusLimit}`;
    
    // 2. Control del Cooldown
    const now = Date.now();
    const timeSinceLast = now - lastAnalysisTimestamp;
    
    let isCooldownActive = false;
    
    if (lastAnalysisTimestamp !== 0 && timeSinceLast < COOLDOWN_MS) {
        isCooldownActive = true;
        const nextFreeTime = lastAnalysisTimestamp + COOLDOWN_MS;
        startCooldownTimer(nextFreeTime, cooldownTimer); // Temporizador principal
    } else {
        cooldownTimer.textContent = 'Listo';
    }
    
    // 3. Habilitar/Deshabilitar Botón principal (ANALIZAR)
    // Se puede analizar si: (Quedan usos gratis O hay un bono activo) Y NO está en cooldown
    const hasActiveUses = remainingFree > 0 || isBonusActive;
    const canAnalyze = hasActiveUses && !isCooldownActive;
    
    if (imageBase64) {
        analyzeButton.disabled = !canAnalyze;
    } else {
        analyzeButton.disabled = true; // Siempre deshabilitado si no hay imagen
    }
    
    // 4. Actualizar texto del botón
    if (isCooldownActive) {
        buttonText.textContent = `En espera. Siguiente análisis en...`;
    } else if (isBonusActive) {
        buttonText.textContent = 'Analizar (Usando Bono)';
    } else if (remainingFree <= 0 && remainingAdsClaimable > 0) {
        // El usuario agotó los gratis y necesita reclamar un bono para continuar.
        buttonText.textContent = 'Ver anuncio para desbloquear análisis';
        analyzeButton.disabled = true; // Botón principal DESHABILITADO si necesita ver anuncio
    } else if (remainingTotal <= 0) {
        buttonText.textContent = 'Límite diario alcanzado';
    } else {
        buttonText.textContent = 'Analizar Plato y Calcular Costo';
    }

    // 5. Control del Banner de Anuncio
    if (remainingAdsClaimable > 0) {
        adBanner.classList.remove('hidden');
    } else {
        adBanner.classList.add('hidden');
    }
}

/**
 * Inicia el temporizador de cuenta regresiva para el cooldown.
 */
function startCooldownTimer(targetTimestamp, element) {
    if (countdownInterval) clearInterval(countdownInterval);

    const updateTimer = () => {
        const now = Date.now();
        const diff = targetTimestamp - now;

        if (diff <= 0) {
            clearInterval(countdownInterval);
            element.textContent = '¡Listo!';
            updateDisplayAndControls(); // Revisa el estado cuando el cooldown termina
            return;
        }

        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        element.textContent = `${minutes}m ${seconds}s`;
    };

    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
}

// --- Lógica del Ad Block (Simulado) ---

/**
 * Simula la visualización de un anuncio de recompensa y reclama el bono.
 */
function simulateAdView() {
    const { adCount, adBonusLimit, lastAnalysisTimestamp } = usageStatus;
    const remainingAdsClaimable = adBonusLimit - adCount;

    if (remainingAdsClaimable <= 0) {
        alert("Ya has reclamado todos los bonos por anuncio de hoy.");
        return;
    }
    
    // Anti-abuso: Cooldown entre anuncios (bypassado a 1ms para pruebas)
    const now = Date.now();
    const timeSinceLast = now - lastAnalysisTimestamp;
    
    if (lastAnalysisTimestamp !== 0 && timeSinceLast < AD_COOLDOWN_MS) {
        const nextAdTime = lastAnalysisTimestamp + AD_COOLDOWN_MS;
        const diff = nextAdTime - now;
        const minutes = Math.ceil(diff / (1000 * 60));
        alert(`Debes esperar ${minutes} minutos antes de ver otro anuncio. (Cooldown de 30 minutos).`); 
        return;
    }

    // --- Simulación de UI de Anuncio ---
    viewAdButton.disabled = true;
    const adButtonSpan = viewAdButton.querySelector('#ad-button-text');
    const originalText = adButtonSpan.textContent;
    adButtonSpan.textContent = "Cargando anuncio...";
    adButtonLoader.classList.remove('hidden');

    // Simulación del tiempo del anuncio
    setTimeout(async () => {
        adButtonSpan.textContent = "¡Anuncio completado! Reclamando bono...";
        await claimAdBonus();
        closePremiumModal();
        alert("¡Genial! Has desbloqueado un uso de bono.");
        
        // El botón se reestablece al final
        viewAdButton.disabled = false;
        adButtonSpan.textContent = originalText;
        adButtonLoader.classList.add('hidden');

    }, 3000);
}

/**
 * Llama al backend para incrementar el contador de bonos y activar isBonusActive.
 */
async function claimAdBonus() {
    try {
        const payload = {
            action: 'claim_ad_bonus',
            userId: userFingerprint
        };
        const response = await fetch(googleWebAppUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });

        const result = await response.json();
        if (result.success && result.status) {
            usageStatus = result.status;
            // IMPORTANTE: El backend ahora retorna status.isBonusActive = true, lo que activa el botón Analizar.
            updateDisplayAndControls(); 
        } else {
            console.error("Error al reclamar el bono:", result.message);
            alert("Error: No se pudo registrar el bono. " + result.message);
        }
    } catch (e) {
        console.error("Error de red al reclamar el bono:", e);
    }
}


// --- Lógica Principal de Análisis (Modificada) ---
analyzeButton.addEventListener('click', () => {
    if (imageBase64) {
        analyzeImage(imageBase64);
    } else {
        showError("Por favor, selecciona una imagen primero.");
    }
});

async function analyzeImage(base64ImageData) {
    resetUI();
    resultsContainer.classList.remove('hidden');
    
    // Deshabilitar botón mientras se procesa
    analyzeButton.disabled = true;
    buttonText.classList.add('hidden');
    buttonLoader.classList.remove('hidden');
    loader.classList.remove('hidden');

    try {
        const payload = {
            action: 'analyze',
            imageData: base64ImageData,
            location: userLocation,
            userId: userFingerprint
        };
        const response = await fetch(googleWebAppUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });

        if (!response.ok) { throw new Error(`Error de red: ${response.statusText}`); }

        const result = await response.json();

        if (result.success) {
            baseRecipeForOne = result.data;
            usageStatus = result.status; // Actualizar estado después de usar un análisis
            updateDisplayForServings();
            updateDisplayAndControls();
        } else if (result.message === 'limit_reached') {
            usageStatus = result.status;
            updateDisplayAndControls();
            showPremiumModal(false); // Mostrar modal de límite total
        } else if (result.message === 'cooldown_active') {
            usageStatus = result.status;
            updateDisplayAndControls();
            showPremiumModal(true); // Mostrar modal de cooldown
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error("Error detallado:", error);
        showError(`Lo siento, hubo un error: ${error.message}`);
    } finally {
        buttonText.classList.remove('hidden');
        buttonLoader.classList.add('hidden');
        updateDisplayAndControls(); // Re-habilitar/actualizar control
    }
}


// --- Funciones auxiliares (Geolocalización, Cámara, UI, Compartir) ---

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                locationStatusEl.textContent = "✅ Ubicación obtenida. ¡Listo para analizar!";
            },
            () => {
                locationStatusEl.textContent = "⚠️ No se pudo obtener la ubicación. Se usarán estimaciones en USD.";
            }
        );
    } else {
        locationStatusEl.textContent = "La geolocalización no es soportada por este navegador.";
    }
}

function handleImageData(dataUrl) {
    imageBase64 = dataUrl.split(',')[1];
    imagePreview.src = dataUrl;
    uploadOptionsContainer.classList.add('hidden');
    imagePreviewContainer.classList.remove('hidden');
    updateDisplayAndControls(); // Actualiza el botón al cargar la imagen
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => handleImageData(e.target.result);
        reader.readAsDataURL(file);
    }
}

async function openCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }

    const constraints = { video: { facingMode: currentFacingMode } };

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraFeed.srcObject = mediaStream;
        await cameraFeed.play();
        cameraModal.classList.remove('hidden');
    } catch (err) {
        console.error("Error al acceder a la cámara:", err);
        alert("No se pudo acceder a la cámara. Por favor, asegúrate de haber dado los permisos en los ajustes de tu navegador y que la página esté en HTTPS.\n\nError: " + err.message);
    }
}

function closeCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    cameraModal.classList.add('hidden');
}

function takePicture() {
    const context = cameraCanvas.getContext('2d');
    cameraCanvas.width = cameraFeed.videoWidth;
    cameraCanvas.height = cameraFeed.videoHeight;
    context.drawImage(cameraFeed, 0, 0, cameraCanvas.width, cameraCanvas.height);
    const dataUrl = cameraCanvas.toDataURL('image/jpeg', 0.9);
    handleImageData(dataUrl);
    closeCamera();
}

function switchCamera() {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    openCamera();
}

servingsSelector.addEventListener('change', (event) => {
    if(event.target.name === 'servings') {
        currentServings = parseInt(event.target.value, 10);
        if(baseRecipeForOne) {
            updateDisplayForServings();
        }
    }
});

function updateDisplayForServings() {
    if (!baseRecipeForOne) return;

    const scaledRecipe = JSON.parse(JSON.stringify(baseRecipeForOne)); 
    scaledRecipe.ingredients.forEach(ing => {
        ing.quantity *= currentServings;
        if (ing.estimatedLocalPrice) {
            ing.estimatedLocalPrice *= currentServings;
        }
    });

    currentRecipeForDisplay = scaledRecipe;
    displayResults(currentRecipeForDisplay);
}

function displayResults(data) {
    loader.classList.add('hidden'); 

    let totalCost = 0;
    const currency = data.currencyCode || 'USD';

    dishNameEl.textContent = `${data.dishName || "Plato no identificado"} (para ${currentServings} ${currentServings > 1 ? 'personas' : 'persona'})`;
    
    cartListEl.innerHTML = '';
    instructionListEl.innerHTML = '';
    supermarketListEl.innerHTML = '';

    data.ingredients.forEach(ing => {
        const itemPrice = ing.estimatedLocalPrice || 0;
        totalCost += itemPrice;
        const li = document.createElement('li');
        li.className = 'grid grid-cols-2 gap-4 items-center';
        li.innerHTML = `<span>${ing.quantity.toFixed(2).replace(/\.00$/, '')} ${ing.unit} de ${ing.name}</span> <span class="font-medium text-gray-700 text-right">${itemPrice.toFixed(2)} ${currency}</span>`;
        cartListEl.appendChild(li);
    });

    totalCostEl.textContent = `${totalCost.toFixed(2)} ${currency}`;
    
    baseRecipeForOne.instructions.forEach(step => {
        instructionListEl.innerHTML += `<li>${step}</li>`;
    });
    
    if (data.supermarketSuggestions && data.supermarketSuggestions.length > 0) {
        data.supermarketSuggestions.forEach(store => {
            supermarketListEl.innerHTML += `<li>${store}</li>`;
        });
        supermarketSectionEl.classList.remove('hidden');
    } else {
        supermarketSectionEl.classList.add('hidden');
    }
    
    resultContent.classList.remove('hidden');
    shareButtons.classList.remove('hidden');
}

function resetUI() {
    resultContent.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loader.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    baseRecipeForOne = null;
    currentRecipeForDisplay = null;
    document.getElementById('servings1').checked = true;
    currentServings = 1;
}

function showError(message) {
    loader.classList.add('hidden');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    resultsContainer.classList.remove('hidden');
    resultContent.classList.add('hidden');
}

function generateShareableText(platform = 'clipboard') {
    if (!currentRecipeForDisplay) return "Mi receta";
    const recipe = currentRecipeForDisplay;
    let totalCost = 0;
    const title = (text) => platform === 'whatsapp' ? `*${text}*` : text.toUpperCase();
    const nl = '\n';
    const separator = '---------------------\n';
    let shareText = title(`${recipe.dishName} (para ${currentServings} ${currentServings > 1 ? 'personas' : 'persona'})`) + nl + nl;
    shareText += "🛒 " + title("Lista de Compras") + nl;
    recipe.ingredients.forEach(ing => {
        const itemPrice = ing.estimatedLocalPrice || 0;
        totalCost += itemPrice;
        shareText += `- ${ing.quantity.toFixed(2).replace(/\.00$/, '')} ${ing.unit} de ${ing.name} (aprox. ${itemPrice.toFixed(2)} ${recipe.currencyCode})\n`;
    });
    shareText += nl + `Costo Total Estimado: ${totalCost.toFixed(2)} ${recipe.currencyCode}` + nl;
    if (recipe.supermarketSuggestions && recipe.supermarketSuggestions.length > 0) {
        shareText += nl + "🏪 " + title("Puedes comprar en") + nl + recipe.supermarketSuggestions.join(', ') + nl;
    }
    shareText += nl + separator;
    shareText += "📝 " + title("Instrucciones") + nl;
    baseRecipeForOne.instructions.forEach((step, i) => { shareText += `${i + 1}. ${step}\n`; });
    return shareText;
}

function copyToClipboard() {
    const textToCopy = generateShareableText('clipboard');
    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalContent = copyButton.innerHTML;
        copyButton.innerHTML = '¡Copiado! ✅';
        copyButton.disabled = true;
        setTimeout(() => {
            copyButton.innerHTML = originalContent;
            copyButton.disabled = false;
        }, 2000);
    }).catch(err => {
        console.error('Error al copiar texto: ', err);
        alert('No se pudo copiar el texto. Inténtalo manualmente.');
    });
}

function share(platform) {
    const textToShare = generateShareableText(platform);
    const encodedText = encodeURIComponent(textToShare);
    let url = '';
    switch (platform) {
        case 'whatsapp':
            url = `https://wa.me/?text=${encodedText}`;
            window.open(url, '_blank');
            break;
        case 'email':
            const subject = encodeURIComponent(`Receta para ${currentRecipeForDisplay.dishName}`);
            const emailBody = encodeURIComponent(generateShareableText('email'));
            url = `mailto:?subject=${subject}&body=${emailBody}`;
            window.location.href = url;
            break;
    }
}

// --- Lógica de la intro ---
document.addEventListener('DOMContentLoaded', function() {
    const introOverlay = document.getElementById('intro-overlay');
    setTimeout(() => {
        introOverlay.classList.add('fade-out');
        setTimeout(() => {
            introOverlay.style.display = 'none';
        }, 800);
    }, 3000);
});
