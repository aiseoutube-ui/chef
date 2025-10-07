import React from 'react';
import type { LocationCoords } from '../types';

interface LocationStatusProps {
    location: LocationCoords | null;
    error: string | null;
}

export const LocationStatus: React.FC<LocationStatusProps> = ({ location, error }) => {
    let statusText = "Obteniendo ubicación para precios locales...";
    let icon = '🔄';
    let textColor = "text-gray-500";

    if (location) {
        statusText = "Ubicación obtenida";
        icon = '✅';
        textColor = "text-green-600";
    } else if (error) {
        statusText = error;
        icon = '⚠️';
        textColor = "text-amber-600";
    }

    return (
        <div className={`text-center font-medium text-xs ${textColor} flex items-center justify-center gap-1.5`} title={statusText}>
            <span className="mr-1">{icon}</span>
            <span className="truncate">{statusText}</span>
        </div>
    );
};
