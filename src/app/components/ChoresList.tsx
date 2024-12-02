"use client";

import { useState, useEffect } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { Chore, ChoreStatus } from '../types/chore';
import { getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { app } from '../firebase.config';

export default function ChoresList() {
    const [chores, setChores] = useState<Chore[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [newChore, setNewChore] = useState({
        title: '',
        description: '',
        frequency: 'once' as const,
        dueDate: ''
    });

    const { user } = useFirebase();
    const db = getFirestore(app);

    // Subscribe to chores
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'chores'),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const choresList: Chore[] = [];
            snapshot.forEach((doc) => {
                choresList.push({ id: doc.id, ...doc.data() } as Chore);
            });
            setChores(choresList);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching chores:', err);
            setError('Failed to load chores');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, user]);

    const addChore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const choreData: Omit<Chore, 'id'> = {
                title: newChore.title,
                description: newChore.description,
                status: 'active',
                frequency: newChore.frequency,
                dueDate: newChore.dueDate || undefined,
                createdAt: new Date().toISOString(),
                createdBy: user.uid
            };

            await addDoc(collection(db, 'chores'), choreData);
            setNewChore({ title: '', description: '', frequency: 'once', dueDate: '' });
            setShowForm(false);
        } catch (err) {
            console.error('Error adding chore:', err);
            setError('Failed to add chore');
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
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-full bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm sm:text-base hover:opacity-80 transition-opacity"
                >
                    {showForm ? 'Cancel' : 'Add Chore'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={addChore} className="space-y-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={newChore.title}
                            onChange={(e) => setNewChore({ ...newChore, title: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={newChore.description}
                            onChange={(e) => setNewChore({ ...newChore, description: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="frequency" className="block text-sm font-medium mb-1">
                                Frequency
                            </label>
                            <select
                                id="frequency"
                                value={newChore.frequency}
                                onChange={(e) => setNewChore({ ...newChore, frequency: e.target.value as any })}
                                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                            >
                                <option value="once">Once</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium mb-1">
                                Due Date
                            </label>
                            <input
                                type="date"
                                id="dueDate"
                                value={newChore.dueDate}
                                onChange={(e) => setNewChore({ ...newChore, dueDate: e.target.value })}
                                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-sm border rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-full hover:opacity-80"
                        >
                            Add Chore
                        </button>
                    </div>
                </form>
            )}

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