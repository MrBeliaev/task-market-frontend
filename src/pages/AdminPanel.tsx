import { useState, useEffect, type FormEvent } from 'react';
import {
  useAccount,
  useChainId,
  useSignMessage,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from 'wagmi';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  Shield,
  CheckCircle2,
  Scale,
  Network,
  Plus,
  Pencil,
  X,
} from 'lucide-react';
import { formatEther, zeroAddress } from 'viem';
import {
  fetchAdminTasks,
  fetchAdminDisputeDetail,
  fetchAdminChains,
  createAdminChain,
  updateAdminChain,
} from '../api';
import type {
  TaskResponse,
  AdminHeaders,
  DisputeMessage,
  ChainConfigResponse,
} from '../types';
import { taskMarketAbi, ADMIN_ROLE } from '../lib';
import { useContractAddress } from '../hooks';
import StatusBadge from '../components/StatusBadge';
import TaskChat from '../components/TaskChat';

function buildAdminHeaders (
  address: string, signature: string, timestamp: number, chainId: number,
): AdminHeaders {
  return {
    'x-admin-address': address,
    'x-admin-signature': signature,
    'x-admin-timestamp': String(timestamp),
    'x-admin-chain-id': String(chainId),
  };
}

function DisputeDetail ({ taskId, headers }: { taskId: number; headers: AdminHeaders }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dispute', taskId],
    queryFn: () => fetchAdminDisputeDetail(taskId, headers),
  });

  if (isLoading) {
    return <p className="text-sm text-muted p-4">Loading…</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-h-60 overflow-y-auto space-y-2 p-4 bg-paper rounded">
      {data.messages.length === 0 && (
        <p className="text-sm text-muted text-center">No dispute messages yet</p>
      )}
      {data.messages.map((msg: DisputeMessage) => (
        <div
          key={msg.id}
          className={`rounded px-3 py-2 text-sm ${
            msg.isAdmin ? 'bg-warn/10 border border-warn' : 'bg-surface border border-border'
          }`}
        >
          <span className="font-mono text-xs text-muted">{msg.sender.slice(0, 8)}…</span>
          {msg.isAdmin && <span className="ml-2 text-xs font-semibold text-warn">ADMIN</span>}
          <p className="mt-1 text-ink/90">{msg.content}</p>
          {msg.fileUrl && (
            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-accent underline">
              📎 {msg.fileName}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function TaskAdminCard ({
  task,
  headers,
  contractAddress,
}: {
  task: TaskResponse;
  headers: AdminHeaders;
  contractAddress: `0x${string}`;
}) {
  const [expanded, setExpanded] = useState(false);
  const [clientBps, setClientBps] = useState(50);

  const queryClient: QueryClient = useQueryClient();
  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isPending, data: txReceipt } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!txReceipt) {
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
  }, [txReceipt]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleForceComplete = () =>
    writeContract({
      address: contractAddress,
      abi: taskMarketAbi,
      functionName: 'forceComplete',
      args: [BigInt(task.onChainId)],
    });

  const handleResolveDispute = () =>
    writeContract({
      address: contractAddress,
      abi: taskMarketAbi,
      functionName: 'resolveDispute',
      args: [BigInt(task.onChainId), BigInt(clientBps * 100)],
    });

  return (
    <div className="card overflow-hidden">
      <div
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-paper"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-muted">#{task.onChainId}</span>
          <StatusBadge status={task.status} />
          <span className="text-sm font-medium text-ink">{task.title}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted">
          <span className="font-mono">{formatEther(BigInt(task.reward))} ETH</span>
          <span className="font-mono text-xs">
            {task.client.slice(0, 8)}…
          </span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-6 py-4 space-y-4">
          {task.status === 'DISPUTED' && task.executor && (
            <TaskChat
              taskId={task.id}
              address={undefined}
              taskClient={task.client}
              taskExecutor={task.executor}
              readOnly
            />
          )}
          <DisputeDetail taskId={task.id} headers={headers} />

          {(task.status === 'UNDER_REVIEW' || task.status === 'DISPUTED') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="border border-accent rounded p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-display font-semibold text-ink">Force Complete</h3>
                </div>
                <p className="text-xs text-muted">
                  Releases full payout to executor (minus platform fee). Use when work quality is confirmed.
                </p>
                <button
                  onClick={handleForceComplete}
                  disabled={isPending}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {isPending ? 'Confirming…' : 'Force Complete'}
                </button>
              </div>

              {task.status === 'DISPUTED' && (
                <div className="border border-warn rounded p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-warn" />
                    <h3 className="text-sm font-display font-semibold text-ink">Split Funds</h3>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted">
                      <span>Client: {clientBps}%</span>
                      <span>Executor: {100 - clientBps}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={clientBps}
                      onChange={(e) => setClientBps(Number(e.target.value))}
                      className="w-full accent-warn"
                    />
                    <p className="text-xs text-muted">
                      Client gets {(Number(task.reward) * clientBps / 100 / 1e18).toFixed(4)} ETH
                    </p>
                  </div>
                  <button
                    onClick={handleResolveDispute}
                    disabled={isPending}
                    className="w-full bg-warn text-accent-ink py-2.5 rounded font-mono text-xs uppercase
                      tracking-widest font-medium hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {isPending ? 'Confirming…' : 'Resolve Dispute'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChainConfigSection ({ headers }: { headers: AdminHeaders }) {
  const queryClient: QueryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ chainId: '', rpcUrl: '', contractAddress: '', startBlock: '0' });
  const [editingChainId, setEditingChainId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ rpcUrl: '', contractAddress: '', startBlock: '' });

  const { data: chains = [], isLoading, error: fetchError } = useQuery({
    queryKey: ['admin-chains', headers],
    queryFn: () => fetchAdminChains(headers),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-chains'] });

  const toggleEnabled = async (chain: ChainConfigResponse) => {
    setError(null);
    try {
      await updateAdminChain(chain.chainId, { enabled: !chain.enabled }, headers);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update chain');
    }
  };

  const startEdit = (chain: ChainConfigResponse) => {
    setEditingChainId(chain.chainId);
    setEditForm({
      rpcUrl: chain.rpcUrl,
      contractAddress: chain.contractAddress,
      startBlock: String(chain.startBlock),
    });
  };

  const cancelEdit = () => {
    setEditingChainId(null);
    setError(null);
  };

  const handleSaveEdit = async (chainId: number) => {
    setError(null);
    try {
      await updateAdminChain(
        chainId,
        {
          rpcUrl: editForm.rpcUrl || undefined,
          contractAddress: editForm.contractAddress || undefined,
          startBlock: editForm.startBlock !== '' ? Number(editForm.startBlock) : undefined,
        },
        headers,
      );
      setEditingChainId(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update chain');
    }
  };

  const handleAddChain = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createAdminChain(
        {
          chainId: Number(form.chainId),
          rpcUrl: form.rpcUrl,
          contractAddress: form.contractAddress,
          startBlock: Number(form.startBlock) || 0,
        },
        headers,
      );
      setForm({ chainId: '', rpcUrl: '', contractAddress: '', startBlock: '0' });
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add chain');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Toggle a network on/off for the indexer. Changes apply on the next indexer restart.
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-secondary !py-1.5"
        >
          <Plus className="h-4 w-4" />
          Add network
        </button>
      </div>

      {error && (
        <div className="card border-danger p-4 text-danger text-sm">{error}</div>
      )}
      {fetchError && (
        <div className="card border-danger p-4 text-danger text-sm">
          {fetchError instanceof Error ? fetchError.message : 'Error loading chains'}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleAddChain}
          className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          <input
            required
            type="number"
            placeholder="Chain ID"
            value={form.chainId}
            onChange={(e) => setForm({ ...form, chainId: e.target.value })}
            className="input !py-1.5"
          />
          <input
            required
            type="url"
            placeholder="RPC URL"
            value={form.rpcUrl}
            onChange={(e) => setForm({ ...form, rpcUrl: e.target.value })}
            className="input !py-1.5"
          />
          <input
            required
            placeholder="Contract address"
            value={form.contractAddress}
            onChange={(e) => setForm({ ...form, contractAddress: e.target.value })}
            className="input !py-1.5"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Start block"
              value={form.startBlock}
              onChange={(e) => setForm({ ...form, startBlock: e.target.value })}
              className="input !py-1.5 flex-1"
            />
            <button type="submit" className="btn-primary !py-1.5">Save</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-sm text-muted">Loading chains…</p>}
      {!isLoading && chains.length === 0 && (
        <p className="text-muted text-sm py-8 text-center">No chains configured.</p>
      )}

      {chains.map((chain) => (
        <div key={chain.chainId} className="card overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Network className="h-4 w-4 text-muted" />
              <div>
                <p className="text-sm font-medium text-ink">Chain {chain.chainId}</p>
                <p className="text-xs text-muted font-mono">{chain.rpcUrl}</p>
                <p className="text-xs text-muted/70 font-mono">
                  {chain.contractAddress} · start block {chain.startBlock}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => editingChainId === chain.chainId ? cancelEdit() : startEdit(chain)}
                className="btn-ghost !py-1 !px-2"
                title="Edit network"
              >
                {editingChainId === chain.chainId
                  ? <X className="h-4 w-4" />
                  : <Pencil className="h-4 w-4" />
                }
              </button>
              <button
                onClick={() => toggleEnabled(chain)}
                className={`stamp ${
                  chain.enabled
                    ? 'border-accent text-accent'
                    : 'border-border text-muted'
                }`}
              >
                {chain.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {editingChainId === chain.chainId && (
            <div className="border-t border-border px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="label">RPC URL</label>
                  <input
                    type="url"
                    value={editForm.rpcUrl}
                    onChange={(e) => setEditForm({ ...editForm, rpcUrl: e.target.value })}
                    className="input !py-1.5"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="label">Contract address</label>
                  <input
                    value={editForm.contractAddress}
                    onChange={(e) => setEditForm({ ...editForm, contractAddress: e.target.value })}
                    className="input !py-1.5"
                    placeholder="0x..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="label">Start block</label>
                  <input
                    type="number"
                    value={editForm.startBlock}
                    onChange={(e) => setEditForm({ ...editForm, startBlock: e.target.value })}
                    className="input !py-1.5"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleSaveEdit(chain.chainId)}
                  className="btn-primary !py-1.5"
                >
                  Save changes
                </button>
                <button onClick={cancelEdit} className="btn-ghost !py-1.5">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminPanel (): React.ReactElement {
  const { address, isConnected } = useAccount();
  const chainId: number = useChainId();
  const { signMessageAsync } = useSignMessage();
  const contractAddress: `0x${string}` | undefined = useContractAddress();

  const [headers, setHeaders] = useState<AdminHeaders | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('DISPUTED');

  const { data: isContractAdmin } = useReadContract({
    address: contractAddress,
    abi: taskMarketAbi,
    functionName: 'hasRole',
    args: [ADMIN_ROLE, address ?? zeroAddress],
    query: { enabled: !!contractAddress && !!address },
  });

  const authenticate = async () => {
    if (!address) {
      return;
    }

    try {
      const timestamp: number = Date.now();
      const message: string = `admin:${timestamp}`;
      const signature: `0x${string}` = await signMessageAsync({ message });
      setHeaders(buildAdminHeaders(address, signature, timestamp, chainId));
      setAuthError(null);
    } catch {
      setAuthError('Signature rejected');
    }
  };

  const [activeTab, setActiveTab] = useState<'disputes' | 'networks'>('disputes');

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['admin-tasks', statusFilter, headers],
    queryFn: () => {
      if (!headers) {
        throw new Error('admin headers are required');
      }

      return fetchAdminTasks(headers, statusFilter || undefined);
    },
    enabled: headers !== null,
  });

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <Shield className="h-12 w-12 text-muted mx-auto mb-4" />
        <p className="text-muted label">Connect your wallet to access the admin panel.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-accent" />
        <div>
          <p className="label text-accent mb-1">Restricted</p>
          <h1 className="text-3xl font-display font-bold text-ink">Admin Panel</h1>
          <p className="text-sm text-muted">Dispute resolution and task management</p>
        </div>
        {address && (
          <span className={
            `ml-auto stamp ${isContractAdmin ? 'border-accent text-accent' : 'border-border text-muted'}`
          }>
            {isContractAdmin ? '✓ Contract admin' : 'Not an admin'}
          </span>
        )}
      </div>

      {!headers
        ? (
          <div className="card p-8 text-center space-y-4 max-w-md mx-auto">
            <Shield className="h-10 w-10 text-muted mx-auto" />
            <p className="text-sm text-muted">
              Sign a message with your wallet to authenticate as admin. The server will verify your
              address holds <code className="tag">ADMIN_ROLE</code> on-chain.
            </p>
            {authError && <p className="text-sm text-danger">{authError}</p>}
            <button onClick={authenticate} className="btn-primary">
              Sign to Authenticate
            </button>
          </div>
        )
        : (
          <div className="space-y-6">
            <div className="flex items-center justify-end">
              <button
                onClick={() => setHeaders(null)}
                className="label hover:text-ink transition-colors"
              >
                Re-authenticate
              </button>
            </div>

            {/* ── Tab bar ────────────────────────────────────────────────────── */}
            <div className="flex gap-1 border-b border-border">
              {(['disputes', 'networks'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 label capitalize transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-accent text-accent'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  {tab === 'disputes' ? 'Disputes' : 'Networks'}
                </button>
              ))}
            </div>

            {/* ── Disputes tab ───────────────────────────────────────────────── */}
            {activeTab === 'disputes' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="label">Filter:</label>
                  {['DISPUTED', 'UNDER_REVIEW', 'COMPLETED', ''].map((s) => (
                    <button
                      key={s || 'all'}
                      onClick={() => setStatusFilter(s)}
                      className={`stamp transition-colors ${
                        statusFilter === s
                          ? 'border-accent text-accent'
                          : 'border-border text-muted hover:text-ink'
                      }`}
                    >
                      {s || 'All'}
                    </button>
                  ))}
                </div>

                {isLoading && <p className="text-sm text-muted">Loading tasks…</p>}
                {error && (
                  <div className="card border-danger p-4 text-danger text-sm">
                    {error instanceof Error ? error.message : 'Error loading tasks'}
                  </div>
                )}
                {!isLoading && tasks.length === 0 && (
                  <p className="text-muted text-sm py-8 text-center">No tasks found.</p>
                )}
                {contractAddress && tasks.map((task) => (
                  <TaskAdminCard
                    key={task.id}
                    task={task}
                    headers={headers}
                    contractAddress={contractAddress}
                  />
                ))}
              </div>
            )}

            {/* ── Networks tab ───────────────────────────────────────────────── */}
            {activeTab === 'networks' && (
              <ChainConfigSection headers={headers} />
            )}
          </div>
        )}
    </div>
  );
}
