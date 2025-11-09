declare module 'colyseus.js' {
  export class Client {
    constructor(endpoint: string);
    joinOrCreate<T = any>(roomName: string, options?: Record<string, unknown>): Promise<Room<T>>;
    create<T = any>(roomName: string, options?: Record<string, unknown>): Promise<Room<T>>;
    joinById<T = any>(roomId: string, options?: Record<string, unknown>): Promise<Room<T>>;
  }

  export class Room<T = any> {
    id: string;
    sessionId: string;
    state: T;

    leave(consented?: boolean): Promise<void>;
    send(type: string, message?: any): void;
    onMessage(type: string, callback: (message: any) => void): void;
    onStateChange(callback: (state: T) => void): void;
    onError(callback: (code: number, message?: string) => void): void;
    onLeave(callback: (code: number) => void): void;
  }
}
