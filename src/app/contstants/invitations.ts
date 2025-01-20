export enum InvitationStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    ACCEPTED = 'ACCEPTED',
    COMPLETE = 'COMPLETE',
    REFUSED = 'REFUSED',
    CANCELED = 'CANCELED',
    QUEUED = 'QUEUED',
    SENDING = 'SENDING',
    FAILED = 'FAILED',
    DELIVERED = 'DELIVERED',
    UNDELIVERED = 'UNDELIVERED',
    RECEIVING = 'RECEIVING',
    RECEIVED = 'RECEIVED',
    SCHEDULED = 'SCHEDULED',
    READ = 'READ',
    ACKNOWLEDGED = 'ACKNOWLEDGED',
    PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED'
}

export const InvitationStatusConfig: {
    [key in InvitationStatus]: { label: string; color: string; backgroundColor: string };
} = {
    [InvitationStatus.PENDING]: {
        label: 'invitations.pending',
        color: 'gray',
        backgroundColor: '#E3F2FD',
    },
    [InvitationStatus.QUEUED]: {
        label: 'invitations.queued',
        color: 'gray',
        backgroundColor: '#E3F2FD',
    },
    [InvitationStatus.SENT]: {
        label: 'invitations.sent',
        color: 'blue',
        backgroundColor: '#E3F2FD',
    },
    [InvitationStatus.DELIVERED]: {
        label: 'invitations.delivered',
        color: 'blue',
        backgroundColor: '#E3F2FD',
    },
    [InvitationStatus.SENDING]: {
        label: 'invitations.sending',
        color: 'blue',
        backgroundColor: '#E3F2FD',
    },
    [InvitationStatus.ACCEPTED]: {
        label: 'invitations.accepted',
        color: 'green',
        backgroundColor: '#E8F5E9',
    },
    [InvitationStatus.RECEIVED]: {
        label: 'invitations.received',
        color: 'green',
        backgroundColor: '#E8F5E9',
    },
    [InvitationStatus.READ]: {
        label: 'invitations.read',
        color: 'green',
        backgroundColor: '#E8F5E9',
    },
    [InvitationStatus.ACKNOWLEDGED]: {
        label: 'invitations.read',
        color: 'green',
        backgroundColor: '#E8F5E9',
    },
    [InvitationStatus.COMPLETE]: {
        label: 'invitations.closed',
        color: 'gray',
        backgroundColor: '#F5F5F5',
    },
    [InvitationStatus.SCHEDULED]: {
        label: 'invitations.scheduled',
        color: 'gray',
        backgroundColor: '#F5F5F5',
    },
    [InvitationStatus.RECEIVING]: {
        label: 'invitations.receiving',
        color: 'gray',
        backgroundColor: '#F5F5F5',
    },
    [InvitationStatus.PARTIALLY_DELIVERED]: {
        label: 'invitations.partiallyDelivered',
        color: 'gray',
        backgroundColor: '#F5F5F5',
    },
    [InvitationStatus.CANCELED]: {
        label: 'invitations.canceled',
        color: 'red',
        backgroundColor: '#FFEBEE',
    },
    [InvitationStatus.REFUSED]: {
        label: 'invitations.refused',
        color: 'red',
        backgroundColor: '#FFEBEE',
    },
    [InvitationStatus.FAILED]: {
        label: 'invitations.failed',
        color: 'red',
        backgroundColor: '#FFEBEE',
    },
    [InvitationStatus.UNDELIVERED]: {
        label: 'invitations.undelivered',
        color: 'red',
        backgroundColor: '#FFEBEE',
    },
};
