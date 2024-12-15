export type FamilyRole = 'parent' | 'child';
export type InviteStatus = 'pending' | 'accepted' | 'declined';

export interface FamilyMember {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: FamilyRole;
    userId?: string; // Optional until they create an account
    familyId: string;
    inviteStatus: InviteStatus;
    invitedBy: string; // userId of the parent who sent the invite
    invitedAt: string;
    acceptedAt?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface FamilyInvite {
    id: string;
    email: string;
    role: FamilyRole;
    familyId: string;
    invitedBy: string;
    invitedAt: string;
    status: InviteStatus;
    token: string; // Unique token for invite link
}

export interface FamilyMemberPermissions {
    canInviteMembers: boolean;
    canRemoveMembers: boolean;
    canUpdateRoles: boolean;
    canManageChores: boolean;
} 