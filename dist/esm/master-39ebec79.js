import { P as ProcessGameConfig, e as error, C as CreateGameReducer, w as UNDO, x as REDO, M as MAKE_MOVE } from './reducer-fbf421a2.js';
import { createStore } from 'redux';
import { I as InitializeGame } from './initialize-d5f56b08.js';
import { T as Type } from './base-c99f5be2.js';

/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
const getPlayerMetadata = (gameMetadata, playerID) => {
    if (gameMetadata && gameMetadata.players) {
        return gameMetadata.players[playerID];
    }
};
function IsSynchronous(storageAPI) {
    return storageAPI.type() === Type.SYNC;
}
/**
 * Redact the log.
 *
 * @param {Array} log - The game log (or deltalog).
 * @param {String} playerID - The playerID that this log is
 *                            to be sent to.
 */
function redactLog(log, playerID) {
    if (log === undefined) {
        return log;
    }
    return log.map(logEvent => {
        // filter for all other players and spectators.
        if (playerID !== null && +playerID === +logEvent.action.payload.playerID) {
            return logEvent;
        }
        if (logEvent.redact !== true) {
            return logEvent;
        }
        const payload = {
            ...logEvent.action.payload,
            args: null,
        };
        const filteredEvent = {
            ...logEvent,
            action: { ...logEvent.action, payload },
        };
        /* eslint-disable-next-line no-unused-vars */
        const { redact, ...remaining } = filteredEvent;
        return remaining;
    });
}
/**
 * Verifies that the game has metadata and is using credentials.
 */
const doesGameRequireAuthentication = (gameMetadata) => {
    if (!gameMetadata)
        return false;
    const { players } = gameMetadata;
    const hasCredentials = Object.keys(players).some(key => {
        return !!(players[key] && players[key].credentials);
    });
    return hasCredentials;
};
/**
 * Verifies that the move came from a player with the correct credentials.
 */
const isActionFromAuthenticPlayer = (actionCredentials, playerMetadata) => {
    if (!actionCredentials)
        return false;
    if (!playerMetadata)
        return false;
    return actionCredentials === playerMetadata.credentials;
};
/**
 * Remove player credentials from action payload
 */
const stripCredentialsFromAction = (action) => {
    // eslint-disable-next-line no-unused-vars
    const { credentials, ...payload } = action.payload;
    return { ...action, payload };
};
const getCtxPlayers = (gameMetadata, gameID, clientInfo) => {
    // console.log("[getCtxPlayers] gameID", gameID, "clientInfo", clientInfo)
    let allPlayers = Object.values(gameMetadata.players).reduce((allPlayers, player) => {
        if (player.name) {
            let isConnected = false;
            clientInfo.forEach((client) => {
                if (client.gameID == gameID && client.playerID == player.id) {
                    isConnected = client.socket.connected;
                }
            });
            // console.log("[getCtxPlayers]", player.id, player.name, isConnected)
            allPlayers.push({
                id: player.id,
                name: player.name,
                isConnected,
                isHost: false,
            });
        }
        return allPlayers;
    }, []);
    for (let player of allPlayers) {
        if (player.name) {
            player.isHost = true;
            break;
        }
    }
    return allPlayers;
};
/**
 * Master
 *
 * Class that runs the game and maintains the authoritative state.
 * It uses the transportAPI to communicate with clients and the
 * storageAPI to communicate with the database.
 */
class Master {
    constructor(game, storageAPI, transportAPI, clientInfo, auth) {
        this.game = ProcessGameConfig(game);
        this.storageAPI = storageAPI;
        this.transportAPI = transportAPI;
        this.clientInfo = clientInfo;
        this.auth = null;
        this.subscribeCallback = () => { };
        this.shouldAuth = () => false;
        if (auth === true) {
            this.auth = isActionFromAuthenticPlayer;
            this.shouldAuth = doesGameRequireAuthentication;
        }
        else if (typeof auth === 'function') {
            this.auth = auth;
            this.shouldAuth = () => true;
        }
    }
    subscribe(fn) {
        this.subscribeCallback = fn;
    }
    /**
     * Called on each move / event made by the client.
     * Computes the new value of the game state and returns it
     * along with a deltalog.
     */
    async onUpdate(credAction, stateID, gameID, playerID) {
        let isActionAuthentic;
        let metadata;
        const credentials = credAction.payload.credentials;
        if (IsSynchronous(this.storageAPI)) {
            ({ metadata } = this.storageAPI.fetch(gameID, { metadata: true }));
            const playerMetadata = getPlayerMetadata(metadata, playerID);
            isActionAuthentic = this.shouldAuth(metadata)
                ? this.auth(credentials, playerMetadata)
                : true;
        }
        else {
            ({ metadata } = await this.storageAPI.fetch(gameID, {
                metadata: true,
            }));
            const playerMetadata = getPlayerMetadata(metadata, playerID);
            isActionAuthentic = this.shouldAuth(metadata)
                ? await this.auth(credentials, playerMetadata)
                : true;
        }
        if (!isActionAuthentic) {
            return { error: 'unauthorized action' };
        }
        let action = stripCredentialsFromAction(credAction);
        const key = gameID;
        let state;
        let result;
        if (IsSynchronous(this.storageAPI)) {
            result = this.storageAPI.fetch(key, { state: true });
        }
        else {
            result = await this.storageAPI.fetch(key, { state: true });
        }
        state = result.state;
        if (state === undefined) {
            error(`game not found, gameID=[${key}]`);
            return { error: 'game not found' };
        }
        if (state.ctx.gameover !== undefined) {
            error(`game over - gameID=[${key}]`);
            return;
        }
        const reducer = CreateGameReducer({
            game: this.game,
        });
        const store = createStore(reducer, state);
        // Only allow UNDO / REDO if there is exactly one player
        // that can make moves right now and the person doing the
        // action is that player.
        if (action.type == UNDO || action.type == REDO) {
            if (state.ctx.currentPlayer !== playerID ||
                state.ctx.activePlayers !== null) {
                error(`playerID=[${playerID}] cannot undo / redo right now`);
                return;
            }
        }
        // Check whether the player is active.
        if (!this.game.flow.isPlayerActive(state.G, state.ctx, playerID)) {
            error(`player not active - playerID=[${playerID}]`);
            return;
        }
        // Check whether the player is allowed to make the move.
        if (action.type == MAKE_MOVE &&
            !this.game.flow.getMove(state.ctx, action.payload.type, playerID)) {
            error(`move not processed - canPlayerMakeMove=false, playerID=[${playerID}]`);
            return;
        }
        if (state._stateID !== stateID) {
            error(`invalid stateID, was=[${stateID}], expected=[${state._stateID}]`);
            // resync?
            this.onSync(gameID, playerID, Object.keys(metadata.players).length);
            return;
        }
        // Update server's version of the store.
        store.dispatch(action);
        state = store.getState();
        state.ctx.players = getCtxPlayers(metadata, gameID, this.clientInfo);
        this.subscribeCallback({
            state,
            action,
            gameID,
        });
        this.transportAPI.sendAll((playerID) => {
            const filteredState = {
                ...state,
                G: this.game.playerView(state.G, state.ctx, playerID),
                deltalog: undefined,
                _undo: [],
                _redo: [],
            };
            const log = redactLog(state.deltalog, playerID);
            return {
                type: 'update',
                args: [gameID, filteredState, log],
            };
        });
        const { deltalog, ...stateWithoutDeltalog } = state;
        let newMetadata;
        if (metadata &&
            !('gameover' in metadata) &&
            state.ctx.gameover !== undefined) {
            newMetadata = {
                ...metadata,
                gameover: state.ctx.gameover,
            };
        }
        if (IsSynchronous(this.storageAPI)) {
            this.storageAPI.setState(key, stateWithoutDeltalog, deltalog);
            if (newMetadata)
                this.storageAPI.setMetadata(key, newMetadata);
        }
        else {
            const writes = [
                this.storageAPI.setState(key, stateWithoutDeltalog, deltalog),
            ];
            if (newMetadata) {
                writes.push(this.storageAPI.setMetadata(key, newMetadata));
            }
            await Promise.all(writes);
        }
    }
    /**
     * Called when the client connects / reconnects.
     * Returns the latest game state and the entire log.
     */
    async onSync(gameID, playerID, numPlayers) {
        const key = gameID;
        let state;
        let initialState;
        let log;
        let gameMetadata;
        let filteredMetadata;
        let result;
        if (IsSynchronous(this.storageAPI)) {
            result = this.storageAPI.fetch(key, {
                state: true,
                metadata: true,
                log: true,
                initialState: true,
            });
        }
        else {
            result = await this.storageAPI.fetch(key, {
                state: true,
                metadata: true,
                log: true,
                initialState: true,
            });
        }
        state = result.state;
        initialState = result.initialState;
        log = result.log;
        gameMetadata = result.metadata;
        if (gameMetadata) {
            filteredMetadata = Object.values(gameMetadata.players).map(player => {
                const { credentials, ...filteredData } = player;
                return filteredData;
            });
        }
        // If the game doesn't exist, then create one on demand.
        // TODO: Move this out of the sync call.
        if (state === undefined) {
            initialState = state = InitializeGame({ game: this.game, numPlayers });
            this.subscribeCallback({
                state,
                gameID,
            });
            if (IsSynchronous(this.storageAPI)) {
                this.storageAPI.setState(key, state);
            }
            else {
                await this.storageAPI.setState(key, state);
            }
        }
        state.ctx.players = getCtxPlayers(gameMetadata, gameID, this.clientInfo);
        const filteredState = {
            ...state,
            G: this.game.playerView(state.G, state.ctx, playerID),
            deltalog: undefined,
            _undo: [],
            _redo: [],
        };
        log = redactLog(log, playerID);
        const syncInfo = {
            state: filteredState,
            log,
            filteredMetadata,
            initialState,
        };
        this.transportAPI.send({
            playerID,
            type: 'sync',
            args: [gameID, syncInfo],
        });
        return;
    }
    /**
     * Called when the client disconnects.
     * Returns the latest game state and the entire log.
     */
    async onDisconnect(gameID, numPlayers) {
        const key = gameID;
        let state;
        let initialState;
        let log;
        let gameMetadata;
        let filteredMetadata;
        let result;
        if (IsSynchronous(this.storageAPI)) {
            result = this.storageAPI.fetch(key, {
                state: true,
                metadata: true,
                log: true,
                initialState: true,
            });
        }
        else {
            result = await this.storageAPI.fetch(key, {
                state: true,
                metadata: true,
                log: true,
                initialState: true,
            });
        }
        state = result.state;
        initialState = result.initialState;
        log = result.log;
        gameMetadata = result.metadata;
        if (gameMetadata) {
            filteredMetadata = Object.values(gameMetadata.players).map(player => {
                const { credentials, ...filteredData } = player;
                return filteredData;
            });
        }
        // If the game doesn't exist, then create one on demand.
        // TODO: Move this out of the sync call.
        if (state === undefined) {
            initialState = state = InitializeGame({ game: this.game, numPlayers });
            this.subscribeCallback({
                state,
                gameID,
            });
            if (IsSynchronous(this.storageAPI)) {
                this.storageAPI.setState(key, state);
            }
            else {
                await this.storageAPI.setState(key, state);
            }
        }
        state.ctx.players = getCtxPlayers(gameMetadata, gameID, this.clientInfo);
        this.transportAPI.sendAll((playerID) => {
            const filteredState = {
                ...state,
                G: this.game.playerView(state.G, state.ctx, playerID),
                deltalog: undefined,
                _undo: [],
                _redo: [],
            };
            const log = redactLog(state.deltalog, playerID);
            return {
                type: 'update',
                args: [gameID, filteredState, log],
            };
        });
        return;
    }
}

export { Master as M };
