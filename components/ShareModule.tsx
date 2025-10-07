import React, { useState } from 'react';
import type { Recipe } from '../types';

interface ShareModuleProps {
    recipe: Recipe & { totalCost: number };
}

const ShareButton: React.FC<{ children: React.ReactNode, onClick: () => void, className?: string }> = ({ children, onClick, className }) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md ${className}`}>
        {children}
    </button>
);

export const ShareModule: React.FC<ShareModuleProps> = ({ recipe }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copiar');

    const generateShareableText = (platform: 'clipboard' | 'whatsapp' = 'clipboard') => {
        const title = (text: string) => platform === 'whatsapp' ? `*${text}*` : text.toUpperCase();
        const nl = '\n';
        const separator = '---------------------\n';
        
        let shareText = title(`${recipe.dishName}`) + nl + nl;
        shareText += "🛒 " + title("Ingredientes") + nl;
        recipe.ingredients.forEach(ing => {
            const price = ing.estimatedLocalPrice || 0;
            shareText += `- ${ing.quantity.toFixed(2).replace(/\.00$/, '')} ${ing.unit} de ${ing.name} (aprox. ${price.toFixed(2)} ${recipe.currencyCode})\n`;
        });
        shareText += nl + `Costo Total Estimado: ${recipe.totalCost.toFixed(2)} ${recipe.currencyCode}` + nl;
        if (recipe.supermarketSuggestions?.length > 0) {
            shareText += nl + "🏪 " + title("Puedes comprar en") + nl + recipe.supermarketSuggestions.join(', ') + nl;
        }
        shareText += nl + separator;
        shareText += "📝 " + title("Instrucciones") + nl;
        recipe.instructions.forEach((step, i) => { shareText += `${i + 1}. ${step}\n`; });
        shareText += nl + "Generado con FoodAI ✨";
        return shareText;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generateShareableText('clipboard')).then(() => {
            setCopyButtonText('¡Copiado! ✅');
            setTimeout(() => setCopyButtonText('Copiar'), 2000);
        });
    };

    const handleShare = (platform: 'whatsapp') => {
        const text = generateShareableText(platform);
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };
    
    return (
        <div className="space-y-3 pt-4">
             <p className="text-center text-sm font-semibold text-gray-500">Compartir Receta</p>
             <div className="flex flex-col sm:flex-row gap-3">
                <ShareButton onClick={handleCopy} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
                    <span>{copyButtonText}</span>
                </ShareButton>
                <ShareButton onClick={() => handleShare('whatsapp')} className="bg-[#25D366] text-white hover:bg-[#128C7E]">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zM6.597 20.193c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.003 2.011.564 3.965 1.634 5.675l-1.109 4.069 4.212-1.106z"/></svg>
                    <span>WhatsApp</span>
                </ShareButton>
            </div>
        </div>
    );
};