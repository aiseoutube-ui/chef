import React, { useState, useEffect, useCallback } from 'react';
import { IntroOverlay } from './components/IntroOverlay';
import { Header } from './components/Header';
import { LocationStatus } from './components/LocationStatus';
import { StatusTracker } from './components/StatusTracker';
import { ImageHandler } from './components/ImageHandler';
import { AnalyzeButton } from './components/AnalyzeButton';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LimitModal } from './components/LimitModal';
import { Loader } from './components/Loader';
import { SpecialOfferCard } from './components/SpecialOfferCard';
import { useFingerprint } from './hooks/useFingerprint';
import { useLocation } from './hooks/useLocation';
import { callWebApp } from './services/apiService';
import type { Recipe, UserStatus, LocationCoords } from './types';
import { ApiAction } from './types';

type View = 'upload' | 'loading' | 'results';

const LOADING_MESSAGES = [
    "Analizando los sabores en tu foto...",
    "Consultando a nuestros chefs de IA...",
    "Calculando los costos locales...",
    "¡Casi listo! Dando los toques finales...",
];

// NUEVO: Definir la duración del cooldown como una constante
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutos

const App: React.FC = () => {
    const [showIntro, setShowIntro] = useState(true);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [view, setView] = useState<View>('upload');
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

    const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [modalReason, setModalReason] = useState<'cooldown' | 'limit'>('limit');

    const visitorId = useFingerprint();
    const { location, error: locationError } = useLocation();

    const fetchUserStatus = useCallback(async () => {
        if (!visitorId) return;
        try {
            const result = await callWebApp<{ status: UserStatus }>(ApiAction.GET_STATUS, { userId: visitorId });
            if (result.success) {
                setUserStatus(result.status);
            }
        } catch (err) {
            console.error("Failed to fetch user status:", err);
        }
    }, [visitorId]);

    useEffect(() => {
        const introTimer = setTimeout(() => setShowIntro(false), 3000);
        return () => clearTimeout(introTimer);
    }, []);

    useEffect(() => {
        fetchUserStatus();
    }, [fetchUserStatus]);

    useEffect(() => {
        let interval: number;
        if (view === 'loading') {
            let messageIndex = 0;
            interval = window.setInterval(() => {
                messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
                setLoadingMessage(LOADING_MESSAGES[messageIndex]);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [view]);

    const handleAnalyze = async () => {
        if (!imageBase64 || !visitorId) return;

        setView('loading');
        setError(null);
        setRecipe(null);
        setLoadingMessage(LOADING_MESSAGES[0]);
        let shouldShowResults = true;

        try {
            const payload = {
                imageData: imageBase64,
                location: location as LocationCoords,
                userId: visitorId
            };
            const result = await callWebApp<{ data: Recipe, status: UserStatus }>(ApiAction.ANALYZE, payload);
            
            if (result.success) {
                setRecipe(result.data);
                setUserStatus(result.status);
            } else {
                setUserStatus(result.status);
                shouldShowResults = false;
                if (result.message === 'cooldown_active' || result.message === 'limit_reached') {
                    setModalReason(result.message === 'cooldown_active' ? 'cooldown' : 'limit');
                    setShowLimitModal(true);
                    setView('upload');
                } else {
                    setError(result.message || 'An unknown error occurred.');
                    shouldShowResults = true; // Show error in results view
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze image.');
        } finally {
            if (shouldShowResults) {
                setView('results');
            }
        }
    };
    
    const handleClaimBonus = async () => {
        if (!visitorId) return;
        try {
            const result = await callWebApp<{ status: UserStatus }>(ApiAction.CLAIM_AD_BONUS, { userId: visitorId });
            if (result.success) {
                setUserStatus(result.status);
                setShowLimitModal(false);
            }
        } catch (err) {
            console.error("Failed to claim ad bonus:", err);
        }
    };
    
    const resetAnalysis = () => {
        setRecipe(null);
        setError(null);
        setImageBase64(null);
        setView('upload');
    }

    const resetImage = () => {
        setImageBase64(null);
    }

    // ================================================================
    // NUEVO: LÓGICA PARA DETERMINAR SI EL BOTÓN DE BONO DEBE MOSTRARSE
    // ================================================================
    let showBonusButton = false;
    let isCooldownActive = false;

    if (userStatus) {
        const { freeCount, adCount, freeLimit, adBonusLimit, lastAnalysisTimestamp, isBonusActive } = userStatus;
        
        const remainingFree = freeLimit - freeCount;
        const remainingAdsClaimable = adBonusLimit - adCount;
        
        isCooldownActive = (Date.now() - (lastAnalysisTimestamp || 0)) < COOLDOWN_MS && !isBonusActive;
        
        const isBlockedByLimit = remainingFree <= 0 && !isBonusActive;
        const canGetBonus = remainingAdsClaimable > 0;

        if ((isCooldownActive || isBlockedByLimit) && canGetBonus) {
            showBonusButton = true;
        }
    }

    const renderContent = () => {
        const isLoading = view === 'loading';
        switch(view) {
            case 'loading':
                return (
                    <div className="flex-grow flex flex-col justify-center items-center text-center p-4">
                        <Loader />
                        <h2 className="text-gray-700 font-bold text-2xl mt-6">Cocinando tu receta...</h2>
                        <p className="text-gray-500 text-md mt-2 transition-opacity duration-500">{loadingMessage}</p>
                    </div>
                );
            case 'results':
                return <ResultsDisplay recipe={recipe} error={error} onReset={resetAnalysis} />;
            case 'upload':
            default:
                return (
                    <>
                        <LocationStatus location={location} error={locationError} />
                        {userStatus && <StatusTracker status={userStatus} />}
                        <SpecialOfferCard />
                        
                        {/* ================================================================ */}
                        {/* NUEVO: BOTÓN DE BONO QUE APARECE CONDICIONALMENTE              */}
                        {/* ================================================================ */}
                        {showBonusButton && (
                            <div className="mt-4 text-center">
                                <button
                                    onClick={() => {
                                        setModalReason(isCooldownActive ? 'cooldown' : 'limit');
                                        setShowLimitModal(true);
                                    }}
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-transform transform hover:scale-105"
                                >
                                    ¡Salta la espera! Obtén +1 análisis ✨
                                </button>
                            </div>
                        )}
                        
                        <div className="space-y-6 mt-6 flex-grow flex flex-col justify-center">
                            <ImageHandler imageBase64={imageBase64} onImageSelect={setImageBase64} onReset={resetImage} />
                        </div>
                         <div className="mt-6">
                            <AnalyzeButton imageBase64={imageBase64} userStatus={userStatus} isLoading={isLoading} onClick={handleAnalyze} />
                        </div>
                    </>
                );
        }
    }


    return (
        <>
            <IntroOverlay show={showIntro} />
            <div className="flex justify-center items-start min-h-screen p-4">
                <main className="bg-white rounded-3xl w-full max-w-md shadow-lg my-8 relative flex flex-col min-h-[calc(100vh-4rem)] overflow-hidden">
                    <Header />
                    <div className="p-6 flex-grow flex flex-col overflow-y-auto">
                         {renderContent()}
                    </div>
                     <div className="text-center p-4 mt-auto border-t border-gray-100">
                        <p className="text-xs text-gray-400 font-medium">CusiCusa - Powered by Gemini</p>
                    </div>
                </main>
            </div>
            {userStatus && <LimitModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                onClaimBonus={handleClaimBonus}
                reason={modalReason}
                status={userStatus}
            />}
        </>
    );
};

export default App;