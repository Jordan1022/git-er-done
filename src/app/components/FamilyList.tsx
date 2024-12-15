"use client";

import { useState, useEffect } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { FamilyMember, FamilyInvite, FamilyRole } from '../types/family';

export default function FamilyList() {
    const { user } = useFirebase();
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [invites, setInvites] = useState<FamilyInvite[]>([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<FamilyRole>('child');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Subscribe to family members
        const membersQuery = query(
            collection(db, 'familyMembers'),
            where('familyId', '==', user.uid)
        );

        const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
            const members: FamilyMember[] = [];
            snapshot.forEach((doc) => {
                members.push({ id: doc.id, ...doc.data() } as FamilyMember);
            });
            setFamilyMembers(members);
            setLoading(false);
        });

        // Subscribe to invites
        const invitesQuery = query(
            collection(db, 'familyInvites'),
            where('familyId', '==', user.uid)
        );

        const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
            const currentInvites: FamilyInvite[] = [];
            snapshot.forEach((doc) => {
                currentInvites.push({ id: doc.id, ...doc.data() } as FamilyInvite);
            });
            setInvites(currentInvites);
        });

        return () => {
            unsubscribeMembers();
            unsubscribeInvites();
        };
    }, [user]);

    const inviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setError('');

            // Check if email is already invited
            const existingInvite = invites.find(invite =>
                invite.email === newMemberEmail && invite.status === 'pending'
            );
            if (existingInvite) {
                setError('This email has already been invited');
                return;
            }

            // Check if email is already a member
            const existingMember = familyMembers.find(member =>
                member.email === newMemberEmail
            );
            if (existingMember) {
                setError('This person is already a family member');
                return;
            }

            // Create invite token
            const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

            // Create invite document
            const invite: Omit<FamilyInvite, 'id'> = {
                email: newMemberEmail,
                role: newMemberRole,
                familyId: user.uid,
                invitedBy: user.uid,
                invitedAt: new Date().toISOString(),
                status: 'pending',
                token
            };

            await addDoc(collection(db, 'familyInvites'), invite);

            // TODO: Send email invitation
            // This would typically be handled by a Cloud Function
            console.log(`Invitation link: /join-family/${token}`);

            setNewMemberEmail('');
            setNewMemberRole('child');
        } catch (err) {
            setError('Failed to send invite');
            console.error('Error inviting member:', err);
        }
    };

    const resendInvite = async (invite: FamilyInvite) => {
        try {
            const inviteRef = doc(db, 'familyInvites', invite.id);
            await updateDoc(inviteRef, {
                invitedAt: new Date().toISOString(),
            });
            // TODO: Resend email invitation
        } catch (err) {
            setError('Failed to resend invite');
            console.error('Error resending invite:', err);
        }
    };

    const cancelInvite = async (invite: FamilyInvite) => {
        try {
            const inviteRef = doc(db, 'familyInvites', invite.id);
            await updateDoc(inviteRef, {
                status: 'declined'
            });
        } catch (err) {
            setError('Failed to cancel invite');
            console.error('Error canceling invite:', err);
        }
    };

    if (loading) {
        return <div className="animate-pulse">Loading family members...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Family Members</h2>
                <div className="space-y-4">
                    {familyMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                                {member.avatar ? (
                                    <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                                ) : (
                                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                        <span className="text-lg">{member.name[0]}</span>
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium">{member.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending Invites Section */}
            {invites.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Pending Invites</h2>
                    <div className="space-y-4">
                        {invites.filter(invite => invite.status === 'pending').map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div>
                                    <p className="font-medium">{invite.email}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Invited {new Date(invite.invitedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => resendInvite(invite)}
                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        Resend
                                    </button>
                                    <button
                                        onClick={() => cancelInvite(invite)}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Invite Family Member</h2>
                <form onSubmit={inviteMember} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Role
                        </label>
                        <select
                            id="role"
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value as FamilyRole)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="child">Child</option>
                            <option value="parent">Parent</option>
                        </select>
                    </div>
                    {error && (
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Send Invite
                    </button>
                </form>
            </div>
        </div>
    );
} 