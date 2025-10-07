import { useState, useEffect } from 'react';
import type { LocationCoords } from '../types';

export const useLocation = () => {
    const [location, setLocation] = useState<LocationCoords | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("La geolocalización no es compatible con este navegador.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setError(null);
                setLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
            },
            (err) => {
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError("Permiso de ubicación denegado.");
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError("Información de ubicación no disponible.");
                        break;
                    case err.TIMEOUT:
                        setError("La solicitud de ubicación expiró.");
                        break;
                    default:
                        setError("No se pudo obtener la ubicación.");
                        break;
                }
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, []);

    return { location, error };
};
