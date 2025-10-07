import React, { useState, useRef } from 'react';
import { CameraModal } from './CameraModal';

interface ImageHandlerProps {
    imageBase64: string | null;
    onImageSelect: (base64: string) => void;
    onReset: () => void;
}

const UploadButton: React.FC<{ children: React.ReactNode; onClick?: () => void; htmlFor?: string }> = ({ children, onClick, htmlFor }) => {
    const commonProps = {
        className: "flex flex-col items-center justify-center flex-1 rounded-2xl bg-orange-50 border-2 border-dashed border-orange-200 p-6 text-orange-800 font-semibold cursor-pointer text-center transition-all duration-300 hover:bg-orange-100 hover:scale-105 hover:shadow-lg hover:border-solid",
        onClick: onClick
    };
    if (htmlFor) {
        return <label htmlFor={htmlFor} {...commonProps}>{children}</label>;
    }
    return <button type="button" {...commonProps}>{children}</button>;
};

export const ImageHandler: React.FC<ImageHandlerProps> = ({ imageBase64, onImageSelect, onReset }) => {
    const [showCamera, setShowCamera] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                onImageSelect(result.split(',')[1]);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleImageCapture = (dataUrl: string) => {
        onImageSelect(dataUrl.split(',')[1]);
        setShowCamera(false);
    };

    if (imageBase64) {
        return (
            <div className="relative group">
                <img src={`data:image/jpeg;base64,${imageBase64}`} className="rounded-2xl w-full h-auto max-h-80 object-contain shadow-md" alt="Vista previa" />
                <button 
                    onClick={onReset} 
                    className="absolute top-3 right-3 bg-black bg-opacity-40 text-white rounded-full p-2 hover:bg-opacity-70 transition-all scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Change photo"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="text-center text-gray-600">
                <p className="font-bold text-xl text-gray-800">Sube una foto de tu comida</p>
                <p className="text-sm mt-1">Descubre la receta secreta en un instante.</p>
            </div>
            <div className="flex gap-4">
                <UploadButton onClick={() => setShowCamera(true)}>
                    <svg className="w-10 h-10 mx-auto mb-2 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
                    Usar Cámara
                </UploadButton>
                <UploadButton htmlFor="file-input">
                     <svg className="w-10 h-10 mx-auto mb-2 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                    Subir Archivo
                </UploadButton>
            </div>
            <input id="file-input" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
             {showCamera && (
                <CameraModal
                    onCapture={handleImageCapture}
                    onClose={() => setShowCamera(false)}
                />
            )}
        </div>
    );
};