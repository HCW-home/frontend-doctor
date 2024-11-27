export const TwilioWhatsappConfig = {
  patientInvite: 'patient invite',
  scheduledPatientInvite: 'scheduled patient invite',
  pleaseUseThisLink: 'please use this link',
  scheduledGuestInvite: 'scheduled guest invite',
  guestInvite: 'guest invite',
  patientIsReady: 'patient is ready',
  offlineAction: 'notification for offline action text for doctor'
};

export type TwilioWhatsappTypes =
  (typeof TwilioWhatsappConfig)[keyof typeof TwilioWhatsappConfig];
