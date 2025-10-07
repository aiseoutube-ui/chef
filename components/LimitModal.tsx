import React, { useState, useEffect } from 'react';
import type { UserStatus } from '../types';
import { COOLDOWN_MINUTES } from '../constants';

const ButtonLoader: React.FC = () => (
    <div 
        className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"
        role="status"
        aria-label="loading"
    />
);


interface LimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClaimBonus: () => Promise<void>;
    reason: 'cooldown' | 'limit';
    status: UserStatus;
}

export const LimitModal: React.FC<LimitModalProps> = ({ isOpen, onClose, onClaimBonus, reason, status }) => {
    const [isClaiming, setIsClaiming] = useState(false);
    const [cooldownText, setCooldownText] = useState('');
    const { adCount, adBonusLimit, lastAnalysisTimestamp } = status;
    const remainingAdsClaimable = adBonusLimit - adCount;

    useEffect(() => {
        if (!isOpen || reason !== 'cooldown') return;
        
        const interval = setInterval(() => {
            const diff = (lastAnalysisTimestamp + COOLDOWN_MINUTES * 60 * 1000) - Date.now();
            if (diff <= 0) {
                setCooldownText('Listo!');
                clearInterval(interval);
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setCooldownText(`${minutes}m ${seconds.toString().padStart(2, '0')}s`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, reason, lastAnalysisTimestamp]);

    const handleClaim = async () => {
        setIsClaiming(true);
        await onClaimBonus();
        setIsClaiming(false);
    };
    
    if (!isOpen) return null;

    const title = reason === 'cooldown' ? '¡Salta la espera!' : 'Límite gratuito alcanzado';
    const canClaim = remainingAdsClaimable > 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-sm w-full transform transition-transform duration-300 scale-95 animate-modal-pop-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-500 mb-6">
                    {reason === 'cooldown' 
                        ? `Usa un bono para analizar ahora o espera ${cooldownText}.` 
                        : 'Puedes obtener un análisis extra usando un bono.'
                    }
                </p>
                
                <div className="flex flex-col gap-3">
                    {canClaim ? (
                         <button 
                            onClick={handleClaim} 
                            disabled={isClaiming}
                            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl font-semibold text-white bg-brand-orange hover:bg-brand-orange-light transition-transform transform hover:scale-105 disabled:bg-gray-300 disabled:scale-100"
                        >
                            {isClaiming ? <ButtonLoader /> : `Usar Bono (${remainingAdsClaimable} disp.)`}
                        </button>
                    ) : (
                        <p className="text-sm font-medium text-gray-600 bg-gray-100 p-3 rounded-lg">Has usado todos tus bonos por hoy. ¡Vuelve mañana!</p>
                    )}
                    <button onClick={onClose} className="w-full h-12 flex items-center justify-center rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-transform transform hover:scale-105">
                        Cerrar
                    </button>
                </div>
            </div>
            <style>{`.animate-modal-pop-in { animation: pop-in 0.3s ease-out forwards; } @keyframes pop-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }`}</style>
        </div>
    );
};