'use client';

import { useMemo } from 'react';
import { usePlayers, useGameState, useViewers, usePokerActions } from '@/app/games/poker/lib/providers/poker-provider';
import { useUser } from '@/app/lib/providers/user-provider';
import PlayerSlots from './player-slots';
import CommunalCards from './communal-cards';
import Pot from './pot';
import PokerDashboard from './poker-dashboard';
import { Button } from '@iam/ui';
import { useScreenOrientation } from '@/app/lib/hooks/use-screen-orientation';
import { StaleGameModal } from './stale-game-modal';
import LayoutToggle from './layout-toggle';
import clsx from 'clsx';
import { PageContent } from '@iam/ui';
import type { PokerLayout } from '@/app/games/poker/lib/hooks/use-poker-layout';

interface PokerTableClassicProps {
    showPlayerControls: boolean;
    handleActionTaken: () => void;
    actionTriggered: boolean;
    showStaleModal: boolean;
    handleStaleReset: () => void;
    layout: PokerLayout;
    toggleLayout: () => void;
}

export default function PokerTableClassic({
    showPlayerControls,
    handleActionTaken,
    actionTriggered,
    showStaleModal,
    handleStaleReset,
    layout,
    toggleLayout,
}: PokerTableClassicProps) {
    const { players } = usePlayers();
    const { locked, currentPlayerIndex } = useGameState();
    const { gameId } = useViewers();
    const { joinGame, leaveGame, resetSingleton } = usePokerActions();
    const { user } = useUser();
    const orientation = useScreenOrientation();

    const isUserInGame = useMemo(
        () => players.some(p => p.id === user?.id),
        [players, user?.id]
    );

    return (
        <div className='flex flex-1 flex-row items-start justify-center max-h-dvh gap-2 relative bg-green-700 h-full'>
            <PageContent fullscreen>
                <LayoutToggle
                    layout={layout}
                    onToggle={toggleLayout}
                    className='absolute top-2 right-14 z-[9999]'
                />
                <div className={clsx('flex flex-1 flex-col w-full h-dvh min-h-[300px] relative', {
                    'min-h-[320px] min-w-[580px]': orientation === 'landscape',
                })}>
                    {/* Player slots */}
                    <div className={clsx('flex flex-1 w-full z-15', {
                        'z-5': isUserInGame,
                        'max-h-[44%] px-4': orientation === 'landscape',
                    })}>
                        <PlayerSlots
                            players={players}
                            locked={locked}
                            currentPlayerIndex={currentPlayerIndex}
                            currentUser={user}
                            gameId={gameId}
                            onJoinGame={joinGame}
                            onLeaveGame={leaveGame}
                            actionTriggered={actionTriggered}
                        />
                    </div>

                    {/* Main table area */}
                    <div className={clsx('absolute right-0 bottom-0 left-0 z-5 h-[53%]', {
                        'z-15': isUserInGame,
                        'h-[64%]': orientation === 'landscape',
                    })}>
                        <div className='flex flex-1 h-full flex-col items-center justify-center'>
                            <div className={clsx('flex flex-col w-11/12 items-center justify-center py-2', {
                                'w-[60%]': orientation === 'landscape',
                            })}>
                                <Pot />
                                <PokerDashboard
                                    showPlayerControls={showPlayerControls}
                                    onActionTaken={handleActionTaken}
                                />
                            </div>
                            <div className='flex flex-1 flex-row items-center'>
                                <CommunalCards />
                            </div>
                        </div>
                    </div>
                </div>

                {gameId && (
                    <Button
                        onClick={resetSingleton}
                        size='sm'
                        className='cursor-pointer bg-red-600 hover:bg-red-700 text-white absolute bottom-1 right-1 z-100'
                    >
                        X
                    </Button>
                )}

                {showStaleModal && <StaleGameModal onResetTriggered={handleStaleReset} />}
            </PageContent>
        </div>
    );
}
