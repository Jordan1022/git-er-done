"use client";

import { useState } from 'react';
import { AssignmentType, RotationPeriod, Chore } from '../types/chore';

interface FamilyMember {
    id: string;
    name: string;
    avatar: string;
}

type ChoreFormData = {
    title: string;
    assignmentType: AssignmentType;
    assignedTo: string[];
    rotationFrequency: number;
    rotationPeriod: RotationPeriod;
};

interface ChoreFormProps {
    onSubmit: (choreData: Omit<Chore, 'id' | 'status' | 'createdAt' | 'createdBy'>) => Promise<void>;
    onCancel: () => void;
    initialData?: Partial<ChoreFormData>;
}

export default function ChoreForm({ onSubmit, onCancel, initialData }: ChoreFormProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [assignmentType, setAssignmentType] = useState<AssignmentType>(initialData?.assignmentType || 'rotate');
    const [selectedMembers, setSelectedMembers] = useState<string[]>(initialData?.assignedTo || []);
    const [rotationFrequency, setRotationFrequency] = useState(initialData?.rotationFrequency || 1);
    const [rotationPeriod, setRotationPeriod] = useState<RotationPeriod>(initialData?.rotationPeriod || 'week');

    // Temporary family members data - this should come from your Firebase database
    const familyMembers: FamilyMember[] = [
        { id: '1', name: 'Aletheia Allen', avatar: '/path-to-avatar1.jpg' },
        { id: '2', name: 'Corban Allen', avatar: '/path-to-avatar2.jpg' },
        { id: '3', name: 'Micaiah Allen', avatar: '/path-to-avatar3.jpg' },
    ];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await onSubmit({
            title,
            assignmentType,
            assignedTo: selectedMembers,
            rotationFrequency,
            rotationPeriod
        });
    };

    const toggleMember = (memberId: string) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Section */}
            <div className="space-y-2">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Chore Title"
                    className="w-full p-3 text-xl font-semibold border-none focus:ring-0 bg-transparent"
                    required
                />
            </div>

            {/* Assignees Section */}
            <div className="space-y-4">
                <label className="block text-sm text-gray-500 uppercase">Assignees</label>
                <div className="space-y-2">
                    {familyMembers.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedMembers.includes(member.id)}
                                    onChange={() => toggleMember(member.id)}
                                    className="w-5 h-5 rounded border-gray-300"
                                />
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    {/* Replace with actual avatar */}
                                    <div className="w-full h-full bg-gray-300"></div>
                                </div>
                                <span>{member.name}</span>
                            </div>
                            <button type="button" className="text-gray-400">≡</button>
                        </div>
                    ))}
                </div>

                {/* Assignment Type Selector */}
                <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    {(['everyone', 'anyone', 'rotate'] as const).map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setAssignmentType(type)}
                            className={`py-2 px-4 rounded-md text-sm ${assignmentType === type
                                    ? 'bg-white dark:bg-gray-700 shadow'
                                    : 'text-gray-500'
                                }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Rotation Settings */}
                {assignmentType === 'rotate' && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Take turns doing this task.
                        </p>
                        <div className="space-y-2">
                            <label className="block text-sm">Rotate Every</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={rotationFrequency}
                                    onChange={(e) => setRotationFrequency(Number(e.target.value))}
                                    min="1"
                                    className="w-20 p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                                />
                                <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex-1">
                                    {(['day', 'week', 'month'] as const).map(period => (
                                        <button
                                            key={period}
                                            type="button"
                                            onClick={() => setRotationPeriod(period)}
                                            className={`py-2 px-4 rounded-md text-sm ${rotationPeriod === period
                                                    ? 'bg-white dark:bg-gray-700 shadow'
                                                    : 'text-gray-500'
                                                }`}
                                        >
                                            {period.charAt(0).toUpperCase() + period.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-blue-500 font-medium"
                >
                    Cancel
                </button>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        className="text-gray-400"
                    >
                        •••
                    </button>
                    <button
                        type="submit"
                        className="text-blue-500 font-medium"
                    >
                        Save
                    </button>
                </div>
            </div>
        </form>
    );
} 