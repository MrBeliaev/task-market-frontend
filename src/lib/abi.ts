// An explicit type annotation here would widen the literal `as const` shape that
// wagmi relies on to type-check contract calls (functionName/args) elsewhere.
// eslint-disable-next-line @typescript-eslint/typedef
export const taskMarketAbi = [
  // ── State-changing functions ─────────────────────────────────────────────────
  {
    type: 'function',
    name: 'createTask',
    inputs: [
      { name: '_deadline',     type: 'uint256' },
      { name: '_metadataHash', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'assignExecutor',
    inputs: [
      { name: '_taskId',   type: 'uint256' },
      { name: '_executor', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelTask',
    inputs: [{ name: '_taskId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'startWork',
    inputs: [{ name: '_taskId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'submitWork',
    inputs: [{ name: '_taskId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'confirmCompletion',
    inputs: [{ name: '_taskId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'raiseDispute',
    inputs: [{ name: '_taskId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'resolveDispute',
    inputs: [
      { name: '_taskId',    type: 'uint256' },
      { name: '_clientBps', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'forceComplete',
    inputs: [{ name: '_taskId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'extendDeadline',
    inputs: [
      { name: '_taskId',      type: 'uint256' },
      { name: '_newDeadline', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setFeeBps',
    inputs: [{ name: '_feeBps', type: 'uint16' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setFeeRecipient',
    inputs: [{ name: '_recipient', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdrawPendingFees',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // ── View functions ───────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'getTask',
    inputs: [{ name: '_taskId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id',                type: 'uint256'  },
          { name: 'client',            type: 'address'  },
          { name: 'reward',            type: 'uint96'   },
          { name: 'executor',          type: 'address'  },
          { name: 'status',            type: 'uint8'    },
          { name: 'clientConfirmed',   type: 'bool'     },
          { name: 'executorConfirmed', type: 'bool'     },
          { name: 'feeBps',            type: 'uint16'   },
          { name: 'deadline',          type: 'uint32'   },
          { name: 'metadataHash',      type: 'bytes32'  },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'taskCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pendingWithdrawals',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pendingFees',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'platformFeeBps',
    inputs: [],
    outputs: [{ name: '', type: 'uint16' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'feeRecipient',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasRole',
    inputs: [
      { name: 'role',    type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  // ── Events ───────────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'TaskCreated',
    inputs: [
      { name: 'taskId',       type: 'uint256',  indexed: true  },
      { name: 'client',       type: 'address',  indexed: true  },
      { name: 'reward',       type: 'uint256',  indexed: false },
      { name: 'deadline',     type: 'uint256',  indexed: false },
      { name: 'metadataHash', type: 'bytes32',  indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TaskAssigned',
    inputs: [
      { name: 'taskId',   type: 'uint256', indexed: true },
      { name: 'executor', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'TaskStatusChanged',
    inputs: [
      { name: 'taskId',    type: 'uint256', indexed: true  },
      { name: 'oldStatus', type: 'uint8',   indexed: false },
      { name: 'newStatus', type: 'uint8',   indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'CompletionConfirmed',
    inputs: [
      { name: 'taskId',            type: 'uint256', indexed: true  },
      { name: 'confirmer',         type: 'address', indexed: true  },
      { name: 'clientConfirmed',   type: 'bool',    indexed: false },
      { name: 'executorConfirmed', type: 'bool',    indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TaskCompleted',
    inputs: [
      { name: 'taskId',   type: 'uint256', indexed: true  },
      { name: 'executor', type: 'address', indexed: true  },
      { name: 'payout',   type: 'uint256', indexed: false },
      { name: 'fee',      type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TaskCancelled',
    inputs: [{ name: 'taskId', type: 'uint256', indexed: true }],
  },
  {
    type: 'event',
    name: 'DeadlineExtended',
    inputs: [
      { name: 'taskId',      type: 'uint256', indexed: true  },
      { name: 'oldDeadline', type: 'uint256', indexed: false },
      { name: 'newDeadline', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TaskDisputed',
    inputs: [
      { name: 'taskId',     type: 'uint256', indexed: true },
      { name: 'disputedBy', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'DisputeResolved',
    inputs: [
      { name: 'taskId',         type: 'uint256', indexed: true  },
      { name: 'resolvedBy',     type: 'address', indexed: true  },
      { name: 'clientRefund',   type: 'uint256', indexed: false },
      { name: 'executorPayout', type: 'uint256', indexed: false },
      { name: 'fee',            type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'FeeBpsUpdated',
    inputs: [
      { name: 'oldBps', type: 'uint256', indexed: false },
      { name: 'newBps', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'FeeRecipientUpdated',
    inputs: [
      { name: 'oldRecipient', type: 'address', indexed: true },
      { name: 'newRecipient', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'Withdrawn',
    inputs: [
      { name: 'recipient', type: 'address', indexed: true  },
      { name: 'amount',    type: 'uint256', indexed: false },
    ],
  },
] as const;
