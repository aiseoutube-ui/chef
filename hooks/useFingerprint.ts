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
                // The FingerprintJS object is now guaranteed to exist here
                const fp = await window.FingerprintJS.load();
                const result = await fp.get();
                setVisitorId(result.visitorId);
            } catch (error) {
                console.error("FingerprintJS execution error:", error);
                // Fallback to a simple session identifier if execution fails
                setVisitorId('temp_user_' + Date.now());
            }
        };

        // This function will wait for the FingerprintJS script to be loaded
        const waitForFingerprint = () => {
            // Check if the script is already available
            if (window.FingerprintJS) {
                getVisitorId();
            } else {
                // If not, poll every 100ms to see if it has loaded
                let attempts = 0;
                const interval = setInterval(() => {
                    attempts++;
                    if (window.FingerprintJS) {
                        clearInterval(interval);
                        getVisitorId();
                    } else if (attempts > 50) { // Stop trying after 5 seconds
                        clearInterval(interval);
                        console.error("FingerprintJS script did not load after 5 seconds. It might be blocked by an ad-blocker.");
                        setVisitorId('temp_user_' + Date.now()); // Use fallback
                    }
                }, 100);
            }
        };
        
        waitForFingerprint();

    }, []);

    return visitorId;
};