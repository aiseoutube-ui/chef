import React from 'react';
import type { UserStatus } from '../types';
import { COOLDOWN_MINUTES } from '../constants';

// A smaller, inline loader for the button
const ButtonLoader: React.FC = () => (
    <div 
        className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"
        role="status"
        aria-label="loading"
    />
);


interface AnalyzeButtonProps {
    imageBase64: string | null;
    userStatus: UserStatus | null;
    isLoading: boolean;
    onClick: () => void;
}

export const AnalyzeButton: React.FC<AnalyzeButtonProps> = ({ imageBase64, userStatus, isLoading, onClick }) => {
    const getButtonState = () => {
        if (isLoading) {
            return { text: '', disabled: true, showLoader: true };
        }
        if (!userStatus) {
            return { text: 'Cargando...', disabled: true, showLoader: false };
        }

        const { freeCount, freeLimit, lastAnalysisTimestamp, isBonusActive } = userStatus;
        const remainingFree = freeLimit - freeCount;
        const timeSinceLast = Date.now() - (lastAnalysisTimestamp || 0);
        const isCooldownActive = lastAnalysisTimestamp !== 0 && timeSinceLast < COOLDOWN_MINUTES * 60 * 1000 && !isBonusActive;
        const hasUses = remainingFree > 0 || isBonusActive;

        if (!imageBase64) {
            return { text: 'Selecciona una imagen', disabled: true, showLoader: false };
        }
        if (isCooldownActive) {
            return { text: 'Enfriamiento activo', disabled: true, showLoader: false };
        }
        if (!hasUses) {
            return { text: 'Límite diario alcanzado', disabled: true, showLoader: false };
        }
        if (isBonusActive) {
            return { text: 'Analizar con Bono', disabled: false, showLoader: false };
        }
        return { text: 'Generar Receta', disabled: false, showLoader: false };
    };

    const { text, disabled, showLoader } = getButtonState();

    return (
        <button
            onClick={onClick}
            disabled={disabled || !imageBase64}
            className="w-full h-14 flex items-center justify-center rounded-xl font-bold text-lg text-white bg-brand-orange transition-all duration-300 transform hover:bg-brand-orange-light hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-300 disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:scale-100 disabled:shadow-none disabled:cursor-not-allowed"
        >
            {showLoader ? <ButtonLoader /> : <span>{text}</span>}
        </button>
    );
};