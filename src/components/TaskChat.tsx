import {
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useSignMessage } from 'wagmi';
import {
  MessageCircle,
  Paperclip,
  Send,
  Download,
  Lock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { fetchTaskMessages, postTaskMessage } from '../api';
import type { TaskMessage } from '../types';
import { useChatSocket } from '../hooks';

interface Props {
  taskId: number;
  address: string | undefined;
  taskClient: string;
  taskExecutor: string | null;
  readOnly?: boolean; // admin view: can read but not post
}

function formatFileSize (bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Bubble ({
  msg,
  currentAddress,
  taskClient,
}: {
  msg: TaskMessage;
  currentAddress?: string;
  taskClient: string;
}) {
  const isOwn: boolean = currentAddress?.toLowerCase() === msg.sender;
  const isClient: boolean = msg.sender === taskClient.toLowerCase();

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded px-4 py-3 text-sm space-y-1 ${
          isOwn
            ? 'bg-accent text-accent-ink'
            : 'bg-surface border border-border text-ink'
        }`}
      >
        <p className={`text-xs font-mono opacity-70 ${isOwn ? 'text-accent-ink' : 'text-muted'}`}>
          {msg.sender.slice(0, 6)}…{msg.sender.slice(-4)}
          <span className="ml-1 opacity-60">{isClient ? '(client)' : '(executor)'}</span>
        </p>
        <p className="whitespace-pre-wrap">{msg.content}</p>
        {msg.fileUrl && (
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 text-xs underline ${isOwn ? 'text-accent-ink' : 'text-accent'}`}
          >
            <Download className="h-3 w-3" />
            {msg.fileName ?? 'Attachment'}
            {msg.fileSize != null && ` (${formatFileSize(msg.fileSize)})`}
          </a>
        )}
        <p className={`text-xs opacity-60 ${isOwn ? 'text-accent-ink' : 'text-muted'}`}>
          {new Date(msg.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function TaskChat ({
  taskId,
  address,
  taskClient,
  taskExecutor,
  readOnly = false,
}: Props): React.ReactElement {
  const queryClient: QueryClient = useQueryClient();
  const { signMessageAsync } = useSignMessage();
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | undefined>();
  const fileRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
  const scrollRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);

  // Initial load via HTTP
  const { data: initialMessages = [], isLoading } = useQuery({
    queryKey: ['task-chat', taskId],
    queryFn: () => fetchTaskMessages(taskId),
    staleTime: Infinity, // WS keeps us in sync, so no background refetch is needed
  });

  // Real-time updates via WebSocket
  const { liveMessages, connected } = useChatSocket(taskId);

  // Merge: initial load + live messages, deduplicating by id
  const messages: TaskMessage[] = useMemo(() => {
    const seen: Set<number> = new Set(initialMessages.map((m) => m.id));
    const merged: TaskMessage[] = [...initialMessages];
    for (const m of liveMessages) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        merged.push(m);
      }
    }

    return merged;
  }, [initialMessages, liveMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const canPost: boolean =
    !readOnly &&
    address !== undefined &&
    (address.toLowerCase() === taskClient.toLowerCase() ||
      address.toLowerCase() === taskExecutor?.toLowerCase());

  const mutation: UseMutationResult<TaskMessage | undefined, Error, void, unknown> = useMutation({
    mutationFn: async () => {
      if (!address || !content.trim()) {
        return;
      }

      const sig: `0x${string}` = await signMessageAsync({ message: `chat:${taskId}:${content}` });
      return postTaskMessage(taskId, { sender: address, content, signature: sig, file });
    },
    onSuccess: () => {
      // WS broadcast delivers the new message, so no need to refetch
      // Invalidate only as fallback when WS is disconnected
      if (!connected) {
        queryClient.invalidateQueries({ queryKey: ['task-chat', taskId] });
      }

      setContent('');
      setFile(undefined);

      if (fileRef.current) {
        fileRef.current.value = '';
      }
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      if (content.trim()) {
        mutation.mutate();
      }
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-display font-semibold text-ink">Task Chat</h2>
        <span
          title={connected ? 'Live' : 'Reconnecting…'}
          className="ml-1 flex items-center gap-1 text-xs"
        >
          {connected
            ? (
              <Wifi className="h-3.5 w-3.5 text-success" />
            )
            : (
              <WifiOff className="h-3.5 w-3.5 text-muted animate-pulse" />
            )}
        </span>
        {readOnly && (
          <span className="ml-auto flex items-center gap-1 label text-muted text-xs">
            <Lock className="h-3 w-3" />
            Read-only (admin view)
          </span>
        )}
        {!readOnly && (
          <span className="label text-muted ml-auto text-xs">
            Messages signed by wallet · Enter to send
          </span>
        )}
      </div>

      <div ref={scrollRef} className="p-4 space-y-3 max-h-96 overflow-y-auto bg-paper">
        {isLoading && (
          <p className="text-center text-sm text-muted py-8">Loading…</p>
        )}
        {!isLoading && messages.length === 0 && (
          <p className="text-center text-sm text-muted py-8">
            No messages yet. Start the conversation.
          </p>
        )}
        {messages.map((msg) => (
          <Bubble
            key={msg.id}
            msg={msg}
            currentAddress={address}
            taskClient={taskClient}
          />
        ))}
      </div>

      {canPost
        ? (
          <div className="p-4 border-t border-border space-y-2">
            {file && (
              <div
                className="flex items-center gap-2 text-xs text-muted bg-paper px-3 py-2
                  rounded border border-border"
              >
                <Paperclip className="h-3 w-3" />
                <span className="truncate flex-1">{file.name}</span>
                <button
                  onClick={() => {
                    setFile(undefined);

                    if (fileRef.current) {
                      fileRef.current.value = '';
                    }
                  }}
                  className="text-danger hover:opacity-70"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message… (Shift+Enter for new line)"
                className="input flex-1 resize-none h-20"
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="btn-ghost !px-2 border border-border"
                  title="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  onClick={() => mutation.mutate()}
                  disabled={!content.trim() || mutation.isPending}
                  className="btn-primary !px-2 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.md,.zip,.rar,.7z"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
            <p className="label text-muted">Max 10 MB · Images, PDF, text, zip</p>
          </div>
        )
        : (
          !readOnly && (
            <div className="px-6 py-3 bg-paper text-sm text-muted border-t border-border">
              Only the task client and executor can post in this chat.
            </div>
          )
        )}
    </div>
  );
}
