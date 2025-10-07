import React from 'react';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div 
                className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-sm w-full transform transition-transform duration-300 scale-95 animate-modal-pop-in" 
                onClick={e => e.stopPropagation()}
            >
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 -mt-12 mb-4 shadow-lg">
                    <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345h5.364c.54 0 .82.733.424 1.11l-4.29 3.13a.563.563 0 00-.182.635l2.125 5.111a.563.563 0 01-.84.62l-4.29-3.13a.563.563 0 00-.606 0l-4.29 3.13a.563.563 0 01-.84-.62l2.125-5.111a.563.563 0 00-.182-.635l-4.29-3.13a.563.563 0 01.424-1.11h5.364a.563.563 0 00.475-.345l2.125-5.111z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Función Pro Exclusiva</h3>
                <p className="text-gray-500 mb-6">
                    ¡Guarda tus recetas favoritas y crea tu propio libro de cocina digital con FoodAI Pro!
                </p>
                
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={onClose} 
                        className="w-full h-12 flex items-center justify-center gap-2 rounded-xl font-semibold text-white bg-brand-orange hover:bg-brand-orange-light transition-transform transform hover:scale-105"
                    >
                        Actualizar a Pro
                    </button>
                    <button onClick={onClose} className="w-full h-12 flex items-center justify-center rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-transform transform hover:scale-105">
                        Quizás más tarde
                    </button>
                </div>
            </div>
            <style>{`.animate-modal-pop-in { animation: pop-in 0.3s ease-out forwards; } @keyframes pop-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }`}</style>
        </div>
    );
};