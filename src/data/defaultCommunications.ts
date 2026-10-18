export interface CommunicationRecord {
  id: string;
  title: string;
  category: string;
  channel: 'SMS' | 'Noticeboard' | 'In-App' | 'Email';
  recipientAudience: string;
  messageContent: string;
  dateSent: string;
  status: 'Sent' | 'Draft' | 'Scheduled' | 'Failed';
  senderName: string;
}

export const defaultCommunications: CommunicationRecord[] = [
  {
    id: 'comm_1',
    title: 'Opening Day and Fee Balances Circular',
    category: 'Circular',
    channel: 'Noticeboard',
    recipientAudience: 'All Parents & Guardians',
    messageContent: 'Dear parents, please note that school reopens on Monday for Term 2. All outstanding fee balances should be cleared.',
    dateSent: '2025-05-02',
    status: 'Sent',
    senderName: 'Principal Office'
  },
  {
    id: 'comm_2',
    title: 'Grade 9 CBC Assessment Notice',
    category: 'Assessment',
    channel: 'In-App',
    recipientAudience: 'Grade 9 Parents',
    messageContent: 'The upcoming KPSEA assessment registration and school-based formative assessments will commence next week.',
    dateSent: '2025-05-05',
    status: 'Sent',
    senderName: 'Academic Registrar'
  },
  {
    id: 'comm_3',
    title: 'Parent-Teacher Consultation Meeting',
    category: 'Meeting',
    channel: 'SMS',
    recipientAudience: 'All Teachers & Parents',
    messageContent: 'You are invited to the mid-term progress consultation meeting scheduled for this coming Friday at 2:00 PM.',
    dateSent: '2025-05-10',
    status: 'Sent',
    senderName: 'Head Teacher'
  }
];

export const getCommunications = (): CommunicationRecord[] => {
  try {
    const raw = localStorage.getItem('munyaka_communications') || localStorage.getItem('communications');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return defaultCommunications;
};

export const saveCommunications = (records: CommunicationRecord[]): boolean => {
  try {
    localStorage.setItem('munyaka_communications', JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
};

export default defaultCommunications;
