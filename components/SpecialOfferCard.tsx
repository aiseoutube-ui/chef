import React, { useState, useEffect } from 'react';

const offers = [
    {
        image: "https://images.unsplash.com/photo-1518843875459-f738682238a6?q=80&w=2070&auto=format&fit=crop",
        title: "¡Conviértete en Chef Pro!",
        description: "Accede a funciones exclusivas y análisis ilimitados.",
        buttonText: "Ver Planes Pro",
        buttonClass: "bg-teal-500 hover:bg-teal-400"
    },
    {
        image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop",
        title: "Planifica tu Semana",
        description: "Genera un menú semanal completo con nuestra IA.",
        buttonText: "Crear Menú",
        buttonClass: "bg-blue-500 hover:bg-blue-400"
    },
    {
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop",
        title: "¡Comparte y Gana!",
        description: "Invita a un amigo y ambos obtienen 5 análisis extra.",
        buttonText: "Invitar Amigos",
        buttonClass: "bg-purple-500 hover:bg-purple-400"
    },
    {
        image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop",
        title: "¿Necesitas una dieta especial?",
        description: "Desbloquea recetas keto, veganas, y más con CusiCusa.",
        buttonText: "Explorar Dietas",
        buttonClass: "bg-green-500 hover:bg-green-400"
    }
];

export const SpecialOfferCard: React.FC = () => {
    const [currentOfferIndex, setCurrentOfferIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentOfferIndex(prevIndex => (prevIndex + 1) % offers.length);
        }, 5000); // Rotate every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const currentOffer = offers[currentOfferIndex];

    return (
        <div className="relative rounded-2xl overflow-hidden shadow-lg mt-6 bg-gray-800 transform transition-transform duration-300 hover:scale-[1.03] h-48">
            {offers.map((offer, index) => (
                 <img
                    key={offer.image} 
                    src={offer.image}
                    alt="Promotional background"
                    className={`absolute w-full h-full object-cover transition-opacity duration-1000 ${index === currentOfferIndex ? 'opacity-30' : 'opacity-0'}`}
                />
            ))}
           
            <div className="relative p-6 flex flex-col justify-between h-full text-white">
                 <div className="transition-opacity duration-700">
                    <h3 className="text-2xl font-extrabold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{currentOffer.title}</h3>
                    <p className="mt-1 text-sm font-medium opacity-90" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                        {currentOffer.description}
                    </p>
                </div>
                <button className={`mt-4 self-start text-white font-bold py-2 px-5 rounded-lg text-sm transition-all duration-300 shadow-md hover:shadow-lg ${currentOffer.buttonClass}`}>
                    {currentOffer.buttonText}
                </button>
            </div>
        </div>
    );
};
