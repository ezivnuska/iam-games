// app/lib/utils/socket-helper.ts

import { emitViaAPI } from '@/app/api/socket/io';
import { SOCKET_EVENTS } from '@/app/lib/socket/events';
import { serializeGame } from './game-serialization';
import type { PokerGameDocument } from '@/app/games/poker/lib/models/poker-game';
import type { PokerNotificationPayload } from '@/app/lib/socket/events';

export class PokerSocketEmitter {
  static async emitStateUpdate(game: PokerGameDocument | any) {
    const serialized = serializeGame(game);
    await emitViaAPI(SOCKET_EVENTS.POKER_STATE_UPDATE, serialized);
  }

  static async emitGameCreated(game: PokerGameDocument | any) {
    const serialized = serializeGame(game);
    await emitViaAPI(SOCKET_EVENTS.POKER_GAME_CREATED, serialized);
  }

  static async emitGameDeleted(gameId: string) {
    await emitViaAPI(SOCKET_EVENTS.POKER_GAME_DELETED, { gameId });
  }

  static async emitPlayerJoined(payload: {
    player: any; players: any[]; playerCount: number; lockTime?: string; actionHistory: any[];
  }) {
    await emitViaAPI(SOCKET_EVENTS.POKER_PLAYER_JOINED, payload);
  }

  static async emitPlayerLeft(payload: {
    playerId: string; players: any[]; playerCount: number; gameReset?: boolean; actionHistory: any[];
  }) {
    await emitViaAPI(SOCKET_EVENTS.POKER_PLAYER_LEFT, payload);
  }

  static async emitPlayerPresenceUpdated(payload: { playerId: string; isAway: boolean }) {
    await emitViaAPI(SOCKET_EVENTS.POKER_PLAYER_PRESENCE_UPDATED, payload);
  }

  static async emitGameLocked(payload: {
    locked: true; stage: number; players: any[]; currentPlayerIndex: number;
    lockTime?: string; pot?: any[]; playerBets?: number[]; actionHistory?: any[];
  }) {
    await emitViaAPI(SOCKET_EVENTS.POKER_GAME_LOCKED, payload);
  }

  static async emitGameUnlocked(payload: {
    locked: false; stage: number; dealerButtonPosition: number;
  }) {
    await emitViaAPI(SOCKET_EVENTS.POKER_GAME_UNLOCKED, payload);
  }

  static async emitGameRestart(payload: {
    stage: number; locked: boolean; players: any[]; communalCards: any[];
    pot: any[]; playerBets: number[]; currentPlayerIndex: number;
    dealerButtonPosition?: number; actionHistory: any[]; winner?: any;
  }) {
    await emitViaAPI(SOCKET_EVENTS.POKER_STATE_UPDATE, payload);
  }

  static async emitBetPlaced(payload: {
    playerIndex: number; chipCount: number; pot: any[]; playerBets: number[];
    currentPlayerIndex: number; actionHistory: any[]; players?: any[];
  }) {
    await emitViaAPI(SOCKET_EVENTS.POKER_BET_PLACED, payload);
  }

  static async emitCardsDealt(payload: {
    stage: number; communalCards: any[]; deckCount: number;
    players?: any[]; currentPlayerIndex?: number;
  }) {
    await emitViaAPI(SOCKET_EVENTS.POKER_CARDS_DEALT, payload);
  }

  static async emitRoundComplete(payload: { winner: any; players: any[] }) {
    await emitViaAPI(SOCKET_EVENTS.POKER_ROUND_COMPLETE, payload);
  }

  static async emitDealerButtonMoved(payload: { dealerButtonPosition: number }) {
    await emitViaAPI(SOCKET_EVENTS.POKER_DEALER_BUTTON_MOVED, payload);
  }

  static async emitTimerStarted(payload: {
    startTime: string; duration: number; currentActionIndex: number;
    totalActions: number; actionType: string; targetPlayerId?: string;
  }) {
    await emitViaAPI(SOCKET_EVENTS.POKER_ACTION_TIMER_STARTED, payload);
  }

  static async emitTimerPaused(payload: { pausedAt: string; remainingSeconds: number }) {
    await emitViaAPI(SOCKET_EVENTS.POKER_ACTION_TIMER_PAUSED, payload);
  }

  static async emitTimerResumed(payload: {
    resumedAt: string; duration: number; currentActionIndex: number;
    totalActions: number; actionType: string; targetPlayerId?: string;
  }) {
    await emitViaAPI(SOCKET_EVENTS.POKER_ACTION_TIMER_RESUMED, payload);
  }

  static async emitTimerCleared() {
    await emitViaAPI(SOCKET_EVENTS.POKER_ACTION_TIMER_CLEARED, {});
  }

  static async emitTimerActionSet(payload: {
    playerId: string; action: 'fold' | 'call' | 'check' | 'bet' | 'raise';
  }) {
    await emitViaAPI(SOCKET_EVENTS.POKER_ACTION_TIMER_ACTION_SET, payload);
  }

  static async emitGameNotification(payload: {
    message: string; type: 'blind' | 'deal' | 'action' | 'info';
    duration?: number; excludeUserId?: string;
  }) {
    const { excludeUserId, ...data } = payload;
    await emitViaAPI(SOCKET_EVENTS.POKER_GAME_NOTIFICATION, data, undefined, excludeUserId);
  }

  static async emitGameActionResults(results: {
    betPlaced?: any; cardsDealt?: any; roundComplete?: any;
  }) {
    if (results.betPlaced) await this.emitBetPlaced(results.betPlaced);
    if (results.cardsDealt) await this.emitCardsDealt(results.cardsDealt);
    if (results.roundComplete) await this.emitRoundComplete(results.roundComplete);
  }

  static async emitNotification(payload: PokerNotificationPayload, excludeUserId?: string) {
    return await emitViaAPI(SOCKET_EVENTS.POKER_NOTIFICATION, payload, undefined, excludeUserId);
  }

  static async emitNotificationCanceled() {
    return await emitViaAPI(SOCKET_EVENTS.POKER_NOTIFICATION_CANCELED, {});
  }

  static async emitGameStaleReset() {
    return await emitViaAPI(SOCKET_EVENTS.POKER_GAME_STALE_RESET, {});
  }
}

export function isPlayerConnected(playerId: string, playerUsername?: string): boolean {
  const io = (global as any).io;
  if (!io) return false;

  const sockets = Array.from(io.sockets.sockets.values());
  let isConnected = sockets.some((socket: any) => socket.userId === playerId);

  if (!isConnected && playerUsername && playerId.startsWith('guest-')) {
    isConnected = sockets.some((socket: any) =>
      socket.username === playerUsername &&
      (socket.userId === 'guest-pending' || socket.userId?.startsWith('guest-'))
    );
  }

  return isConnected;
}
