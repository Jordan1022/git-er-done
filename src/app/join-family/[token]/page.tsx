"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { FamilyInvite, FamilyMember } from '../../types/family';

export default function JoinFamily({ params }: { params: { token: string } }) {
    const router = useRouter();
    const { user } = useFirebase();
    const [invite, setInvite] = useState<FamilyInvite | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [avatar, setAvatar] = useState('');

    useEffect(() => {
        const fetchInvite = async () => {
            try {
                const invitesRef = collection(db, 'familyInvites');
                const q = query(
                    invitesRef,
                    where('token', '==', params.token),
                    where('status', '==', 'pending')
                );
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setError('Invalid or expired invite link');
                    setLoading(false);
                    return;
                }

                const inviteData = {
                    id: querySnapshot.docs[0].id,
                    ...querySnapshot.docs[0].data()
                } as FamilyInvite;

                if (inviteData.email !== user?.email) {
                    setError('This invite is for a different email address');
                    setLoading(false);
                    return;
                }

                setInvite(inviteData);
                setDisplayName(user?.displayName || '');
                setLoading(false);
            } catch (err) {
                console.error('Error fetching invite:', err);
                setError('Failed to load invite');
                setLoading(false);
            }
        };

        if (user) {
            fetchInvite();
        }
    }, [params.token, user]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !invite) return;

        try {
            // Create family member
            const memberData: Omit<FamilyMember, 'id'> = {
                name: displayName,
                email: user.email!,
                avatar,
                role: invite.role,
                userId: user.uid,
                familyId: invite.familyId,
                inviteStatus: 'accepted',
                invitedBy: invite.invitedBy,
                invitedAt: invite.invitedAt,
                acceptedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'familyMembers'), memberData);

            // Update invite status
            const inviteRef = doc(db, 'familyInvites', invite.id);
            await updateDoc(inviteRef, {
                status: 'accepted'
            });

            // Redirect to dashboard
            router.push('/');
        } catch (err) {
            console.error('Error joining family:', err);
            setError('Failed to join family');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen grid place-items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen grid place-items-center">
                <div className="text-center space-y-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    if (!invite) {
        return (
            <div className="min-h-screen grid place-items-center">
                <p>Invalid invite</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen grid place-items-center p-4">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="text-center">
                    <h2 className="text-3xl font-bold">Join Family</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        You are invited to join as a {invite.role}
                    </p>
                </div>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Display Name
                        </label>
                        <input
                            type="text"
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Avatar URL (optional)
                        </label>
                        <input
                            type="url"
                            id="avatar"
                            value={avatar}
                            onChange={(e) => setAvatar(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Join Family
                    </button>
                </form>
            </div>
        </div>
    );
} 