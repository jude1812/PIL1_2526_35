import { useEffect, useState } from "react";
import "./ThemeToggle.css";

const ThemeToggle = () => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("mentor_link_theme") || "dark";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("mentor_link_theme", theme);

        // Ajoute une classe d'animation flash sur le body
        document.body.classList.add("theme-transition-flash");
        setTimeout(() => {
            document.body.classList.remove("theme-transition-flash");
        }, 400);
    }, [theme]);

    const toggle = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <button className="theme-toggle-btn" onClick={toggle}>
            <span className="toggle-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
        </button>
    );
};

export default ThemeToggle;