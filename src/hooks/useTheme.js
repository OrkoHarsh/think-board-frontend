import { useState, useEffect } from 'react';

export const useTheme = () => {
    const [isDark, setIsDark] = useState(() => {
        // Read from localStorage on mount
        const stored = localStorage.getItem('theme');
        if (stored) return stored === 'dark';
        // Default to light mode
        return false;
    });

    // Sync .dark class to document.documentElement
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

    return [isDark, toggleTheme];
};
