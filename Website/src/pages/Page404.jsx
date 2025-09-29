import React from 'react';
import {useNavigate} from "react-router-dom";

const Page404 = () => {
    const Navigate = useNavigate()
    return (
        <div className="min-h-screen bg-back flex items-center justify-center p-4">
            <div className="w-full max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="text-first space-y-6">
                        <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                            Something went wrong
                        </h1>

                        <div className="space-y-4 text-lg lg:text-xl">
                            <p>Sorry, we couldn't find the page you were looking for.</p>
                        </div>

                        <button className="border-2 border-first text-first px-8 py-3 text-lg font-medium hover:bg-first hover:text-back transition-colors duration-200 mt-8" onClick={()=> Navigate("/")} >
                            GO HOME
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page404;