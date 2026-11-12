import { Server as HttpServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { prisma } from './prisma.js';
import { verifyToken } from './auth.js';

/**
 * Syncro Realtime Gateway
 *
 * Protocol (JSON frames `{ event, data, timestamp }`):
 *   connect      ws://host/ws?token=<jwt>
 *   client → server
 *     JOIN_WORKSPACE   { workspaceId }          subscribe to a workspace room
 *     LEAVE_WORKSPACE  {}
 *     PRESENCE_UPDATE  { viewing?, typing? }    what the user is doing right now
 *     PING             {}
 *   server → client
 *     CONNECTED        { userId }
 *     JOINED           { workspaceId }
 *     PRESENCE_STATE   { workspaceId, members: PresenceEntry[] }
 *     <domain events>  TASK_CREATED, TASK_UPDATED, TASK_DELETED, COMMIT_CREATED,
 *                      EVENT_CREATED, EVENT_DELETED, WORKSPACE_UPDATED, ACTIVITY_RECORDED
 *     ERROR            { message }
 */

export interface WSMessage<T = unknown> {
  event: string;
  data: T;
  timestamp?: string;
}

export interface PresenceEntry {
  userId: string;
  name: string;
  connections: number;
  viewing: string | null;
  typing: boolean;
  lastSeenAt: string;
}

interface ClientState {
  userId: string;
  name: string;
  workspaceId: string | null;
  viewing: string | null;
  typing: boolean;
  isAlive: boolean;
}

const HEARTBEAT_MS = 30_000;

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients = new Map<WebSocket, ClientState>();
  private rooms = new Map<string, Set<WebSocket>>();

  public initialize(server: HttpServer): WebSocketServer {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      void this.onConnection(ws, req);
    });

    // Drop dead sockets so presence stays accurate.
    const interval = setInterval(() => {
      for (const [ws, state] of this.clients) {
        if (!state.isAlive) {
          ws.terminate();
          continue;
        }
        state.isAlive = false;
        ws.ping();
      }
    }, HEARTBEAT_MS);
    this.wss.on('close', () => clearInterval(interval));

    console.log('[WebSocket] Realtime gateway initialized on /ws');
    return this.wss;
  }

  private async onConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
    const url = new URL(req.url || '', 'http://localhost');
    const payload = verifyToken(url.searchParams.get('token') || '');
    if (!payload) {
      ws.close(4401, 'Unauthorized');
      return;
    }

    // Attach listeners synchronously: clients typically send JOIN_WORKSPACE the
    // instant the socket opens, before the user lookup below resolves. Frames
    // that arrive early are queued and replayed in order once authenticated.
    let state: ClientState | null = null;
    let closed = false;
    const pending: WSMessage[] = [];
    let chain = Promise.resolve();

    const dispatch = (msg: WSMessage) => {
      // Serialize per-socket so JOIN completes before a following PRESENCE_UPDATE.
      chain = chain.then(() => (state ? this.handleClientMessage(ws, state, msg) : undefined)).catch((err) => {
        console.error('[WebSocket] handler error', err);
      });
    };

    ws.on('message', (raw) => {
      let msg: WSMessage;
      try {
        msg = JSON.parse(raw.toString()) as WSMessage;
      } catch {
        this.send(ws, 'ERROR', { message: 'Invalid JSON frame' });
        return;
      }
      if (state) dispatch(msg);
      else pending.push(msg);
    });
    ws.on('close', () => {
      closed = true;
      this.removeClient(ws);
    });
    ws.on('error', () => this.removeClient(ws));

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true },
    });
    if (closed) return;
    if (!user) {
      ws.close(4401, 'Unauthorized');
      return;
    }

    const authed: ClientState = {
      userId: user.id,
      name: user.name,
      workspaceId: null,
      viewing: null,
      typing: false,
      isAlive: true,
    };
    state = authed;
    this.clients.set(ws, authed);
    ws.on('pong', () => (authed.isAlive = true));

    this.send(ws, 'CONNECTED', { userId: user.id });
    pending.splice(0).forEach(dispatch);
  }

  private async handleClientMessage(ws: WebSocket, state: ClientState, msg: WSMessage): Promise<void> {
    const data = (msg.data ?? {}) as Record<string, unknown>;
    switch (msg.event) {
      case 'PING':
        this.send(ws, 'PONG', {});
        return;

      case 'JOIN_WORKSPACE': {
        const workspaceId = String(data.workspaceId || '');
        const member = await prisma.workspaceMember.findUnique({
          where: { userId_workspaceId: { userId: state.userId, workspaceId } },
        });
        if (!member) {
          this.send(ws, 'ERROR', { message: 'Not a member of that workspace' });
          return;
        }
        this.leaveRoom(ws, state);
        state.workspaceId = workspaceId;
        if (!this.rooms.has(workspaceId)) this.rooms.set(workspaceId, new Set());
        this.rooms.get(workspaceId)!.add(ws);
        this.send(ws, 'JOINED', { workspaceId });
        this.broadcastPresence(workspaceId);
        return;
      }

      case 'LEAVE_WORKSPACE':
        this.leaveRoom(ws, state);
        return;

      case 'PRESENCE_UPDATE':
        if (typeof data.viewing === 'string' || data.viewing === null) state.viewing = data.viewing as string | null;
        if (typeof data.typing === 'boolean') state.typing = data.typing;
        if (state.workspaceId) this.broadcastPresence(state.workspaceId);
        return;
    }
  }

  private leaveRoom(ws: WebSocket, state: ClientState): void {
    const prev = state.workspaceId;
    if (!prev) return;
    this.rooms.get(prev)?.delete(ws);
    if (this.rooms.get(prev)?.size === 0) this.rooms.delete(prev);
    state.workspaceId = null;
    this.broadcastPresence(prev);
  }

  private removeClient(ws: WebSocket): void {
    const state = this.clients.get(ws);
    if (!state) return;
    this.leaveRoom(ws, state);
    this.clients.delete(ws);
  }

  /** Aggregates all sockets in a room into one entry per user. */
  public getPresence(workspaceId: string): PresenceEntry[] {
    const byUser = new Map<string, PresenceEntry>();
    for (const ws of this.rooms.get(workspaceId) ?? []) {
      const s = this.clients.get(ws);
      if (!s) continue;
      const existing = byUser.get(s.userId);
      if (existing) {
        existing.connections++;
        existing.typing ||= s.typing;
        existing.viewing ??= s.viewing;
      } else {
        byUser.set(s.userId, {
          userId: s.userId,
          name: s.name,
          connections: 1,
          viewing: s.viewing,
          typing: s.typing,
          lastSeenAt: new Date().toISOString(),
        });
      }
    }
    return [...byUser.values()];
  }

  private broadcastPresence(workspaceId: string): void {
    this.toWorkspace(workspaceId, 'PRESENCE_STATE', { workspaceId, members: this.getPresence(workspaceId) });
  }

  private send(ws: WebSocket, event: string, data: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data, timestamp: new Date().toISOString() }));
    }
  }

  /** Broadcast an event to every socket subscribed to a workspace. */
  public toWorkspace(workspaceId: string, event: string, data: unknown): void {
    const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    for (const ws of this.rooms.get(workspaceId) ?? []) {
      if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    }
  }

  public getConnectedCount(): number {
    return this.clients.size;
  }

  public getRoomCount(): number {
    return this.rooms.size;
  }
}

export const wsManager = new WebSocketManager();
