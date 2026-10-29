// app/lib/socket/events.ts

export const SOCKET_EVENTS = {
    // Connection events
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',

    // User events
    USER_ONLINE: 'user:online',
    USER_OFFLINE: 'user:offline',

    // Poker events - Core state management
    POKER_STATE_UPDATE: 'poker:state_update',
    POKER_GAME_CREATED: 'poker:game_created',
    POKER_GAME_DELETED: 'poker:game_deleted',
    POKER_GAME_STALE_RESET: 'poker:game_stale_reset',

    // Poker events - Player management
    POKER_JOIN_GAME: 'poker:join_game',
    POKER_JOIN_SUCCESS: 'poker:join_success',
    POKER_JOIN_ERROR: 'poker:join_error',
    POKER_LEAVE_GAME: 'poker:leave_game',
    POKER_LEAVE_SUCCESS: 'poker:leave_success',
    POKER_LEAVE_ERROR: 'poker:leave_error',
    POKER_PLAYER_JOINED: 'poker:player_joined',
    POKER_PLAYER_LEFT: 'poker:player_left',
    POKER_GAME_LOCKED: 'poker:game_locked',
    POKER_GAME_UNLOCKED: 'poker:game_unlocked',
    POKER_SET_PRESENCE: 'poker:set_presence',
    POKER_PLAYER_PRESENCE_UPDATED: 'poker:player_presence_updated',

    // Poker events - Game actions
    POKER_BET: 'poker:bet',
    POKER_BET_SUCCESS: 'poker:bet_success',
    POKER_BET_ERROR: 'poker:bet_error',
    POKER_FOLD: 'poker:fold',
    POKER_FOLD_SUCCESS: 'poker:fold_success',
    POKER_FOLD_ERROR: 'poker:fold_error',
    POKER_SET_TIMER_ACTION: 'poker:set_timer_action',
    POKER_TIMER_SUCCESS: 'poker:timer_success',
    POKER_TIMER_ERROR: 'poker:timer_error',

    // Poker events - Granular gameplay updates
    POKER_BET_PLACED: 'poker:bet_placed',
    POKER_CARDS_DEALT: 'poker:cards_dealt',
    POKER_ROUND_COMPLETE: 'poker:round_complete',
    POKER_DEALER_BUTTON_MOVED: 'poker:dealer_button_moved',

    // Poker events - Action timer
    POKER_ACTION_TIMER_STARTED: 'poker:action_timer_started',
    POKER_ACTION_TIMER_PAUSED: 'poker:action_timer_paused',
    POKER_ACTION_TIMER_RESUMED: 'poker:action_timer_resumed',
    POKER_ACTION_TIMER_CLEARED: 'poker:action_timer_cleared',
    POKER_ACTION_TIMER_ACTION_SET: 'poker:action_timer_action_set',

    // Poker events - Notifications
    POKER_GAME_NOTIFICATION: 'poker:game_notification',
    POKER_NOTIFICATION: 'poker:notification',
    POKER_NOTIFICATION_CANCELED: 'poker:notification_canceled',
    POKER_WINNER_NOTIFICATION_COMPLETE: 'poker:winner_notification_complete',
} as const

export type SocketEventType = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS]

export interface PokerStateUpdatePayload {
    _id?: string
    players: any[]
    deck: any[]
    communalCards: any[]
    pot: any[]
    stage: number
    locked: boolean
    lockTime?: string
    currentPlayerIndex: number
    dealerButtonPosition?: number
    playerBets: number[]
    winner?: {
        winnerId: string
        winnerName: string
        handRank: string
        isTie: boolean
        tiedPlayers?: string[]
    }
}

export interface PokerGameDeletedPayload {
    gameId: string
}

export interface PokerJoinGamePayload {
    gameId: string
    username?: string
}

export interface PokerJoinSuccessPayload {
    gameState: any
}

export interface PokerJoinErrorPayload {
    error: string
}

export interface PokerPlayerJoinedPayload {
    player: { id: string; username: string; chips: any[]; hand: any[] }
    players: any[]
    playerCount: number
}

export interface PokerPlayerLeftPayload {
    playerId: string
    players: any[]
    playerCount: number
    gameReset?: boolean
}

export interface PokerSetPresencePayload {
    gameId: string
    isAway: boolean
}

export interface PokerPlayerPresenceUpdatedPayload {
    playerId: string
    isAway: boolean
}

export interface PokerGameLockedPayload {
    locked: true
    stage: number
    players: any[]
    currentPlayerIndex: number
    lockTime?: string
}

export interface PokerBetPlacedPayload {
    playerIndex: number
    chipCount: number
    pot: any[]
    playerBets: number[]
    currentPlayerIndex: number
}

export interface PokerCardsDealtPayload {
    stage: number
    communalCards: any[]
    deckCount: number
}

export interface PokerRoundCompletePayload {
    winner: {
        winnerId: string
        winnerName: string
        handRank: string
        isTie: boolean
        tiedPlayers?: string[]
    }
    players: any[]
}

export interface PokerActionTimerStartedPayload {
    startTime: string
    duration: number
    currentActionIndex: number
    totalActions: number
    actionType: string
    targetPlayerId?: string
}

export interface PokerActionTimerPausedPayload {
    pausedAt: string
    remainingSeconds: number
}

export interface PokerActionTimerResumedPayload {
    resumedAt: string
    duration: number
    currentActionIndex: number
    totalActions: number
    actionType: string
    targetPlayerId?: string
}

export interface PokerActionTimerActionSetPayload {
    playerId: string
    action: 'fold' | 'call' | 'check' | 'bet' | 'raise'
}

export interface PokerBetPayload { gameId: string; chipCount: number }
export interface PokerFoldPayload { gameId: string }
export interface PokerSetTimerActionPayload {
    gameId: string
    timerAction: 'fold' | 'call' | 'check' | 'bet' | 'raise'
    betAmount?: number
}

export interface PokerBetSuccessPayload { success: true }
export interface PokerFoldSuccessPayload { success: true }
export interface PokerTimerSuccessPayload { success: true }
export interface PokerBetErrorPayload { error: string }
export interface PokerFoldErrorPayload { error: string }
export interface PokerTimerErrorPayload { error: string }

export interface PokerGameNotificationPayload {
    message: string
    type: 'blind' | 'deal' | 'action' | 'info'
    duration?: number
}

export type PokerNotificationType =
    | 'player_bet'
    | 'player_raise'
    | 'player_call'
    | 'player_check'
    | 'player_fold'
    | 'player_all_in'
    | 'player_thinking'
    | 'player_queued'
    | 'blind_posted'
    | 'cards_dealt'
    | 'winner_determined'
    | 'game_tied'
    | 'stage_advanced'
    | 'player_joined'
    | 'game_starting'
    | 'game_shuffling';

export interface PokerNotificationPayload {
    notificationType: PokerNotificationType;
    category: 'action' | 'info' | 'blind' | 'stage' | 'deal';
    playerId?: string;
    playerName?: string;
    chipAmount?: number;
    isAI?: boolean;
    timerTriggered?: boolean;
    blindType?: 'small' | 'big';
    winnerId?: string;
    winnerName?: string;
    handRank?: string;
    isTie?: boolean;
    tiedPlayers?: string[];
    stage?: number;
    stageName?: string;
    countdownSeconds?: number;
    pot?: any[];
    playerBets?: number[];
    currentPlayerIndex?: number;
}
