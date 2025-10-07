
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader } from './Loader';

interface CameraModalProps {
    onCapture: (dataUrl: string) => void;
    onClose: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const startStream = useCallback(async (mode: 'environment' | 'user') => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setIsLoading(true);
        setError(null);
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: mode }
            });
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
                await videoRef.current.play();
            }
        } catch (err) {
            setError('Could not access the camera. Please check permissions.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [stream]);

    useEffect(() => {
        startStream(facingMode);
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
                onCapture(dataUrl);
            }
        }
    };

    const handleSwitchCamera = () => {
        setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex justify-center items-center">
            <video ref={videoRef} className={`w-full h-full object-cover ${isLoading ? 'hidden' : ''}`} playsInline />
            <canvas ref={canvasRef} className="hidden" />
            
            {isLoading && <div className="text-white flex flex-col items-center"><Loader isWhite={true} /><p className="mt-4">Starting camera...</p></div>}
            {error && <p className="text-white text-center p-4">{error}</p>}
            
            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/70 to-transparent flex justify-around items-center">
                <button onClick={onClose} className="text-white font-semibold text-lg">Cancel</button>
                <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-lg ring-4 ring-black/30" aria-label="Capture photo"></button>
                <button onClick={handleSwitchCamera} className="text-white font-semibold text-lg">Flip</button>
            </div>
        </div>
    );
};
