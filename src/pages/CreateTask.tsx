import {
  useState,
  useEffect,
  useRef,
  type RefObject,
} from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSignMessage,
} from 'wagmi';
import {
  parseEther,
  keccak256,
  toHex,
  decodeEventLog,
} from 'viem';
import { taskMarketAbi } from '../lib';
import { useContractAddress } from '../hooks';
import { createTaskMetadata } from '../api';

const EMPTY_FORM: Record<string, string> = {
  title: '',
  description: '',
  contactInfo: '',
  referenceLink: '',
  category: '',
  skills: '',
  reward: '',
  deadlineDays: '7',
};

function CreateTask (): React.ReactElement {
  const { address, isConnected } = useAccount();
  const chainId: number = useChainId();
  const contractAddress: `0x${string}` | undefined = useContractAddress();
  const navigate: NavigateFunction = useNavigate();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Captures at submission time; read by the post-confirmation effect.
  const submittedFormRef: RefObject<typeof form | null> = useRef<typeof form | null>(null);
  const metadataHashRef: RefObject<`0x${string}` | null> = useRef<`0x${string}` | null>(null);
  const signatureRef: RefObject<string | null> = useRef<string | null>(null);

  const { writeContract, data: txHash, error: txError } = useWriteContract();
  const { signMessageAsync } = useSignMessage();
  const { isLoading: isTxPending, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Sign metadata BEFORE the transaction so no second MetaMask popup is
  // needed after confirmation. Order: sign → send tx → wait → save to backend.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || !contractAddress || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const deadline: number = Math.floor(Date.now() / 1000) + Number(form.deadlineDays) * 86400;
      const metadataJson: string = JSON.stringify({
        title: form.title,
        description: form.description,
        contactInfo: form.contactInfo,
        referenceLink: form.referenceLink,
        category: form.category,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      const metadataHash: `0x${string}` = keccak256(toHex(metadataJson));

      // Step 1: sign (chainId prevents cross-chain replay; metadataHash binds to content)
      const message: string = `create-task:${chainId}:${metadataHash}`;
      const signature: `0x${string}` = await signMessageAsync({ message });

      // Capture everything for the post-confirmation effect
      submittedFormRef.current = { ...form };
      metadataHashRef.current = metadataHash;
      signatureRef.current = signature;

      // Step 2: broadcast transaction
      writeContract({
        address: contractAddress,
        abi: taskMarketAbi,
        functionName: 'createTask',
        args: [BigInt(deadline), metadataHash],
        value: parseEther(form.reward),
      });

      // Reset form immediately after broadcast so the user knows it was accepted
      setForm({ ...EMPTY_FORM });
    } catch {
      // User rejected the sign or tx, so stay on the page so they can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  // After tx confirmation: parse onChainId from receipt, then save metadata to
  // backend using the pre-computed signature (no extra MetaMask popup).
  useEffect(() => {
    if (!receipt || !address || !metadataHashRef.current || !submittedFormRef.current || !signatureRef.current) {
      return;
    }

    const capturedForm: typeof form = submittedFormRef.current;
    const metadataHash: `0x${string}` = metadataHashRef.current;
    const signature: string = signatureRef.current;
    // Clear refs so a re-render of receipt doesn't double-submit
    submittedFormRef.current = null;
    metadataHashRef.current = null;
    signatureRef.current = null;

    let onChainId: number | undefined;
    for (const log of receipt.logs) {
      try {
        // decodeEventLog's return type is a discriminated union keyed by eventName;
        // an explicit annotation here would widen it and lose that precision.
        // eslint-disable-next-line @typescript-eslint/typedef
        const decoded = decodeEventLog({
          abi: taskMarketAbi,
          eventName: 'TaskCreated',
          topics: log.topics,
          data: log.data,
        });
        const args: { taskId: bigint } | undefined = decoded.args as { taskId: bigint } | undefined;
        if (args?.taskId !== undefined) {
          onChainId = Number(args.taskId);
          break;
        }
      } catch {
        // Not the TaskCreated log, continue
      }
    }

    if (onChainId === undefined) {
      console.error('TaskCreated event not found in receipt');
      navigate('/');
      return;
    }

    const deadline: string = new Date(
      Date.now() + Number(capturedForm.deadlineDays) * 86400 * 1000,
    ).toISOString();

    (async () => {
      try {
        await createTaskMetadata({
          onChainId,
          chainId,
          client: address,
          signature,
          reward: parseEther(capturedForm.reward).toString(),
          deadline,
          metadataHash,
          title: capturedForm.title,
          description: capturedForm.description,
          contactInfo: capturedForm.contactInfo,
          referenceLink: capturedForm.referenceLink || undefined,
          category: capturedForm.category || undefined,
          skills: capturedForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
        });
      } catch (err) {
        console.error('Failed to save metadata:', err);
      } finally {
        navigate('/');
      }
    })();
  }, [receipt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-xl font-display font-semibold text-ink mb-2">
          Connect your wallet
        </h2>
        <p className="text-muted">You need to connect a wallet to post a task.</p>
      </div>
    );
  }

  if (!contractAddress) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-xl font-display font-semibold text-ink mb-2">
          Unsupported network
        </h2>
        <p className="text-muted">
          TaskMarket is not deployed on this chain. Switch to Hardhat, Sepolia, or Base.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <p className="label text-accent mb-1">New listing</p>
      <h1 className="text-3xl font-display font-bold text-ink mb-6">Post a Task</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <div>
            <label className="label block mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Build a smart contract for NFT marketplace"
              className="input"
            />
          </div>

          <div>
            <label className="label block mb-1.5">
              Description *
            </label>
            <textarea
              required
              minLength={20}
              maxLength={5000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the task in detail: requirements, deliverables, acceptance criteria..."
              className="input resize-none h-32"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label block mb-1.5">
                Contact Info *
              </label>
              <input
                type="text"
                required
                value={form.contactInfo}
                onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                placeholder="Telegram: @username, Discord: user#1234"
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1.5">
                Reference Link
              </label>
              <input
                type="url"
                value={form.referenceLink}
                onChange={(e) =>
                  setForm({ ...form, referenceLink: e.target.value })
                }
                placeholder="https://github.com/..."
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label block mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input appearance-none"
              >
                <option value="">Select category</option>
                <option value="smart-contracts">Smart Contracts</option>
                <option value="frontend">Frontend Development</option>
                <option value="backend">Backend Development</option>
                <option value="design">Design</option>
                <option value="audit">Security Audit</option>
                <option value="content">Content Writing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label block mb-1.5">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="Solidity, React, TypeScript"
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="font-display font-semibold text-ink">Payment & Deadline</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label block mb-1.5">
                Reward (ETH) *
              </label>
              <input
                type="number"
                required
                step="0.001"
                min="0.001"
                value={form.reward}
                onChange={(e) => setForm({ ...form, reward: e.target.value })}
                placeholder="0.5"
                className="input"
              />
              <p className="text-xs text-muted mt-1.5">
                ETH will be locked in escrow until task completion
              </p>
            </div>
            <div>
              <label className="label block mb-1.5">
                Deadline (days from now) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="365"
                value={form.deadlineDays}
                onChange={(e) =>
                  setForm({ ...form, deadlineDays: e.target.value })
                }
                className="input"
              />
            </div>
          </div>
        </div>

        {txError && (
          <div className="card border-danger p-4 text-danger text-sm">
            Transaction failed: {txError.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isTxPending || !form.title || !form.description || !form.reward}
          className="btn-primary w-full !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Signing…' : isTxPending ? 'Confirming Transaction…' : 'Post Task & Lock ETH'}
        </button>
      </form>
    </div>
  );
}

export default CreateTask;
