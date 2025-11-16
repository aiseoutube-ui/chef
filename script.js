document.addEventListener('DOMContentLoaded', () => {

    // =====================================================================
    // === CONSTANTES Y CONFIGURACIÓN ===
    // =====================================================================
    
    // IMPORTANTE: Recuerda actualizar esta URL cuando redespliegues tu script de Google.
    const GOOGLE_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw6wmmxtuc0hIkJl00g4J6S3r22ukRhpApZcoZUlqSDNBiDRs37IeImHjr1_g6BTQe7/exec'; 

    const APP_VERSION = "1.0.3"; // Versión actualizada
    const LOADING_MESSAGES = [
        "Analizando los sabores...",
        "Consultando a nuestros chefs de IA...",
        "Calculando los costos locales...",
        "Casi listo! Dando los toques finales...",
    ];
    const ApiAction = {
        GET_STATUS: 'get_status', 
        ANALYZE: 'analyze',
        REMIX: 'remix',
        CLAIM_AD_BONUS: 'claim_ad_bonus',
        // CHECK_MESSAGES: 'check_messages', // --- ELIMINADO ---
        GET_YOUTUBE_VIDEOS: 'get_youtube_videos',
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
        checkedIngredients: []
    };

    // =====================================================================
    // === REFERENCIAS A ELEMENTOS DEL DOM ===
    // =====================================================================
    
    const DOMElements = {};
    
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
        // --- ELIMINADO: Referencias al modal de menú ---
        // DOMElements.menuModal = document.getElementById('menu-modal');
        // DOMElements.appVersion = document.getElementById('app-version');
        // DOMElements.privacyPolicyBtn = document.getElementById('privacy-policy-btn');
        // DOMElements.updatesBtn = document.getElementById('updates-btn');
        // DOMElements.simulateAdBtn = document.getElementById('simulate-ad-btn');
        // DOMElements.menuModalCloseBtn = document.getElementById('menu-modal-close-btn');
        DOMElements.limitModal = document.getElementById('limit-modal');
        DOMElements.limitModalIcon = document.getElementById('limit-modal-icon');
        DOMElements.limitModalTitle = document.getElementById('limit-modal-title');
        DOMElements.limitModalDescription = document.getElementById('limit-modal-description');
        DOMElements.limitModalActions = document.getElementById('limit-modal-actions');
        // --- ELIMINADO: REFERENCIAS AL MODAL PREMIUM ---
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

    const cacheService = {
        get: (key) => { try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : null; } catch (e) { console.error("Cache read error:", e); return null; } },
        set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error("Cache write error:", e); } },
        getLast: () => { try { const item = localStorage.getItem(LAST_RECIPE_KEY); return item ? JSON.parse(item) : null; } catch (e) { console.error("Cache read last error:", e); return null; } },
        setLast: (value) => { try { localStorage.setItem(LAST_RECIPE_KEY, JSON.stringify(value)); } catch (e) { console.error("Cache write last error:", e); } },
        clearLast: () => { try { localStorage.removeItem(LAST_RECIPE_KEY); } catch (e) { console.error("Cache clear last error:", e); } }
    };

    async function callWebApp(action, payload) {
        const debugPayload = { action, ...payload };
        try {
            const response = await fetch(GOOGLE_WEB_APP_URL, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify(debugPayload),
            });
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error(`Error: La respuesta para la accion ${action} no es un JSON valido.`, text);
                return { success: false, message: 'Respuesta invalida del servidor.', rawResponse: text };
            }
            if (!result.success) {
                console.error(`API Logic Error for action ${action}:`, result.message);
            }
            if (result.status && typeof result.status.adCount !== 'undefined') {
                result.status.rewardedUsedToday = result.status.adCount;
                delete result.status.adCount;
            }
            return result;
        } catch (error) {
            console.error(`API Communication Error for action ${action}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, message: `API Communication Error: ${errorMessage}` };
        }
    }
    
    // =====================================================================
    // === FUNCIONES DE RENDERIZADO Y MANIPULACIÓN DEL DOM ===
    // =====================================================================

    function updateView(newView) {
        state.view = newView;
        DOMElements.uploadView.classList.toggle('hidden', newView !== 'upload');
        DOMElements.loadingView.classList.toggle('hidden', newView !== 'loading');
        DOMElements.resultsView.classList.toggle('hidden', newView !== 'results');
        
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

    /** Muestra un banner de notificación que permanece visible hasta que el usuario lo cierra. */
    function showNotification(messageOrObject) {
        if (!messageOrObject) return;
        let content, type;
        if (typeof messageOrObject === 'string') {
            content = messageOrObject;
            type = 'text';
        } else {
            content = messageOrObject.content;
            type = messageOrObject.type || 'text';
        }
        if (!content) return;
        if (type === 'html') {
            DOMElements.notificationMessage.innerHTML = content;
        } else {
            DOMElements.notificationMessage.textContent = content;
        }
        DOMElements.notificationBanner.classList.remove('hidden');
        DOMElements.notificationBanner.classList.add('animate-slide-down');
    }

    /** Muestra un toast de error temporal en la parte inferior. */
    function showServerErrorToast(message) {
        const toastElement = document.getElementById('server-error-toast');
        const messageElement = document.getElementById('server-error-message');
        
        if (!toastElement || !messageElement) return;

        messageElement.textContent = message;
        
        // 1. Quitar 'hidden' para que sea parte del layout
        toastElement.classList.remove('hidden');
        
        // 2. Forzar un "reflow" para que la transición funcione
        void toastElement.offsetWidth; 

        // 3. Añadir las clases de "mostrar"
        toastElement.classList.remove('opacity-0', 'translate-y-3');
        toastElement.classList.add('opacity-100', 'translate-y-0');

        // 4. Ocultar después de 5 segundos
        setTimeout(() => {
            toastElement.classList.remove('opacity-100', 'translate-y-0');
            toastElement.classList.add('opacity-0', 'translate-y-3');
            
            // 5. Añadir 'hidden' de nuevo cuando la transición termine
            setTimeout(() => {
                toastElement.classList.add('hidden');
            }, 300); // 300ms es la duración de la transición (ver HTML)
        }, 5000);
    }

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

// --- FUNCIÓN MODIFICADA (PARA COINCIDIR CON LA IMAGEN DE EJEMPLO) ---
    /**
     * Renderiza un carrusel con los últimos videos de YouTube.
     * @param {Array} videos - Array de objetos de video del backend.
     * @param {string} subscribeUrl - URL de suscripción (no se usa aquí).
     */
    function renderSpecialOfferCard(videos, subscribeUrl) {
        if (!videos || videos.length === 0) {
            DOMElements.specialOfferCard.innerHTML = '';
            return;
        }

        // Color fijo para el botón como en la imagen de ejemplo
        const buttonColorClass = 'bg-teal-500 hover:bg-teal-400';

        let currentVideoIndex = 0;
        let intervalId = null;
        const carouselId = 'video-carousel-' + Date.now();

        function updateCarousel() {
            const oldDots = document.getElementById(carouselId);
            if (oldDots) oldDots.remove();

            const currentVideo = videos[currentVideoIndex];

            // 1. Título: Limitar a X caracteres (ej. 70) y poner en mayúsculas
            let videoTitle = currentVideo.title.toUpperCase();
            const MAX_TITLE_CHARS = 30; // <-- AJUSTA ESTE LÍMITE DE CARACTERES SI ES NECESARIO
            if (videoTitle.length > MAX_TITLE_CHARS) {
                videoTitle = videoTitle.substring(0, MAX_TITLE_CHARS) + '...';
            }

            // 2. Descripción: Limitar a Y caracteres (ej. 100)
            let description = currentVideo.description || "Mira este video para más contenido.";
            const MAX_DESC_CHARS = 50; // <-- AJUSTA ESTE LÍMITE DE CARACTERES SI ES NECESARIO
            if (description.length > MAX_DESC_CHARS) {
                description = description.substring(0, MAX_DESC_CHARS) + '...';
            }

            DOMElements.specialOfferCard.innerHTML = `
                <div class="relative rounded-2xl overflow-hidden shadow-lg bg-gray-800 transform transition-transform duration-300 hover:scale-[1.03] h-56 mt-6">

                    <div class="absolute inset-0">
                        ${videos.map((video, index) => `
                            <img src="${video.thumbnail}" alt="Thumbnail de video" class="absolute w-full h-full object-cover transition-opacity duration-1000 ${index === currentVideoIndex ? 'opacity-30' : 'opacity-0'}" />
                        `).join('')}
                    </div>

                    <div class="relative p-6 flex flex-col justify-between h-full text-white">
                        <div class="transition-opacity duration-700">
                            <h3 class="text-2xl font-extrabold" style="text-shadow: 0 2px 4px rgba(0,0,0,0.5)">${videoTitle}</h3>
                            <p class="mt-1 text-sm font-medium opacity-90" style="text-shadow: 0 1px 3px rgba(0,0,0,0.5)">${description}</p>
                        </div>

                        <a href="https://www.youtube.com/watch?v=${currentVideo.videoId}" target="_blank" rel="noopener noreferrer" class="self-start text-center text-white font-bold py-2 px-5 rounded-lg text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 bg-teal-500 hover:bg-teal-400">
                            Ver Video
                        </a>
                    </div>
                </div>

                <div id="${carouselId}" class="flex justify-center gap-2 mt-3">
                    ${videos.map((_, index) => `
                        <button data-index="${index}" class="video-dot w-2 h-2 rounded-full transition-all ${index === currentVideoIndex ? 'bg-brand-orange scale-125' : 'bg-gray-300'}" aria-label="Ir al video ${index + 1}"></button>
                    `).join('')}
                </div>
            `;

            document.querySelectorAll(`#${carouselId} .video-dot`).forEach(dot => {
                dot.addEventListener('click', (e) => {
                    currentVideoIndex = parseInt(e.target.getAttribute('data-index'));
                    updateCarousel();
                    startCarousel(); // Reinicia el timer al hacer clic en un dot
                });
            });
        }

        function stopCarousel() {
            if (intervalId) clearInterval(intervalId);
        }

        function startCarousel() {
            stopCarousel();
            updateCarousel(); // Muestra el primer slide inmediatamente
            intervalId = setInterval(() => {
                currentVideoIndex = (currentVideoIndex + 1) % videos.length;
                updateCarousel();
            }, 5000); // Cambia cada 5 segundos
        }

        startCarousel(); // Inicia el carrusel
    }
    // --- FIN DE LA FUNCIÓN MODIFICADA ---

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
                        <p class="font-bold text-xl text-gray-800">Que tienes en tu refri?</p>
                        <p class="text-sm mt-1">Lista tus ingredientes y crearemos una receta para ti.</p>
                    </div>
                    <textarea id="ingredients-textarea" rows="5" class="w-full p-4 rounded-2xl bg-orange-50 border-2 border-dashed border-orange-200 text-orange-800 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-solid transition-all" placeholder="Ej: Arroz, 2 pechugas de pollo, 1 limon, aceite de oliva...">${state.ingredientsText}</textarea>
                </div>`;
        }
        addAnalysisModeEventListeners();
    }

    function renderAnalyzeButton() {
        let text = '', disabled = true, showLoader = false;
        
        if (state.view === 'loading') {
            showLoader = true;
            disabled = true;
        } else if (!state.userStatus) {
            text = 'Cargando...';
        } else {
            const isInputReady = state.analysisMode === 'photo' ? !!state.imageBase64 : !!state.ingredientsText.trim();
            if (!isInputReady) {
                text = state.analysisMode === 'photo' ? 'Selecciona una imagen' : 'Lista tus ingredientes';
            } else {
                const { freeCount, freeLimit, isBonusActive } = state.userStatus;
                if (state.analysisMode === 'ingredients') {
                    disabled = false;
                    text = isBonusActive ? 'Usar Bono' : 'Desbloquear con Anuncio';
                } else {
                    const hasFreeUses = freeCount < freeLimit;
                    if (hasFreeUses) {
                        text = 'Generar Receta';
                        disabled = false;
                    } else if (isBonusActive) {
                        text = 'Usar Bono';
                        disabled = false;
                    } else {
                        text = 'Limite diario alcanzado';
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
    
    function updateTotalCost() {
        if (!state.recipe) return;

        const ingredientsList = DOMElements.resultsView.querySelectorAll('.ingredient-item');
        let runningTotal = 0;
        let currencyCode = state.recipe.currencyCode || '';
        
        ingredientsList.forEach((item, index) => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            
            state.checkedIngredients[index] = checkbox.checked;
            
            if (checkbox && !checkbox.checked) {
                const price = parseFloat(checkbox.getAttribute('data-price')) || 0;
                runningTotal += price;
                item.classList.remove('bg-gray-50');
                item.querySelector('label').classList.remove('line-through', 'opacity-60');
            } else {
                item.classList.add('bg-gray-50');
                item.querySelector('label').classList.add('line-through', 'opacity-60');
            }
        });

        const totalElement = DOMElements.resultsView.querySelector('#current-total-cost');
        if (totalElement) {
            totalElement.textContent = runningTotal.toFixed(2);
            DOMElements.resultsView.querySelector('#total-currency-code').textContent = runningTotal > 0 ? currencyCode : '';
        }
        
        renderShareModule(runningTotal);
    }

    function renderResultsView() {
        if (state.error && !state.recipe) {
            DOMElements.resultsView.innerHTML = `
                <div class="text-center p-8 flex flex-col items-center justify-center h-full animate-fadeIn">
                    <h2 class="text-2xl font-bold text-red-600 mb-2">Oops! Algo salio mal</h2>
                    <p class="text-gray-600 bg-red-50 p-4 rounded-lg mb-6 max-w-sm w-full">${state.error}</p>
                    <button id="return-home-btn" class="w-full max-w-xs h-12 flex items-center justify-center rounded-xl font-semibold text-white bg-brand-orange hover:bg-brand-orange-light">Intentar de Nuevo</button>
                </div>`;
            document.getElementById('return-home-btn').addEventListener('click', returnToHome);
            return;
        }

        if (!state.recipe) {
             DOMElements.resultsView.innerHTML = `
                <div class="text-center p-8 flex flex-col items-center justify-center h-full animate-fadeIn">
                    <h2 class="text-2xl font-bold text-gray-700 mb-2">No se encontro la receta</h2>
                    <p class="text-gray-500 mb-6 max-w-sm w-full">No pudimos generar una receta. Intenta con una foto mas clara o ingredientes diferentes.</p>
                    <button id="return-home-btn" class="w-full max-w-xs h-12 flex items-center justify-center rounded-xl font-semibold text-white bg-brand-orange">Volver a Empezar</button>
                </div>`;
             document.getElementById('return-home-btn').addEventListener('click', returnToHome);
             return;
        }
        
        const { dishName, preparationTime, difficulty, calories, ingredients, instructions, platingSuggestions, supermarketSuggestions, currencyCode } = state.recipe;
        
        if (state.checkedIngredients.length !== ingredients.length || state.isRemixing) {
            state.checkedIngredients = Array(ingredients.length).fill(false);
        }

        const initialTotalCost = ingredients.reduce((acc, ing) => acc + (ing.estimatedLocalPrice || 0), 0);

        const remixMessage = (() => {
            if (!state.userStatus) return '';
            const { isBonusActive, rewardedUsedToday, adBonusLimit } = state.userStatus;
            if (isBonusActive) return `<p class="text-center text-xs text-green-700 mb-3 font-semibold">Bono disponible para usar en Remix!</p>`;
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
                <h2 class="text-xl font-bold text-gray-700 mb-3">🏪 Donde Comprar</h2>
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
                        <span>Guardar</span>
                    </button>
                </div>
                <div class="flex gap-2 text-center my-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div class="flex-1 flex flex-col items-center"><div class="text-brand-orange"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><p class="text-sm font-bold text-gray-800 mt-1">${preparationTime}</p><p class="text-xs text-gray-500">Tiempo</p></div>
                    <div class="flex-1 flex flex-col items-center"><div class="text-brand-orange"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div><p class="text-sm font-bold text-gray-800 mt-1">${difficulty}</p><p class="text-xs text-gray-500">Dificultad</p></div>
                    <div class="flex-1 flex flex-col items-center"><div class="text-brand-orange"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div><p class="text-sm font-bold text-gray-800 mt-1">${calories}</p><p class="text-xs text-gray-500">Calorias</p></div>
                </div>
                
                <div class="my-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                    <h2 class="text-center text-lg font-bold text-amber-800 mb-1">Chef Remix</h2>
                    ${remixMessage}
                    <div class="flex gap-3 text-white text-sm">
                        <button id="remix-quick-btn" class="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed bg-sky-500 hover:bg-sky-600"><span class="text-2xl">⚡️</span><span>Version Rapida</span></button>
                        <button id="remix-healthy-btn" class="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-600"><span class="text-2xl">🥗</span><span>Version Saludable</span></button>
                        <button id="remix-spicy-btn" class="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600"><span class="text-2xl">🌶️</span><span>Version Picante</span></button>
                    </div>
                </div>

                <div id="recipe-details-container">
                    ${state.isRemixing ? remixLoaderHTML : recipeDetailsHTML}
                </div>
            </div>`;

        renderShareModule(initialTotalCost);
        addResultsEventListeners();
        
        updateTotalCost();
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
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5 .124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
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

    function renderLoader(containerId, isWhite = false) {
        const container = document.getElementById(containerId);
        if(!container) return;

        const animations = [
            `<svg class="w-24 h-24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path class="steam steam-1 ${isWhite ? 'white': ''}" d="M40 45 Q 42 35, 40 25" fill="none" /><path class="steam steam-2 ${isWhite ? 'white': ''}" d="M50 45 Q 52 35, 50 25" fill="none" /><path class="steam steam-3 ${isWhite ? 'white': ''}" d="M60 45 Q 58 35, 60 25" fill="none" /><path d="M20 50 H 80 V 80 A 10 10 0 0 1 70 90 H 30 A 10 10 0 0 1 20 80 Z" fill="#E5E7EB" /><path d="M22 55 H 78 V 80 A 8 8 0 0 1 70 88 H 30 A 8 8 0 0 1 22 80 Z" fill="#F3F4F6" /><circle cx="15" cy="60" r="5" fill="#D1D5DB" /><circle cx="85" cy="60" r="5" fill="#D1D5DB" /><g class="pot-lid"><path d="M30 48 C 30 42, 70 42, 70 48" fill="#E5E7EB" /><circle cx="50" cy="40" r="4" fill="#D1D5DB" /></g></svg>`,
            `<svg class="w-24 h-24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g><path class="flame flame-1 ${isWhite ? 'white': ''}" d="M45,95 C 40,85 50,80 50,95 Z" /><path class="flame flame-2 ${isWhite ? 'white': ''}" d="M50,95 C 45,80 55,75 55,95 Z" /><path class="flame flame-3 ${isWhite ? 'white': ''}" d="M55,95 C 50,85 60,80 60,95 Z" /></g><g class="wok-group"><path d="M25 70 C 40 90, 60 90, 75 70 L 85 60 L 15 60 Z" fill="#6B7280" /><path d="M28 69 C 40 85, 60 85, 72 69 L 80 62 L 20 62 Z" fill="#9CA3AF" /><rect x="0" y="56" width="20" height="8" rx="4" fill="#4B5563" /><rect x="0" y="56" width="20" height="8" rx="4" fill="#4B5563" /><g><rect class="food-particle food1" x="45" y="60" width="5" height="5" rx="2" fill="#34D399" /><circle class="food-particle food2" cx="55" cy="62" r="3" fill="#F87171" /><rect class="food-particle food3" x="60" y="58" width="6" height="4" rx="2" fill="#FBBF24" /></g></g></svg>`,
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

    function showLimitModal(context) {
        state.premiumModalContext = context;
        if (!context || !state.userStatus) return;

        const contentMap = {
            ingredients: { icon: '🌿', title: 'Funcion Premium', description: "Analizar por ingredientes requiere 1 Bono.", confirmText: 'Usar Bono' },
            extra_analysis: { icon: '📸', title: 'Analisis Extra', description: 'Se te acabaron los analisis gratis? Usa un Bono para analizar esta foto!', confirmText: 'Usar Bono' },
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
            actionsHTML = `<p class="text-sm font-medium text-gray-600 bg-gray-100 p-3 rounded-lg">Has usado todos tus bonos por hoy. Vuelve manana!</p>`;
        }
        actionsHTML += `<button id="limit-modal-close" class="w-full h-12 flex items-center justify-center rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300">Ahora no</button>`;
        
        DOMElements.limitModalActions.innerHTML = actionsHTML;
        DOMElements.limitModal.classList.remove('hidden');

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

    function getLocation() {
        if (!navigator.geolocation) {
            state.locationError = "La geolocalizacion no es compatible.";
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
                    case err.PERMISSION_DENIED: state.locationError = "Permiso de ubicacion denegado."; break;
                    case err.POSITION_UNAVAILABLE: state.locationError = "Ubicacion no disponible."; break;
                    case err.TIMEOUT: state.locationError = "La solicitud de ubicacion expiro."; break;
                    default: state.locationError = "No se pudo obtener la ubicacion."; break;
                }
                renderLocationStatus();
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
    }

    // --- MODIFICADO: AHORA TAMBIÉN RECIBE Y PROCESA EL MENSAJE ---
    async function fetchUserStatus() {
        if (!state.visitorId) return;
        try {
            // Esta llamada AHORA devuelve { success, status, message }
            const result = await callWebApp(ApiAction.GET_STATUS, { userId: state.visitorId });
            
            if (result.success) {
                // 1. Guardamos el estado (como antes)
                state.userStatus = result.status;

                // 2. Revisamos si vino un mensaje "colgado" (piggybacked)
                if (result.message) {
                    state.unreadMessage = result.message; // Guardamos el mensaje
                    DOMElements.headerNotificationDot.classList.remove('hidden'); // Mostramos el punto
                    DOMElements.headerNotificationBtn.classList.add('animate-ring');
                    setTimeout(() => DOMElements.headerNotificationBtn.classList.remove('animate-ring'), 1000);
                }

            } else {
                console.error("Failed to fetch user status:", result.message);
                state.userStatus = null;
            }
        } catch (err) {
            console.error("Failed to fetch user status:", err);
        } finally {
            renderStatusTracker();
            renderAnalyzeButton();
        }
    }

    // --- NUEVA FUNCION ---
    /**
     * Llama al backend para obtener los últimos videos de YouTube y los renderiza.
     * [OPTIMIZADO] Utiliza caché por 2 DÍAS.
     */
    async function fetchYouTubeVideos() {
        if (!state.visitorId) return; // Requerido para la llamada a la API
        
        try {
            // Intentar obtener de la caché primero
            const cacheKey = 'youtube_videos_cache';
            const cachedData = cacheService.get(cacheKey);
            const now = new Date().getTime();

            // --- MODIFICADO: 3600000 (1 hora) -> 172800000 (2 días) ---
            if (cachedData && (now - cachedData.timestamp < 172800000)) { // 2 días
                renderSpecialOfferCard(cachedData.videos, cachedData.subscribeUrl);
                return; 
            }

            // Si no está en caché o está expirada, buscar
            const result = await callWebApp(ApiAction.GET_YOUTUBE_VIDEOS, { userId: state.visitorId }); 
            
            if (result.success && result.videos.length > 0) {
                renderSpecialOfferCard(result.videos, result.subscribeUrl);
                // Guardar en caché
                cacheService.set(cacheKey, { videos: result.videos, subscribeUrl: result.subscribeUrl, timestamp: now });
            } else if (result.success) {
                // No hay videos
                DOMElements.specialOfferCard.innerHTML = '';
            }
            else {
                console.error("Failed to fetch YouTube videos:", result.message);
                // No hacer nada, simplemente no mostrar el card
                DOMElements.specialOfferCard.innerHTML = '';
            }
        } catch (err) {
            console.error("Error calling fetchYouTubeVideos:", err);
            DOMElements.specialOfferCard.innerHTML = ''; // Ocultar en caso de error
        }
    }
    
    // --- ELIMINADO: La función checkMessages() ya no es necesaria ---

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
                state.checkedIngredients = Array(state.recipe.ingredients.length).fill(false); 
                renderResultsView();
                updateView('results');
            } else {
                const errorMessage = result.message || '';
                if (errorMessage.includes('503') && (errorMessage.toLowerCase().includes('overloaded') || errorMessage.includes('UNAVAILABLE'))) {
                    showServerErrorToast('El servidor esta sobrecargado. Por favor, intentalo de nuevo mas tarde.');
                }

                state.error = result.message || 'Ocurrio un error desconocido.';
                updateView('upload');
            }
            if (result.status) {
                state.userStatus = result.status;
                renderStatusTracker();
            }

        } catch (err) {
            state.error = err instanceof Error ? err.message : 'Fallo la comunicacion con el servidor.';
            updateView('upload');
        } finally {
            renderAnalyzeButton();
        }
    }

    function handleAnalysisRequest() {
        if (!state.userStatus || state.view === 'loading') return;

        if (state.analysisMode === 'photo') {
            const hasFreeAnalyses = state.userStatus.freeCount < state.userStatus.freeLimit;
            if (hasFreeAnalyses || state.userStatus.isBonusActive) {
                callAnalysisApi();
            } else {
                showLimitModal('extra_analysis');
            }
        } else {
            if (state.userStatus.isBonusActive) {
                callAnalysisApi();
            } else {
                showLimitModal('ingredients');
            }
        }
    }
    
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

    async function handleClaimBonus() {
        if (!state.visitorId) return;
        try {
            const result = await callWebApp(ApiAction.CLAIM_AD_BONUS, { userId: state.visitorId });
            if (result.success) {
                state.userStatus = result.status;
                showNotification("Bono activado! Ya puedes usar la funcion.");
            } else {
                const message = result.message === 'bonus_limit_reached' ? 'Has alcanzado el limite de bonos por hoy.' : 'Error al reclamar el bono.';
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
            state.checkedIngredients = Array(state.recipe.ingredients.length).fill(false);
            renderResultsView();
            return;
        }

        state.isRemixing = true;
        state.currentRemixType = remixType;
        state.error = null;
        renderResultsView();

        try {
            const payload = { recipe: state.recipe, remixType, userId: state.visitorId };
            const result = await callWebApp(ApiAction.REMIX, payload);
            if (result.success) {
                state.recipe = result.data;
                cacheService.set(cacheKey, result.data);
                cacheService.setLast(result.data);
                state.checkedIngredients = Array(state.recipe.ingredients.length).fill(false);
            } else {
                state.error = result.message || 'Error desconocido durante el remix.';
            }
            if (result.status) state.userStatus = result.status;
        } catch (err) {
            state.error = err instanceof Error ? err.message : 'Fallo la remezcla de la receta.';
        } finally {
            state.isRemixing = false;
            state.currentRemixType = null;
            renderResultsView();
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
                    closeCamera();
                };
                img.src = e.target?.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function handleShare(platform, totalCost) {
        const currentTotalElement = DOMElements.resultsView.querySelector('#current-total-cost');
        const currentTotal = currentTotalElement ? parseFloat(currentTotalElement.textContent) : totalCost;

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
                    copyBtn.querySelector('span').textContent = 'Copiado! ✅';
                    setTimeout(() => { copyBtn.querySelector('span').textContent = originalText; }, 2000);
                }
            });
        } else if (platform === 'whatsapp') {
            const text = encodeURIComponent(generateText(true));
            window.open(`https://wa.me/?text=${text}`, '_blank');
        }
    }

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
            DOMElements.cameraError.textContent = 'No se pudo acceder a la camara. Por favor, revisa los permisos.';
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
            console.warn("La funcion de bonos solo esta disponible en la aplicacion movil.");
            showNotification("La funcion de bonos solo esta disponible en la aplicacion movil.");
        }
    }

    // =====================================================================
    // === INICIALIZACIÓN Y EVENT LISTENERS ===
    // =====================================================================

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

    /** Anade los event listeners para la vista de resultados. */
    function addResultsEventListeners() {
        const returnBtn = document.getElementById('return-home-btn');
        if (returnBtn) {
            returnBtn.addEventListener('click', returnToHome);
        }

        // --- MODIFICADO: AHORA GUARDA EN LOCALSTORAGE ---
        const saveBtn = document.getElementById('save-recipe-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                if (state.recipe) {
                    try {
                        // Usamos un prefijo para guardar varias recetas
                        cacheService.set(`saved_recipe_${state.recipe.dishName}`, state.recipe);
                        
                        // Feedback visual
                        const button = e.currentTarget;
                        const span = button.querySelector('span');
                        const originalText = span.textContent;
                        button.disabled = true;
                        span.textContent = 'Guardado! ✅';
                        
                        setTimeout(() => {
                            span.textContent = originalText;
                            button.disabled = false;
                        }, 2000);

                    } catch (error) {
                        console.error("Error guardando receta:", error);
                        showNotification("No se pudo guardar la receta.");
                    }
                }
            });
        }

        const quickBtn = document.getElementById('remix-quick-btn');
        if (quickBtn) {
            quickBtn.addEventListener('click', () => handleRemix('quick'));
        }

        const healthyBtn = document.getElementById('remix-healthy-btn');
        if (healthyBtn) {
            healthyBtn.addEventListener('click', () => handleRemix('healthy'));
        }
        
        const spicyBtn = document.getElementById('remix-spicy-btn');
        if (spicyBtn) {
            spicyBtn.addEventListener('click', () => handleRemix('spicy'));
        }
    }

    function addStaticListeners() {
        DOMElements.notificationCloseBtn.addEventListener('click', () => DOMElements.notificationBanner.classList.add('hidden'));
        
        DOMElements.modePhotoBtn.addEventListener('click', () => switchAnalysisMode('photo'));
        DOMElements.modeIngredientsBtn.addEventListener('click', () => switchAnalysisMode('ingredients'));
        
        DOMElements.showLastRecipeBtn.addEventListener('click', () => {
            if(state.recipe) {
                renderResultsView();
                updateView('results');
            }
        });

        // 🟢 NUEVA LÓGICA: Redirigir al canal de YouTube al hacer clic en el logo
        DOMElements.headerLogoBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Previene cualquier acción por defecto del botón
            window.open('https://www.youtube.com/@CusiCusa.?sub_confirmation=1', '_blank');
        });


        DOMElements.headerNotificationBtn.addEventListener('click', () => {
            if (state.unreadMessage) {
                showNotification(state.unreadMessage);
                state.unreadMessage = null;
                DOMElements.headerNotificationDot.classList.add('hidden');
            }
        });

        // --- ELIMINADO: Lógica de Modal de Menú / Premium eliminada ---
        // DOMElements.menuModal.addEventListener('click', () => DOMElements.menuModal.classList.add('hidden'));
        // DOMElements.menuModalCloseBtn.addEventListener('click', () => DOMElements.menuModal.classList.add('hidden'));
        // DOMElements.simulateAdBtn.addEventListener('click', ...);
        // DOMElements.privacyPolicyBtn.addEventListener('click', ...);
        // DOMElements.updatesBtn.addEventListener('click', ...);
        
        DOMElements.cameraCancelBtn.addEventListener('click', closeCamera);
        DOMElements.cameraCaptureBtn.addEventListener('click', handleCameraCapture);
        DOMElements.cameraSwitchBtn.addEventListener('click', () => {
            const newMode = DOMElements.cameraVideo.srcObject?.getVideoTracks()[0].getSettings().facingMode === 'user' ? 'environment' : 'user';
            startCameraStream(newMode);
        });
    }

    async function initialize() {
        initDOMElements(); 
        
        setTimeout(() => {
            DOMElements.introOverlay.style.opacity = '0';
            setTimeout(() => DOMElements.introOverlay.classList.add('hidden'), 1000);
        }, 3000);
        
        const lastRecipe = cacheService.getLast();
        if (lastRecipe) {
            state.recipe = lastRecipe;
            state.checkedIngredients = Array(state.recipe.ingredients.length).fill(false);
            
            if (DOMElements.lastRecipeCard && DOMElements.lastRecipeName) {
                DOMElements.lastRecipeCard.classList.remove('hidden');
                DOMElements.lastRecipeName.textContent = lastRecipe.dishName;
            }
        }

        // --- ELIMINADO: La versión de la app ya no se muestra en el menú
        // DOMElements.appVersion.textContent = `Version ${APP_VERSION}`; 
        renderLoader('loader-animation-container');
        renderLoader('camera-loader', true);
        renderLocationStatus();
        renderAnalysisMode();
        renderAnalyzeButton();

        addStaticListeners();

        await getVisitorId();
        getLocation();
        await fetchUserStatus(); // <-- Esta función ahora también trae los mensajes
        
        fetchYouTubeVideos(); // <-- Esta función trae los videos (con caché de 2 días)
    }

    window.handleAdReward = (wasSuccessful, message) => {
        if (wasSuccessful) {
            handleClaimBonus();
        } else {
            console.error("Ad failed or was dismissed:", message);
            showNotification("No se pudo obtener el bono del anuncio.");
        }
    };

    function mostrarUltimoAnalisis() {
        const lastRecipe = cacheService.getLast();
        if (!lastRecipe) return;

        DOMElements.lastRecipeCard.classList.remove('hidden');
        DOMElements.lastRecipeName.textContent = lastRecipe.dishName || "Receta anterior";

        DOMElements.showLastRecipeBtn.addEventListener('click', () => {
            state.recipe = lastRecipe;
            updateView('results');
            renderResultsView();
        });
    }

    initDOMElements();
    initialize();
    mostrarUltimoAnalisis();
});


