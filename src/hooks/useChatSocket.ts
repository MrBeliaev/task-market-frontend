import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import type { TaskMessage } from '../types';

interface WsMessage { type: 'message'; data: TaskMessage }

const RECONNECT_DELAY_MS: number = 3_000;

export function useChatSocket (taskId: number): {
  liveMessages: TaskMessage[];
  connected: boolean;
} {
  const [liveMessages, setLiveMessages] = useState<TaskMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef: RefObject<WebSocket | null> = useRef<WebSocket | null>(null);
  const timerRef: RefObject<ReturnType<typeof setTimeout> | null> = useRef(null);
  const unmountedRef: RefObject<boolean> = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;
    setLiveMessages([]);

    function connect () {
      if (unmountedRef.current) {
        return;
      }

      const protocol: 'wss:' | 'ws:' = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url: string = `${protocol}//${window.location.host}/ws/chat/${taskId}`;
      const ws: WebSocket = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!unmountedRef.current) {
          setConnected(true);
        }
      };

      ws.onmessage = (event) => {
        try {
          const parsed: WsMessage = JSON.parse(event.data as string) as WsMessage;
          if (parsed.type === 'message') {
            setLiveMessages((prev) => [...prev, parsed.data]);
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (unmountedRef.current) {
          return;
        }

        setConnected(false);
        timerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      wsRef.current?.close();
    };
  }, [taskId]);

  return { liveMessages, connected };
}
