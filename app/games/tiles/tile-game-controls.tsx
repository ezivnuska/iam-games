'use client';

import { useMemo, useState } from 'react';
import { Button, Modal, UserAvatar, useHorizontalLayout } from '@iam/ui';
import { useSmallScreen } from '@/app/lib/hooks/use-small-screen';
import { useTiles } from '@/app/lib/providers/tile-provider';
import { GameStatus } from '@/app/lib/definitions/tiles';
import Leaderboard from './leaderboard';
import {
    PauseCircleIcon,
    PlayCircleIcon,
    StopCircleIcon,
} from '@heroicons/react/24/solid';

export default function TileGameControls() {
    const { scores, status, ticks, time, setStatus, clearScores } = useTiles();
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const isLandscape = useHorizontalLayout() === true;
    const isSmallScreen = useSmallScreen();

    const topScore = useMemo(() => scores.length > 0 ? scores[0] : null, [scores]);

    const startPlay = () => setStatus(GameStatus.START);
    const unpause = () => setStatus(GameStatus.PLAYING);
    const pause = () => setStatus(GameStatus.PAUSED);
    const reset = () => setStatus(GameStatus.IDLE);

    const handleClearScores = async () => {
        await clearScores();
        setShowLeaderboard(false);
    };

    const hideLabel = isLandscape && isSmallScreen;

    const renderButton = () => {
        switch (status) {
            case GameStatus.IDLE:
                return (
                    <Button onClick={startPlay} variant='link' className='gap-2'>
                        <PlayCircleIcon className='w-8 h-8' />
                        {!hideLabel && <span className='text-lg'>Play</span>}
                    </Button>
                );
            case GameStatus.PLAYING:
                return (
                    <Button onClick={pause} variant='link' className='gap-2'>
                        <PauseCircleIcon className='w-8 h-8' />
                        {!hideLabel && <span className='text-lg'>Pause</span>}
                    </Button>
                );
            case GameStatus.PAUSED:
                return (
                    <>
                        <Button onClick={unpause} variant='link' className='gap-2'>
                            <PlayCircleIcon className='w-8 h-8' />
                            {!hideLabel && <span className='text-lg'>Resume</span>}
                        </Button>
                        <Button onClick={reset} variant='link' className='text-red-500 gap-2'>
                            <StopCircleIcon className='w-8 h-8' />
                            {!hideLabel && <span className='text-lg'>Quit</span>}
                        </Button>
                    </>
                );
            case GameStatus.RESOLVED:
                return (
                    <Button onClick={startPlay} variant='default' className='gap-2'>
                        {!hideLabel && 'Play again'}
                    </Button>
                );
            default:
                return null;
        }
    };

    const leaderboardButton = topScore && (
        <button
            onClick={() => setShowLeaderboard(true)}
            className='flex flex-col items-center justify-center gap-1 hover:opacity-80 transition-opacity'
        >
            <div className='flex items-center gap-1'>
                <span className='font-bold text-sm'>Fastest</span>
                <span className='text-sm'>›</span>
            </div>
            <div className='flex items-center gap-2'>
                <div className='w-8 h-8'>
                    <UserAvatar
                        username={topScore.user.username}
                        avatar={topScore.user.avatar}
                    />
                </div>
                <span className='text-sm'>{topScore.score}</span>
            </div>
        </button>
    );

    if (isLandscape) {
        return (
            <div className='flex flex-col justify-between h-full w-full py-4 px-1'>
                <div className='flex flex-col gap-2'>
                    {renderButton()}
                    {ticks > 0 && time && (
                        <span className='font-bold text-xl'>{time}</span>
                    )}
                </div>
                {leaderboardButton}
                {showLeaderboard && (
                    <Modal
                        onClose={() => setShowLeaderboard(false)}
                        position='fixed'
                        showCloseButton
                    >
                        <div className='bg-white rounded-lg p-6 max-w-md w-full'>
                            <Leaderboard scores={scores} clearScores={handleClearScores} />
                            <div className='mt-6'>
                                <Button
                                    onClick={() => setShowLeaderboard(false)}
                                    variant='ghost'
                                    className='w-full'
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        );
    }

    return (
        <div className='flex flex-row items-center w-full py-4 px-2'>
            <div className='flex-1 flex justify-start'>
                {leaderboardButton}
            </div>
            <div className='flex-1 flex justify-center'>
                {ticks > 0 && time && (
                    <span className='font-bold text-xl'>{time}</span>
                )}
            </div>
            <div className='flex-1 flex justify-end'>
                {renderButton()}
            </div>
            {showLeaderboard && (
                <Modal
                    onClose={() => setShowLeaderboard(false)}
                    position='fixed'
                    showCloseButton
                >
                    <div className='bg-white rounded-lg p-6 max-w-md w-full'>
                        <Leaderboard scores={scores} clearScores={handleClearScores} />
                        <div className='mt-6'>
                            <Button
                                onClick={() => setShowLeaderboard(false)}
                                variant='ghost'
                                className='w-full'
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
