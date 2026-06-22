import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

export function formatMessageTime(date: string): string {
  const d = dayjs(date);
  return d.format('HH:mm');
}

export function formatConversationTime(date: string): string {
  const d = dayjs(date);
  if (d.isToday()) return d.format('HH:mm');
  if (d.isYesterday()) return 'Yesterday';
  return d.format('DD/MM/YYYY');
}

export function formatLastSeen(date: string): string {
  return dayjs(date).fromNow();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getOtherParticipant(conversation: any, currentUserId: string) {
  return conversation.participants.find(
    (p: any) => p.userId !== currentUserId,
  )?.user;
}
