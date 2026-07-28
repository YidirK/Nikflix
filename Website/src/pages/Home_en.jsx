import React, { useState, useEffect } from 'react';
import { Download, Chrome, Github, Heart, ChevronDown, ShieldQuestionMark, Users, TrendingUp, Star, GitBranch } from "lucide-react";

function Home_en() {
    const [openItems, setOpenItems] = useState(new Set());
    const [userCount, setUserCount] = useState(0);

    // Animation du compteur d'utilisateurs
    useEffect(() => {
        const targetCount = 50000;
        const duration = 2000; // 2 secondes
        const steps = 60;
        const increment = targetCount / steps;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            if (currentStep <= steps) {
                setUserCount(Math.floor(increment * currentStep));
            } else {
                setUserCount(targetCount);
                clearInterval(timer);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, []);

    const toggleItem = (index) => {
        const newOpenItems = new Set(openItems);
        if (newOpenItems.has(index)) {
            newOpenItems.delete(index);
        } else {
            newOpenItems.add(index);
        }
        setOpenItems(newOpenItems);
    };

    const faqData = [
        {
            question: "Is it legal to use this extension?",
            answer: "We designed this extension to be as legal as possible. It only modifies the content sent by Netflix, which is legal. However, we are not responsible for any consequences that may occur from its use."
        },
        {
            question: "Is the extension free?",
            answer: "Yes! We know times are tough, especially for students. This extension is completely free. However, if you want to support its development, you can make a donation."
        },
        {
            question: "Is the extension open source?",
            answer: "Yes, the extension is open source. The code is available on GitHub, allowing everyone to review it and understand how it works."
        },
        {
            question: "What should I do if I encounter a bug?",
            answer: "A special button in the extension pop-up allows you to restart it to fix most bugs. If that doesn't work, you can contact us by email or create an issue on GitHub."
        },
        {
            question: "Netflix says my device is not part of the household, what should I do?",
            answer: "That's exactly why Nikflix exists! Install the extension on your Chrome, Firefox, Edge, or any Chromium-based browser, and you'll be able to watch Netflix without this restriction."
        },
        {
            question: "Does the extension work on all browsers?",
            answer: "Nikflix works on Chrome, Firefox, Edge, Brave, Opera, and all Chromium-based browsers. It's available on the Chrome Web Store and Mozilla Add-ons Store."
        },
        {
            question: "Can I use Netflix at a friend's house with this extension?",
            answer: "Yes! With Nikflix, you can watch Netflix anywhere: at friends' places, on vacation, or on any WiFi network without being blocked by the household restriction."
        },
        {
            question: "Will my Netflix account be banned?",
            answer: "The extension only modifies what your browser sends to Netflix, without touching your account. We have thousands of active users for months without any reported issues."
        },
        {
            question: "Does the extension slow down Netflix?",
            answer: "No, Nikflix is optimized to not affect performance. You can watch your shows and movies in streaming without any slowdown."
        },
        {
            question: "How do I install Nikflix?",
            answer: "It's very simple! Click on the 'Chrome Store' or 'Mozilla Store' button at the top of this page, then click 'Add to Chrome/Firefox'. The extension installs automatically in a few seconds."
        },
        {
            question: "Can I share my Netflix account with my family in another city?",
            answer: "Yes, with Nikflix, your family members can use your Netflix account even if they live in another city or country, without being blocked by the household restriction."
        },
        {
            question: "Is the extension safe? Does it steal my data?",
            answer: "Nikflix is 100% open source, which means anyone can review the code and verify that it doesn't collect any personal data. We respect your privacy and collect nothing."
        }
    ];

    const changelogData = [
        {
            version: "1.8.9",
            date: "FEBRUARY 2026",
            changes: [
                "Add autoplay next episode option for chrome not yet for Firefox",
                "add fullscreen (F) and mute (M) keyboard shortcuts",
                "hide restriction screens via CSS and prevent video pause",
                "fix: clicks not working in homepage",
                "Update: Switched to a custom license prohibiting redistribution."

            ]
        }
    ];

    const contributors = [
        { name: "YidirK", role: "creator/maintainer", github: "YidirK" },
        { name: "Alexander Jensen", role: "Dev", github: "Ajexsen" },
        { name: "variableninja", role: "Dev", github: "variableninja" },
        { name: "Nanika", role: "Dev", github: "bhhoang" },
        { name: "Michael Yan Petra", role: "Dev", github: "myanpetra99" },
        { name: "ibanfernandez", role: "Dev", github: "ibanfernandez" },
        { name: "IshaanM8", role: "Dev", github: "IshaanM8" },
        { name: "vinodhelambe", role: "Dev", github: "vinodhelambe" },
        { name: "Yorcal", role: "Dev", github: "Yorcal" },
        { name: "LemonPho", role: "Dev", github: "LemonPho" },
    ];

    return (
        <>
            {/* SEO Meta Tags - To add in your document's head */}
            <title>How to Watch Netflix Without Household Restriction? Free Nikflix Extension</title>
            <meta name="description" content="Your device is not part of the Netflix household? Nikflix is the free and open-source extension to bypass Netflix restrictions. Compatible with Chrome, Firefox, Edge. Over 50,000 satisfied users." />
            <meta name="keywords" content="nikflix, netflix says not part of household, how to bypass netflix restriction, netflix household error, device not recognized netflix, netflix blocks me outside household, share netflix account with friends, netflix multiple addresses, free netflix extension, is it legal to bypass netflix, open source netflix extension, how to watch netflix at friend's house, netflix geographic restriction, unlock netflix everywhere, watch netflix on vacation, netflix multiple households, netflix household solution, bypass netflix household, chrome extension netflix, firefox addon netflix, chromium extension netflix, edge extension netflix, brave netflix extension, opera netflix addon, 50000 nikflix users, netflix without device restriction, how to use netflix outside home, legal netflix account sharing, free extension for netflix, open source code netflix, github extension netflix, netflix household problem, netflix device error, netflix household message, easy netflix bypass, netflix multiple wifi, watch netflix anywhere for free" />
            <meta property="og:title" content="Nikflix - How to Watch Netflix Without Household Restriction" />
            <meta property="og:description" content="Free extension to bypass Netflix household restrictions. Over 50K users. Open source and compatible with all browsers." />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://nikflix.com" />
            <meta property="og:image" content="https://nikflix.com/og-image.png" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Nikflix - Free Extension for Netflix" />
            <meta name="twitter:description" content="Easily bypass Netflix household restrictions with our open source extension" />
            <meta name="twitter:image" content="https://nikflix.com/twitter-image.png" />
            <link rel="canonical" href="https://nikflix.com" />

            {/* FAQ Schema for SEO */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": [
                        {
                            "@type": "Question",
                            "name": "Is it legal to use Nikflix to bypass Netflix restrictions?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Nikflix only modifies the content sent by Netflix, which is legal. However, we are not responsible for any consequences that may occur from its use."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "Is the Nikflix extension free?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Yes! Nikflix is completely free. If you want to support its development, you can make a donation."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "Is the Nikflix extension open source?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Yes, the Nikflix code is available on GitHub, allowing anyone to review it and understand how it works."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "What should I do if I have a bug with Nikflix?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "A special button in the extension pop-up allows you to restart it to fix most bugs. Otherwise, contact us by email or create an issue on GitHub."
                            }
                        }
                    ]
                })}
            </script>

            {/* Organization Schema */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "Nikflix",
                    "applicationCategory": "BrowserExtension",
                    "operatingSystem": "Chrome, Firefox, Edge, Brave, Opera",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "USD"
                    },
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": "4.8",
                        "ratingCount": "50000"
                    },
                    "description": "Free and open-source extension to bypass Netflix household restrictions"
                })}
            </script>

            <div className="navbar bg-first sticky top-0 z-20">
                <div className="navbar-start">
                    <div className="dropdown">
                        <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden text-back">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h8m-8 6h16" />
                            </svg>
                        </div>
                        <ul
                            tabIndex={0}
                            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
                            <li><a onClick={() => window.open("https://github.com/YidirK/Nikflix", "_blank")}>Source Code</a></li>
                            <li>
                                <a>Download</a>
                                <ul className="p-2">
                                    <li>
                                        <button
                                            onClick={() => window.open("https://chromewebstore.google.com/detail/nikflix/knjoabokknkpkhbbdclmnjcoeedmgema?hl=en-GB&authuser=0", "_blank")}
                                            className="group bg-first text-back px-2 py-1 mb-3 font-medium hover:bg-back hover:text-first rounded-xl transition-all duration-300 flex items-center justify-center gap-3 border border-first">
                                            <Chrome size={20} />
                                            <span>Chrome Store</span>
                                            <Download size={16}
                                                      className="group-hover:translate-y-0.5 transition-transform" />
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => window.open("https://addons.mozilla.org/fr/firefox/addon/nikflix/", "_blank")}
                                            className="group bg-transparent px-2 py-1 border border-first text-first font-bold rounded-xl hover:bg-first hover:text-back transition-all duration-300 flex items-center justify-center gap-3"
                                        >
                                            <div
                                                className="w-5 h-5 rounded flex items-center justify-center group-hover:text-white transition-colors"
                                            >
                                                <svg
                                                    height="20px"
                                                    width="20px"
                                                    viewBox="0 0 512 512"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="currentColor"
                                                    className="transition-colors duration-300"
                                                >
                                                    <path
                                                        d="M455.576,89.903c-23.871-26.416-50.311-39.43-72.616-35.73c-52.037,8.673-96.363-17.296-96.803-17.556 c-3.435-2.038-7.78-1.704-10.821,0.861c-3.054,2.551-4.171,6.754-2.775,10.482c28.803,76.801,58.938,88.822,104.56,107.019 l3.897,1.557c16.398,6.557,25.735,13.179,27.754,19.681c2.367,7.62-4.629,19.026-13.316,32.054 c-13.458,20.183-18.01,48.391-19.548,65.444l-5.967-2.986c-4.025-2.015-8.778-0.769-11.517,2.793 c-2.738,3.553-2.459,8.673,0.508,12.034c0.288,0.33,2.77,3.334,1.639,8.499c-1.287,5.907-9.222,21.833-54.904,42.137 c-45.407,20.185-75.547,8.068-92.613-5.248c40.154,3.251,58.604-16.174,64.809-24.874l33.89-8.481 c3.095-0.769,5.586-3.068,6.608-6.099c1.021-3.022,0.435-6.356-1.561-8.856c-21.279-26.605-28.752-32.31-47.751-22.566 c-7.528,3.846-18.912,9.671-43.974,9.671c-15.042,0-25.158-3.764-30.07-11.173c-6.627-10.01-3.784-26.156-0.816-35.817 c40.264-1.273,40.264-14.246,40.264-18.655c0-6.861-4.346-12.808-9.456-17.433c17.602-9.434,36.3-23.01,34.302-37.393 c-1.959-14.09-19.713-18.22-32.896-20.102c-13.435-1.923-22.241-5.811-23.551-10.413c-2.038-7.154,9.639-21.661,18.857-29.375 c2.605-2.184,3.828-5.605,3.196-8.943c-0.632-3.338-3.018-6.077-6.241-7.153c-25.72-8.563-50.26,7.894-60.672,16.412 c-13.519-4.451-35.823-1.795-51.714,1.098L81.658,66.171c-2.442-2.445-6.05-3.343-9.347-2.344 c-3.311,1.003-5.802,3.746-6.478,7.134l-8.885,44.413c-5.353,6.112-21.525,25.043-27.823,37.636 C17.136,176.99,1.119,227.26,0.441,229.388c-1.309,4.121,0.371,8.599,4.066,10.853c3.7,2.253,8.448,1.676,11.504-1.383 l8.118-8.119c-2.317,29.045-0.678,75.487,23.999,118.677c39.463,69.063,89.311,117.025,204.303,126.604 c5.532,0.467,11.022,0.687,16.48,0.687c114.094,0,210.792-98.378,237.177-195.126C525.632,209.919,493.605,131.986,455.576,89.903z"></path>
                                                </svg>
                                            </div>

                                            <span>Mozilla Store</span>
                                            <Download
                                                size={16}
                                                className="group-hover:translate-y-0.5 transition-transform"
                                            />
                                        </button>
                                    </li>
                                </ul>
                            </li>
                            <li><a href="#changelog">Changelog</a></li>
                            <li><a href="#faq">FAQ</a></li>
                        </ul>
                    </div>
                    <a className="btn btn-ghost text-xl text-back">Nikflix</a>
                </div>
                <div className="navbar-center hidden lg:flex">
                    <ul className="menu menu-horizontal px-1 text-back ">
                        <li><a onClick={() => window.open("https://github.com/YidirK/Nikflix", "_blank")} className={'font-semibold'}>Source Code</a></li>
                        <li>
                            <details>
                                <summary className={"font-semibold"}>Download</summary>
                                <ul className="p-2">
                                    <li>
                                        <button
                                            onClick={() => window.open("https://chromewebstore.google.com/detail/nikflix/knjoabokknkpkhbbdclmnjcoeedmgema?hl=en-GB&authuser=0", "_blank")}
                                            className="group bg-first text-back px-2 py-1 mb-3 font-medium hover:bg-back hover:text-first rounded-xl transition-all duration-300 flex items-center justify-center gap-3 border border-first">
                                            <Chrome size={20} />
                                            <span>Chrome Store</span>
                                            <Download size={16}
                                                      className="group-hover:translate-y-0.5 transition-transform" />
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => window.open("https://addons.mozilla.org/fr/firefox/addon/nikflix/", "_blank")}
                                            className="group bg-transparent border border-first text-first font-bold px-2 py-1 mb-2 rounded-xl hover:bg-first hover:text-back transition-all duration-300 flex items-center justify-center gap-3"
                                        >
                                            <div
                                                className="w-5 h-5 rounded flex items-center justify-center group-hover:text-white transition-colors"
                                            >
                                                <svg
                                                    height="20px"
                                                    width="20px"
                                                    viewBox="0 0 512 512"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="currentColor"
                                                    className="transition-colors duration-300"
                                                >
                                                    <path
                                                        d="M455.576,89.903c-23.871-26.416-50.311-39.43-72.616-35.73c-52.037,8.673-96.363-17.296-96.803-17.556 c-3.435-2.038-7.78-1.704-10.821,0.861c-3.054,2.551-4.171,6.754-2.775,10.482c28.803,76.801,58.938,88.822,104.56,107.019 l3.897,1.557c16.398,6.557,25.735,13.179,27.754,19.681c2.367,7.62-4.629,19.026-13.316,32.054 c-13.458,20.183-18.01,48.391-19.548,65.444l-5.967-2.986c-4.025-2.015-8.778-0.769-11.517,2.793 c-2.738,3.553-2.459,8.673,0.508,12.034c0.288,0.33,2.77,3.334,1.639,8.499c-1.287,5.907-9.222,21.833-54.904,42.137 c-45.407,20.185-75.547,8.068-92.613-5.248c40.154,3.251,58.604-16.174,64.809-24.874l33.89-8.481 c3.095-0.769,5.586-3.068,6.608-6.099c1.021-3.022,0.435-6.356-1.561-8.856c-21.279-26.605-28.752-32.31-47.751-22.566 c-7.528,3.846-18.912,9.671-43.974,9.671c-15.042,0-25.158-3.764-30.07-11.173c-6.627-10.01-3.784-26.156-0.816-35.817 c40.264-1.273,40.264-14.246,40.264-18.655c0-6.861-4.346-12.808-9.456-17.433c17.602-9.434,36.3-23.01,34.302-37.393 c-1.959-14.09-19.713-18.22-32.896-20.102c-13.435-1.923-22.241-5.811-23.551-10.413c-2.038-7.154,9.639-21.661,18.857-29.375 c2.605-2.184,3.828-5.605,3.196-8.943c-0.632-3.338-3.018-6.077-6.241-7.153c-25.72-8.563-50.26,7.894-60.672,16.412 c-13.519-4.451-35.823-1.795-51.714,1.098L81.658,66.171c-2.442-2.445-6.05-3.343-9.347-2.344 c-3.311,1.003-5.802,3.746-6.478,7.134l-8.885,44.413c-5.353,6.112-21.525,25.043-27.823,37.636 C17.136,176.99,1.119,227.26,0.441,229.388c-1.309,4.121,0.371,8.599,4.066,10.853c3.7,2.253,8.448,1.676,11.504-1.383 l8.118-8.119c-2.317,29.045-0.678,75.487,23.999,118.677c39.463,69.063,89.311,117.025,204.303,126.604 c5.532,0.467,11.022,0.687,16.48,0.687c114.094,0,210.792-98.378,237.177-195.126C525.632,209.919,493.605,131.986,455.576,89.903z"></path>
                                                </svg>
                                            </div>

                                            <span>Mozilla Store</span>
                                            <Download
                                                size={16}
                                                className="group-hover:translate-y-0.5 transition-transform"
                                            />
                                        </button>
                                    </li>
                                </ul>
                            </details>
                        </li>
                        <li><a href="#changelog" className={"font-semibold"}>Changelog</a></li>
                        <li><a href="#faq" className={"font-semibold"}>FAQ</a></li>
                    </ul>
                </div>
                <div className="navbar-end">
                    <button className="btn bg-back text-first hover:text-white rounded-xl gap-2 hover:bg-first"
                            onClick={() => window.open("https://ko-fi.com/yidirk", '_blank')}>
                        <Heart /> Donate
                    </button>
                </div>
            </div>

            <div className="min-h-screen bg-back text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-15">
                    <div
                        className="absolute top-1/4 left-1/4 w-96 h-96 border border-first border-4 rounded-full animate-pulse"></div>
                    <div
                        className="absolute bottom-1/4 right-1/4 w-64 h-64 border border-first border-4 rounded-full animate-pulse animation-delay-2000"></div>
                    <div
                        className="absolute top-1/2 left-1/2  border-4 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-first rounded-full animate-pulse animation-delay-4000"></div>
                </div>
                <div className="container mx-auto px-4 py-12 lg:py-24 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                        <div className="order-2 lg:order-1 text-center lg:text-left">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light mb-6 lg:mb-8 tracking-tight text-first ">
                                <span className="block font-bold">Your device is not part of the Netflix Household for this account?</span>
                            </h1>

                            <p className="text-lg sm:text-xl text-first leading-relaxed mb-8 lg:mb-12 max-w-md mx-auto lg:mx-0">
                                No problem! Our extension <span className={"font-bold"}>Nikflix</span>,
                                available for free on the Chrome Web Store and Firefox Add-ons Store, works on all Chromium-based browsers as well as Firefox. It is open source,
                                which means anyone can view its code and verify how it works.
                                With <span className={"font-bold"}>Nikflix</span>,
                                you can bypass this limitation and watch Netflix like before.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 mb-8 justify-center lg:justify-start">
                                <button
                                    onClick={() => window.open("https://chromewebstore.google.com/detail/nikflix/knjoabokknkpkhbbdclmnjcoeedmgema?hl=en-GB&authuser=0", "_blank")}
                                    className="group bg-first text-back px-4 py-3 font-medium hover:bg-back hover:text-first rounded-xl transition-all duration-300 flex items-center justify-center gap-3 border border-first">
                                    <Chrome size={20} />
                                    <span>Chrome Store</span>
                                    <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
                                </button>

                                <button
                                    onClick={() => window.open("https://addons.mozilla.org/fr/firefox/addon/nikflix/", "_blank")}
                                    className="group bg-transparent border border-first text-first font-bold px-4 py-3 rounded-xl hover:bg-first hover:text-back transition-all duration-300 flex items-center justify-center gap-3"
                                >
                                    <div
                                        className="w-5 h-5 rounded flex items-center justify-center group-hover:text-white transition-colors"
                                    >
                                        <svg
                                            height="20px"
                                            width="20px"
                                            viewBox="0 0 512 512"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="currentColor"
                                            className="transition-colors duration-300"
                                        >
                                            <path
                                                d="M455.576,89.903c-23.871-26.416-50.311-39.43-72.616-35.73c-52.037,8.673-96.363-17.296-96.803-17.556 c-3.435-2.038-7.78-1.704-10.821,0.861c-3.054,2.551-4.171,6.754-2.775,10.482c28.803,76.801,58.938,88.822,104.56,107.019 l3.897,1.557c16.398,6.557,25.735,13.179,27.754,19.681c2.367,7.62-4.629,19.026-13.316,32.054 c-13.458,20.183-18.01,48.391-19.548,65.444l-5.967-2.986c-4.025-2.015-8.778-0.769-11.517,2.793 c-2.738,3.553-2.459,8.673,0.508,12.034c0.288,0.33,2.77,3.334,1.639,8.499c-1.287,5.907-9.222,21.833-54.904,42.137 c-45.407,20.185-75.547,8.068-92.613-5.248c40.154,3.251,58.604-16.174,64.809-24.874l33.89-8.481 c3.095-0.769,5.586-3.068,6.608-6.099c1.021-3.022,0.435-6.356-1.561-8.856c-21.279-26.605-28.752-32.31-47.751-22.566 c-7.528,3.846-18.912,9.671-43.974,9.671c-15.042,0-25.158-3.764-30.07-11.173c-6.627-10.01-3.784-26.156-0.816-35.817 c40.264-1.273,40.264-14.246,40.264-18.655c0-6.861-4.346-12.808-9.456-17.433c17.602-9.434,36.3-23.01,34.302-37.393 c-1.959-14.09-19.713-18.22-32.896-20.102c-13.435-1.923-22.241-5.811-23.551-10.413c-2.038-7.154,9.639-21.661,18.857-29.375 c2.605-2.184,3.828-5.605,3.196-8.943c-0.632-3.338-3.018-6.077-6.241-7.153c-25.72-8.563-50.26,7.894-60.672,16.412 c-13.519-4.451-35.823-1.795-51.714,1.098L81.658,66.171c-2.442-2.445-6.05-3.343-9.347-2.344 c-3.311,1.003-5.802,3.746-6.478,7.134l-8.885,44.413c-5.353,6.112-21.525,25.043-27.823,37.636 C17.136,176.99,1.119,227.26,0.441,229.388c-1.309,4.121,0.371,8.599,4.066,10.853c3.7,2.253,8.448,1.676,11.504-1.383 l8.118-8.119c-2.317,29.045-0.678,75.487,23.999,118.677c39.463,69.063,89.311,117.025,204.303,126.604 c5.532,0.467,11.022,0.687,16.48,0.687c114.094,0,210.792-98.378,237.177-195.126C525.632,209.919,493.605,131.986,455.576,89.903z"></path>
                                        </svg>
                                    </div>

                                    <span>Mozilla Store</span>
                                    <Download
                                        size={16}
                                        className="group-hover:translate-y-0.5 transition-transform"
                                    />
                                </button>

                                <button
                                    onClick={() => window.open("https://github.com/YidirK/Nikflix", "_blank")}
                                    className="group bg-first text-back px-4 py-3 font-medium hover:bg-back hover:text-first rounded-xl transition-all duration-300 flex items-center justify-center gap-3 border border-first">
                                    <Github size={20} />
                                    <span>Source code</span>
                                </button>
                            </div>

                        </div>

                        <div className="order-1 lg:order-2">
                            <div
                                className="bg-gray-900 border border-gray-800 rounded-lg shadow-2xl max-w-2xl mx-auto rounded-xl">
                                <div className="bg-gray-800 px-4 py-3 rounded-t-lg border-b border-gray-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                    </div>
                                    <div className="bg-gray-700 text-white text-sm px-3 py-1 rounded text-center">
                                        https://www.netflix.com/browse
                                    </div>
                                </div>

                                <div
                                    className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden rounded-xl">
                                    <img
                                        className="w-full h-full object-cover  rounded-b-xl"
                                        src="/bg-en.png"
                                        alt="Netflix Preview - Nikflix Extension to bypass restrictions"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Section with animation */}
            <section className="py-16 bg-back">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-8 bg-back border border-first rounded-xl hover:scale-105 transition-transform duration-300">
                            <Users className="w-12 h-12 text-first mx-auto mb-4" />
                            <div className="text-5xl font-bold text-first mb-2">
                                {userCount.toLocaleString('en-US')}+
                            </div>
                            <div className="text-first text-lg">Active Users</div>
                        </div>

                        <div className="text-center p-8 bg-back border border-first rounded-xl hover:scale-105 transition-transform duration-300">
                            <TrendingUp className="w-12 h-12 text-first mx-auto mb-4" />
                            <div className="text-5xl font-bold text-first mb-2">100%</div>
                            <div className="text-first text-lg">Free & Open Source</div>
                        </div>

                        <div className="text-center p-8 bg-back border border-first rounded-xl hover:scale-105 transition-transform duration-300">
                            <Star className="w-12 h-12 text-first mx-auto mb-4" />
                            <div className="text-5xl font-bold text-first mb-2">4.8</div>
                            <div className="text-first text-lg">Average Rating</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Changelog Section */}
            <section id="changelog" className="py-16 bg-back">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-first rounded-full mb-6">
                            <GitBranch className="text-white" size={40} />
                        </div>
                        <h2 className="text-4xl font-bold text-first mb-4">
                            Changelog
                        </h2>
                        <p className="text-first text-lg">
                            Follow Nikflix evolution and discover the latest improvements
                        </p>
                    </div>

                    <div className="space-y-6">
                        {changelogData.map((release, index) => (
                            <div
                                key={index}
                                className="bg-back border border-first rounded-xl p-6 hover:shadow-lg hover:shadow-first/20 transition-all duration-300"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-2xl font-bold text-first">
                                        Version {release.version}
                                    </h3>
                                    <span className="text-first bg-first/20 px-3 py-1 rounded-full text-sm font-semibold">
                                        {release.date}
                                    </span>
                                </div>
                                <ul className="space-y-2">
                                    {release.changes.map((change, changeIndex) => (
                                        <li key={changeIndex} className="text-first flex items-start gap-2">
                                            <span className="text-first mt-1">✓</span>
                                            <span>{change}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contributors Section with scrolling animation */}
            <section className="py-16 bg-back overflow-hidden">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-first mb-4">
                            Thanks to Our Contributors ❤️
                        </h2>
                        <p className="text-first text-lg">
                            A big thank you to everyone who contributed to the Nikflix project
                        </p>
                    </div>

                    {/* Infinite scroll animation */}
                    <div className="relative">
                        <div className="flex overflow-hidden">
                            <div className="flex animate-scroll">
                                {contributors.concat(contributors).map((contributor, index) => (
                                    <div
                                        key={index}
                                        className="flex-shrink-0 mx-3 bg-back border border-first rounded-xl p-4 hover:scale-105 transition-transform duration-300 cursor-pointer"
                                        onClick={() => window.open(`https://github.com/${contributor.github}`, "_blank")}
                                        style={{ width: '200px' }}
                                    >
                                        <div className="w-12 h-12 bg-first rounded-full mx-auto mb-3 flex items-center justify-center">
                                            <Github className="text-white" size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-first text-center mb-1">
                                            {contributor.name}
                                        </h3>
                                        <p className="text-first text-sm text-center mb-2">{contributor.role}</p>
                                        <p className="text-first/70 text-xs text-center">
                                            @{contributor.github}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-center p-8 bg-back border border-first rounded-xl">
                        <h3 className="text-xl font-semibold text-first mb-3">
                            Want to contribute?
                        </h3>
                        <p className="text-first mb-6">
                            The project is open source! Check out our GitHub repository to contribute.
                        </p>
                        <button
                            onClick={() => window.open("https://github.com/YidirK/Nikflix", "_blank")}
                            className="bg-first text-white px-6 py-3 rounded-xl font-semibold hover:bg-first/80 transition-all duration-300 inline-flex items-center gap-2"
                        >
                            <Github size={20} />
                            Contribute on GitHub
                        </button>
                    </div>
                </div>

                <style jsx>{`
                    @keyframes scroll {
                        0% {
                            transform: translateX(0);
                        }
                        100% {
                            transform: translateX(-50%);
                        }
                    }
                    .animate-scroll {
                        animation: scroll 30s linear infinite;
                    }
                    .animate-scroll:hover {
                        animation-play-state: paused;
                    }
                `}</style>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="bg-back h-fit">
                <div className={"py-16 px-4 max-w-4xl mx-auto"}>
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-first rounded-full mb-6">
                            <ShieldQuestionMark className={"text-white"} size={40} />
                        </div>
                        <h2 className="text-4xl font-bold text-first mb-4">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {faqData.map((item, index) => (
                            <div
                                key={index}
                                className=" border border-first rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                <button
                                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-2 focus:ring-first focus:ring-inset rounded-xl"
                                    onClick={() => toggleItem(index)}
                                >
                                    <h3 className="text-lg font-semibold text-first pr-4">
                                        {item.question}
                                    </h3>
                                    <ChevronDown
                                        className={`w-5 h-5 text-first transition-transform duration-200 flex-shrink-0 ${openItems.has(index) ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-200 ease-in-out ${openItems.has(index) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="px-6 pb-6">
                                        <div className="w-full h-px bg-first/30 mb-4"></div>
                                        <p className="text-first leading-relaxed">
                                            {item.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center p-8 bg-first rounded-xl border">
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Still have questions?
                        </h3>
                        <p className="text-white mb-6">
                            Send me an email at:<span
                            className={"font-semibold"}> yidirk@hergol.me</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* SEO - Long-tail keywords section (invisible but crawlable) */}
            <section className="py-8 bg-back border-t border-first/20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center">
                        <h3 className="text-sm font-semibold text-first/60 mb-4">
                            Frequent Searches
                        </h3>
                        <div className="flex flex-wrap justify-center gap-2 text-xs text-first/50">
                            <span className="px-2 py-1 bg-first/5 rounded">netflix doesn't recognize my device</span>
                            <span className="px-2 py-1 bg-first/5 rounded">how to bypass netflix household</span>
                            <span className="px-2 py-1 bg-first/5 rounded">extension to unblock netflix</span>
                            <span className="px-2 py-1 bg-first/5 rounded">watch netflix outside household</span>
                            <span className="px-2 py-1 bg-first/5 rounded">share netflix with friends</span>
                            <span className="px-2 py-1 bg-first/5 rounded">netflix multiple addresses</span>
                            <span className="px-2 py-1 bg-first/5 rounded">netflix household error solution</span>
                            <span className="px-2 py-1 bg-first/5 rounded">free chrome extension netflix</span>
                            <span className="px-2 py-1 bg-first/5 rounded">bypass netflix household free</span>
                            <span className="px-2 py-1 bg-first/5 rounded">netflix on vacation</span>
                            <span className="px-2 py-1 bg-first/5 rounded">use netflix at friend's house</span>
                            <span className="px-2 py-1 bg-first/5 rounded">netflix multiple wifi</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Support Section */}
            <section className="py-16 bg-back text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-first">Support the Project ❤️</h2>
                <p className="max-w-xl mx-auto mb-6 font-semibold text-first">
                    <span className={"font-bold"}>Nikflix</span> is open source and free. Your donations help cover development costs and allow us to keep improving the extension.
                </p>

                <button className="btn bg-first text-white rounded-xl gap-2 hover:bg-first/80"
                        onClick={() => window.open("https://ko-fi.com/yidirk", '_blank')}>
                    <Heart /> Donate
                </button>
            </section>

            {/* Footer */}
            <footer className="bg-first border-t border-gray-300 mt-auto">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="flex items-center space-x-2">
                            <p className={"font-bold"}><span className="text-xl text-white">Coded with</span></p>
                            <Heart className="w-5 h-5 text-red-500 fill-current animate-pulse" />
                        </div>
                        <p className="text-white text-sm">
                            Nikflix - Free Extension for Netflix • 50,000+ Users • Open Source
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}

export default Home_en;