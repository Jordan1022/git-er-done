"use client";

import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { useFirebase } from './contexts/FirebaseContext';

export default function Home() {
  const { user, loading } = useFirebase();

  if (loading) {
    return (
      <div className="grid place-items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {user ? (
        <Dashboard />
      ) : (
        <div className="min-h-screen grid place-items-center">
          <Auth />
        </div>
      )}
    </div>
  );
}
