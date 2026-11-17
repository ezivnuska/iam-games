'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePlayers, useGameState, useViewers, usePokerActions } from '@/app/games/poker/lib/providers/poker-provider';
import { useUser, createGuestUser } from '@/app/lib/providers/user-provider';
import { useSocket } from '@/app/lib/providers/socket-provider';
import CommunalCards from './communal-cards';
import Pot from './pot';
import PokerDashboard from './poker-dashboard';
import PlayerRow from './player-row';
import LayoutToggle from './layout-toggle';
import GuestUsernameModal from './guest-username-modal';
import { StaleGameModal } from './stale-game-modal';
import { Button } from '@iam/ui';
import { getBlindPositions } from './player-slots';
import { useScreenOrientation } from '@/app/lib/hooks/use-screen-orientation';
import type { PokerLayout } from '@/app/games/poker/lib/hooks/use-poker-layout';

const MAX_SLOTS = 5;

interface PokerTableListProps {
    showPlayerControls: boolean;
    handleActionTaken: () => void;
    actionTriggered: boolean;
    showStaleModal: boolean;
    handleStaleReset: () => void;
    layout: PokerLayout;
    toggleLayout: () => void;
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
    layout,
    toggleLayout,
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

    const tablePanel = (
        <div className={isLandscape
            ? 'flex flex-col items-center justify-center gap-4 bg-green-900 border-l border-green-700 px-4 py-4 w-2/5'
            : 'flex flex-row items-center justify-center gap-6 px-4 py-3 bg-green-900 border-b border-green-700 min-h-[110px]'
        }>
            <Pot />
            <CommunalCards />
        </div>
    );

    const dashboard = (
        <div className='px-2 pb-2 pt-1 bg-gray-900 border-t border-gray-700'>
            <PokerDashboard showPlayerControls={showPlayerControls} onActionTaken={handleActionTaken} />
        </div>
    );

    return (
        <div className={`relative flex flex-1 bg-gray-900 h-dvh ${isLandscape ? 'flex-row' : 'flex-col'}`}>
            <LayoutToggle
                layout={layout}
                onToggle={toggleLayout}
                className='absolute top-2 right-2 z-[9999]'
            />

            {isLandscape ? (
                <>
                    {/* Landscape: players + controls on left, table panel on right */}
                    <div className='flex flex-1 flex-col min-h-0'>
                        <div className='flex flex-1 flex-col overflow-y-auto px-2 py-2 gap-1'>
                            {renderSlots()}
                        </div>
                        {dashboard}
                    </div>
                    {tablePanel}
                </>
            ) : (
                <>
                    {/* Portrait: table panel on top, players in middle, controls at bottom */}
                    {tablePanel}
                    <div className='flex flex-1 flex-col overflow-y-auto px-2 py-2 gap-1'>
                        {renderSlots()}
                    </div>
                    {dashboard}
                </>
            )}

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
