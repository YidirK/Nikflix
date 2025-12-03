import React, { useEffect } from 'react';
import { useNavigate } from "react-router-dom";

const LoadingSpinner = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const browserLang = navigator.language || navigator.languages?.[0] || 'en';
        const isFrench = browserLang.toLowerCase().startsWith('fr');
        const timer = setTimeout(() => {
            if (isFrench) {
                navigate("/fr");
            } else {
                navigate("/en");
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div
            className="flex flex-col items-center justify-center h-screen bg-back"
            role="status"
            aria-live="polite"
        >
            <img
                src="/Nikflix-64.png"
                alt="Loading..."
                className="animate-spin h-20 w-20 mb-4"
            />
            <p className="text-first text-lg animate-pulse">
                Checking your preferences...
            </p>
        </div>
    );
};

export default LoadingSpinner;