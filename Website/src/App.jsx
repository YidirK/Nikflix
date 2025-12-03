
import "./App.css";
import Home_fr from "./pages/Home_fr.jsx";
import Home_en from "./pages/Home_en.jsx";
import LoadingSpinner from "./pages/LoadingSpinner.jsx";
import Page404 from "./pages/Page404.jsx";
import { HashRouter, Routes, Route } from "react-router-dom";

function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<LoadingSpinner />} />
                <Route path="/fr" element={<Home_fr />} />
                <Route path="/en" element={<Home_en />} />
                <Route path="*" element={<Page404 />} />
            </Routes>
        </HashRouter>
    );
}

export default App;