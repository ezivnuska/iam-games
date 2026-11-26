// app/poker/components/poker-notification-display.tsx
'use client';

import { type Notification } from '@/app/games/poker/lib/providers/notification-provider';

interface PokerNotificationDisplayProps {
  notification: Notification | null;
}

export default function PokerNotificationDisplay({ notification }: PokerNotificationDisplayProps) {
  if (!notification) {
    return null;
  }

  return (
    <div className="relative z-10 flex flex-row h-full items-center justify-center">
        <span className='text-white'>{notification.message}</span>
    </div>
  );
}
