"use client";

import { useState } from 'react';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    AuthError
} from 'firebase/auth';
import { useFirebase } from '../contexts/FirebaseContext';

export default function Auth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useFirebase();
    const auth = getAuth();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            setEmail('');
            setPassword('');
        } catch (error) {
            const authError = error as AuthError;
            let errorMessage = 'Authentication failed';

            // Handle specific Firebase auth errors
            switch (authError.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered. Please sign in instead.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password should be at least 6 characters long.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Invalid email or password.';
                    break;
                default:
                    errorMessage = authError.message;
            }

            setError(errorMessage);
            console.error('Auth error:', authError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        setIsLoading(true);
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Sign out error:', error);
            setError('Failed to sign out. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (user) {
        return (
            <div className="text-center">
                <p className="mb-4">Signed in as {user.email}</p>
                <button
                    onClick={handleSignOut}
                    disabled={isLoading}
                    className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Signing Out...' : 'Sign Out'}
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm">
            <form onSubmit={handleAuth} className="flex flex-col gap-4">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded text-sm">
                        {error}
                    </div>
                )}
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="p-2 border rounded dark:bg-gray-800"
                    required
                    disabled={isLoading}
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="p-2 border rounded dark:bg-gray-800"
                    required
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                    }}
                    disabled={isLoading}
                    className="text-sm underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </button>
            </form>
        </div>
    );
} 