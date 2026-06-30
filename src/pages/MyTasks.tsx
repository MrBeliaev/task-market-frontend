import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { formatEther, zeroAddress } from 'viem';
import { Wallet, AlertTriangle, Clock } from 'lucide-react';
import { fetchTasks } from '../api';
import { taskMarketAbi } from '../lib';
import { useContractAddress } from '../hooks';
import TaskCard from '../components/TaskCard';

function MyTasks (): React.ReactElement {
  const { address, isConnected } = useAccount();
  const chainId: number = useChainId();
  const contractAddress: `0x${string}` | undefined = useContractAddress();
  const queryClient: QueryClient = useQueryClient();

  const { data: pendingAmount } = useReadContract({
    address: contractAddress,
    abi: taskMarketAbi,
    functionName: 'pendingWithdrawals',
    args: [address ?? zeroAddress],
    query: { enabled: !!contractAddress && !!address },
  });

  const { writeContract, data: withdrawTxHash } = useWriteContract();
  const { isLoading: isWithdrawPending, data: withdrawReceipt } = useWaitForTransactionReceipt({
    hash: withdrawTxHash,
  });

  useEffect(() => {
    if (!withdrawReceipt) {
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['my-tasks-client', address, chainId] });
    queryClient.invalidateQueries({ queryKey: ['my-tasks-executor', address, chainId] });
  }, [withdrawReceipt]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasPending: boolean = pendingAmount != null && pendingAmount > 0n;

  const baseParams: { chainId: string } = { chainId: String(chainId) };
  const now: string = new Date().toISOString();

  const { data: expiredTasks } = useQuery({
    queryKey: ['expired-tasks', address, chainId],
    queryFn: () => {
      if (!address) {
        throw new Error('address is required');
      }

      return fetchTasks({ ...baseParams, client: address, deadlineBefore: now });
    },
    enabled: isConnected && !!address,
    select: (data) =>
      data.tasks.filter((t) =>
        t.status === 'OPEN' || t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS',
      ),
  });

  const { data: clientTasks, isLoading: loadingClient } = useQuery({
    queryKey: ['my-tasks-client', address, chainId],
    queryFn: () => {
      if (!address) {
        throw new Error('address is required');
      }

      return fetchTasks({ ...baseParams, client: address });
    },
    enabled: isConnected && !!address,
  });

  const { data: executorTasks, isLoading: loadingExecutor } = useQuery({
    queryKey: ['my-tasks-executor', address, chainId],
    queryFn: () => {
      if (!address) {
        throw new Error('address is required');
      }

      return fetchTasks({ ...baseParams, executor: address });
    },
    enabled: isConnected && !!address,
  });

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <p className="text-muted label">Connect your wallet to see your tasks</p>
      </div>
    );
  }

  const isLoading: boolean = loadingClient || loadingExecutor;

  return (
    <div>
      <p className="label text-accent mb-1">Dashboard</p>
      <h1 className="text-3xl font-display font-bold text-ink mb-6">My Tasks</h1>

      {hasPending && (
        <div className="card border-accent p-6 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Wallet className="h-6 w-6 text-accent shrink-0" />
            <div>
              <p className="text-sm font-semibold text-ink">Funds available to withdraw</p>
              <p className="font-mono text-xl font-bold text-accent">
                {formatEther(pendingAmount ?? 0n)} ETH
              </p>
              <p className="text-xs text-muted mt-0.5">
                Earned from completed or resolved tasks. The contract holds it until you withdraw.
              </p>
            </div>
          </div>
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
            disabled={isWithdrawPending}
            className="btn-primary shrink-0 disabled:opacity-50"
          >
            <Wallet className="h-4 w-4" />
            {isWithdrawPending ? 'Withdrawing…' : 'Withdraw to Wallet'}
          </button>
        </div>
      )}

      {expiredTasks && expiredTasks.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-warn" />
            <h2 className="font-display text-lg font-semibold text-ink">
              Expired Tasks ({expiredTasks.length})
            </h2>
          </div>
          <p className="text-sm text-muted mb-4">
            These tasks passed their deadline with ETH still locked.
            You can cancel them to recover your funds.
          </p>
          <div className="space-y-3">
            {expiredTasks.map((task) => (
              <a
                key={task.id}
                href={`/tasks/${task.id}`}
                className="card border-warn/40 p-4 flex items-center justify-between gap-4
                  hover:border-warn transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate">{task.title}</p>
                  <p className="text-xs text-muted font-mono mt-0.5">
                    {task.reward ? `${(Number(task.reward) / 1e18).toFixed(4)} ETH locked` : ''}
                    {' · '}
                    Expired {new Date(task.deadline).toLocaleDateString()}
                    {' · '}
                    <span className="text-warn">{task.status}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 text-warn shrink-0 text-sm">
                  <Clock className="h-4 w-4" />
                  Cancel &amp; recover
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="font-display text-lg font-semibold text-ink mb-4">
          Tasks I Posted
        </h2>
        {isLoading
          ? (
            <div className="animate-pulse h-24 card" />
          )
          : clientTasks?.tasks.length === 0
            ? (
              <p className="text-sm text-muted">No tasks posted yet</p>
            )
            : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientTasks?.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-ink mb-4">
          Tasks I Am Working On
        </h2>
        {isLoading
          ? (
            <div className="animate-pulse h-24 card" />
          )
          : executorTasks?.tasks.length === 0
            ? (
              <p className="text-sm text-muted">No assigned tasks</p>
            )
            : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {executorTasks?.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
      </section>
    </div>
  );
}

export default MyTasks;
