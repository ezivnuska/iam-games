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

export type {
    PokerStateUpdatePayload,
    PokerGameDeletedPayload,
    PokerJoinGamePayload,
    PokerJoinSuccessPayload,
    PokerJoinErrorPayload,
    PokerPlayerJoinedPayload,
    PokerPlayerLeftPayload,
    PokerSetPresencePayload,
    PokerPlayerPresenceUpdatedPayload,
    PokerGameLockedPayload,
    PokerBetPlacedPayload,
    PokerCardsDealtPayload,
    PokerRoundCompletePayload,
    PokerActionTimerStartedPayload,
    PokerActionTimerPausedPayload,
    PokerActionTimerResumedPayload,
    PokerActionTimerActionSetPayload,
    PokerBetPayload,
    PokerFoldPayload,
    PokerSetTimerActionPayload,
    PokerBetSuccessPayload,
    PokerFoldSuccessPayload,
    PokerTimerSuccessPayload,
    PokerBetErrorPayload,
    PokerFoldErrorPayload,
    PokerTimerErrorPayload,
    PokerGameNotificationPayload,
    PokerNotificationType,
    PokerNotificationPayload,
} from '@iam/shared-types';
