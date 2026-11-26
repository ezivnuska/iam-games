// app/poker/components/poker-dashboard.tsx

'use client';

import { useGameState, usePlayers } from '@/app/games/poker/lib/providers/poker-provider';
import { useUser } from '@/app/lib/providers/user-provider';
import { useActionTimerPercentage } from '@/app/games/poker/lib/hooks/use-action-timer-percentage';
import GameNotification from './game-notification';
import PlayerControls from './player-controls';

interface PokerDashboardProps {
  showPlayerControls: boolean;
  onActionTaken: () => void;
}

export default function PokerDashboard({
  showPlayerControls,
  onActionTaken,
}: PokerDashboardProps) {
  const { actionTimer } = useGameState();
  const { players } = usePlayers();
  const { user } = useUser();

  const turnTimerProgress = useActionTimerPercentage(actionTimer, user?.id);

  const actingPlayer = actionTimer?.targetPlayerId
    ? players.find(p => p.id === actionTimer.targetPlayerId)
    : null;

  const showActingPlayerPlaceholder = !showPlayerControls && actingPlayer && !actingPlayer.isAI;

  const humanPlayers = players.filter(p => !p.isAI);
  const hasHumanPlayers = humanPlayers.length > 0;

  const showWaitingForPlayers = !hasHumanPlayers && !showPlayerControls && !showActingPlayerPlaceholder;

  return (
    <div className='relative w-full h-10 flex-row items-center justify-center rounded-full bg-gray-900/90 overflow-hidden border border-gray-700'>
      {/* Keep GameNotification mounted for socket subscriptions */}
      <div className='hidden'><GameNotification /></div>

      {/* Turn timer progress bar */}
      {turnTimerProgress > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 bg-green-500 transition-all duration-100 ease-linear z-5"
          style={{ width: `${turnTimerProgress}%`, opacity: 0.8 }}
        />
      )}

      {/* Content Layer */}
      <div className='relative z-11 flex flex-1 h-full flex-row items-center justify-center rounded-full'>
        {showPlayerControls && (
          <PlayerControls onActionTaken={onActionTaken} />
        )}

        {showActingPlayerPlaceholder && (
          <div className='text-sm text-white/70 px-4'>
            Waiting for {actingPlayer.username}...
          </div>
        )}

        {showWaitingForPlayers && (
          <div className='text-sm text-white/70 px-4'>
            Waiting for players
          </div>
        )}
      </div>
    </div>
  );
}
