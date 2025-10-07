import React, { useState, useEffect } from 'react';

// FIX: Added `isWhite` prop to support different background colors and fix type error in CameraModal.tsx.
interface LoaderProps {
    isWhite?: boolean;
}

const PotAnimation: React.FC<{ color: string }> = ({ color }) => (
    <svg 
        className="w-24 h-24"
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg" 
        preserveAspectRatio="xMidYMid"
    >
        <style>{`
            .steam {
                stroke: ${color};
                stroke-width: 2;
                stroke-linecap: round;
                animation: steam-animate 3s infinite ease-out;
            }
            @keyframes steam-animate {
                0% { stroke-dasharray: 0 10; transform: translateY(15px); opacity: 0; }
                20% { stroke-dasharray: 5 5; transform: translateY(5px); opacity: 1; }
                80% { stroke-dasharray: 5 5; transform: translateY(-15px); opacity: 1; }
                100% { stroke-dasharray: 0 10; transform: translateY(-25px); opacity: 0; }
            }
            .steam-1 { animation-delay: 0s; }
            .steam-2 { animation-delay: 0.5s; }
            .steam-3 { animation-delay: 1s; }
            .pot-lid { animation: lid-bounce 1.5s infinite ease-in-out; transform-origin: center; }
            @keyframes lid-bounce {
                0%, 100% { transform: translateY(0) rotate(0); }
                25% { transform: translateY(-2px) rotate(-2deg); }
                50% { transform: translateY(0) rotate(0); }
                75% { transform: translateY(-2px) rotate(2deg); }
            }
        `}</style>
        <path className="steam steam-1" d="M40 45 Q 42 35, 40 25" fill="none" />
        <path className="steam steam-2" d="M50 45 Q 52 35, 50 25" fill="none" />
        <path className="steam steam-3" d="M60 45 Q 58 35, 60 25" fill="none" />
        <path d="M20 50 H 80 V 80 A 10 10 0 0 1 70 90 H 30 A 10 10 0 0 1 20 80 Z" fill="#E5E7EB" />
        <path d="M22 55 H 78 V 80 A 8 8 0 0 1 70 88 H 30 A 8 8 0 0 1 22 80 Z" fill="#F3F4F6" />
        <circle cx="15" cy="60" r="5" fill="#D1D5DB" />
        <circle cx="85" cy="60" r="5" fill="#D1D5DB" />
        <g className="pot-lid">
            <path d="M30 48 C 30 42, 70 42, 70 48" fill="#E5E7EB" />
            <circle cx="50" cy="40" r="4" fill="#D1D5DB" />
        </g>
    </svg>
);

const WokAnimation: React.FC<{ color: string }> = ({ color }) => (
    <svg className="w-24 h-24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <style>{`
            .wok-group {
                animation: wok-toss 2.5s infinite ease-in-out;
                transform-origin: 15% 75%;
            }
            @keyframes wok-toss {
                0%, 100% { transform: rotate(0deg) translateY(0); }
                25% { transform: rotate(15deg) translateY(-8px); }
                50% { transform: rotate(-5deg); }
                75% { transform: rotate(15deg) translateY(-8px); }
            }

            .food-particle {
                animation: food-toss 2.5s infinite ease-out;
                opacity: 0;
            }
            @keyframes food-toss {
                0%, 10%, 90%, 100% { transform: translateY(0) rotate(0); opacity: 0; }
                25% { transform: translateY(-25px) rotate(90deg); opacity: 1; }
                50% { transform: translateY(-15px) rotate(180deg); opacity: 1; }
                75% { transform: translateY(-25px) rotate(270deg); opacity: 1; }
            }
            .food1 { animation-delay: 0s; }
            .food2 { animation-delay: 0.1s; }
            .food3 { animation-delay: 0.2s; }

            .flame {
                fill: ${color};
                animation: flame-flicker 1.5s infinite ease-in-out;
                transform-origin: 50% 100%;
            }
            @keyframes flame-flicker {
                0%, 100% { transform: scaleY(1) skewX(0); opacity: 0.9; }
                25% { transform: scaleY(1.2) skewX(8deg); opacity: 1; }
                50% { transform: scaleY(0.8) skewX(-8deg); opacity: 0.8; }
                75% { transform: scaleY(1.1) skewX(4deg); opacity: 1; }
            }
            .flame-1 { animation-delay: 0s; }
            .flame-2 { animation-delay: 0.2s; }
            .flame-3 { animation-delay: 0.1s; }
        `}</style>
        
        {/* Flames */}
        <g>
            <path className="flame flame-1" d="M45,95 C 40,85 50,80 50,95 Z" />
            <path className="flame flame-2" d="M50,95 C 45,80 55,75 55,95 Z" />
            <path className="flame flame-3" d="M55,95 C 50,85 60,80 60,95 Z" />
        </g>

        {/* Wok and Food */}
        <g className="wok-group">
            {/* Wok Body */}
            <path d="M25 70 C 40 90, 60 90, 75 70 L 85 60 L 15 60 Z" fill="#6B7280" />
            <path d="M28 69 C 40 85, 60 85, 72 69 L 80 62 L 20 62 Z" fill="#9CA3AF" />
            {/* Wok Handle */}
            <rect x="0" y="56" width="20" height="8" rx="4" fill="#4B5563" />
            
            {/* Food Particles */}
            <g>
                <rect className="food-particle food1" x="45" y="60" width="5" height="5" rx="2" fill="#34D399" />
                <circle className="food-particle food2" cx="55" cy="62" r="3" fill="#F87171" />
                <rect className="food-particle food3" x="60" y="58" width="6" height="4" rx="2" fill="#FBBF24" />
            </g>
        </g>
    </svg>
);


const ShakerAnimation: React.FC<{ color: string }> = ({ color }) => (
     <svg className="w-24 h-24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <style>{`
            .shaker { animation: shake 2s infinite ease-in-out; }
            .shaker-salt { transform-origin: bottom center; animation-delay: 0s; }
            .shaker-pepper { transform-origin: bottom center; animation-delay: -1s; }
            @keyframes shake {
                0%, 100% { transform: translateX(0) rotate(0); }
                25% { transform: translateX(-2px) rotate(-5deg); }
                75% { transform: translateX(2px) rotate(5deg); }
            }
            .particle { fill: ${color}; animation: fall 2s infinite linear; opacity: 0; }
            @keyframes fall {
                0% { transform: translateY(0); opacity: 0; }
                20% { opacity: 1; }
                80% { transform: translateY(20px); opacity: 1; }
                100% { transform: translateY(25px); opacity: 0; }
            }
            .p1 { animation-delay: 0.1s; } .p2 { animation-delay: 0.6s; } .p3 { animation-delay: 1.1s; }
            .p4 { animation-delay: 1.6s; } .p5 { animation-delay: 0.3s; } .p6 { animation-delay: 1.3s; }
        `}</style>
        {/* Salt Shaker */}
        <g className="shaker shaker-salt" transform="translateX(-15)">
            <rect x="25" y="40" width="20" height="35" rx="5" fill="#F3F4F6" />
            <rect x="25" y="35" width="20" height="5" rx="2" fill="#D1D5DB" />
            <circle className="particle p1" cx="35" cy="45" r="1.5" />
            <circle className="particle p2" cx="32" cy="45" r="1.5" />
            <circle className="particle p3" cx="38" cy="45" r="1.5" />
        </g>
        {/* Pepper Shaker */}
        <g className="shaker shaker-pepper" transform="translateX(15)">
            <rect x="55" y="40" width="20" height="35" rx="5" fill="#E5E7EB" />
            <rect x="55" y="35" width="20" height="5" rx="2" fill="#9CA3AF" />
            <circle className="particle p4" cx="65" cy="45" r="1.5" />
            <circle className="particle p5" cx="62" cy="45" r="1.5" />
            <circle className="particle p6" cx="68" cy="45" r="1.5" />
        </g>
    </svg>
);


export const Loader: React.FC<LoaderProps> = ({ isWhite = false }) => {
    const steamColor = isWhite ? '#FFFFFF' : '#F97316';
    const [animationIndex, setAnimationIndex] = useState(0);

    const animations = [
        <PotAnimation color={steamColor} />,
        <WokAnimation color={steamColor} />,
        <ShakerAnimation color={steamColor} />
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimationIndex(prevIndex => (prevIndex + 1) % animations.length);
        }, 3000); // Rotate animation every 3 seconds

        return () => clearInterval(interval);
    }, [animations.length]);

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="transition-opacity duration-500">
                {animations[animationIndex]}
            </div>
        </div>
    );
};