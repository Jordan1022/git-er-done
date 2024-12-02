export type ChoreStatus = 'active' | 'archived' | 'completed';

export interface Chore {
    id: string;
    title: string;
    description?: string;
    status: ChoreStatus;
    assignedTo?: string; // User ID
    dueDate?: string;
    frequency?: 'daily' | 'weekly' | 'monthly' | 'once';
    createdAt: string;
    createdBy: string; // User ID
    updatedAt?: string;
    completedAt?: string;
} 