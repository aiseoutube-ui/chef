import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="bg-brand-orange text-white p-6 pt-8 rounded-t-3xl shadow-lg relative z-10 overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-20px] left-[-30px] w-24 h-24 bg-white/10 rounded-full" aria-hidden="true"></div>
            <div className="absolute top-[50px] right-[-40px] w-32 h-32 bg-white/10 rounded-full" aria-hidden="true"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute w-40 h-40 text-white/5 right-5 top-10 transform -rotate-12" fill="none" viewBox="0 0 64 64" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M32 12 C 18 12 10 24 10 32 L 54 32 C 54 24 46 12 32 12 Z M 8 34 L 56 34 M 30 8 A 2 2 0 0 1 34 8 L 34 12 L 30 12 Z" />
            </svg>
            
            <div className="relative z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                         <button aria-label="Menu" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div>
                            <p className="text-sm text-white/70">Welcome</p>
                            <p className="font-semibold text-white">Guest</p>
                        </div>
                    </div>

                    <button aria-label="Notifications" className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-brand-orange"></span>
                    </button>
                </div>
                 <div className="text-center my-4">
                     <h1 className="text-4xl font-extrabold tracking-tighter">CusiCusa</h1>
                     <p className="text-xl font-semibold text-amber-200 -mt-1">Food AI</p>
                </div>
            </div>
        </header>
    );
};
