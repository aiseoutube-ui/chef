import React, { useState, useEffect } from 'react';
import type { Recipe } from '../types';
import { ShareModule } from './ShareModule';
import { PremiumModal } from './PremiumModal';

interface ResultsDisplayProps {
    recipe: Recipe | null;
    error: string | null;
    onReset: () => void;
}

const InfoCard: React.FC<{ label: string; value: string | number | undefined; icon: React.ReactNode }> = ({ label, value, icon }) => {
    if (!value) return null;
    return (
        <div className="flex-1 flex flex-col items-center">
            <div className="text-brand-orange">{icon}</div>
            <p className="text-sm font-bold text-gray-800 mt-1">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
        </div>
    );
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ recipe, error, onReset }) => {
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [checkedIngredients, setCheckedIngredients] = useState<boolean[]>([]);
    const [dynamicTotalCost, setDynamicTotalCost] = useState<number>(0);

    useEffect(() => {
        if (recipe) {
            setCheckedIngredients(Array(recipe.ingredients.length).fill(false));
        }
    }, [recipe]);

    useEffect(() => {
        if (!recipe) return;

        const newTotal = recipe.ingredients.reduce((acc, ing, index) => {
            if (!checkedIngredients[index]) {
                return acc + (ing.estimatedLocalPrice || 0);
            }
            return acc;
        }, 0);
        setDynamicTotalCost(newTotal);

    }, [recipe, checkedIngredients]);

    if (error) {
        return (
            <div className="text-center p-8 flex flex-col items-center justify-center h-full animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">¡Oops! Algo salió mal</h2>
                <p className="text-gray-600 bg-red-50 p-4 rounded-lg mb-6 max-w-sm w-full">{error}</p>
                <button
                    onClick={onReset}
                    className="w-full max-w-xs h-12 flex items-center justify-center rounded-xl font-semibold text-white bg-brand-orange hover:bg-brand-orange-light transition-transform transform hover:scale-105"
                >
                    Intentar de Nuevo
                </button>
            </div>
        );
    }
    
    if (!recipe) {
        return (
             <div className="text-center p-8 flex flex-col items-center justify-center h-full animate-fadeIn">
                 <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-700 mb-2">No se encontró la receta</h2>
                <p className="text-gray-500 mb-6 max-w-sm w-full">No pudimos generar una receta a partir de tu imagen. Intenta con una foto más clara.</p>
                <button
                    onClick={onReset}
                    className="w-full max-w-xs h-12 flex items-center justify-center rounded-xl font-semibold text-white bg-brand-orange hover:bg-brand-orange-light transition-transform transform hover:scale-105"
                >
                    Volver a Empezar
                </button>
            </div>
        );
    }
    
    const recipeWithCost = { ...recipe, totalCost: dynamicTotalCost };

    return (
        <div className="animate-slideInUp pb-4">
            <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight pr-4">{recipe.dishName}</h1>
                <button 
                    onClick={() => setShowPremiumModal(true)} 
                    className="flex-shrink-0 flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full transition hover:bg-amber-200 hover:scale-105 transform"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    Guardar
                </button>
            </div>

            <div className="flex gap-2 text-center my-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <InfoCard label="Tiempo" value={recipe.preparationTime} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <InfoCard label="Dificultad" value={recipe.difficulty} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
                <InfoCard label="Calorías" value={recipe.calories} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-700 mb-2">🛒 Ingredientes</h2>
                <p className="text-xs text-gray-500 mb-3 -mt-1">Marca los ingredientes que ya tienes en casa.</p>
                <ul className="space-y-2">
                    {recipe.ingredients.map((ing, i) => {
                        const isChecked = checkedIngredients[i] || false;
                        const handleToggle = () => {
                            const newCheckedState = [...checkedIngredients];
                            newCheckedState[i] = !newCheckedState[i];
                            setCheckedIngredients(newCheckedState);
                        };
                        return (
                             <li
                                key={i}
                                onClick={handleToggle}
                                className={`grid grid-cols-[1fr_auto] items-start gap-4 bg-white p-3 rounded-lg border transition-all duration-200 cursor-pointer ${isChecked ? 'opacity-60 bg-gray-50' : 'shadow-sm'}`}
                            >
                                {/* Column 1: Checkbox and Text */}
                                <div className="flex items-start">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        readOnly
                                        className="h-5 w-5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange mr-4 mt-1 flex-shrink-0 cursor-pointer"
                                    />
                                    <div>
                                        <span className={`font-semibold text-gray-800 ${isChecked ? 'line-through' : ''}`}>{ing.name}</span>
                                        <span className={`block text-xs text-gray-500 ${isChecked ? 'line-through' : ''}`}>
                                            {`${ing.quantity.toFixed(2).replace(/\.00$/, '')} ${ing.unit}`}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Column 2: Price Box */}
                                <div className={`bg-gray-100 p-2 rounded-md text-center w-[80px] flex-shrink-0 ${isChecked ? 'line-through' : ''}`}>
                                    <p className={`text-sm font-bold ${isChecked ? 'text-gray-500' : 'text-gray-800'}`}>
                                        {ing.estimatedLocalPrice > 0 ? ing.estimatedLocalPrice.toFixed(2) : '-'}
                                    </p>
                                    <p className={`text-xs -mt-1 ${isChecked ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {ing.estimatedLocalPrice > 0 ? recipe.currencyCode : 'N/A'}
                                    </p>
                                </div>
                            </li>
                        )
                    })}
                </ul>
                <div className="text-right font-bold text-lg mt-3 text-gray-800 border-t pt-3">
                    Costo de Compra Estimado: <span className="text-brand-orange">{dynamicTotalCost.toFixed(2)} {recipe.currencyCode}</span>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-700 mb-3">📝 Instrucciones</h2>
                <ol className="list-decimal list-outside space-y-3 pl-5 text-gray-700">
                    {recipe.instructions.map((step, i) => (
                        <li key={i} className="pl-2 leading-relaxed">{step}</li>
                    ))}
                </ol>
            </div>

            {recipe.supermarketSuggestions?.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-700 mb-3">🏪 Dónde Comprar</h2>
                    <div className="flex flex-wrap gap-2">
                        {recipe.supermarketSuggestions.map((store, i) => (
                            <span key={i} className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1.5 rounded-full">{store}</span>
                        ))}
                    </div>
                </div>
            )}

            <ShareModule recipe={recipeWithCost} />

            <div className="mt-8">
                <button
                    onClick={onReset}
                    className="w-full h-12 flex items-center justify-center rounded-xl font-semibold text-white bg-brand-orange hover:bg-brand-orange-light transition-transform transform hover:scale-105"
                >
                    Analizar Otra Foto
                </button>
            </div>
            
            <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
            <style>{`.animate-slideInUp { animation: slideInUp 0.5s ease-out; } @keyframes slideInUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.5s ease-out; } @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }`}</style>
        </div>
    );
};