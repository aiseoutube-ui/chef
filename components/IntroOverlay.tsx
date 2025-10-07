
import React from 'react';

interface IntroOverlayProps {
    show: boolean;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ show }) => {
    return (
        <div
            className={`fixed inset-0 bg-gradient-to-br from-orange-400 to-amber-500 flex flex-col justify-center items-center z-50 transition-opacity duration-1000 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            <img 
                src="https://yt3.googleusercontent.com/UpzZjCNpkV7xb49ViYY2hDoTcyjf8Jo8NUBftU8qKgELba-leKetstmtqGTnwnk6KNUzK61PJg=s160-c-k-c0x00ffffff-no-rj" 
                alt="CusiCusa Logo" 
                className="w-32 h-32 rounded-full shadow-2xl mb-8 animate-logoFloat" 
            />
            <h1 className="text-white font-sans text-5xl font-extrabold tracking-tight animate-textFadeIn">CusiCusa</h1>
            <p className="text-white/90 text-xl mt-4 animate-subtitleFadeIn">Food AI</p>
            <style>{`
                @keyframes logoFloat {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                @keyframes textFadeIn {
                    0% { opacity: 0; transform: translateY(30px); }
                    100% { opacity: 1; transform: translateY(0px); }
                }
                @keyframes subtitleFadeIn {
                    0% { opacity: 0; transform: translateY(20px); }
                    50% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0px); }
                }
                .animate-slideIn { animation: slideIn 1s ease-out; }
                @keyframes slideIn {
                    0% { opacity: 0; transform: translateY(50px); }
                    100% { opacity: 1; transform: translateY(0px); }
                }
            `}</style>
        </div>
    );
};
