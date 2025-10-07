import React, { useState, useEffect } from 'react';
import type { UserStatus } from '../types';
import { COOLDOWN_MINUTES } from '../constants';

const CooldownTimer: React.FC<{ targetTimestamp: number }> = ({ targetTimestamp }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const diff = targetTimestamp - now;

            if (diff <= 0) {
                setTimeLeft('Listo');
                clearInterval(interval);
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${minutes}m ${seconds.toString().padStart(2, '0')}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [targetTimestamp]);

    return <p className="text-2xl font-bold text-brand-orange min-h-[32px]">{timeLeft}</p>;
};

interface StatusTrackerProps {
    status: UserStatus;
    onUseBonus: () => void;
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({ status, onUseBonus }) => {
    const { freeCount, adCount, freeLimit, adBonusLimit, lastAnalysisTimestamp, isBonusActive } = status;
    
    const remainingFree = Math.max(0, freeLimit - freeCount);
    const remainingAdsClaimable = adBonusLimit - adCount;

    const timeSinceLast = Date.now() - (lastAnalysisTimestamp || 0);
    const isCooldownActive = lastAnalysisTimestamp !== 0 && timeSinceLast < COOLDOWN_MINUTES * 60 * 1000 && !isBonusActive;
    
    const showBonusButton = (isCooldownActive || (remainingFree <= 0 && !isBonusActive)) && remainingAdsClaimable > 0;

    return (
        <div className="text-center my-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex justify-around items-center">
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{remainingFree}</p>
                    <p className="text-xs text-gray-500">Análisis Gratis</p>
                </div>
                 <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{adCount}/{adBonusLimit}</p>
                    <p className="text-xs text-gray-500">Bonos Usados</p>
                </div>
                 <div className="text-center">
                    {isCooldownActive ? 
                        <CooldownTimer targetTimestamp={lastAnalysisTimestamp + COOLDOWN_MINUTES * 60 * 1000} /> : 
                        <p className="text-2xl font-bold text-green-500 min-h-[32px]">Listo</p>
                    }
                    <p className="text-xs text-gray-500">Siguiente Gratis</p>
                </div>
            </div>
            {showBonusButton && (
                 <button onClick={onUseBonus} className="mt-4 bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold py-2 px-4 rounded-full text-xs transition-transform transform hover:scale-105 w-full">
                     Saltar espera con 1 Bono
                 </button>
            )}
        </div>
    );
}