export interface FamilyMember {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'parent' | 'child';
    userId: string; // Firebase Auth user ID
    familyId: string; // ID of the family they belong to
    createdAt: string;
    updatedAt?: string;
} 