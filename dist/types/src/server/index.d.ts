/// <reference types="node" />
import Koa from 'koa';
import { Server as ServerTypes, Game, StorageAPI } from '../types';
export declare type KoaServer = ReturnType<Koa['listen']>;
interface ServerConfig {
    port?: number;
    callback?: () => void;
    lobbyConfig?: {
        apiPort: number;
        apiCallback?: () => void;
    };
}
interface HttpsOptions {
    cert: string;
    key: string;
}
/**
 * Build config object from server run arguments.
 */
export declare const createServerRunConfig: (portOrConfig: number | ServerConfig, callback?: () => void) => ServerConfig;
interface ServerOpts {
    games: Game[];
    db?: StorageAPI.Async | StorageAPI.Sync;
    transport?: any;
    authenticateCredentials?: ServerTypes.AuthenticateCredentials;
    generateCredentials?: ServerTypes.GenerateCredentials;
    https?: HttpsOptions;
}
/**
 * Instantiate a game server.
 *
 * @param games - The games that this server will handle.
 * @param db - The interface with the database.
 * @param transport - The interface with the clients.
 * @param authenticateCredentials - Function to test player credentials.
 * @param generateCredentials - Method for API to generate player credentials.
 * @param https - HTTPS configuration options passed through to the TLS module.
 */
export declare function Server({ games, db, transport, authenticateCredentials, generateCredentials, https, }: ServerOpts): {
    app: Koa<Koa.DefaultState, Koa.DefaultContext>;
    db: StorageAPI.Async | StorageAPI.Sync;
    run: (portOrConfig: number | object, callback?: () => void) => Promise<{
        apiServer: import("http").Server;
        appServer: import("http").Server;
    }>;
    kill: (servers: {
        apiServer?: import("http").Server;
        appServer: import("http").Server;
    }) => void;
};
export {};
