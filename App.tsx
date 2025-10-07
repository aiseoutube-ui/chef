import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageHandler } from './components/ImageHandler';
import { AnalyzeButton } from './components/AnalyzeButton';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Loader } from './components/Loader';
import { LocationStatus } from './components/LocationStatus';
import { StatusTracker } from './components/StatusTracker';
import { SpecialOfferCard } from './components/SpecialOfferCard';
import { LimitModal } from './components/LimitModal';
import { IntroOverlay } from './components/IntroOverlay';
import { useFingerprint } from './hooks/useFingerprint';
import { useLocation } from './hooks/useLocation';
import { callWebApp } from './services/apiService';
import { ApiAction } from './types';
import type { Recipe, UserStatus } from './types';
import { COOLDOWN_MINUTES } from './constants';

// Define the Android interface on the window object for TypeScript
declare global {
    interface Window {
        Android?: {
            showRewardedAd: () => void;
        };
        grantAdBonusFromAndroid?: () => void;
    }
}

function App() {
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [limitModalReason, setLimitModalReason] = useState<'cooldown' | 'limit'>('limit');
    const [isClaimingBonus, setIsClaimingBonus] = useState(false);
    const [showIntro, setShowIntro] = useState(true);

    const visitorId = useFingerprint();
    const { location, error: locationError } = useLocation();
    
    useEffect(() => {
        const timer = setTimeout(() => setShowIntro(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    const fetchUserStatus = useCallback(async () => {
        if (!visitorId) return;
        try {
            const response = await callWebApp(ApiAction.GET_STATUS, { visitorId });
            if (response.success && response.status) {
                setUserStatus(response.status);
            } else {
                setError(response.message || 'Failed to get user status.');
            }
        } catch (e) {
            setError('An error occurred while fetching user status.');
            console.error(e);
        }
    }, [visitorId]);

    useEffect(() => {
        if (visitorId) {
            fetchUserStatus();
        }
    }, [visitorId, fetchUserStatus]);

    const handleAnalyze = useCallback(async () => {
        if (!imageBase64 || !visitorId || !userStatus) return;

        const { freeCount, freeLimit, lastAnalysisTimestamp, isBonusActive } = userStatus;
        const remainingFree = freeLimit - freeCount;
        const timeSinceLast = Date.now() - (lastAnalysisTimestamp || 0);
        const isCooldownActive = lastAnalysisTimestamp !== 0 && timeSinceLast < COOLDOWN_MINUTES * 60 * 1000 && !isBonusActive;
        const hasUses = remainingFree > 0 || isBonusActive;
        
        if (isCooldownActive) {
            setLimitModalReason('cooldown');
            setIsLimitModalOpen(true);
            return;
        }
        if (!hasUses) {
            setLimitModalReason('limit');
            setIsLimitModalOpen(true);
            return;
        }

        setIsLoading(true);
        setError(null);
        setRecipe(null);

        try {
            const payload = {
                visitorId,
                imageBase64,
                location: location ? { lat: location.lat, lon: location.lon } : null,
            };
            const response = await callWebApp(ApiAction.ANALYZE, payload);
            if (response.success) {
                setRecipe(response.recipe);
                setUserStatus(response.status);
            } else {
                setError(response.message || 'Analysis failed. Please try again.');
                if (response.status) {
                    setUserStatus(response.status);
                }
            }
        } catch (e: any) {
            setError(e.message || 'A critical error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    }, [imageBase64, visitorId, userStatus, location]);
    
    // This is the function that the Android app will call after a successful ad view.
    const grantAdBonusCallback = useCallback(async () => {
        if (!visitorId) return;
        try {
            const response = await callWebApp(ApiAction.CLAIM_AD_BONUS, { visitorId });
            if (response.success && response.status) {
                setUserStatus(response.status);
                setIsLimitModalOpen(false); // Close modal on success
            } else {
                setError(response.message || 'Failed to claim bonus after ad.');
            }
        } catch (e) {
            setError('An error occurred while claiming bonus after ad.');
            console.error(e);
        } finally {
            // Always turn off the loading indicator, regardless of outcome
            setIsClaimingBonus(false);
        }
    }, [visitorId]);

    // This useEffect hook exposes the callback function to the window object for Android to call.
    useEffect(() => {
        window.grantAdBonusFromAndroid = grantAdBonusCallback;
        // Clean up the function from the window object when the component unmounts
        return () => {
            delete window.grantAdBonusFromAndroid;
        };
    }, [grantAdBonusCallback]);

    // This function is called when the user clicks the "Use Bonus" button in the modal.
    const handleRequestAd = () => {
        setIsClaimingBonus(true); // Start loading indicator immediately

        if (window.Android && typeof window.Android.showRewardedAd === 'function') {
            // This is the production path inside the Android WebView
            window.Android.showRewardedAd();
        } else {
            // This is a fallback for testing in a desktop browser where the Android interface doesn't exist.
            console.warn("Android interface not found. Simulating ad reward for testing.");
            setTimeout(() => {
                grantAdBonusCallback(); // Simulate a successful ad view after 1.5 seconds
            }, 1500);
        }
    };
    
    const handleReset = () => {
        setImageBase64(null);
        setRecipe(null);
        setError(null);
    };

    const handleOpenLimitModal = () => {
        if (!userStatus) return;
        const { freeCount, freeLimit, lastAnalysisTimestamp, isBonusActive } = userStatus;
        const remainingFree = freeLimit - freeCount;
        const timeSinceLast = Date.now() - (lastAnalysisTimestamp || 0);
        const isCooldownActive = lastAnalysisTimestamp !== 0 && timeSinceLast < COOLDOWN_MINUTES * 60 * 1000 && !isBonusActive;
        
        if(isCooldownActive) {
            setLimitModalReason('cooldown');
        } else if (remainingFree <= 0 && !isBonusActive) {
            setLimitModalReason('limit');
        } else {
            return;
        }
        setIsLimitModalOpen(true);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                    <Loader />
                    <p className="mt-4 text-lg font-semibold text-gray-700">Analizando tu plato...</p>
                    <p className="text-sm text-gray-500">Esto podría tardar un momento.</p>
                </div>
            );
        }

        if (recipe || error) {
            return <ResultsDisplay recipe={recipe} error={error} onReset={handleReset} />;
        }

        return (
            <>
                <ImageHandler imageBase64={imageBase64} onImageSelect={setImageBase64} onReset={handleReset} />
                <div className="mt-4 space-y-4">
                    {userStatus && <StatusTracker status={userStatus} onUseBonus={handleOpenLimitModal} />}
                    <AnalyzeButton imageBase64={imageBase64} userStatus={userStatus} isLoading={isLoading} onClick={handleAnalyze} />
                    <LocationStatus location={location} error={locationError} />
                </div>
                <SpecialOfferCard />
            </>
        );
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <IntroOverlay show={showIntro} />
            <div className="max-w-md mx-auto bg-white shadow-2xl rounded-3xl min-h-screen overflow-hidden flex flex-col">
                <Header />
                <main className="p-6 flex-grow">
                    {renderContent()}
                </main>
            </div>
            {isLimitModalOpen && userStatus && (
                <LimitModal 
                    isOpen={isLimitModalOpen}
                    onClose={() => setIsLimitModalOpen(false)}
                    onClaimBonus={handleRequestAd}
                    isClaiming={isClaimingBonus}
                    reason={limitModalReason}
                    status={userStatus}
                />
            )}
        </div>
    );
}

export default App;