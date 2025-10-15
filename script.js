document.addEventListener('DOMContentLoaded', () => {

    // =====================================================================
    // === CONSTANTES Y CONFIGURACIÓN ===
    // =====================================================================
    
    // URL de la Web App de Google actualizada
    const GOOGLE_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbytqUkw9u2HQywOXlNcXsMpJaJZZlh4wXFuDwme3GFJdk-gKgT7JUkT0Cn9mpjQXOfX2A/exec'; 

    const APP_VERSION = "1.0.2";
    const LOADING_MESSAGES = [
        "Analizando los sabores...",
        "Consultando a nuestros chefs de IA...",
        "Calculando los costos locales...",
        "¡Casi listo! Dando los toques finales...",
    ];
    // CORRECCIÓN A MINÚSCULAS: Se cambiaron los valores para coincidir con la lógica estricta del backend (get_status, analyze, etc.)
    const ApiAction = {
        GET_STATUS: 'get_status', 
        ANALYZE: 'analyze',
        REMIX: 'remix',
        CLAIM_AD_BONUS: 'claim_ad_bonus',
        CHECK_MESSAGES: 'check_messages',
    };
    const CACHE_PREFIX = 'cusicusa_cache_';
    const LAST_RECIPE_KEY = 'cusicusa_last_recipe';


    // =====================================================================
    // === ESTADO GLOBAL DE LA APLICACIÓN ===
    // =====================================================================

    let state = {
        showIntro: true,
        imageBase64: null,
        recipe: null,
        view: 'upload', // 'upload', 'loading', 'results'
        error: null,
        loadingMessageInterval: null,
        isRemixing: false,
        currentRemixType: null, // 'quick', 'healthy', 'spicy'
        analysisMode: 'photo', // 'photo', 'ingredients'
        ingredientsText: '',
        userStatus: null,
        premiumModalContext: null, // 'ingredients', 'extra_analysis', 'remix'
        unreadMessage: null,
        displayedMessage: null,
        isMenuModalOpen: false,
        visitorId: null,
        location: null,
        locationError: null,
        cameraStream: null,
        // Nuevo estado para la lista de ingredientes marcados
        checkedIngredients: []
    };

    // =====================================================================
    // === REFERENCIAS A ELEMENTOS DEL DOM ===
    // =====================================================================
    
    // Objeto vacío para almacenar las referencias del DOM
    const DOMElements = {};
    
    /** * @description Inicializa las referencias a los elementos del DOM. */
    function initDOMElements() {
        DOMElements.uploadView = document.getElementById('view-upload');
        DOMElements.loadingView = document.getElementById('view-loading');
        DOMElements.resultsView = document.getElementById('view-results');
        DOMElements.introOverlay = document.getElementById('intro-overlay');
        DOMElements.headerLogoBtn = document.getElementById('header-logo-btn');
        DOMElements.headerNotificationBtn = document.getElementById('header-notification-btn');
        DOMElements.headerNotificationDot = document.getElementById('header-notification-dot');
        DOMElements.notificationBanner = document.getElementById('notification-banner');
        DOMElements.notificationMessage = document.getElementById('notification-message');
        DOMElements.notificationCloseBtn = document.getElementById('notification-close-btn');
        DOMElements.locationStatus = document.getElementById('location-status');
        DOMElements.statusTracker = document.getElementById('status-tracker');
        DOMElements.lastRecipeCard = document.getElementById('last-recipe-card');
        DOMElements.showLastRecipeBtn = document.getElementById('show-last-recipe-btn');
        DOMElements.lastRecipeName = document.getElementById('last-recipe-name');
        DOMElements.specialOfferCard = document.getElementById('special-offer-card');
        DOMElements.modePhotoBtn = document.getElementById('mode-photo-btn');
        DOMElements.modeIngredientsBtn = document.getElementById('mode-ingredients-btn');
        DOMElements.analysisModeContainer = document.getElementById('analysis-mode-container');
        DOMElements.analyzeButtonContainer = document.getElementById('analyze-button-container');
        DOMElements.loaderAnimationContainer = document.getElementById('loader-animation-container');
        DOMElements.loadingMessage = document.getElementById('loading-message');
        DOMElements.menuModal = document.getElementById('menu-modal');
        DOMElements.appVersion = document.getElementById('app-version');
        DOMElements.privacyPolicyBtn = document.getElementById('privacy-policy-btn');
        DOMElements.updatesBtn = document.getElementById('updates-btn');
        DOMElements.simulateAdBtn = document.getElementById('simulate-ad-btn');
        DOMElements.menuModalCloseBtn = document.getElementById('menu-modal-close-btn');
        DOMElements.limitModal = document.getElementById('limit-modal');
        DOMElements.limitModalIcon = document.getElementById('limit-modal-icon');
        DOMElements.limitModalTitle = document.getElementById('limit-modal-title');
        DOMElements.limitModalDescription = document.getElementById('limit-modal-description');
        DOMElements.limitModalActions = document.getElementById('limit-modal-actions');
        DOMElements.premiumSaveModal = document.getElementById('premium-save-modal');
        DOMElements.premiumSaveUpgradeBtn = document.getElementById('premium-save-upgrade-btn');
        DOMElements.premiumSaveCloseBtn = document.getElementById('premium-save-close-btn');
        DOMElements.cameraModal = document.getElementById('camera-modal');
        DOMElements.cameraVideo = document.getElementById('camera-video');
        DOMElements.cameraCanvas = document.getElementById('camera-canvas');
        DOMElements.cameraLoader = document.getElementById('camera-loader');
        DOMElements.cameraError = document.getElementById('camera-error');
        DOMElements.cameraCancelBtn = document.getElementById('camera-cancel-btn');
        DOMElements.cameraCaptureBtn = document.getElementById('camera-capture-btn');
        DOMElements.cameraSwitchBtn = document.getElementById('camera-switch-btn');
    }

    // =====================================================================
    // === SERVICIOS (API, Cache, etc.) ===
    // =====================================================================

// =====================================================================
// === SERVICIO DE CACHE (SIMPLIFICADO Y FIABLE) ===
// =====================================================================
const cacheService = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error("Cache read error:", e);
            return null;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error("Cache write error:", e);
        }
    },
    getLast: () => {
        try {
            const item = localStorage.getItem(LAST_RECIPE_KEY);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error("Cache read last error:", e);
            return null;
        }
    },
    setLast: (value) => {
        try {
            localStorage.setItem(LAST_RECIPE_KEY, JSON.stringify(value));
        } catch (e) {
            console.error("Cache write last error:", e);
        }
    },
    clearLast: () => {
        try {
            localStorage.removeItem(LAST_RECIPE_KEY);
        } catch (e) {
            console.error("Cache clear last error:", e);
        }
    }
};


    /**
     * @description Realiza una llamada a la Google Web App (Apps Script).
     * @param {string} action - La acción a ejecutar en el backend.
     * @param {object} payload - Los datos a enviar al backend.
     * @returns {Promise<object>}
     */
    async function callWebApp(action, payload) {
        // CORRECCIÓN: Estructura del payload enviada al backend
        const debugPayload = { action, ...payload }; 
        
        try {
            // CORRECCIÓN CLAVE: No especificar Content-Type para evitar redirección CORS (302).
            const response = await fetch(GOOGLE_WEB_APP_URL, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify(debugPayload),
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }

            const text = await response.text();
            
            // Intenta parsear la respuesta como JSON
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                // Si el backend devuelve HTML/texto de error, manejarlo como fallo de comunicación
                console.error(`Error: La respuesta para la acción ${action} no es un JSON válido.`, text);
                return { success: false, message: 'Respuesta inválida del servidor. Revisa el script de Google Apps.', rawResponse: text };
            }

            // Si el backend devuelve un error de lógica, lo mostramos en la consola junto con la acción
            if (result.success === false) {
                 console.error(`API Logic Error for action ${action}:`, result.message);
            }

            // Mapeo por compatibilidad con el backend
            if (result.status && typeof result.status.adCount !== 'undefined') {
                result.status.rewardedUsedToday = result.status.adCount;
                delete result.status.adCount;
            }

            return result;

        } catch (error) {
            // Error de red o comunicación (TypeError: Failed to fetch)
            console.error(`API Communication Error for action ${action} (Network/Fetch failure):`, error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return { success: false, message: `API Communication Error: ${errorMessage}` };
        }
    }
    
    // =====================================================================
    // === FUNCIONES DE RENDERIZADO Y MANIPULACIÓN DEL DOM ===
    // =====================================================================

    /**
     * Updates the main view of the application.
     * @param {'upload' | 'loading' | 'results'} newView The view to display.
     */
    function updateView(newView) {
        state.view = newView;
        DOMElements.uploadView.classList.toggle('hidden', newView !== 'upload');
        DOMElements.loadingView.classList.toggle('hidden', newView !== 'loading');
        DOMElements.resultsView.classList.toggle('hidden', newView !== 'results');
        
        // Banner and loading message logic
        if (newView === 'upload') {
            window.androidApp?.showBannerAd?.();
            if (state.loadingMessageInterval) clearInterval(state.loadingMessageInterval);
        } else {
            window.androidApp?.hideBannerAd?.();
        }

        if (newView === 'loading') {
            let messageIndex = 0;
            DOMElements.loadingMessage.textContent = LOADING_MESSAGES[0];
            state.loadingMessageInterval = setInterval(() => {
                messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
                DOMElements.loadingMessage.textContent = LOADING_MESSAGES[messageIndex];
            }, 2500);
        }
    }

    /** Muestra un banner de notificación temporal. */
function showNotification(messageOrObject) {
    // --- INICIO DE LA CORRECCIÓN ---
    if (!messageOrObject) return;

    let content, type;
    
    // Primero, revisa si lo que llega es un texto simple (para que no se rompan otras notificaciones)
    // o si es el nuevo objeto que envía el servidor.
    if (typeof messageOrObject === 'string') {
        content = messageOrObject;
        type = 'text';
    } else {
        content = messageOrObject.content; // Extrae el contenido del objeto
        type = messageOrObject.type || 'text'; // Extrae el tipo del objeto
    }

    if (!content) return;

    // Ahora, dependiendo del tipo, lo muestra como HTML o como texto.
    if (type === 'html') {
        DOMElements.notificationMessage.innerHTML = content;
    } else {
        DOMElements.notificationMessage.textContent = content;
    }
    // --- FIN DE LA CORRECCIÓN ---

    DOMElements.notificationBanner.classList.remove('hidden');
    DOMElements.notificationBanner.classList.add('animate-slide-down');
    
    // ELIMINAMOS ESTE BLOQUE DE CÓDIGO
    /*
    setTimeout(() => {
        DOMElements.notificationBanner.classList.add('hidden');
        DOMElements.notificationBanner.classList.remove('animate-slide-down');
    }, 8000);
    */
   // --- FIN DE LA MODIFICACIÓN ---
}

    /** Renderiza el componente LocationStatus */
    function renderLocationStatus() {
        let statusText = "Obteniendo ubicación para precios locales...";
        let icon = '🔄';
        let textColor = "text-gray-500";

        if (state.location) {
            statusText = "Ubicación obtenida";
            icon = '✅';
            textColor = "text-green-600";
        } else if (state.locationError) {
            statusText = state.locationError;
            icon = '⚠️';
            textColor = "text-amber-600";
        }
        
        DOMElements.locationStatus.className = `text-center font-medium text-xs flex items-center justify-center gap-1.5 ${textColor}`;
        DOMElements.locationStatus.title = statusText;
        DOMElements.locationStatus.innerHTML = `<span class="mr-1">${icon}</span><span class="truncate">${statusText}</span>`;
    }

    /** Renderiza el componente StatusTracker */
    function renderStatusTracker() {
        if (!state.userStatus) {
            DOMElements.statusTracker.innerHTML = '';
            return;
        }
        const { freeCount, freeLimit, rewardedUsedToday, adBonusLimit, isBonusActive } = state.userStatus;
        const remainingFree = Math.max(0, freeLimit - freeCount);
        const hasFreeAnalyses = remainingFree > 0;
        const freeAnalysisClasses = !hasFreeAnalyses ? "text-orange-500 cursor-pointer animate-pulse" : "text-gray-800";
        
        const html = `
            <div class="text-center my-4 p-3 rounded-2xl bg-gray-50 border border-gray-200">
                <div class="flex justify-around items-start divide-x divide-gray-200">
                    <div id="extra-analysis-btn" class="flex-1 px-2 text-center flex flex-col items-center justify-start ${!hasFreeAnalyses ? 'cursor-pointer' : ''}">
                        <div class="h-12 flex items-center justify-center">
                            <p class="text-4xl font-extrabold tracking-tight ${freeAnalysisClasses}">${remainingFree}/${freeLimit}</p>
                        </div>
                        <p class="text-xs font-medium text-gray-500 mt-1">Análisis Gratis</p>
                    </div>
                    <div class="flex-1 px-2 text-center flex flex-col items-center justify-start">
                        <div class="h-12 flex items-center justify-center">
                            ${isBonusActive
                                ? `<span class="text-4xl text-green-500" role="img" aria-label="Bono Activo">✅</span>`
                                : `<p class="text-4xl font-extrabold text-gray-800 tracking-tight">${rewardedUsedToday}/${adBonusLimit}</p>`
                            }
                        </div>
                        <p class="text-xs font-medium text-gray-500 mt-1">
                            ${isBonusActive ? "Bono Disponible" : "Bonos Ganados Hoy"}
                        </p>
                    </div>
                </div>
            </div>`;
        DOMElements.statusTracker.innerHTML = html;
        if (!hasFreeAnalyses) {
            document.getElementById('extra-analysis-btn').addEventListener('click', handleExtraAnalysisRequest);
        }
    }

    /** Renderiza la tarjeta de oferta especial. */
    function renderSpecialOfferCard() {
        const offers = [
            { image: "https://images.unsplash.com/photo-1518843875459-f738682238a6?q=80&w=2070&auto=format&fit=crop", title: "¡Conviértete en Chef Pro!", description: "Accede a funciones exclusivas y análisis ilimitados.", buttonText: "Ver Planes Pro", buttonClass: "bg-teal-500 hover:bg-teal-400" },
            { image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop", title: "Planifica tu Semana", description: "Genera un menú semanal completo con nuestra IA.", buttonText: "Crear Menú", buttonClass: "bg-blue-500 hover:bg-blue-400" },
            { image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop", title: "¡Comparte y Gana!", description: "Invita a un amigo y ambos obtienen 5 análisis extra.", buttonText: "Invitar Amigos", buttonClass: "bg-purple-500 hover:bg-purple-400" },
            { image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop", title: "¿Necesitas una dieta especial?", description: "Desbloquea recetas keto, veganas, y más con CusiCusa.", buttonText: "Explorar Dietas", buttonClass: "bg-green-500 hover:bg-green-400" }
        ];
        let currentOfferIndex = 0;
        let intervalId = null;

        function updateOffer() {
            const currentOffer = offers[currentOfferIndex];
            DOMElements.specialOfferCard.innerHTML = `
                <div class="relative rounded-2xl overflow-hidden shadow-lg mt-6 bg-gray-800 transform transition-transform duration-300 hover:scale-[1.03] h-48">
                    ${offers.map((offer, index) => `<img src="${offer.image}" alt="Promotional background" class="absolute w-full h-full object-cover transition-opacity duration-1000 ${index === currentOfferIndex ? 'opacity-30' : 'opacity-0'}" />`).join('')}
                    <div class="relative p-6 flex flex-col justify-between h-full text-white">
                        <div class="transition-opacity duration-700">
                            <h3 class="text-2xl font-extrabold" style="text-shadow: 0 2px 4px rgba(0,0,0,0.5)">${currentOffer.title}</h3>
                            <p class="mt-1 text-sm font-medium opacity-90" style="text-shadow: 0 1px 3px rgba(0,0,0,0.5)">${currentOffer.description}</p>
                        </div>
                        <button class="mt-4 self-start text-white font-bold py-2 px-5 rounded-lg text-sm transition-all duration-300 shadow-md hover:shadow-lg ${currentOffer.buttonClass}">${currentOffer.buttonText}</button>
                    </div>
                </div>`;
        }
        
        function stopCarousel() {
            if(intervalId) clearInterval(intervalId);
        }

        function startCarousel() {
            stopCarousel();
            updateOffer();
            intervalId = setInterval(() => {
                currentOfferIndex = (currentOfferIndex + 1) % offers.length;
                updateOffer();
            }, 5000);
        }
        
        startCarousel();
    }

    /** Renderiza el manejador de imagen o el input de ingredientes. */
    function renderAnalysisMode() {
        if (state.analysisMode === 'photo') {
            DOMElements.analysisModeContainer.innerHTML = state.imageBase64
                ? `<div class="relative group">
                      <img src="data:image/jpeg;base64,${state.imageBase64}" class="rounded-2xl w-full h-auto max-h-80 object-contain shadow-md" alt="Vista previa" />
                      <button id="reset-image-btn" class="absolute top-3 right-3 bg-black bg-opacity-40 text-white rounded-full p-2 hover:bg-opacity-70 transition-all scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white" aria-label="Change photo">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>`
                : `<div class="space-y-4">
                      <div class="text-center text-gray-600">
                          <p class="font-bold text-xl text-gray-800">Sube una foto de tu comida</p>
                          <p class="text-sm mt-1">Descubre la receta secreta en un instante.</p>
                      </div>
                      <div class="flex gap-4">
                          <button id="open-camera-btn" type="button" class="flex flex-col items-center justify-center flex-1 rounded-2xl bg-orange-50 border-2 border-dashed border-orange-200 p-6 text-orange-800 font-semibold cursor-pointer text-center transition-all duration-300 hover:bg-orange-100 hover:scale-105 hover:shadow-lg hover:border-solid">
                              <svg class="w-10 h-10 mx-auto mb-2 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
                              Usar Cámara
                          </button>
                          <label for="file-input" class="flex flex-col items-center justify-center flex-1 rounded-2xl bg-orange-50 border-2 border-dashed border-orange-200 p-6 text-orange-800 font-semibold cursor-pointer text-center transition-all duration-300 hover:bg-orange-100 hover:scale-105 hover:shadow-lg hover:border-solid">
                              <svg class="w-10 h-10 mx-auto mb-2 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                              Subir Archivo
                          </label>
                      </div>
                      <input id="file-input" type="file" accept="image/*" class="hidden" />
                  </div>`;
        } else {
            DOMElements.analysisModeContainer.innerHTML = `
                <div class="space-y-4">
                    <div class="text-center text-gray-600">
                        <p class="font-bold text-xl text-gray-800">¿Qué tienes en tu refri?</p>
                        <p class="text-sm mt-1">Lista tus ingredientes y crearemos una receta para ti.</p>
                    </div>
                    <textarea id="ingredients-textarea" rows="5" class="w-full p-4 rounded-2xl bg-orange-50 border-2 border-dashed border-orange-200 text-orange-800 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-solid transition-all" placeholder="Ej: Arroz, 2 pechugas de pollo, 1 limón, aceite de oliva...">${state.ingredientsText}</textarea>
                </div>`;
        }
        addAnalysisModeEventListeners();
    }

    /** Renderiza el botón principal de análisis. */
    function renderAnalyzeButton() {
        let text = '', disabled = true, showLoader = false;
        
        if (state.view === 'loading') {
            showLoader = true;
            disabled = true;
        } else if (!state.userStatus) {
            text = 'Cargando...'; // Estado inicial mientras se obtiene el status
        } else {
            const isInputReady = state.analysisMode === 'photo' ? !!state.imageBase64 : !!state.ingredientsText.trim();
            if (!isInputReady) {
                text = state.analysisMode === 'photo' ? 'Selecciona una imagen' : 'Lista tus ingredientes';
            } else {
                const { freeCount, freeLimit, isBonusActive } = state.userStatus;
                if (state.analysisMode === 'ingredients') {
                    disabled = false;
                    text = isBonusActive ? 'Usar Bono' : 'Desbloquear con Anuncio';
                } else { // Photo mode
                    const hasFreeUses = freeCount < freeLimit;
                    if (hasFreeUses) {
                        text = 'Generar Receta';
                        disabled = false;
                    } else if (isBonusActive) {
                        text = 'Usar Bono';
                        disabled = false;
                    } else {
                        text = 'Límite diario alcanzado';
                    }
                }
            }
        }

        const loaderHTML = `<div class="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" role="status" aria-label="loading"></div>`;
        DOMElements.analyzeButtonContainer.innerHTML = `
            <button id="analyze-btn" ${disabled ? 'disabled' : ''} class="w-full h-14 flex items-center justify-center rounded-xl font-bold text-lg text-white bg-brand-orange transition-all duration-300 transform hover:bg-brand-orange-light hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-300 disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:scale-100 disabled:shadow-none disabled:cursor-not-allowed">
                ${showLoader ? loaderHTML : `<span>${text}</span>`}
            </button>`;
        
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn && !disabled) {
            analyzeBtn.addEventListener('click', handleAnalysisRequest);
        }
    }
    
    /** Recalcula el costo total de la receta excluyendo los ingredientes seleccionados. */
    function updateTotalCost() {
        if (!state.recipe) return;

        const ingredientsList = DOMElements.resultsView.querySelectorAll('.ingredient-item');
        let runningTotal = 0;
        let currencyCode = state.recipe.currencyCode || '';
        
        ingredientsList.forEach((item, index) => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            
            // Actualizar el estado local de los ingredientes marcados
            state.checkedIngredients[index] = checkbox.checked;
            
            // Si el checkbox NO está marcado, sumamos el precio (es decir, el usuario NO tiene el ingrediente)
            if (checkbox && !checkbox.checked) {
                const price = parseFloat(checkbox.getAttribute('data-price')) || 0;
                runningTotal += price;
                // Ajustar estilos para indicar que debe comprar
                item.classList.remove('bg-gray-50');
                item.querySelector('label').classList.remove('line-through', 'opacity-60');
            } else {
                 // Ajustar estilos para indicar que ya tiene
                item.classList.add('bg-gray-50');
                item.querySelector('label').classList.add('line-through', 'opacity-60');
            }
        });

        const totalElement = DOMElements.resultsView.querySelector('#current-total-cost');
        if (totalElement) {
            totalElement.textContent = runningTotal.toFixed(2);
            // Si el costo es 0, ocultamos el código de moneda, sino lo mostramos.
            DOMElements.resultsView.querySelector('#total-currency-code').textContent = runningTotal > 0 ? currencyCode : '';
        }
        
        // **CORRECCIÓN:** Actualizar el módulo de compartir con el nuevo costo
        renderShareModule(runningTotal);
    }

    /** Renderiza el contenido de la vista de resultados */
    function renderResultsView() {
        if (state.error && !state.recipe) {
            DOMElements.resultsView.innerHTML = `
                <div class="text-center p-8 flex flex-col items-center justify-center h-full animate-fadeIn">
                    <h2 class="text-2xl font-bold text-red-600 mb-2">¡Oops! Algo salió mal</h2>
                    <p class="text-gray-600 bg-red-50 p-4 rounded-lg mb-6 max-w-sm w-full">${state.error}</p>
                    <button id="return-home-btn" class="w-full max-w-xs h-12 flex items-center justify-center rounded-xl font-semibold text-white bg-brand-orange hover:bg-brand-orange-light">Intentar de Nuevo</button>
                </div>`;
            document.getElementById('return-home-btn').addEventListener('click', returnToHome);
            return;
        }

        if (!state.recipe) {
             DOMElements.resultsView.innerHTML = `
                <div class="text-center p-8 flex flex-col items-center justify-center h-full animate-fadeIn">
                    <h2 class="text-2xl font-bold text-gray-700 mb-2">No se encontró la receta</h2>
                    <p class="text-gray-500 mb-6 max-w-sm w-full">No pudimos generar una receta. Intenta con una foto más clara o ingredientes diferentes.</p>
                    <button id="return-home-btn" class="w-full max-w-xs h-12 flex items-center justify-center rounded-xl font-semibold text-white bg-brand-orange">Volver a Empezar</button>
                </div>`;
             document.getElementById('return-home-btn').addEventListener('click', returnToHome);
             return;
        }
        
        const { dishName, preparationTime, difficulty, calories, ingredients, instructions, platingSuggestions, supermarketSuggestions, currencyCode } = state.recipe;
        
        // Inicializar checkedIngredients si es la primera vez que se renderiza esta receta
        if (state.checkedIngredients.length !== ingredients.length || state.isRemixing) {
            state.checkedIngredients = Array(ingredients.length).fill(false);
        }

        // 1. **CORRECCIÓN** Definir totalCost aquí para su uso local
        const initialTotalCost = ingredients.reduce((acc, ing) => acc + (ing.estimatedLocalPrice || 0), 0);

        const remixMessage = (() => {
            if (!state.userStatus) return '';
            const { isBonusActive, rewardedUsedToday, adBonusLimit } = state.userStatus;
            if (isBonusActive) return `<p class="text-center text-xs text-green-700 mb-3 font-semibold">¡Bono disponible para usar en Remix!</p>`;
            if (rewardedUsedToday < adBonusLimit) return `<p class="text-center text-xs text-amber-700 mb-3">Desbloquea Remix con un anuncio.</p>`;
            return `<p class="text-center text-xs text-gray-500 mb-3">Has usado todos tus bonos por hoy.</p>`;
        })();

        const recipeDetailsHTML = `
            <div class="mb-6">
                <div class="flex justify-between items-center mb-2">
                    <h2 class="text-xl font-bold text-gray-700">🛒 Lista de Compras</h2>
                    <div class="text-sm font-semibold text-gray-600 bg-orange-100 px-3 py-1 rounded-full shadow-sm">
                        Costo Restante: 
                        <span id="current-total-cost" class="font-extrabold text-brand-orange">${initialTotalCost.toFixed(2)}</span>
                        <span id="total-currency-code" class="text-xs text-brand-orange/80">${currencyCode}</span>
                    </div>
                </div>
                <p class="text-xs text-gray-500 mb-3">Marca los ingredientes que **YA TIENES** para recalcular el costo.</p>
                <ul class="space-y-2" id="ingredients-list">
                    ${ingredients.map((ing, index) => `
                        <li class="ingredient-item grid grid-cols-[auto_1fr_auto] items-start gap-3 bg-white p-3 rounded-lg border shadow-sm transition-all duration-200 hover:bg-gray-50 ${state.checkedIngredients[index] ? 'bg-gray-50' : ''}">
                            <!-- El precio se adjunta al checkbox para el cálculo -->
                            <input type="checkbox" id="ing-check-${index}" class="mt-1 w-5 h-5 text-brand-orange bg-gray-100 border-gray-300 rounded focus:ring-brand-orange checked:bg-brand-orange/90 cursor-pointer" 
                                data-price="${ing.estimatedLocalPrice || 0}"
                                ${state.checkedIngredients[index] ? 'checked' : ''}
                                aria-label="Tengo ${ing.name}">
                            <label for="ing-check-${index}" class="flex flex-col cursor-pointer ${state.checkedIngredients[index] ? 'line-through opacity-60' : ''}">
                                <span class="font-semibold text-gray-800">${ing.name}</span>
                                <span class="block text-xs text-gray-500">${ing.quantity.toFixed(2).replace(/\.00$/, '')} ${ing.unit}</span>
                            </label>
                            <div class="bg-gray-100 p-2 rounded-md text-center w-[70px] flex-shrink-0">
                                <p class="text-sm font-bold text-gray-800 ingredient-price">${(ing.estimatedLocalPrice || 0).toFixed(2)}</p>
                                <p class="text-xs -mt-1 text-gray-500">${ing.estimatedLocalPrice > 0 ? currencyCode : 'N/A'}</p>
                            </div>
                        </li>`).join('')}
                </ul>
            </div>
            <div class="mb-6">
                <h2 class="text-xl font-bold text-gray-700 mb-3">📝 Instrucciones</h2>
                <ol class="list-decimal list-outside space-y-3 pl-5 text-gray-700">${instructions.map(step => `<li class="pl-2 leading-relaxed">${step}</li>`).join('')}</ol>
            </div>
            ${platingSuggestions && platingSuggestions.length > 0 ? `
            <div class="mb-6">
                <h2 class="text-xl font-bold text-gray-700 mb-3">💡 Ideas para Emplatar</h2>
                <ul class="list-disc list-outside space-y-2 pl-5 text-gray-700">${platingSuggestions.map(tip => `<li class="pl-2 leading-relaxed">${tip}</li>`).join('')}</ul>
            </div>` : ''}
            ${supermarketSuggestions && supermarketSuggestions.length > 0 ? `
            <div class="mb-6">
                <h2 class="text-xl font-bold text-gray-700 mb-3">🏪 Dónde Comprar</h2>
                <div class="flex flex-wrap gap-2">${supermarketSuggestions.map(store => `<span class="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1.5 rounded-full">${store}</span>`).join('')}</div>
            </div>` : ''}
            <div id="share-module"></div>
            <div class="mt-8">
                <button id="return-home-btn" class="w-full h-12 flex items-center justify-center gap-2 rounded-xl font-semibold text-white bg-brand-orange hover:bg-brand-orange-light">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    <span>Volver al Inicio</span>
                </button>
            </div>
        `;

        const remixLoaderHTML = `
            <div class="flex flex-col justify-center items-center text-center py-16" aria-live="assertive">
                <div id="remix-loader-animation"></div>
                <p class="mt-4 text-gray-600 font-semibold animate-pulse">Mezclando tu receta...</p>
            </div>`;

        DOMElements.resultsView.innerHTML = `
            <div class="animate-slideInUp pb-4">
                ${state.error ? `<div class="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">${state.error}</div>` : ''}
                <div class="flex justify-between items-start mb-4">
                    <h1 class="text-3xl font-extrabold text-gray-800 tracking-tight pr-4">${dishName}</h1>
                    <button id="save-recipe-btn" class="flex-shrink-0 flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full transition hover:bg-amber-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        Guardar
                    </button>
                </div>
                <div class="flex gap-2 text-center my-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div class="flex-1 flex flex-col items-center"><div class="text-brand-orange"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><p class="text-sm font-bold text-gray-800 mt-1">${preparationTime}</p><p class="text-xs text-gray-500">Tiempo</p></div>
                    <div class="flex-1 flex flex-col items-center"><div class="text-brand-orange"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div><p class="text-sm font-bold text-gray-800 mt-1">${difficulty}</p><p class="text-xs text-gray-500">Dificultad</p></div>
                    <div class="flex-1 flex flex-col items-center"><div class="text-brand-orange"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div><p class="text-sm font-bold text-gray-800 mt-1">${calories}</p><p class="text-xs text-gray-500">Calorías</p></div>
                </div>
                
                <div class="my-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                    <h2 class="text-center text-lg font-bold text-amber-800 mb-1">Chef Remix</h2>
                    ${remixMessage}
                    <div class="flex gap-3 text-white text-sm">
                        <button id="remix-quick-btn" class="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed bg-sky-500 hover:bg-sky-600"><span class="text-2xl">⚡️</span><span>Versión Rápida</span></button>
                        <button id="remix-healthy-btn" class="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-600"><span class="text-2xl">🥗</span><span>Versión Saludable</span></button>
                        <button id="remix-spicy-btn" class="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600"><span class="text-2xl">🌶️</span><span>Versión Picante</span></button>
                    </div>
                </div>

                <div id="recipe-details-container">
                    ${state.isRemixing ? remixLoaderHTML : recipeDetailsHTML}
                </div>
            </div>`;

        renderShareModule(initialTotalCost);
        addResultsEventListeners();
        
        // Ejecutar cálculo de costo inicial y agregar listeners
        updateTotalCost(); // Debe llamarse para establecer el costo restante inicial
        DOMElements.resultsView.querySelectorAll('.ingredient-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', updateTotalCost);
        });

        if(state.isRemixing) {
            renderLoader('remix-loader-animation');
        }
    }

    function renderShareModule(totalCost) {
        const shareModuleContainer = document.getElementById('share-module');
        if (!shareModuleContainer) return;

        shareModuleContainer.innerHTML = `
            <div class="space-y-3 pt-4">
                 <p class="text-center text-sm font-semibold text-gray-500">Compartir Receta</p>
                 <div class="flex flex-col sm:flex-row gap-3">
                    <button id="copy-recipe-btn" class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md bg-gray-200 text-gray-800 hover:bg-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
                        <span>Copiar</span>
                    </button>
                    <button id="whatsapp-share-btn" class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md bg-[#25D366] text-white hover:bg-[#128C7E]">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zM6.597 20.193c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.003 2.011.564 3.965 1.634 5.675l-1.109 4.069 4.212-1.106z"/></svg>
                        <span>WhatsApp</span>
                    </button>
                 </div>
             </div>`;
        document.getElementById('copy-recipe-btn').addEventListener('click', () => handleShare('copy', totalCost));
        document.getElementById('whatsapp-share-btn').addEventListener('click', () => handleShare('whatsapp', totalCost));
    }

    /** Renderiza el loader SVG animado. */
    function renderLoader(containerId, isWhite = false) {
        const container = document.getElementById(containerId);
        if(!container) return;

        const animations = [
            // Pot Animation
            `<svg class="w-24 h-24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path class="steam steam-1 ${isWhite ? 'white': ''}" d="M40 45 Q 42 35, 40 25" fill="none" /><path class="steam steam-2 ${isWhite ? 'white': ''}" d="M50 45 Q 52 35, 50 25" fill="none" /><path class="steam steam-3 ${isWhite ? 'white': ''}" d="M60 45 Q 58 35, 60 25" fill="none" /><path d="M20 50 H 80 V 80 A 10 10 0 0 1 70 90 H 30 A 10 10 0 0 1 20 80 Z" fill="#E5E7EB" /><path d="M22 55 H 78 V 80 A 8 8 0 0 1 70 88 H 30 A 8 8 0 0 1 22 80 Z" fill="#F3F4F6" /><circle cx="15" cy="60" r="5" fill="#D1D5DB" /><circle cx="85" cy="60" r="5" fill="#D1D5DB" /><g class="pot-lid"><path d="M30 48 C 30 42, 70 42, 70 48" fill="#E5E7EB" /><circle cx="50" cy="40" r="4" fill="#D1D5DB" /></g></svg>`,
            // Wok Animation
            `<svg class="w-24 h-24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g><path class="flame flame-1 ${isWhite ? 'white': ''}" d="M45,95 C 40,85 50,80 50,95 Z" /><path class="flame flame-2 ${isWhite ? 'white': ''}" d="M50,95 C 45,80 55,75 55,95 Z" /><path class="flame flame-3 ${isWhite ? 'white': ''}" d="M55,95 C 50,85 60,80 60,95 Z" /></g><g class="wok-group"><path d="M25 70 C 40 90, 60 90, 75 70 L 85 60 L 15 60 Z" fill="#6B7280" /><path d="M28 69 C 40 85, 60 85, 72 69 L 80 62 L 20 62 Z" fill="#9CA3AF" /><rect x="0" y="56" width="20" height="8" rx="4" fill="#4B5563" /><rect x="0" y="56" width="20" height="8" rx="4" fill="#4B5563" /><g><rect class="food-particle food1" x="45" y="60" width="5" height="5" rx="2" fill="#34D399" /><circle class="food-particle food2" cx="55" cy="62" r="3" fill="#F87171" /><rect class="food-particle food3" x="60" y="58" width="6" height="4" rx="2" fill="#FBBF24" /></g></g></svg>`,
            // Shaker Animation
            `<svg class="w-24 h-24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g class="shaker shaker-salt" transform="translate(-15, 0)"><rect x="25" y="40" width="20" height="35" rx="5" fill="#F3F4F6" /><rect x="25" y="35" width="20" height="5" rx="2" fill="#D1D5DB" /><circle class="particle p1 ${isWhite ? 'white': ''}" cx="35" cy="45" r="1.5" /><circle class="particle p2 ${isWhite ? 'white': ''}" cx="32" cy="45" r="1.5" /><circle class="particle p3 ${isWhite ? 'white': ''}" cx="38" cy="45" r="1.5" /></g><g class="shaker shaker-pepper" transform="translate(15, 0)"><rect x="55" y="40" width="20" height="35" rx="5" fill="#E5E7EB" /><rect x="55" y="35" width="20" height="5" rx="2" fill="#9CA3AF" /><circle class="particle p4 ${isWhite ? 'white': ''}" cx="65" cy="45" r="1.5" /><circle class="particle p5 ${isWhite ? 'white': ''}" cx="62" cy="45" r="1.5" /><circle class="particle p6 ${isWhite ? 'white': ''}" cx="68" cy="45" r="1.5" /></g></svg>`
        ];
        let animationIndex = 0;
        let intervalId = null;

        function updateAnimation() {
            if(container) container.innerHTML = `<div class="transition-opacity duration-500">${animations[animationIndex]}</div>`;
        }

        function stopAnimation() {
            if(intervalId) clearInterval(intervalId);
        }

        function startAnimation() {
            stopAnimation();
            updateAnimation();
            intervalId = setInterval(() => {
                animationIndex = (animationIndex + 1) % animations.length;
                updateAnimation();
            }, 3000);
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startAnimation();
                } else {
                    stopAnimation();
                }
            });
        });

        if (container) {
            observer.observe(container);
        }
    }

    /** Muestra y configura el modal de límite/premium. */
    function showLimitModal(context) {
        state.premiumModalContext = context;
        if (!context || !state.userStatus) return;

        const contentMap = {
            ingredients: { icon: '🌿', title: 'Función Premium', description: "Analizar por ingredientes requiere 1 Bono.", confirmText: 'Usar Bono' },
            extra_analysis: { icon: '📸', title: 'Análisis Extra', description: '¿Se te acabaron los análisis gratis? ¡Usa un Bono para analizar esta foto!', confirmText: 'Usar Bono' },
            remix: { icon: '🧑‍🍳', title: 'Desbloquear Chef Remix', description: 'Transformar tu receta con Chef Remix requiere 1 Bono.', confirmText: 'Usar Bono' },
        };
        const { isBonusActive, rewardedUsedToday, adBonusLimit } = state.userStatus;
        const canEarnMore = rewardedUsedToday < adBonusLimit;
        const { icon, title, description, confirmText } = contentMap[context];

        DOMElements.limitModalIcon.textContent = icon;
        DOMElements.limitModalTitle.textContent = title;
        DOMElements.limitModalDescription.textContent = description;

        let actionsHTML = '';
        if (isBonusActive) {
            actionsHTML = `<button id="limit-modal-confirm" class="w-full h-12 flex items-center justify-center gap-2 rounded-xl font-semibold text-white bg-brand-orange hover:bg-brand-orange-light transition-transform transform hover:scale-105">${confirmText}</button>`;
        } else if (canEarnMore) {
            actionsHTML = `<button id="limit-modal-watch-ad" class="w-full h-12 flex items-center justify-center gap-2 rounded-xl font-semibold text-white bg-brand-orange hover:bg-brand-orange-light transition-transform transform hover:scale-105">Ver Anuncio (${adBonusLimit - rewardedUsedToday} disp.)</button>`;
        } else {
            actionsHTML = `<p class="text-sm font-medium text-gray-600 bg-gray-100 p-3 rounded-lg">Has usado todos tus bonos por hoy. ¡Vuelve mañana!</p>`;
        }
        actionsHTML += `<button id="limit-modal-close" class="w-full h-12 flex items-center justify-center rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300">Ahora no</button>`;
        
        DOMElements.limitModalActions.innerHTML = actionsHTML;
        DOMElements.limitModal.classList.remove('hidden');

        // Add event listeners for new buttons
        const confirmBtn = document.getElementById('limit-modal-confirm');
        const watchAdBtn = document.getElementById('limit-modal-watch-ad');
        const closeBtn = document.getElementById('limit-modal-close');
        
        if (confirmBtn) confirmBtn.addEventListener('click', handleLimitModalConfirm);
        if (watchAdBtn) watchAdBtn.addEventListener('click', handleWatchAd);
        closeBtn.addEventListener('click', closeLimitModal);
    }
    
    function closeLimitModal() {
        DOMElements.limitModal.classList.add('hidden');
        state.premiumModalContext = null;
    }

    // =====================================================================
    // === LÓGICA DE LA APLICACIÓN Y MANEJADORES DE EVENTOS ===
    // =====================================================================

    /** Obtiene el ID de visitante (fingerprint). */
    async function getVisitorId() {
        if (typeof window.FingerprintJS === 'undefined') {
            console.error("FingerprintJS library not loaded yet.");
            state.visitorId = 'temp_user_' + Date.now();
            return;
        }

        try {
            const fp = await window.FingerprintJS.load();
            const result = await fp.get();
            state.visitorId = result.visitorId;
        } catch (error) {
            console.error("FingerprintJS error:", error);
            state.visitorId = 'temp_user_' + Date.now();
        }
    }

    /** Obtiene la geolocalización del usuario. */
    function getLocation() {
        if (!navigator.geolocation) {
            state.locationError = "La geolocalización no es compatible.";
            renderLocationStatus();
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                state.locationError = null;
                state.location = { lat: position.coords.latitude, lon: position.coords.longitude };
                renderLocationStatus();
            },
            (err) => {
                switch (err.code) {
                    case err.PERMISSION_DENIED: state.locationError = "Permiso de ubicación denegado."; break;
                    case err.POSITION_UNAVAILABLE: state.locationError = "Ubicación no disponible."; break;
                    case err.TIMEOUT: state.locationError = "La solicitud de ubicación expiró."; break;
                    default: state.locationError = "No se pudo obtener la ubicación."; break;
                }
                renderLocationStatus();
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
    }

    /** Obtiene el estado del usuario desde la API. */
    async function fetchUserStatus() {
        if (!state.visitorId) return;
        try {
            const result = await callWebApp(ApiAction.GET_STATUS, { userId: state.visitorId });
            if (result.success) {
                state.userStatus = result.status;
            } else {
                console.error("Failed to fetch user status:", result.message);
                state.userStatus = null; // o un estado de error
            }
        } catch (err) {
            console.error("Failed to fetch user status:", err);
        } finally {
            renderStatusTracker();
            renderAnalyzeButton();
        }
    }

    /** Revisa si hay mensajes nuevos para el usuario. */
    async function checkMessages() {
        if (!state.visitorId) return;
        const result = await callWebApp(ApiAction.CHECK_MESSAGES, { userId: state.visitorId });
        if (result.success && result.message) {
            state.unreadMessage = result.message;
            DOMElements.headerNotificationDot.classList.remove('hidden');
            DOMElements.headerNotificationBtn.classList.add('animate-ring');
            setTimeout(() => DOMElements.headerNotificationBtn.classList.remove('animate-ring'), 1000);
        }
    }

    /** Maneja la lógica principal de análisis (foto o ingredientes). */
    async function callAnalysisApi() {
        if (!state.visitorId) return;
        if (state.analysisMode === 'photo' && !state.imageBase64) return;
        if (state.analysisMode === 'ingredients' && !state.ingredientsText.trim()) return;

        updateView('loading');
        state.error = null;
        state.recipe = null;
        cacheService.clearLast();

        try {
            const cacheKey = state.analysisMode === 'photo' ? state.imageBase64 : state.ingredientsText.trim();
            if (cacheKey && cacheService.get(cacheKey)) {
                state.recipe = cacheService.get(cacheKey);
                cacheService.setLast(state.recipe);
                // Si viene del cache, inicializa los checkedIngredients con valores por defecto
                state.checkedIngredients = Array(state.recipe.ingredients.length).fill(false);
                renderResultsView();
                updateView('results');
                return;
            }

            const payload = {
                location: state.location,
                userId: state.visitorId,
                ...(state.analysisMode === 'photo' ? { imageData: state.imageBase64 } : { ingredientsText: state.ingredientsText })
            };
            const result = await callWebApp(ApiAction.ANALYZE, payload);

            if (result.success) {
                state.recipe = result.data;
                if (cacheKey) cacheService.set(cacheKey, result.data);
                cacheService.setLast(result.data);
                // Inicializa el estado de los checkboxes para la nueva receta
                state.checkedIngredients = Array(state.recipe.ingredients.length).fill(false); 
                renderResultsView();
                updateView('results');
            } else {
                state.error = result.message || 'Ocurrió un error desconocido.';
                updateView('upload');
            }
            if (result.status) {
                state.userStatus = result.status;
                renderStatusTracker();
            }

        } catch (err) {
            state.error = err instanceof Error ? err.message : 'Falló la comunicación con el servidor.';
            updateView('upload');
        } finally {
            renderAnalyzeButton();
        }
    }

    /** Decide si se puede realizar el análisis y llama a la API. */
    function handleAnalysisRequest() {
        if (!state.userStatus || state.view === 'loading') return;

        if (state.analysisMode === 'photo') {
            const hasFreeAnalyses = state.userStatus.freeCount < state.userStatus.freeLimit;
            if (hasFreeAnalyses || state.userStatus.isBonusActive) {
                callAnalysisApi();
            } else {
                showLimitModal('extra_analysis');
            }
        } else { // 'ingredients' mode
            if (state.userStatus.isBonusActive) {
                callAnalysisApi();
            } else {
                showLimitModal('ingredients');
            }
        }
    }
    
    /** Cambia el modo de análisis entre 'foto' e 'ingredientes'. */
    function switchAnalysisMode(mode) {
        state.analysisMode = mode;
        DOMElements.modePhotoBtn.classList.toggle('bg-white', mode === 'photo');
        DOMElements.modePhotoBtn.classList.toggle('text-brand-orange', mode === 'photo');
        DOMElements.modePhotoBtn.classList.toggle('shadow', mode === 'photo');
        DOMElements.modePhotoBtn.classList.toggle('text-gray-500', mode !== 'photo');
        DOMElements.modePhotoBtn.classList.toggle('hover:bg-gray-200', mode !== 'photo');
        
        DOMElements.modeIngredientsBtn.classList.toggle('bg-white', mode === 'ingredients');
        DOMElements.modeIngredientsBtn.classList.toggle('text-brand-orange', mode === 'ingredients');
        DOMElements.modeIngredientsBtn.classList.toggle('shadow', mode === 'ingredients');
        DOMElements.modeIngredientsBtn.classList.toggle('text-gray-500', mode !== 'ingredients');
        DOMElements.modeIngredientsBtn.classList.toggle('hover:bg-gray-200', mode !== 'ingredients');

        if (mode === 'ingredients' && state.userStatus && !state.userStatus.isBonusActive) {
            showLimitModal('ingredients');
        }

        renderAnalysisMode();
        renderAnalyzeButton();
    }
    
    function handleExtraAnalysisRequest() {
        if (state.userStatus && state.userStatus.freeCount >= state.userStatus.freeLimit) {
            showLimitModal('extra_analysis');
        }
    }

    /** Maneja el reclamo de un bono por ver un anuncio. */
    async function handleClaimBonus() {
        if (!state.visitorId) return;
        try {
            const result = await callWebApp(ApiAction.CLAIM_AD_BONUS, { userId: state.visitorId });
            if (result.success) {
                state.userStatus = result.status;
                showNotification("¡Bono activado! Ya puedes usar la función.");
            } else {
                const message = result.message === 'bonus_limit_reached' ? 'Has alcanzado el límite de bonos por hoy.' : 'Error al reclamar el bono.';
                showNotification(message);
            }
        } catch (err) {
            console.error("Failed to claim bonus:", err);
            showNotification("Error al reclamar el bono.");
        } finally {
            closeLimitModal();
            renderStatusTracker();
            renderAnalyzeButton();
        }
    }
    
    /** Maneja la remezcla de una receta. */
    async function handleRemix(remixType) {
        if (!state.recipe || state.isRemixing || !state.visitorId || !state.userStatus) return;

        if (!state.userStatus.isBonusActive) {
            showLimitModal('remix');
            return;
        }

        const cacheKey = `${state.recipe.dishName}-${remixType}`;
        const cachedRemix = cacheService.get(cacheKey);
        if (cachedRemix) {
            state.recipe = cachedRemix;
            cacheService.setLast(cachedRemix);
            state.checkedIngredients = Array(state.recipe.ingredients.length).fill(false); // Resetear checked ingredients
            renderResultsView();
            return;
        }

        state.isRemixing = true;
        state.currentRemixType = remixType;
        state.error = null;
        renderResultsView(); // Re-render to show loader

        try {
            const payload = { recipe: state.recipe, remixType, userId: state.visitorId };
            const result = await callWebApp(ApiAction.REMIX, payload);
            if (result.success) {
                state.recipe = result.data;
                cacheService.set(cacheKey, result.data);
                cacheService.setLast(result.data);
                state.checkedIngredients = Array(state.recipe.ingredients.length).fill(false); // Resetear checked ingredients
            } else {
                state.error = result.message || 'Error desconocido durante el remix.';
            }
            if (result.status) state.userStatus = result.status;
        } catch (err) {
            state.error = err instanceof Error ? err.message : 'Falló la remezcla de la receta.';
        } finally {
            state.isRemixing = false;
            state.currentRemixType = null;
            renderResultsView(); // Re-render with new recipe or error
        }
    }

    function returnToHome() {
        window.androidApp?.showInterstitialAd?.();
        updateView('upload');
mostrarUltimoAnalisis();
        fetchUserStatus();
    }

    function resetImage() {
        state.imageBase64 = null;
        renderAnalysisMode();
        renderAnalyzeButton();
    }

    function handleImageFileChange(event) {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_DIMENSION = 1024;
                    let { width, height } = img;
                    if (width > height) {
                        if (width > MAX_DIMENSION) {
                            height = Math.round(height * (MAX_DIMENSION / width));
                            width = MAX_DIMENSION;
                        }
                    } else {
                        if (height > MAX_DIMENSION) {
                            width = Math.round(width * (MAX_DIMENSION / height));
                            height = MAX_DIMENSION;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    state.imageBase64 = dataUrl.split(',')[1];
                    renderAnalysisMode();
                    renderAnalyzeButton();
                };
                img.src = e.target?.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function handleShare(platform, totalCost) {
        // Obtenemos el costo actual mostrado en la UI
        const currentTotalElement = DOMElements.resultsView.querySelector('#current-total-cost');
        const currentTotal = currentTotalElement ? parseFloat(currentTotalElement.textContent) : totalCost; // Usar el total pasado por argumento si no se encuentra en el DOM


        const generateText = (isWhatsapp) => {
            const title = (text) => isWhatsapp ? `*${text}*` : text.toUpperCase();
            const nl = '\n';
            const separator = '---------------------\n';
            let txt = `${title(state.recipe.dishName)}${nl}${nl}`;
            txt += `🛒 ${title("Ingredientes")}${nl}`;
            
            state.recipe.ingredients.forEach((ing, index) => {
                const checked = state.checkedIngredients[index] || false;
                const checkMark = checked ? '✅ ' : '❌ ';
                const priceText = ing.estimatedLocalPrice > 0 ? `(aprox. ${ing.estimatedLocalPrice.toFixed(2)} ${state.recipe.currencyCode})` : '';

                txt += `${checkMark}${ing.quantity.toFixed(2).replace(/\.00$/, '')} ${ing.unit} de ${ing.name} ${priceText}${nl}`;
            });
            
            const currencyCode = state.recipe.currencyCode || '';
            
            txt += `${nl}Costo Restante Estimado: ${currentTotal.toFixed(2)} ${currencyCode}${nl}`;
            
            if (state.recipe.supermarketSuggestions?.length > 0) {
                txt += `${nl}🏪 ${title("Puedes comprar en")}${nl}${state.recipe.supermarketSuggestions.join(', ')}${nl}`;
            }
            txt += `${nl}${separator}📝 ${title("Instrucciones")}${nl}`;
            state.recipe.instructions.forEach((step, i) => { txt += `${i + 1}. ${step}${nl}`; });
            txt += `${nl}Generado con CusiCusa ✨`;
            return txt;
        };

        if (platform === 'copy') {
            navigator.clipboard.writeText(generateText(false)).then(() => {
                const copyBtn = document.getElementById('copy-recipe-btn');
                if(copyBtn) {
                    const originalText = copyBtn.querySelector('span').textContent;
                    copyBtn.querySelector('span').textContent = '¡Copiado! ✅';
                    setTimeout(() => { copyBtn.querySelector('span').textContent = originalText; }, 2000);
                }
            });
        } else if (platform === 'whatsapp') {
            const text = encodeURIComponent(generateText(true));
            window.open(`https://wa.me/?text=${text}`, '_blank');
        }
    }

    // --- Lógica de la Cámara ---
    async function startCameraStream(mode) {
        if (state.cameraStream) {
            state.cameraStream.getTracks().forEach(track => track.stop());
        }
        DOMElements.cameraLoader.classList.remove('hidden');
        DOMElements.cameraVideo.classList.add('hidden');
        DOMElements.cameraError.classList.add('hidden');

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
            state.cameraStream = newStream;
            DOMElements.cameraVideo.srcObject = newStream;
            await DOMElements.cameraVideo.play();
            DOMElements.cameraLoader.classList.add('hidden');
            DOMElements.cameraVideo.classList.remove('hidden');
        } catch (err) {
            DOMElements.cameraLoader.classList.add('hidden');
            DOMElements.cameraError.textContent = 'No se pudo acceder a la cámara. Por favor, revisa los permisos.';
            DOMElements.cameraError.classList.remove('hidden');
            console.error(err);
        }
    }
    
    function openCamera() {
        DOMElements.cameraModal.classList.remove('hidden');
        startCameraStream('environment');
    }

    function closeCamera() {
        if (state.cameraStream) {
            state.cameraStream.getTracks().forEach(track => track.stop());
            state.cameraStream = null;
        }
        DOMElements.cameraModal.classList.add('hidden');
    }

    function handleCameraCapture() {
        const context = DOMElements.cameraCanvas.getContext('2d');
        if (context) {
            const video = DOMElements.cameraVideo;
            const MAX_DIMENSION = 1024;
            let { videoWidth: width, videoHeight: height } = video;
            if (width > height) {
                if (width > MAX_DIMENSION) { height = Math.round(height * (MAX_DIMENSION / width)); width = MAX_DIMENSION; }
            } else {
                if (height > MAX_DIMENSION) { width = Math.round(width * (MAX_DIMENSION / height)); height = MAX_DIMENSION; }
            }
            DOMElements.cameraCanvas.width = width;
            DOMElements.cameraCanvas.height = height;
            context.drawImage(video, 0, 0, width, height);
            const dataUrl = DOMElements.cameraCanvas.toDataURL('image/jpeg', 0.9);
            state.imageBase64 = dataUrl.split(',')[1];
            renderAnalysisMode();
            renderAnalyzeButton();
            closeCamera();
        }
    }

    // --- Manejadores de Modales ---
    function handleLimitModalConfirm() {
        closeLimitModal();
        if (state.premiumModalContext === 'remix') {
            if (state.currentRemixType) handleRemix(state.currentRemixType);
        } else {
            callAnalysisApi();
        }
    }

    function handleWatchAd() {
        if (window.androidApp?.showRewardedVideo) {
            window.androidApp.showRewardedVideo();
        } else {
            // Nota: Aquí no se puede usar alert() en el entorno de Canvas, pero se mantiene
            // para el contexto de desarrollo del usuario si no está en el app móvil.
            console.warn("La función de bonos solo está disponible en la aplicación móvil.");
            showNotification("La función de bonos solo está disponible en la aplicación móvil.");
        }
    }

    // =====================================================================
    // === INICIALIZACIÓN Y EVENT LISTENERS ===
    // =====================================================================

    /** Añade los event listeners para la vista de upload. */
    function addAnalysisModeEventListeners() {
        const resetBtn = document.getElementById('reset-image-btn');
        const openCameraBtn = document.getElementById('open-camera-btn');
        const fileInput = document.getElementById('file-input');
        const ingredientsTextarea = document.getElementById('ingredients-textarea');

        if (resetBtn) resetBtn.addEventListener('click', resetImage);
        if (openCameraBtn) openCameraBtn.addEventListener('click', openCamera);
        if (fileInput) fileInput.addEventListener('change', handleImageFileChange);
        if (ingredientsTextarea) {
            ingredientsTextarea.addEventListener('input', (e) => {
                state.ingredientsText = e.target.value;
                renderAnalyzeButton();
            });
        }
    }

    /** Añade los event listeners para la vista de resultados. */
    function addResultsEventListeners() {
        document.getElementById('return-home-btn').addEventListener('click', returnToHome);
        document.getElementById('save-recipe-btn').addEventListener('click', () => DOMElements.premiumSaveModal.classList.remove('hidden'));
        document.getElementById('remix-quick-btn').addEventListener('click', () => handleRemix('quick'));
        document.getElementById('remix-healthy-btn').addEventListener('click', () => handleRemix('healthy'));
        document.getElementById('remix-spicy-btn').addEventListener('click', () => handleRemix('spicy'));
    }

    /** Función que añade todos los listeners que dependen de DOMElements. */
    function addStaticListeners() {
        // Notificaciones
        DOMElements.notificationCloseBtn.addEventListener('click', () => DOMElements.notificationBanner.classList.add('hidden'));
        
        // Modos de análisis (Event Delegation ya cubre los botones internos)
        DOMElements.modePhotoBtn.addEventListener('click', () => switchAnalysisMode('photo'));
        DOMElements.modeIngredientsBtn.addEventListener('click', () => switchAnalysisMode('ingredients'));
        
        // Tarjeta de Última Receta
        DOMElements.showLastRecipeBtn.addEventListener('click', () => {
            if(state.recipe) {
                renderResultsView();
                updateView('results');
            }
        });

        // Menú Modal
        DOMElements.headerLogoBtn.addEventListener('click', () => DOMElements.menuModal.classList.remove('hidden'));
        DOMElements.menuModal.addEventListener('click', () => DOMElements.menuModal.classList.add('hidden'));
        
        // Evitar que el clic en el modal lo cierre (se hace con el primer hijo del modal)
        // Ya se verificó la existencia en el cuerpo del documento, pero lo reaseguramos aquí:
        if (DOMElements.menuModal.firstElementChild) {
            DOMElements.menuModal.firstElementChild.addEventListener('click', e => e.stopPropagation()); 
        }
        DOMElements.menuModalCloseBtn.addEventListener('click', () => DOMElements.menuModal.classList.add('hidden'));


        // Listeners del header y modales
        DOMElements.headerNotificationBtn.addEventListener('click', () => {
            if (state.unreadMessage) {
                showNotification(state.unreadMessage);
                state.unreadMessage = null;
                DOMElements.headerNotificationDot.classList.add('hidden');
            }
        });

        // Modales de Límite (Dejamos los listeners dentro de showLimitModal para asegurar el target correcto)
        
        // Modales de Guardado 
        DOMElements.premiumSaveCloseBtn.addEventListener('click', () => DOMElements.premiumSaveModal.classList.add('hidden'));
        DOMElements.premiumSaveUpgradeBtn.addEventListener('click', () => DOMElements.premiumSaveModal.classList.add('hidden'));

        DOMElements.premiumSaveModal.addEventListener('click', () => DOMElements.premiumSaveModal.classList.add('hidden'));
        // Evitar que el clic en el modal lo cierre (se hace con el primer hijo del modal)
        if (DOMElements.premiumSaveModal.firstElementChild) {
            DOMElements.premiumSaveModal.firstElementChild.addEventListener('click', e => e.stopPropagation());
        }
        
        // Listeners de simulación y política
        DOMElements.simulateAdBtn.addEventListener('click', () => {
            if (window.handleAdReward) {
                console.log("Simulating successful rewarded ad...");
                window.handleAdReward(true, 'Simulated ad success');
                DOMElements.menuModal.classList.add('hidden');
            } else {
                showNotification('La función de manejo de anuncios no está disponible.');
            }
        });
        DOMElements.privacyPolicyBtn.addEventListener('click', () => showNotification('Política de Privacidad (Próximamente)'));
        DOMElements.updatesBtn.addEventListener('click', () => showNotification('Buscando actualizaciones... (Próximamente)'));
        
        // Camera Modal listeners
        DOMElements.cameraCancelBtn.addEventListener('click', closeCamera);
        DOMElements.cameraCaptureBtn.addEventListener('click', handleCameraCapture);
        DOMElements.cameraSwitchBtn.addEventListener('click', () => {
            const newMode = DOMElements.cameraVideo.srcObject?.getVideoTracks()[0].getSettings().facingMode === 'user' ? 'environment' : 'user';
            startCameraStream(newMode);
        });
    }

    /** Función de inicialización principal. */
    async function initialize() {
        // 1. Inicializa las referencias del DOM (necesario antes de usarlas)
        initDOMElements(); 
        
        // 2. Ocultar Intro
        setTimeout(() => {
            DOMElements.introOverlay.style.opacity = '0';
            setTimeout(() => DOMElements.introOverlay.classList.add('hidden'), 1000);
        }, 3000);
        
        // 3. Cargar última receta antes del render inicial (FLUJO DE CACHÉ CORREGIDO)
        const lastRecipe = cacheService.getLast();
        if (lastRecipe) {
            state.recipe = lastRecipe;
            // Inicializa el estado de los checkboxes para la receta del caché (todos desmarcados por defecto)
            state.checkedIngredients = Array(state.recipe.ingredients.length).fill(false);
            
            // **CORRECCIÓN CLAVE:** Activar la visibilidad y el nombre de la tarjeta inmediatamente
            // ¡Esta es la corrección que asegura que la tarjeta se muestre si los elementos existen!
            if (DOMElements.lastRecipeCard && DOMElements.lastRecipeName) {
                DOMElements.lastRecipeCard.classList.remove('hidden');
                DOMElements.lastRecipeName.textContent = lastRecipe.dishName;
            }
        }

        // 4. Renderizar componentes estáticos/iniciales
        DOMElements.appVersion.textContent = `Versión ${APP_VERSION}`;
        renderLoader('loader-animation-container');
        renderLoader('camera-loader', true);
        renderLocationStatus();
        renderSpecialOfferCard();
        renderAnalysisMode();
        renderAnalyzeButton(); // Render inicial con "Cargando..."

        // 5. Agregar todos los listeners estáticos que dependen de DOMElements
        addStaticListeners();

        // 6. Cargar datos iniciales de forma ASÍNCRONA (NO BLOQUEANTE)
        await getVisitorId();
        getLocation();
        await fetchUserStatus(); // Esperar a que el status inicial se cargue
        
        // 7. Mensajes
        checkMessages();
        setInterval(checkMessages, 30000);
    }

    // Definir función global para que la app Android pueda llamarla
    window.handleAdReward = (wasSuccessful, message) => {
        if (wasSuccessful) {
            handleClaimBonus();
        } else {
            console.error("Ad failed or was dismissed:", message);
            showNotification("No se pudo obtener el bono del anuncio.");
        }
    };
 // =====================================================================
// === MOSTRAR EL ÚLTIMO ANÁLISIS GUARDADO EN LA PÁGINA PRINCIPAL ===
// =====================================================================
function mostrarUltimoAnalisis() {
    const lastRecipe = cacheService.getLast();
    if (!lastRecipe) return; // No hay análisis previo

    // Mostrar tarjeta “Ver Última Receta”
    DOMElements.lastRecipeCard.classList.remove('hidden');
    DOMElements.lastRecipeName.textContent = lastRecipe.dishName || "Receta anterior";

    // Al hacer clic, mostrar la vista de resultados guardada
    DOMElements.showLastRecipeBtn.addEventListener('click', () => {
        state.recipe = lastRecipe;
        updateView('results');
        renderResultsView();
    });
}

// Inicializar DOM y luego mostrar la última receta (solo si existe)
initDOMElements();
initialize();
mostrarUltimoAnalisis();
});


