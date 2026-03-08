'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface ThemeContextType {
    darkMode: boolean;
    toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const fetchPreferences = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await axios.get('http://127.0.0.1:8080/api/profile/application/preference', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const isDark = res.data.data.darkMode;
                setDarkMode(isDark);
                if (isDark) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } catch (err) {
                console.error('Failed to fetch theme preferences', err);
            }
        };

        fetchPreferences();
    }, []);

    const toggleDarkMode = async () => {
        const newMode = !darkMode;
        setDarkMode(newMode);

        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Sync with backend
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await axios.patch('http://127.0.0.1:8080/api/profile/application/preference',
                    { darkMode: newMode },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (err) {
                console.error('Failed to sync theme preference', err);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
