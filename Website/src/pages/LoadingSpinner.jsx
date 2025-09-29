import React, {useEffect} from 'react';
import { useNavigate} from "react-router-dom";

const LoadingSpinner = () => {
const Navigate = useNavigate()

    useEffect(() => {
        const browserLang = navigator.language || navigator.languages[0];

        if(browserLang === "fr-FR"){
            Navigate("/fr")
        }else{
            Navigate("/en")
        }
    }, []);

    return (
        <div className={`flex flex-col items-center justify-center h-screen`} role="status" aria-live="polite">

            <img src={"/Nikflix-64.png"} className="animate-spin  h-20 w-20   mb-4"/>
            <p className="text-first text-lg animate-pulse">We are checking your browser</p>

        </div>
    );
};

export default LoadingSpinner;