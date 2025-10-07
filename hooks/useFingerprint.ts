
import { useState, useEffect } from 'react';

declare global {
    interface Window {
        FingerprintJS: any;
    }
}

export const useFingerprint = () => {
    const [visitorId, setVisitorId] = useState<string | null>(null);

    useEffect(() => {
        const getVisitorId = async () => {
            try {
                const fp = await window.FingerprintJS.load();
                const result = await fp.get();
                setVisitorId(result.visitorId);
            } catch (error) {
                console.error("FingerprintJS error:", error);
                // Fallback to a simple session identifier
                setVisitorId('temp_user_' + Date.now());
            }
        };

        if (window.FingerprintJS) {
            getVisitorId();
        } else {
             console.error("FingerprintJS script not loaded");
        }
    }, []);

    return visitorId;
};
