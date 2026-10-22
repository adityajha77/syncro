import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export interface WSMessage<T = unknown> {
  event: string;
  data: T;
  timestamp?: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  public initialize(server: HttpServer): WebSocketServer {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.clients.add(ws);
      const clientIp = req.socket.remoteAddress;
      console.log(`[WebSocket] Client connected (${clientIp}). Total: ${this.clients.size}`);

      // Send initial welcome/handshake
      this.sendToClient(ws, 'CONNECTED', {
        message: 'Connected to Syncro Real-time Gateway',
        timestamp: new Date().toISOString(),
      });

      ws.on('message', (data: string) => {
        try {
          const parsed = JSON.parse(data.toString()) as WSMessage;
          this.handleClientMessage(ws, parsed);
        } catch {
          console.warn('[WebSocket] Received non-JSON message');
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WebSocket] Client disconnected. Total: ${this.clients.size}`);
      });

      ws.on('error', (err) => {
        console.error('[WebSocket] Client error:', err);
        this.clients.delete(ws);
      });
    });

    console.log('[WebSocket] Real-time WebSocket server initialized on path /ws');
    return this.wss;
  }

  private handleClientMessage(ws: WebSocket, message: WSMessage): void {
    if (message.event === 'PING') {
      this.sendToClient(ws, 'PONG', { timestamp: new Date().toISOString() });
    }
  }

  public sendToClient(ws: WebSocket, event: string, data: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data, timestamp: new Date().toISOString() }));
    }
  }

  public broadcast(event: string, data: unknown): void {
    const payload = JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  public getConnectedCount(): number {
    return this.clients.size;
  }
}

export const wsManager = new WebSocketManager();
