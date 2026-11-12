import { useEffect, useState, useRef, useCallback } from 'react';
import type { PresenceEntry, WSMessage } from '../types';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

/**
 * Connects to the Syncro realtime gateway, joins `workspaceId`'s room and
 * keeps the connection alive with exponential-backoff reconnects.
 *
 * `onMessage` is kept in a ref so passing an inline function does not
 * tear down the socket on every render.
 */
export function useRealtime(
  token: string | null,
  workspaceId: string | null,
  onMessage?: (message: WSMessage) => void
) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [presence, setPresence] = useState<PresenceEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!token || !workspaceId) {
      setStatus('idle');
      return;
    }

    let disposed = false;
    let attempt = 0;
    let retryTimer: number | undefined;

    const connect = () => {
      if (disposed) return;
      setStatus('connecting');
      const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        attempt = 0;
        ws.send(JSON.stringify({ event: 'JOIN_WORKSPACE', data: { workspaceId } }));
      };

      ws.onmessage = (e) => {
        let msg: WSMessage;
        try {
          msg = JSON.parse(e.data) as WSMessage;
        } catch {
          return;
        }
        if (msg.event === 'JOINED') setStatus('connected');
        if (msg.event === 'PRESENCE_STATE') {
          setPresence((msg.data as { members: PresenceEntry[] }).members);
        }
        handlerRef.current?.(msg);
      };

      ws.onclose = (e) => {
        wsRef.current = null;
        setStatus('disconnected');
        setPresence([]);
        if (disposed || e.code === 4401) return; // 4401 = bad token, don't hammer
        const delay = Math.min(30_000, 1000 * 2 ** attempt++);
        retryTimer = window.setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [token, workspaceId]);

  const send = useCallback((event: string, data: unknown = {}) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ event, data }));
  }, []);

  /** Tell teammates what you're doing (e.g. viewing "tasks", typing in a modal). */
  const updatePresence = useCallback(
    (p: { viewing?: string | null; typing?: boolean }) => send('PRESENCE_UPDATE', p),
    [send]
  );

  return { status, presence, send, updatePresence };
}
