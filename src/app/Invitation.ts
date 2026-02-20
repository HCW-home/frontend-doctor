import { MessageService } from './contstants/invitations';

export interface Invitation {
  createdAt: number;
  emailAddress: string;
  firstName: string;
  gender: string;
  id: string;
  invitedBy: string;
  lastName: string;
  phoneNumber: string;
  queue: string;
  scheduledFor: number;
  status: string;
  updatedAt: number;
  guestInvite: any;
  translatorRequestInvite: any;
  resending: boolean;
  revoking: boolean;
  gettingLink: boolean;
  metadata: object;
  patientTZ: string;
  experts: Expert[];
  messageService: MessageService;
}

export interface Expert {
  expertContact: string;
  messageService: string;
}
