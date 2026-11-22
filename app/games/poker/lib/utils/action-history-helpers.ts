// app/lib/utils/action-history-helpers.ts

import { randomBytes } from 'crypto';
import { ActionHistoryType } from '@/app/games/poker/lib/definitions/action-history';
import type { PokerGameDocument } from '@/app/games/poker/lib/models/poker-game';

/**
 * Add an action to the game's action history with automatic ID and timestamp
 * Handles Mongoose markModified for proper document tracking
 *
 * @param game - The poker game document to update
 * @param actionType - Type of action being logged
 * @param additionalData - Optional extra fields to include in the action entry
 */
export function addActionToHistory(
  game: PokerGameDocument,
  actionType: ActionHistoryType,
  additionalData: Record<string, unknown> = {}
): void {
  game.actionHistory.push({
    id: randomBytes(8).toString('hex'),
    timestamp: new Date(),
    stage: game.stage,
    actionType,
    ...additionalData
  });
  game.markModified('actionHistory');
}

/**
 * Log a player bet action
 */
export function logBetAction(
  game: PokerGameDocument,
  playerId: string,
  playerName: string,
  chipAmount: number
): void {
  addActionToHistory(game, ActionHistoryType.PLAYER_BET, {
    playerId,
    playerName,
    chipAmount,
    isBlind: false, // Explicitly mark as NOT a blind action
  });
}

/**
 * Log a player fold action
 */
export function logFoldAction(
  game: PokerGameDocument,
  playerId: string,
  playerName: string
): void {
  addActionToHistory(game, ActionHistoryType.PLAYER_FOLD, {
    playerId,
    playerName,
  });
}

/**
 * Log a player join action
 */
export function logPlayerJoinAction(
  game: PokerGameDocument,
  playerId: string,
  playerName: string
): void {
  addActionToHistory(game, ActionHistoryType.PLAYER_JOINED, {
    playerId,
    playerName,
  });
}

/**
 * Log a player left action
 */
export function logPlayerLeftAction(
  game: PokerGameDocument,
  playerId: string,
  playerName: string
): void {
  addActionToHistory(game, ActionHistoryType.PLAYER_LEFT, {
    playerId,
    playerName,
  });
}

/**
 * Log a game started action
 */
export function logGameStartedAction(game: PokerGameDocument): void {
  addActionToHistory(game, ActionHistoryType.GAME_STARTED);
}

/**
 * Log a game restart action (uses GAME_STARTED type)
 */
export function logGameRestartAction(game: PokerGameDocument): void {
  addActionToHistory(game, ActionHistoryType.GAME_STARTED);
}
