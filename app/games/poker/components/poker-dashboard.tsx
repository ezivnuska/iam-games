// app/poker/components/poker-dashboard.tsx

'use client';

import { useGameState, usePlayers } from '@/app/games/poker/lib/providers/poker-provider';
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

  const actingPlayer = actionTimer?.targetPlayerId
    ? players.find(p => p.id === actionTimer.targetPlayerId)
    : null;

  const showActingPlayerPlaceholder = !showPlayerControls && actingPlayer && !actingPlayer.isAI;

  const humanPlayers = players.filter(p => !p.isAI);
  const hasHumanPlayers = humanPlayers.length > 0;

  const showWaitingForPlayers = !hasHumanPlayers && !showPlayerControls && !showActingPlayerPlaceholder;

  return (
    <div className='w-full h-10 bg-gray-900/90 flex items-center justify-center'>
      {/* Keep GameNotification mounted for socket subscriptions */}
      <div className='hidden'><GameNotification /></div>

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
  );
}
