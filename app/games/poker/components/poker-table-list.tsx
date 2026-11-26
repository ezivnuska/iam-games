'use client';

import { useEffect } from 'react';
import { usePlayers, useGameState, useViewers, usePokerActions } from '@/app/games/poker/lib/providers/poker-provider';
import { useUser } from '@/app/lib/providers/user-provider';
import { useNotifications } from '@/app/games/poker/lib/providers/notification-provider';
import { usePlayerNotifications } from '@/app/games/poker/lib/providers/player-notification-provider';
import CommunalCards from './communal-cards';
import Pot from './pot';
import PokerDashboard from './poker-dashboard';
import PokerNotificationDisplay from './poker-notification-display';
import PlayerRow from './player-row';
import { StaleGameModal } from './stale-game-modal';
import { Button } from '@iam/ui';
import { useScreenOrientation } from '@/app/lib/hooks/use-screen-orientation';

const MAX_SLOTS = 5;

const ACTION_LABELS: Partial<Record<string, string>> = {
    player_bet: 'Bet',
    player_raise: 'Raised',
    player_call: 'Called',
    player_check: 'Checked',
    player_fold: 'Folded',
    player_all_in: 'All-In',
};

function NotificationBar() {
    const { currentNotification } = useNotifications();
    const { showPlayerNotification, clearAllPlayerNotifications } = usePlayerNotifications();

    // Bridge: sync action notifications to per-player state; clear on stage advance
    useEffect(() => {
        if (!currentNotification) return;
        const { type, metadata } = currentNotification;
        if (type === 'action' && metadata?.playerId) {
            const label = ACTION_LABELS[metadata.notificationType];
            if (label) {
                showPlayerNotification({
                    playerId: metadata.playerId,
                    message: label,
                    timestamp: Date.now(),
                });
            }
        }
        if (metadata?.notificationType === 'stage_advanced') {
            clearAllPlayerNotifications();
        }
    }, [currentNotification?.id]);

    if (!currentNotification || currentNotification.type === 'action') return null;

    return (
        <div className='absolute top-0 left-0 right-0 z-10'>
            <div className='w-full h-10 bg-gray-900/90 flex items-center justify-center'>
                <PokerNotificationDisplay notification={currentNotification} />
            </div>
        </div>
    );
}

function getBlindPositions(dealerButtonPosition: number, playerCount: number) {
    if (playerCount < 2) return { smallBlindPos: -1, bigBlindPos: -1 };
    const smallBlindPos = playerCount === 2
        ? dealerButtonPosition
        : (dealerButtonPosition + 1) % playerCount;
    const bigBlindPos = playerCount === 2
        ? (dealerButtonPosition + 1) % playerCount
        : (dealerButtonPosition + 2) % playerCount;
    return { smallBlindPos, bigBlindPos };
}

interface PokerTableListProps {
    showPlayerControls: boolean;
    handleActionTaken: () => void;
    actionTriggered: boolean;
    showStaleModal: boolean;
    handleStaleReset: () => void;
}

export default function PokerTableList({
    showPlayerControls,
    handleActionTaken,
    actionTriggered,
    showStaleModal,
    handleStaleReset,
}: PokerTableListProps) {
    const { players } = usePlayers();
    const { locked, currentPlayerIndex, dealerButtonPosition } = useGameState();
    const hasHumanPlayers = players.some(p => !p.isAI);
    const { gameId } = useViewers();
    const { resetSingleton } = usePokerActions();
    const { user } = useUser();

    const orientation = useScreenOrientation();
    const isLandscape = orientation === 'landscape';

    const { smallBlindPos, bigBlindPos } = getBlindPositions(dealerButtonPosition, players.length);

    const slots = Array.from({ length: MAX_SLOTS }, (_, i) => {
        const player = players[i];
        if (!player) return { type: 'empty' as const, slotIndex: i };
        return { type: 'player' as const, slotIndex: i, player };
    });

    const renderSlots = () => slots.map(slot => {
        if (slot.type === 'empty') {
            return (
                <div
                    key={`empty-${slot.slotIndex}`}
                    className='flex h-12 w-full rounded-lg border border-dashed border-gray-600 opacity-30'
                />
            );
        }
        const isCurrentUser = user?.id === slot.player.id;
        return (
            <PlayerRow
                key={slot.player.id}
                player={slot.player}
                index={slot.slotIndex}
                currentPlayerIndex={currentPlayerIndex}
                isCurrentUser={isCurrentUser}
                isDealer={slot.slotIndex === dealerButtonPosition}
                isSmallBlind={slot.slotIndex === smallBlindPos}
                isBigBlind={slot.slotIndex === bigBlindPos}
                actionTriggered={actionTriggered}
            />
        );
    });

    return (
        <div className={`relative flex flex-1 min-h-0 bg-gray-900 ${isLandscape ? 'flex-row' : 'flex-col'}`}>
            {/* Game area — 20% pre-game, 50% in-game */}
            <div
                className={`relative flex flex-col min-h-0 min-w-0 transition-[flex-basis] duration-300 ease-in-out ${isLandscape ? 'border-r border-green-700' : 'border-b border-green-700'}`}
                style={{ flexGrow: 1, flexShrink: 1, flexBasis: (hasHumanPlayers || locked) ? '50%' : '20%' }}
            >
                <NotificationBar />
                <div className='flex flex-1 min-h-0 flex-col items-center justify-center gap-4 bg-green-900 px-4 py-4'>
                    <Pot />
                    <CommunalCards />
                </div>
                {/* Player controls overlay — always mounted so GameNotification socket sub stays alive */}
                <div className={showPlayerControls ? 'absolute bottom-0 left-0 right-0 z-20' : 'hidden'}>
                    <PokerDashboard showPlayerControls={showPlayerControls} onActionTaken={handleActionTaken} />
                </div>
            </div>

            {/* Player list — 80% pre-game, 50% in-game */}
            <div
                className='flex flex-col min-h-0 overflow-y-auto px-2 py-2 gap-1 transition-[flex-basis] duration-300 ease-in-out'
                style={{ flexGrow: 1, flexShrink: 1, flexBasis: (hasHumanPlayers || locked) ? '50%' : '80%' }}
            >
                {renderSlots()}
            </div>

            {gameId && (
                <Button
                    onClick={resetSingleton}
                    size='sm'
                    className='cursor-pointer bg-red-600 hover:bg-red-700 text-white absolute bottom-14 right-1 z-[9999]'
                >
                    X
                </Button>
            )}

            {showStaleModal && <StaleGameModal onResetTriggered={handleStaleReset} />}
        </div>
    );
}
