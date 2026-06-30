import { useRef, useState, type RefObject } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useSignMessage } from 'wagmi';
import {
  Paperclip,
  Send,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { fetchDisputeMessages, postDisputeMessage } from '../api';
import type { DisputeMessage } from '../types';

interface Props {
  taskId: number;
  address: string | undefined;
  taskClient: string;
  taskExecutor: string | null;
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

function MessageBubble ({ msg, currentAddress }: { msg: DisputeMessage; currentAddress?: string }) {
  const isOwn: boolean = currentAddress?.toLowerCase() === msg.sender;
  const isAdmin: boolean = msg.isAdmin;

  return (
    <div className={`flex ${isAdmin ? 'justify-center' : isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded px-4 py-3 text-sm space-y-1 ${
          isAdmin
            ? 'bg-warn/10 border border-warn text-ink'
            : isOwn
              ? 'bg-accent text-accent-ink'
              : 'bg-surface border border-border text-ink'
        }`}
      >
        {isAdmin && (
          <p className="text-xs font-semibold text-warn flex items-center gap-1 label">
            <AlertTriangle className="h-3 w-3" />
            Admin
          </p>
        )}
        {!isAdmin && (
          <p className={`text-xs font-mono opacity-70 ${isOwn ? 'text-accent-ink' : 'text-muted'}`}>
            {msg.sender.slice(0, 6)}…{msg.sender.slice(-4)}
          </p>
        )}
        <p className="whitespace-pre-wrap">{msg.content}</p>
        {msg.fileUrl && (
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 text-xs underline ${
              isOwn ? 'text-accent-ink' : 'text-accent'
            }`}
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

export default function DisputeChat ({
  taskId, address, taskClient, taskExecutor,
}: Props): React.ReactElement {
  const queryClient: QueryClient = useQueryClient();
  const { signMessageAsync } = useSignMessage();
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | undefined>();
  const fileRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['dispute', taskId],
    queryFn: () => fetchDisputeMessages(taskId),
    refetchInterval: 10_000, // poll every 10 s
  });

  const canPost: boolean =
    address !== undefined &&
    (address.toLowerCase() === taskClient ||
      address.toLowerCase() === taskExecutor);

  const mutation: UseMutationResult<DisputeMessage | undefined, Error, void, unknown> = useMutation({
    mutationFn: async () => {
      if (!address || !content.trim()) {
        return;
      }

      const message: string = `dispute:${taskId}:${content}`;
      const signature: `0x${string}` = await signMessageAsync({ message });
      return postDisputeMessage(taskId, { sender: address, content, signature, file });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute', taskId] });
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
        <AlertTriangle className="h-5 w-5 text-warn" />
        <h2 className="text-lg font-display font-semibold text-ink">Dispute Chat</h2>
        <span className="label text-muted ml-auto">Messages are signed by wallet addresses</span>
      </div>

      {/* Message list */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto bg-paper">
        {isLoading && (
          <p className="text-center text-sm text-muted py-8">Loading messages…</p>
        )}
        {!isLoading && messages.length === 0 && (
          <p className="text-center text-sm text-muted py-8">No messages yet. Start the conversation.</p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} currentAddress={address} />
        ))}
      </div>

      {/* Input */}
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
                placeholder="Describe the situation… (Enter to send, Shift+Enter for new line)"
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
          <div className="px-6 py-3 bg-paper text-sm text-muted border-t border-border">
            Only task participants (client &amp; executor) can post in the dispute chat.
          </div>
        )}
    </div>
  );
}
