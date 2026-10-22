import { useEffect, useState, useRef, useCallback } from 'react';
import { WSMessage } from '../types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function useRealtime(onMessage?: (message: WSMessage) => void) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

  const connect = useCallback(() => {
    setStatus('connecting');
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        console.log('[WebSocket] Connected to', wsUrl);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WSMessage;
          setLastMessage(parsed);
          if (onMessage) {
            onMessage(parsed);
          }
        } catch {
          // Ignore unparsed messages
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        console.warn('[WebSocket] Disconnected. Reconnecting in 3 seconds...');
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      console.error('[WebSocket] Failed to connect:', err);
      setStatus('disconnected');
    }
  }, [wsUrl, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((event: string, data: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, data, timestamp: new Date().toISOString() }));
    }
  }, []);

  return { status, lastMessage, sendMessage };
}
