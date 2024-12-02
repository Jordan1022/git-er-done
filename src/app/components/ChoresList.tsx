"use client";

import { useState, useEffect } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { Chore, ChoreStatus } from '../types/chore';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase.config';
import ChoreForm from './ChoreForm';

export default function ChoresList() {
    const [chores, setChores] = useState<Chore[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const { user } = useFirebase();

    // Subscribe to chores
    useEffect(() => {
        if (!user) {
            console.log("No user found");
            return;
        }

        console.log("Setting up Firestore listener for user:", user.uid);

        try {
            const q = query(
                collection(db, 'chores'),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                console.log("Received Firestore update:", snapshot.size, "documents");
                const choresList: Chore[] = [];
                snapshot.forEach((doc) => {
                    choresList.push({ id: doc.id, ...doc.data() } as Chore);
                });
                setChores(choresList);
                setLoading(false);
                setError(null); // Clear any previous errors
            }, (err) => {
                console.error('Detailed error fetching chores:', err);
                setError(`Failed to load chores: ${err.message}`);
                setLoading(false);
            });

            return () => {
                console.log("Cleaning up Firestore listener");
                unsubscribe();
            };
        } catch (err) {
            console.error('Error setting up chores listener:', err);
            setError('Failed to set up chores listener');
            setLoading(false);
        }
    }, [user]);

    const handleAddChore = async (choreData: Partial<Chore>) => {
        if (!user) return;

        try {
            console.log("Adding new chore...");
            const newChore: Omit<Chore, 'id'> = {
                ...choreData,
                status: 'active',
                createdAt: new Date().toISOString(),
                createdBy: user.uid,
                assignmentType: choreData.assignmentType || 'rotate',
                assignedTo: choreData.assignedTo || []
            } as Omit<Chore, 'id'>;

            console.log("Chore data:", newChore);
            const docRef = await addDoc(collection(db, 'chores'), newChore);
            console.log("Chore added successfully with ID:", docRef.id);

            setShowForm(false);
            setError(null);
        } catch (err) {
            console.error('Detailed error adding chore:', err);
            setError(`Failed to add chore: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const updateChoreStatus = async (choreId: string, status: ChoreStatus) => {
        try {
            const choreRef = doc(db, 'chores', choreId);
            await updateDoc(choreRef, {
                status,
                updatedAt: new Date().toISOString(),
                ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {})
            });
        } catch (err) {
            console.error('Error updating chore:', err);
            setError('Failed to update chore');
        }
    };

    const deleteChore = async (choreId: string) => {
        if (!confirm('Are you sure you want to delete this chore?')) return;

        try {
            await deleteDoc(doc(db, 'chores', choreId));
        } catch (err) {
            console.error('Error deleting chore:', err);
            setError('Failed to delete chore');
        }
    };

    if (loading) {
        return <div className="animate-pulse">Loading chores...</div>;
    }

    if (showForm) {
        return (
            <div className="bg-white dark:bg-black min-h-screen">
                <ChoreForm
                    onSubmit={handleAddChore}
                    onCancel={() => setShowForm(false)}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded text-sm">
                    {error}
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-3xl font-bold">Chores List</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="rounded-full bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm sm:text-base hover:opacity-80 transition-opacity"
                >
                    Add Chore
                </button>
            </div>

            <div className="space-y-4">
                {chores.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No chores yet. Add your first chore!</p>
                ) : (
                    chores.map((chore) => (
                        <div
                            key={chore.id}
                            className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="font-semibold text-lg">{chore.title}</h3>
                                    {chore.description && (
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">{chore.description}</p>
                                    )}
                                    <div className="flex gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        {chore.frequency && <span>🔄 {chore.frequency}</span>}
                                        {chore.dueDate && <span>📅 {new Date(chore.dueDate).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateChoreStatus(chore.id, 'completed')}
                                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                        title="Mark as completed"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={() => updateChoreStatus(chore.id, 'archived')}
                                        className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                                        title="Archive"
                                    >
                                        📁
                                    </button>
                                    <button
                                        onClick={() => deleteChore(chore.id)}
                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                        title="Delete"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
} 