"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import {
    getAuth,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import { app } from '../firebase.config';

type FirebaseContextType = {
    user: User | null;
    loading: boolean;
};

const FirebaseContext = createContext<FirebaseContextType>({
    user: null,
    loading: true,
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const auth = getAuth(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, [auth]);

    return (
        <FirebaseContext.Provider value={{ user, loading }}>
            {children}
        </FirebaseContext.Provider>
    );
}

export const useFirebase = () => useContext(FirebaseContext); 