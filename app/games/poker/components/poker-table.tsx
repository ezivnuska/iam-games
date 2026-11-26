// app/poker/components/poker-table.tsx

'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageContent } from '@iam/ui';
import { useSetTitle, useSetScreenLayout, useSetLeaveHandler } from '@/app/lib/providers/title-provider';
import { usePlayers, useGameState, usePokerActions, useViewers } from '@/app/games/poker/lib/providers/poker-provider';
import { useUser, createGuestUser } from '@/app/lib/providers/user-provider';
import { useSocket } from '@/app/lib/providers/socket-provider';
import { SOCKET_EVENTS } from '@/app/lib/socket/events';
import type { PokerNotificationPayload } from '@/app/lib/socket/events';
import type { User } from '@/app/lib/definitions';
import { UserRole } from '@/app/lib/definitions/user';
import PokerTableList from './poker-table-list';

export default function PokerTable() {
  useSetTitle('Poker');
  useSetScreenLayout('game');
  const { players } = usePlayers();
  const { stage, locked, currentPlayerIndex, winner, isLoading, canPlayerAct, setSelectedAction } = useGameState();
  const { gameId } = useViewers();
  const { setTurnTimerAction, leaveGame } = usePokerActions();
  const { user, status, setUser } = useUser();
  const { socket } = useSocket();
  const router = useRouter();
  // Restore guest user from localStorage on page load (for reconnection after refresh)
  const [guestRestorationComplete, setGuestRestorationComplete] = useState(false);

  useEffect(() => {
    if (status !== 'unauthenticated') {
      if (status === 'authenticated') setGuestRestorationComplete(true);
      return;
    }
    if (user) {
      setGuestRestorationComplete(true);
      return;
    }
    try {
      const storedGuestId = localStorage.getItem('poker_guest_id');
      const storedGuestUsername = localStorage.getItem('poker_guest_username');
      const storedCreatedAt = localStorage.getItem('poker_guest_created_at');

      if (storedGuestId && storedGuestUsername) {
        const EXPIRATION_DAYS = 30;
        const isExpired = storedCreatedAt
          ? (Date.now() - new Date(storedCreatedAt).getTime()) > (EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
          : false;

        if (isExpired) {
          localStorage.removeItem('poker_guest_id');
          localStorage.removeItem('poker_guest_username');
          localStorage.removeItem('poker_guest_created_at');
          setGuestRestorationComplete(true);
          return;
        }

        const guestUser: User = {
          id: storedGuestId,
          username: storedGuestUsername,
          email: '',
          role: UserRole.User,
          bio: '',
          avatar: null,
          verified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isGuest: true,
        };
        setUser(guestUser);
      }
      setGuestRestorationComplete(true);
    } catch (e) {
      console.warn('[PokerTable] Failed to restore guest user from localStorage:', e);
      setGuestRestorationComplete(true);
    }
  }, [status, user, setUser]);

  // Listen for stale game reset from server
  const [showStaleModal, setShowStaleModal] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const handleStale = () => setShowStaleModal(true);
    socket.on(SOCKET_EVENTS.POKER_GAME_STALE_RESET, handleStale);
    return () => { socket.off(SOCKET_EVENTS.POKER_GAME_STALE_RESET, handleStale); };
  }, [socket]);

  const handleStaleReset = () => window.location.reload();

  // Track if an action has been triggered during the current turn
  const [actionTriggered, setActionTriggered] = useState(false);
  const prevPlayerIndexRef = useRef(currentPlayerIndex);
  const prevStageRef = useRef(stage);

  const userGameInfo = useMemo(() => {
    const currentUserPlayerIndex = players.findIndex(p => p.id === user?.id);
    const isUserInGame = currentUserPlayerIndex !== -1;
    const currentPlayer = players[currentPlayerIndex];
    return {
      isUserInGame,
      currentUserPlayerIndex,
      isUserTurn: currentUserPlayerIndex === currentPlayerIndex && !currentPlayer?.isAI,
    };
  }, [players, user?.id, currentPlayerIndex]);

  const handleLeave = useCallback(() => {
    if (userGameInfo.isUserInGame && gameId) {
      const gameInProgress = locked && !winner;
      if (gameInProgress) {
        try { localStorage.setItem('poker_pending_leave', gameId); } catch {}
        setTurnTimerAction('fold');
      } else {
        leaveGame();
      }
    }
    router.push('/');
  }, [userGameInfo.isUserInGame, gameId, locked, winner, setTurnTimerAction, leaveGame, router]);

  useSetLeaveHandler(userGameInfo.isUserInGame ? handleLeave : null);

  // On return: if a pending leave flag exists for this game, pre-select fold (still active)
  // or auto-leave (game has since ended/reset). Falls back to winner check for no-Leave navigations.
  useEffect(() => {
    if (isLoading || !guestRestorationComplete || !gameId) return;

    let pendingGameId: string | null = null;
    try { pendingGameId = localStorage.getItem('poker_pending_leave'); } catch {}

    if (pendingGameId === gameId && userGameInfo.isUserInGame) {
      const gameInProgress = locked && !winner;
      if (gameInProgress) {
        setSelectedAction('fold');
      } else {
        try { localStorage.removeItem('poker_pending_leave'); } catch {}
        leaveGame();
      }
      return;
    }
    if (pendingGameId === gameId && !userGameInfo.isUserInGame) {
      try { localStorage.removeItem('poker_pending_leave'); } catch {}
      return;
    }

    // Fallback: auto-leave if game ended and player is still listed (navigated away without Leave)
    if (winner && userGameInfo.isUserInGame) {
      leaveGame();
    }
  }, [isLoading, guestRestorationComplete, gameId, userGameInfo.isUserInGame, locked, winner, setSelectedAction, leaveGame]);

  useEffect(() => {
    if (currentPlayerIndex !== prevPlayerIndexRef.current) {
      setActionTriggered(false);
      prevPlayerIndexRef.current = currentPlayerIndex;
    }
  }, [currentPlayerIndex]);

  useEffect(() => {
    if (stage !== prevStageRef.current) {
      setActionTriggered(false);
      prevStageRef.current = stage;
    }
  }, [stage]);

  useEffect(() => {
    if (!socket || !user?.id) return;
    const handleTimerAction = (payload: PokerNotificationPayload) => {
      if (payload.timerTriggered && payload.playerId === user.id) setActionTriggered(true);
    };
    socket.on(SOCKET_EVENTS.POKER_NOTIFICATION, handleTimerAction);
    return () => { socket.off(SOCKET_EVENTS.POKER_NOTIFICATION, handleTimerAction); };
  }, [socket, user?.id]);

  const showPlayerControls = locked && canPlayerAct && !actionTriggered && !winner && stage < 4;
  const handleActionTaken = () => {
    setActionTriggered(true);
    try { localStorage.removeItem('poker_pending_leave'); } catch {}
  };

  useEffect(() => {
    const prev = document.body.style.overscrollBehavior
    const prevHtml = document.documentElement.style.overscrollBehavior
    document.body.style.overscrollBehavior = 'none'
    document.documentElement.style.overscrollBehavior = 'none'
    let startX = 0, startY = 0
    const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX
      const dy = e.touches[0].clientY - startY
      if (Math.abs(dx) > Math.abs(dy) && (startX < 30 || startX > window.innerWidth - 30))
        e.preventDefault()
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      document.body.style.overscrollBehavior = prev
      document.documentElement.style.overscrollBehavior = prevHtml
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  if (isLoading || !guestRestorationComplete) return null;

  return (
    <PageContent scrollable={false} fullscreen>
      <PokerTableList
        showPlayerControls={showPlayerControls}
        handleActionTaken={handleActionTaken}
        actionTriggered={actionTriggered}
        showStaleModal={showStaleModal}
        handleStaleReset={handleStaleReset}
      />
    </PageContent>
  );
}
