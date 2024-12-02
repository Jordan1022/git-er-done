"use client";

import { useState, useEffect } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { FamilyMember } from '../types/family';
import { collection, addDoc, doc, deleteDoc, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase.config';

type NewFamilyMember = {
    name: string;
    email: string;
    role: 'parent' | 'child';
};

export default function FamilyList() {
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [newMember, setNewMember] = useState<NewFamilyMember>({
        name: '',
        email: '',
        role: 'child'
    });

    const { user } = useFirebase();

    // Fetch family members
    useEffect(() => {
        if (!user) {
            console.log("No user found, cannot fetch family members");
            setLoading(false);
            return;
        }

        console.log("Starting to fetch family members for user:", user.uid);

        const fetchMembers = async () => {
            try {
                // Check if user is already part of a family
                const userMemberQuery = query(
                    collection(db, 'familyMembers'),
                    where('userId', '==', user.uid)
                );

                const userMemberDocs = await getDocs(userMemberQuery);
                let familyId = user.uid; // Default to user's ID

                if (!userMemberDocs.empty) {
                    // User is already part of a family
                    const userData = userMemberDocs.docs[0].data() as FamilyMember;
                    familyId = userData.familyId;
                } else {
                    // Create the first family member (the current user)
                    console.log("Creating first family member for user");
                    const firstMemberData: Omit<FamilyMember, 'id'> = {
                        name: user.displayName || 'Parent',
                        email: user.email || '',
                        role: 'parent',
                        userId: user.uid,
                        familyId: user.uid,
                        createdAt: new Date().toISOString()
                    };
                    await addDoc(collection(db, 'familyMembers'), firstMemberData);
                }

                // Set up real-time listener for family members
                console.log("Setting up listener for family:", familyId);
                const q = query(
                    collection(db, 'familyMembers'),
                    where('familyId', '==', familyId),
                    orderBy('createdAt', 'desc')
                );

                const unsubscribe = onSnapshot(q,
                    (snapshot) => {
                        console.log("Received family members update:", snapshot.size, "members");
                        const membersList: FamilyMember[] = [];
                        snapshot.forEach((doc) => {
                            membersList.push({ id: doc.id, ...doc.data() } as FamilyMember);
                        });
                        setMembers(membersList);
                        setLoading(false);
                        setError(null);
                    },
                    (err) => {
                        console.error('Error in family members listener:', err);
                        setError(`Failed to load family members: ${err instanceof Error ? err.message : 'Unknown error'}`);
                        setLoading(false);
                    }
                );

                return () => unsubscribe();
            } catch (err) {
                console.error('Error in fetchMembers:', err);
                setError(`Failed to set up family members: ${err instanceof Error ? err.message : 'Unknown error'}`);
                setLoading(false);
            }
        };

        fetchMembers();
    }, [user]);

    const addMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;

        try {
            console.log("Adding new family member");
            const memberData: Omit<FamilyMember, 'id'> = {
                name: newMember.name,
                email: newMember.email,
                role: newMember.role,
                userId: '', // This will be set when the member creates their account
                familyId: user.uid,
                createdAt: new Date().toISOString()
            };

            console.log("Member data:", memberData);
            const docRef = await addDoc(collection(db, 'familyMembers'), memberData);
            console.log("Member added successfully with ID:", docRef.id);

            setNewMember({ name: '', email: '', role: 'child' });
            setShowForm(false);
            setError(null);
        } catch (err) {
            console.error('Error adding family member:', err);
            setError(`Failed to add family member: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const deleteMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this family member?')) return;

        try {
            await deleteDoc(doc(db, 'familyMembers', memberId));
        } catch (err) {
            console.error('Error removing family member:', err);
            setError(`Failed to remove family member: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    if (loading) {
        return <div className="animate-pulse">Loading family members...</div>;
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded text-sm">
                    {error}
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-3xl font-bold">Family Members</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="rounded-full bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm sm:text-base hover:opacity-80 transition-opacity"
                >
                    Add Member
                </button>
            </div>

            {showForm && (
                <form onSubmit={addMember} className="space-y-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={newMember.name}
                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={newMember.email}
                            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium mb-1">
                            Role
                        </label>
                        <select
                            id="role"
                            value={newMember.role}
                            onChange={(e) => setNewMember({ ...newMember, role: e.target.value as 'parent' | 'child' })}
                            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                        >
                            <option value="child">Child</option>
                            <option value="parent">Parent</option>
                        </select>
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
                            Add Member
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-4">
                {members.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No family members yet. Add your first family member!
                    </p>
                ) : (
                    members.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                    {member.avatar ? (
                                        <img
                                            src={member.avatar}
                                            alt={member.name}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xl">
                                            {member.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-medium">{member.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {member.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                                    {member.role}
                                </span>
                                <button
                                    onClick={() => deleteMember(member.id)}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
} 