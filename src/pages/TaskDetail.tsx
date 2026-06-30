import { useParams } from 'react-router-dom';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type QueryClient,
} from '@tanstack/react-query';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSignMessage,
  useReadContract,
} from 'wagmi';
import {
  Clock,
  DollarSign,
  ExternalLink,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Send,
  Wallet,
  CalendarClock,
} from 'lucide-react';
import { formatEther, zeroAddress } from 'viem';
import { useState, useEffect } from 'react';
import { fetchTask, applyToTask, addComment } from '../api';
import type { Application, Comment } from '../types';
import { taskMarketAbi, ADMIN_ROLE } from '../lib';
import { useContractAddress } from '../hooks';
import StatusBadge from '../components/StatusBadge';
import DisputeChat from '../components/DisputeChat';
import TaskChat from '../components/TaskChat';

function TaskDetail (): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { address } = useAccount();
  const queryClient: QueryClient = useQueryClient();
  const [applicationMsg, setApplicationMsg] = useState('');
  const [comment, setComment] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => fetchTask(Number(id)),
    enabled: !!id,
  });

  const contractAddress: `0x${string}` | undefined = useContractAddress();
  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isTxPending, data: txReceipt } = useWaitForTransactionReceipt({ hash: txHash });
  const { signMessageAsync } = useSignMessage();

  // Refresh task data after any on-chain TX is confirmed.
  // Double-invalidate: once immediately, once after 2.5 s so the indexer
  // has time to process the event before the second refetch lands.
  useEffect(() => {
    if (!txReceipt) {
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['task', id] });
    const t: ReturnType<typeof setTimeout> = setTimeout(
      () => queryClient.invalidateQueries({ queryKey: ['task', id] }),
      2500,
    );
    return () => clearTimeout(t);
  }, [txReceipt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pending withdrawal balance for the connected wallet (pull-payment pattern)
  const { data: pendingAmount } = useReadContract({
    address: contractAddress,
    abi: taskMarketAbi,
    functionName: 'pendingWithdrawals',
    args: [address ?? zeroAddress],
    query: { enabled: !!contractAddress && !!address },
  });

  // Check if connected wallet is admin (for read-only chat access during disputes)
  const { data: isAdminOnChain } = useReadContract({
    address: contractAddress,
    abi: taskMarketAbi,
    functionName: 'hasRole',
    args: [ADMIN_ROLE, address ?? zeroAddress],
    query: { enabled: !!contractAddress && !!address },
  });

  const applyMutation: UseMutationResult<Application, Error, void> = useMutation({
    mutationFn: async () => {
      if (!address) {
        throw new Error('address is required');
      }

      const message: string = `apply:${Number(id)}:${applicationMsg}`;
      const signature: `0x${string}` = await signMessageAsync({ message });
      return applyToTask(Number(id), {
        applicant: address,
        message: applicationMsg,
        signature,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      setApplicationMsg('');
    },
  });

  const commentMutation: UseMutationResult<Comment, Error, void> = useMutation({
    mutationFn: async () => {
      if (!address) {
        throw new Error('address is required');
      }

      const message: string = `comment:${Number(id)}:${comment}`;
      const signature: `0x${string}` = await signMessageAsync({ message });
      return addComment(Number(id), { author: address, content: comment, signature });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      setComment('');
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse max-w-4xl mx-auto">
        <div className="h-8 bg-border rounded w-1/2 mb-4" />
        <div className="h-4 bg-border/60 rounded w-full mb-2" />
        <div className="h-4 bg-border/60 rounded w-3/4" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-16">
        <p className="text-muted label">Task not found</p>
      </div>
    );
  }

  const isClient: boolean = address?.toLowerCase() === task.client;
  const isExecutor: boolean = address?.toLowerCase() === task.executor;
  const isAdmin: boolean = !!isAdminOnChain && !isClient && !isExecutor;
  const deadlineDate: Date = new Date(task.deadline);
  const isExpired: boolean = deadlineDate < new Date();
  const hasPendingFunds: boolean = pendingAmount != null && pendingAmount > 0n;
  const hasExecutor: boolean = !!task.executor;

  const ACTIVE_STATUSES: readonly ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] as const;
  const isActive: boolean = (ACTIVE_STATUSES as readonly string[]).includes(task.status);
  const isCancellable: boolean =
    isClient &&
    (task.status === 'OPEN' || ((task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS') && isExpired));

  // min date for the extend-deadline picker: current deadline + 1 day
  const minExtendDate: string = new Date(deadlineDate.getTime() + 86_400_000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-8 mb-6">
        <div className="flex justify-between items-start mb-4 gap-4">
          <h1 className="text-2xl font-display font-bold text-ink">{task.title}</h1>
          <StatusBadge status={task.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-accent" />
            <span className="font-mono font-semibold text-ink">
              {formatEther(BigInt(task.reward))} ETH
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Clock className="h-4 w-4" />
            <span>Deadline: {deadlineDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Mail className="h-4 w-4" />
            <span>{task.contactInfo}</span>
          </div>
        </div>

        {task.referenceLink && (
          <a
            href={task.referenceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline mb-4"
          >
            <ExternalLink className="h-4 w-4" />
            Reference Link
          </a>
        )}

        <div className="max-w-none mb-6">
          <p className="text-ink/90 whitespace-pre-wrap">{task.description}</p>
        </div>

        {task.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {task.skills.map((skill) => (
              <span key={skill} className="tag">
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-4 text-xs text-muted space-y-1 font-mono">
          <p>Client: {task.client}</p>
          {task.executor && <p>Executor: {task.executor}</p>}
          <p>On-chain ID: #{task.onChainId}</p>
        </div>
      </div>

      {/* Withdraw pending funds (pull-payment, shown after COMPLETED or DISPUTED resolution) */}
      {address && hasPendingFunds && (
        <div className="card border-accent p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-display font-semibold text-ink">Funds Available</h2>
          </div>
          <p className="text-sm text-muted mb-4">
            You have <span className="font-mono font-semibold text-ink">{
              formatEther(pendingAmount ?? 0n)
            } ETH</span> available to withdraw.
          </p>
          <button
            onClick={() => {
              if (!contractAddress) {
                return;
              }

              writeContract({
                address: contractAddress,
                abi: taskMarketAbi,
                functionName: 'withdraw',
                args: [],
              });
            }}
            disabled={isTxPending}
            className="btn-primary disabled:opacity-50"
          >
            <Wallet className="h-4 w-4" />
            {isTxPending ? 'Withdrawing…' : `Withdraw ${formatEther(pendingAmount ?? 0n)} ETH`}
          </button>
        </div>
      )}

      {/* Multi-sig status */}
      {task.status === 'UNDER_REVIEW' && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-display font-semibold text-ink mb-4">Completion Confirmation</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div
              className={`p-4 rounded border ${task.clientConfirmed ? 'border-accent bg-accent/10' : 'border-border'}`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-5 w-5 ${task.clientConfirmed ? 'text-accent' : 'text-muted'}`}
                />
                <span className="text-sm font-medium text-ink">Client Confirmed</span>
              </div>
            </div>
            <div
              className={`p-4 rounded border ${
                task.executorConfirmed ? 'border-accent bg-accent/10' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-5 w-5 ${task.executorConfirmed ? 'text-accent' : 'text-muted'}`}
                />
                <span className="text-sm font-medium text-ink">Executor Confirmed</span>
              </div>
            </div>
          </div>

          {(isClient || isExecutor) && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!contractAddress) {
                    return;
                  }

                  writeContract({
                    address: contractAddress,
                    abi: taskMarketAbi,
                    functionName: 'confirmCompletion',
                    args: [BigInt(task.onChainId)],
                  });
                }}
                disabled={
                  isTxPending ||
                  (isClient && task.clientConfirmed) ||
                  (isExecutor && task.executorConfirmed)
                }
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm Completion
              </button>
              <button
                onClick={() => {
                  if (!contractAddress) {
                    return;
                  }

                  writeContract({
                    address: contractAddress,
                    abi: taskMarketAbi,
                    functionName: 'raiseDispute',
                    args: [BigInt(task.onChainId)],
                  });
                }}
                disabled={isTxPending}
                className="btn-secondary !border-danger !text-danger hover:!bg-danger/10 disabled:opacity-50"
              >
                <AlertTriangle className="h-4 w-4" />
                Raise Dispute
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task chat: client and executor from ASSIGNED onwards, admin read-only during dispute */}
      {(hasExecutor && (isClient || isExecutor)) && (
        <div className="mb-6">
          <TaskChat
            taskId={task.id}
            address={address}
            taskClient={task.client}
            taskExecutor={task.executor}
          />
        </div>
      )}
      {hasExecutor && isAdmin && task.status === 'DISPUTED' && (
        <div className="mb-6">
          <TaskChat
            taskId={task.id}
            address={address}
            taskClient={task.client}
            taskExecutor={task.executor}
            readOnly
          />
        </div>
      )}

      {/* Dispute chat: visible when task is disputed */}
      {task.status === 'DISPUTED' && (
        <div className="mb-6">
          <DisputeChat
            taskId={task.id}
            address={address}
            taskClient={task.client}
            taskExecutor={task.executor}
          />
        </div>
      )}

      {/* Executor actions */}
      {isExecutor && task.status === 'ASSIGNED' && (
        <div className="card p-6 mb-6">
          <button
            onClick={() => {
              if (!contractAddress) {
                return;
              }

              writeContract({
                address: contractAddress,
                abi: taskMarketAbi,
                functionName: 'startWork',
                args: [BigInt(task.onChainId)],
              });
            }}
            disabled={isTxPending}
            className="btn-primary disabled:opacity-50"
          >
            Start Work
          </button>
        </div>
      )}

      {isExecutor && task.status === 'IN_PROGRESS' && (
        <div className="card p-6 mb-6">
          <button
            onClick={() => {
              if (!contractAddress) {
                return;
              }

              writeContract({
                address: contractAddress,
                abi: taskMarketAbi,
                functionName: 'submitWork',
                args: [BigInt(task.onChainId)],
              });
            }}
            disabled={isTxPending}
            className="btn-primary disabled:opacity-50"
          >
            Submit Work for Review
          </button>
        </div>
      )}

      {/* Expiry warning banner */}
      {isClient && isExpired && isActive && (
        <div className="card border-warn bg-warn/5 p-5 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warn shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-ink text-sm">
              Deadline passed on {deadlineDate.toLocaleDateString()}
            </p>
            <p className="text-sm text-muted mt-0.5">
              {task.status === 'OPEN'
                ? 'No executor was assigned. Cancel below to recover your ETH.'
                : 'The task is still in progress but the deadline has passed. You may cancel to ' +
                  'recover your ETH, or extend the deadline if you have agreed with the executor.'}
            </p>
          </div>
        </div>
      )}

      {/* Extend deadline: client only, active non-terminal statuses */}
      {isClient && isActive && (
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-display font-semibold text-ink">Extend Deadline</h2>
          </div>
          <p className="text-sm text-muted mb-4">
            Move the deadline to a later date. New deadline must be after the current one.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="datetime-local"
              value={newDeadline}
              min={minExtendDate}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="input flex-1"
            />
            <button
              onClick={() => {
                if (!newDeadline || !contractAddress) {
                  return;
                }

                const newDeadlineSeconds: number = Math.floor(new Date(newDeadline).getTime() / 1000);
                writeContract({
                  address: contractAddress,
                  abi: taskMarketAbi,
                  functionName: 'extendDeadline',
                  args: [BigInt(task.onChainId), BigInt(newDeadlineSeconds)],
                });
              }}
              disabled={!newDeadline || isTxPending}
              className="btn-primary disabled:opacity-50 shrink-0"
            >
              {isTxPending ? 'Confirming…' : 'Extend Deadline'}
            </button>
          </div>
        </div>
      )}

      {/* Cancel task: client only. OPEN any time, ASSIGNED/IN_PROGRESS only if expired */}
      {isCancellable && (
        <div className="card border-danger/40 p-6 mb-6">
          <h2 className="text-lg font-display font-semibold text-ink mb-2">Cancel Task</h2>
          <p className="text-sm text-muted mb-4">
            {task.status === 'OPEN'
              ? 'No executor assigned yet. You can cancel and get your ETH back.'
              : 'The deadline has passed. Cancel to recover your locked ETH.'}
          </p>
          <button
            onClick={() => {
              if (!contractAddress) {
                return;
              }

              writeContract({
                address: contractAddress,
                abi: taskMarketAbi,
                functionName: 'cancelTask',
                args: [BigInt(task.onChainId)],
              });
            }}
            disabled={isTxPending}
            className="btn-secondary !border-danger !text-danger hover:!bg-danger/10 disabled:opacity-50"
          >
            {isTxPending ? 'Confirming…' : isExpired ? 'Cancel & Recover ETH' : 'Cancel Task'}
          </button>
        </div>
      )}

      {/* Apply section */}
      {task.status === 'OPEN' && address && !isClient && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-display font-semibold text-ink mb-3">Apply for This Task</h2>
          <textarea
            value={applicationMsg}
            onChange={(e) => setApplicationMsg(e.target.value)}
            placeholder="Describe your relevant experience and how you'd approach this task..."
            className="input resize-none h-24"
          />
          <button
            onClick={() => applyMutation.mutate()}
            disabled={applicationMsg.length < 10 || applyMutation.isPending}
            className="btn-primary mt-3 disabled:opacity-50"
          >
            {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      )}

      {/* Applications (visible to client) */}
      {isClient && task.applications && task.applications.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-display font-semibold text-ink mb-4">
            Applications ({task.applications.length})
          </h2>
          <div className="space-y-4">
            {task.applications.map((app) => (
              <div key={app.id} className="border border-border rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-mono text-muted">
                    {app.applicant.slice(0, 8)}...{app.applicant.slice(-6)}
                  </span>
                  {task.status === 'OPEN' && (
                    <button
                      onClick={() => {
                        if (!contractAddress) {
                          return;
                        }

                        writeContract({
                          address: contractAddress,
                          abi: taskMarketAbi,
                          functionName: 'assignExecutor',
                          args: [
                            BigInt(task.onChainId),
                            app.applicant as `0x${string}`,
                          ],
                        });
                      }}
                      className="btn-primary !text-xs !px-3 !py-1"
                    >
                      Assign
                    </button>
                  )}
                </div>
                <p className="text-sm text-ink/90">{app.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="card p-6">
        <h2 className="text-lg font-display font-semibold text-ink mb-4">
          Comments ({task.comments?.length || 0})
        </h2>

        {task.comments && task.comments.length > 0 && (
          <div className="space-y-3 mb-6">
            {task.comments.map((c) => (
              <div key={c.id} className="border-l-2 border-border pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted">
                    {c.author.slice(0, 8)}...{c.author.slice(-4)}
                  </span>
                  <span className="text-xs text-muted/70">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-ink/90">{c.content}</p>
              </div>
            ))}
          </div>
        )}

        {address && (
          <div className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="input flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && comment.trim()) {
                  commentMutation.mutate();
                }
              }}
            />
            <button
              onClick={() => commentMutation.mutate()}
              disabled={!comment.trim() || commentMutation.isPending}
              className="btn-primary !px-3 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskDetail;
