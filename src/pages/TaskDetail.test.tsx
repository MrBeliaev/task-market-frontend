import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSignMessage,
  useReadContract,
} from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TaskResponse } from '../types';
import { useContractAddress } from '../hooks';
import TaskDetail from './TaskDetail';

jest.mock('wagmi');
jest.mock('../hooks');
jest.mock('../api');
jest.mock('@tanstack/react-query');

const mockUseQuery: jest.Mock = useQuery as jest.Mock;

const SAMPLE_TASK: TaskResponse = {
  id: 1,
  onChainId: 1,
  chainId: 11155111,
  client: '0xabc',
  executor: null,
  reward: '1000000000000000000',
  deadline: new Date(Date.now() + 86_400_000).toISOString(),
  status: 'OPEN',
  title: 'Build a thing',
  description: 'A long enough description for the task detail page',
  contactInfo: 'tg:foo',
  referenceLink: null,
  category: null,
  skills: [],
  clientConfirmed: false,
  executorConfirmed: false,
} as unknown as TaskResponse;

beforeEach(() => {
  jest.clearAllMocks();
  (useAccount as jest.Mock).mockReturnValue({ address: undefined });
  (useContractAddress as jest.Mock).mockReturnValue('0xcontract');
  (useWriteContract as jest.Mock).mockReturnValue({ writeContract: jest.fn(), data: undefined });
  (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ isLoading: false, data: undefined });
  (useSignMessage as jest.Mock).mockReturnValue({ signMessageAsync: jest.fn() });
  (useReadContract as jest.Mock).mockReturnValue({ data: undefined });
  (useMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
  (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: jest.fn() });
});

function renderAt (id: string) {
  return render(
    <MemoryRouter initialEntries={[`/tasks/${id}`]}>
      <Routes>
        <Route path="/tasks/:id" element={<TaskDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TaskDetail', () => {
  it('shows a not-found message when the task is missing', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });

    renderAt('999');

    expect(screen.getByText('Task not found')).toBeInTheDocument();
  });

  it('renders the task title and status once loaded', () => {
    mockUseQuery.mockReturnValue({ data: SAMPLE_TASK, isLoading: false });

    renderAt('1');

    expect(screen.getByText('Build a thing')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('1 ETH')).toBeInTheDocument();
  });
});
