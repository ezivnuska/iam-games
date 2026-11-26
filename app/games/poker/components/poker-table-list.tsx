'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePlayers, useGameState, useViewers, usePokerActions } from '@/app/games/poker/lib/providers/poker-provider';
import { useUser, createGuestUser } from '@/app/lib/providers/user-provider';
import { useSocket } from '@/app/lib/providers/socket-provider';
import { useNotifications } from '@/app/games/poker/lib/providers/notification-provider';
import { usePlayerNotifications } from '@/app/games/poker/lib/providers/player-notification-provider';
import CommunalCards from './communal-cards';
import Pot from './pot';
import PokerDashboard from './poker-dashboard';
import PokerNotificationDisplay from './poker-notification-display';
import PlayerRow from './player-row';
import GuestUsernameModal from './guest-username-modal';
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
    const [progress, setProgress] = useState(100);

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

    useEffect(() => {
        if (!currentNotification) { setProgress(0); return; }
        const start = Date.now();
        const { duration } = currentNotification;
        const iv = setInterval(() => {
            const remaining = Math.max(0, duration - (Date.now() - start));
            setProgress((remaining / duration) * 100);
            if (remaining <= 0) clearInterval(iv);
        }, 16);
        return () => clearInterval(iv);
    }, [currentNotification]);

    if (!currentNotification || currentNotification.type === 'action') return null;

    const isWinner = currentNotification.metadata?.notificationType === 'winner_determined'
                  || currentNotification.metadata?.notificationType === 'game_tied';
    const showProgress = currentNotification.type !== 'deal'
                      && !isWinner
                      && progress > 0;

    return (
        <div className='absolute top-2 left-2 right-2 z-10'>
            <div className='relative w-full h-10 overflow-hidden rounded-full bg-green-900 border flex items-center justify-center'>
                {showProgress && (
                    <div
                        className='absolute left-0 top-0 bottom-0 bg-green-500 transition-all duration-100 ease-linear z-5'
                        style={{ width: `${progress}%`, opacity: 0.8 }}
                    />
                )}
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

function EmptySlotRow({ gameId, locked, onJoinGame, isClickable }: {
    gameId: string | null;
    locked: boolean;
    onJoinGame: (gameId: string, guestUsername?: string) => void;
    isClickable: boolean;
}) {
    const { user, status, setUser } = useUser();
    const { isConnected } = useSocket();
    const [showGuestModal, setShowGuestModal] = useState(false);

    const isAuthenticated = status === 'authenticated' || status === 'signing-out';
    const canClick = isClickable && isConnected;

    const handleClick = () => {
        if (!canClick || !gameId) return;
        if (isAuthenticated) {
            onJoinGame(gameId);
        } else {
            setShowGuestModal(true);
        }
    };

    const handleGuestSubmit = async (username: string) => {
        if (!gameId) return;
        const guestUser = createGuestUser();
        guestUser.username = username;
        try {
            localStorage.setItem('poker_guest_id', guestUser.id);
            localStorage.setItem('poker_guest_username', username);
            localStorage.setItem('poker_guest_created_at', new Date().toISOString());
        } catch (e) {
            console.warn('[EmptySlotRow] Failed to store guest credentials:', e);
        }
        setUser(guestUser);
        await new Promise(resolve => setTimeout(resolve, 100));
        onJoinGame(gameId, username);
        setShowGuestModal(false);
    };

    return (
        <>
            <button
                onClick={handleClick}
                disabled={!canClick}
                className={`flex h-12 w-full items-center gap-3 px-3 rounded-lg border border-dashed border-gray-600 text-gray-400 text-sm transition-colors ${
                    canClick ? 'hover:border-gray-400 hover:text-gray-200 cursor-pointer' : 'cursor-default opacity-40'
                }`}
            >
                {isClickable && (
                    <>
                        <span className='text-lg font-bold'>+</span>
                        <span>{isConnected ? 'Join game' : 'Connecting...'}</span>
                    </>
                )}
            </button>
            {showGuestModal && typeof document !== 'undefined' && createPortal(
                <GuestUsernameModal
                    isOpen={showGuestModal}
                    onClose={() => setShowGuestModal(false)}
                    onSubmit={handleGuestSubmit}
                    isGameLocked={locked}
                />,
                document.body
            )}
        </>
    );
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
    const { gameId } = useViewers();
    const { joinGame, resetSingleton } = usePokerActions();
    const { user } = useUser();

    const orientation = useScreenOrientation();
    const isLandscape = orientation === 'landscape';

    const isUserInGame = players.some(p => p.id === user?.id);
    const { smallBlindPos, bigBlindPos } = getBlindPositions(dealerButtonPosition, players.length);

    let firstEmptySlotFound = false;
    const slots = Array.from({ length: MAX_SLOTS }, (_, i) => {
        const player = players[i];
        if (!player) {
            const isFirstEmpty = !firstEmptySlotFound;
            firstEmptySlotFound = true;
            return { type: 'empty' as const, slotIndex: i, isFirstEmpty };
        }
        return { type: 'player' as const, slotIndex: i, player };
    });

    const renderSlots = () => slots.map(slot => {
        if (slot.type === 'empty') {
            return (
                <EmptySlotRow
                    key={`empty-${slot.slotIndex}`}
                    gameId={gameId}
                    locked={locked}
                    onJoinGame={joinGame}
                    isClickable={slot.isFirstEmpty && !isUserInGame}
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
            {/* Game area — 60% */}
            <div className={`relative flex flex-col flex-[3] min-h-0 min-w-0 ${isLandscape ? 'border-r border-green-700' : 'border-b border-green-700'}`}>
                <NotificationBar />
                <div className='flex flex-1 min-h-0 flex-col items-center justify-center gap-4 bg-green-900 px-4 py-4'>
                    <Pot />
                    <CommunalCards />
                </div>
                {/* Player controls overlay — always mounted so GameNotification socket sub stays alive */}
                <div className={showPlayerControls ? 'absolute bottom-3 left-4 right-4 z-20' : 'hidden'}>
                    <PokerDashboard showPlayerControls={showPlayerControls} onActionTaken={handleActionTaken} />
                </div>
            </div>

            {/* Player list — 40% */}
            <div className='flex flex-col flex-[2] min-h-0 overflow-y-auto px-2 py-2 gap-1'>
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
