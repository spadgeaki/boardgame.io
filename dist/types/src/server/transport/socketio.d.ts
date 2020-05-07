/// <reference types="node" />
import { AuthFn } from '../../master/master';
import { ServerOptions as SocketOptions } from 'socket.io';
import { ServerOptions as HttpsOptions } from 'https';
/**
 * API that's exposed by SocketIO for the Master to send
 * information to the clients.
 */
export declare function TransportAPI(gameID: any, socket: any, clientInfo: any, roomInfo: any): {
    send: ({ type, playerID, args }: {
        type: any;
        playerID: any;
        args: any;
    }) => void;
    sendAll: (arg: any) => void;
};
interface SocketOpts {
    auth?: boolean | AuthFn;
    https?: HttpsOptions;
    socketOpts?: SocketOptions;
}
/**
 * Transport interface that uses socket.io
 */
export declare class SocketIO {
    protected clientInfo: Map<any, any>;
    protected roomInfo: Map<any, any>;
    private auth;
    private https;
    private socketOpts;
    constructor({ auth, https, socketOpts }?: SocketOpts);
    init(app: any, games: any): void;
}
export {};
