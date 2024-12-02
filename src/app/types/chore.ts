export type ChoreStatus = 'active' | 'archived' | 'completed';
export type AssignmentType = 'everyone' | 'anyone' | 'rotate';
export type RotationPeriod = 'day' | 'week' | 'month';

export interface Chore {
    id: string;
    title: string;
    description?: string;
    status: ChoreStatus;
    assignmentType: AssignmentType;
    assignedTo: string[]; // Array of user IDs
    rotationFrequency?: number; // e.g., 2 for "every 2 days"
    rotationPeriod?: RotationPeriod; // day/week/month
    frequency?: 'daily' | 'weekly' | 'monthly' | 'once';
    createdAt: string;
    createdBy: string; // User ID
    updatedAt?: string;
    completedAt?: string;
    dueDate?: string;
} 