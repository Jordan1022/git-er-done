"use client";

import { useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { getAuth, signOut } from 'firebase/auth';
import ChoresList from './ChoresList';
import FamilyList from './FamilyList';
import { useTheme } from '../contexts/ThemeContext';

type Tab = 'chores' | 'schedule' | 'family' | 'profile' | 'settings';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('chores');
    const [isLoading, setIsLoading] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user } = useFirebase();
    const auth = getAuth();
    const { theme, toggleTheme } = useTheme();

    const handleSignOut = async () => {
        setIsLoading(true);
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const tabs: { id: Tab; label: string; icon: string }[] = [
        {
            id: 'chores',
            label: 'Chores List',
            icon: '📋'
        },
        {
            id: 'schedule',
            label: 'Schedule',
            icon: '📅'
        },
        {
            id: 'family',
            label: 'Family',
            icon: '👨‍👩‍👧‍👦'
        },
        {
            id: 'profile',
            label: 'Profile',
            icon: '👤'
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: '⚙️'
        }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'chores':
                return (
                    <div className="p-4 sm:p-6">
                        <ChoresList />
                    </div>
                );
            case 'schedule':
                return (
                    <div className="p-4 sm:p-6">
                        <h2 className="text-xl sm:text-3xl font-bold mb-4">Schedule</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Schedule chart coming soon...</p>
                    </div>
                );
            case 'family':
                return (
                    <div className="p-4 sm:p-6">
                        <FamilyList />
                    </div>
                );
            case 'profile':
                return (
                    <div className="p-4 sm:p-6">
                        <h2 className="text-xl sm:text-3xl font-bold mb-4">Profile</h2>
                        <div className="space-y-3 text-sm sm:text-base">
                            <p><strong>Email:</strong> {user?.email}</p>
                            <p><strong>Name:</strong> {user?.displayName || 'Not set'}</p>
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="p-4 sm:p-6">
                        <h2 className="text-xl sm:text-3xl font-bold mb-4">Settings</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg sm:text-2xl font-semibold mb-3">Theme</h3>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div>
                                        <p className="font-medium">Dark Mode</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {theme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={theme === 'dark'}
                                            onClick={toggleTheme}
                                            className={`
                                                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                                                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                                ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'}
                                            `}
                                        >
                                            <span className="sr-only">Toggle theme</span>
                                            <span
                                                aria-hidden="true"
                                                className={`
                                                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                                                    transition duration-200 ease-in-out
                                                    ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}
                                                `}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-2xl font-semibold mb-3">Account</h3>
                                <button
                                    onClick={handleSignOut}
                                    disabled={isLoading}
                                    className="rounded-full border border-red-500 text-red-500 transition-colors flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Signing Out...' : 'Sign Out'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto bg-white dark:bg-black rounded-lg shadow-sm border border-black/[.08] dark:border-white/[.1]">
            {/* Mobile Menu Button */}
            <div className="sm:hidden border-b border-black/[.08] dark:border-white/[.1] p-2">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg"
                >
                    <span className="flex items-center gap-2">
                        <span>{tabs.find(tab => tab.id === activeTab)?.icon}</span>
                        <span>{tabs.find(tab => tab.id === activeTab)?.label}</span>
                    </span>
                    <svg className={`w-5 h-5 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="mt-2 space-y-1 px-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${activeTab === tab.id
                                    ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex border-b border-black/[.08] dark:border-white/[.1] overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 font-medium text-base transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${activeTab === tab.id
                            ? 'border-black dark:border-white text-black dark:text-white'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                            }`}
                    >
                        <span className="text-xl">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* Tab Content */}
            <div className="min-h-[400px] sm:min-h-[600px]">
                {renderTabContent()}
            </div>
        </div>
    );
} 