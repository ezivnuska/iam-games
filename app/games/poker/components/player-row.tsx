'use client';

import clsx from 'clsx';
import { UserAvatar } from '@iam/ui';
import Hand from './player-hand';
import PlayerConnectionStatus from './player-connection-status';
import { useGameState } from '@/app/games/poker/lib/providers/poker-provider';
import { useActionTimerPercentage } from '@/app/games/poker/lib/hooks/use-action-timer-percentage';
import { usePlayerNotifications } from '@/app/games/poker/lib/providers/player-notification-provider';
import type { Player } from '@/app/games/poker/lib/definitions/poker';

interface PlayerRowProps {
    player: Player;
    index: number;
    currentPlayerIndex: number;
    isCurrentUser: boolean;
    isDealer: boolean;
    isSmallBlind: boolean;
    isBigBlind: boolean;
    actionTriggered: boolean;
}

export default function PlayerRow({
    player,
    index,
    currentPlayerIndex,
    isCurrentUser,
    isDealer,
    isSmallBlind,
    isBigBlind,
    actionTriggered,
}: PlayerRowProps) {
    const { winner, actionTimer, locked } = useGameState();
    const { getPlayerNotification } = usePlayerNotifications();
    const isCurrentPlayer = index === currentPlayerIndex;
    const isWinner = player.id === winner?.winnerId;

    const timerForCurrentPlayer = isCurrentPlayer ? actionTimer : undefined;
    const timePercentage = useActionTimerPercentage(timerForCurrentPlayer, player.id);
    const showTimer = timePercentage > 0;

    const actionLabel = getPlayerNotification(player.id)?.message;

    return (
        <div className={clsx(
            'relative flex items-center gap-3 px-3 py-2 rounded-lg border-l-4 overflow-hidden transition-opacity duration-300',
            {
                'opacity-50': player.isAway || player.folded,
                'border-white bg-black/60': isCurrentPlayer && !player.folded,
                'border-transparent bg-black/30': !isCurrentPlayer || player.folded,
                'border-yellow-400': isWinner,
            }
        )}>
            {/* Timer bar along the bottom */}
            {showTimer && (
                <div
                    className='absolute bottom-0 left-0 h-0.5 bg-yellow-400 transition-all duration-100'
                    style={{ width: `${timePercentage}%` }}
                />
            )}

            {/* Avatar */}
            <div className='w-8 h-8 shrink-0'>
                <UserAvatar username={player.username} isAI={player.isAI} />
            </div>

            {/* Username + badges */}
            <div className='flex flex-col min-w-0 flex-1'>
                <div className='flex items-center gap-1.5 flex-wrap'>
                    <span className='text-sm text-white font-medium truncate'>{player.username}</span>
                    {isDealer && locked && !winner && (
                        <span className='flex items-center justify-center w-4 h-4 rounded-full bg-yellow-500 text-black text-[10px] font-bold shrink-0'>D</span>
                    )}
                    {isSmallBlind && locked && !winner && (
                        <span className='flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold shrink-0'>S</span>
                    )}
                    {isBigBlind && locked && !winner && (
                        <span className='flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold shrink-0'>B</span>
                    )}
                    <PlayerConnectionStatus playerId={player.id} lastHeartbeat={player.lastHeartbeat} isCurrentPlayer={isCurrentPlayer} />
                </div>
                <div className='flex items-center gap-1'>
                    {player.isAllIn && !winner ? (
                        <span className='text-white px-1 py-0.5 bg-red-500 rounded text-[10px] font-bold'>ALL-IN</span>
                    ) : (
                        <span className='text-xs text-gray-400'>{player.chipCount}</span>
                    )}
                    {actionLabel && !player.isAllIn && (
                        <span className='text-xs text-white/50'>· {actionLabel}</span>
                    )}
                </div>
            </div>

            {/* Hand */}
            {player.hand.length > 0 && !player.folded && (
                <div className='shrink-0'>
                    <Hand cards={player.hand} hidden={!(isCurrentUser || !!winner)} />
                </div>
            )}
        </div>
    );
}
