// En tu archivo script.js

// --- ¡IMPORTANTE! Pega aquí la URL de tu Web App de Google Script ---
const googleWebAppUrl = "https://script.google.com/macros/s/AKfycbzwfyiU2xQoHYPU5eCZ0k2eSqs0CzouKYH571IrGJ5k_VlYvnItkIYtc13qJ2nIWY9lJw/exec";

// --- Referencias al DOM ---
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
const counterDisplay = document.getElementById('counter-display');
const premiumModal = document.getElementById('premium-modal');
const closeModalButton = document.getElementById('close-modal-button');
const buyPremiumButton = document.getElementById('buy-premium-button');
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

// --- Estado de la Aplicación ---
let baseRecipeForOne = null;
let currentRecipeForDisplay = null;
let imageBase64 = null;
let userLocation = null;
let currentServings = 1;
const DAILY_LIMIT = 7;
let userFingerprint = null;
let mediaStream = null;
let currentFacingMode = 'environment';

// --- Inicialización y Event Listeners ---
window.onload = async function() {
    getLocation();
    userFingerprint = await getFingerprint();
    getAnalysisCount();

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
        analyzeButton.disabled = true;
    });
};


// --- Lógica del Contador con Huella Digital ---
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

function updateControlsState(remaining) {
    if (remaining <= 0) {
        analyzeButton.disabled = true;
        takePhotoButton.disabled = true;
        changePhotoButton.disabled = true;
        // Deshabilitar el label del input de archivo
        const fileLabel = document.querySelector('label[for="file-input"]');
        if (fileLabel) {
            fileLabel.style.pointerEvents = 'none';
            fileLabel.style.opacity = '0.6';
        }
        takePhotoButton.style.opacity = '0.6';
        buttonText.textContent = 'Límite diario alcanzado';
    } else {
        analyzeButton.disabled = !imageBase64;
        takePhotoButton.disabled = false;
        changePhotoButton.disabled = false;
        const fileLabel = document.querySelector('label[for="file-input"]');
        if (fileLabel) {
            fileLabel.style.pointerEvents = 'auto';
            fileLabel.style.opacity = '1';
        }
        takePhotoButton.style.opacity = '1';
        buttonText.textContent = 'Analizar Plato y Calcular Costo';
    }
}

function updateCounterDisplay(count) {
    const remaining = DAILY_LIMIT - count;
    counterDisplay.textContent = `Análisis restantes hoy: ${remaining > 0 ? remaining : 0}`;
    updateControlsState(remaining);
}

async function getAnalysisCount() {
    try {
        const payload = {
            action: 'get_count',
            userId: userFingerprint
        };
        const response = await fetch(googleWebAppUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });

        const result = await response.json();
        if (result.success) {
            updateCounterDisplay(result.count);
            if (result.count >= DAILY_LIMIT) {
                showPremiumModal();
            }
        }
    } catch (e) {
        console.error("Error al obtener el conteo:", e);
    }
}

// --- Lógica de Geolocalización ---
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

// --- Lógica de Cámara e Imágenes ---

function handleImageData(dataUrl) {
    imageBase64 = dataUrl.split(',')[1];
    imagePreview.src = dataUrl;
    uploadOptionsContainer.classList.add('hidden');
    imagePreviewContainer.classList.remove('hidden');
    analyzeButton.disabled = false;
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


// --- Lógica Principal de Análisis ---
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
            updateDisplayForServings();
            updateCounterDisplay(result.count);
        } else if (result.message === 'limit_reached') {
            updateCounterDisplay(DAILY_LIMIT);
            showPremiumModal();
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error("Error detallado:", error);
        showError(`Lo siento, hubo un error: ${error.message}`);
    } finally {
        buttonText.classList.remove('hidden');
        buttonLoader.classList.add('hidden');
    }
}

// --- Lógica de la interfaz de usuario ---
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

// --- Confeti y Modal ---
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

function showPremiumModal() {
    launchConfetti(); 
    premiumModal.classList.remove('hidden');
    setTimeout(() => premiumModal.classList.add('show'), 10);
}

function closePremiumModal() {
    premiumModal.classList.remove('show');
    setTimeout(() => premiumModal.classList.add('hidden'), 300);
}

closeModalButton.addEventListener('click', closePremiumModal);
buyPremiumButton.addEventListener('click', () => { closePremiumModal(); });

// --- Lógica para Compartir ---
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
        alert('No se pudo copiar el texto. Inténtalo manually.');
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