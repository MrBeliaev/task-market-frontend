import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSignMessage,
} from 'wagmi';
import { useContractAddress } from '../hooks';
import CreateTask from './CreateTask';

jest.mock('wagmi');
jest.mock('../hooks');
jest.mock('../api');

const mockAccount: jest.MockedFunction<typeof useAccount> = jest.mocked(useAccount);
const mockContractAddress: jest.MockedFunction<typeof useContractAddress> = jest.mocked(useContractAddress);

beforeEach(() => {
  jest.clearAllMocks();
  (useChainId as jest.Mock).mockReturnValue(11155111);
  (useWriteContract as jest.Mock).mockReturnValue({ writeContract: jest.fn(), data: undefined, error: null });
  (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ isLoading: false, data: undefined });
  (useSignMessage as jest.Mock).mockReturnValue({ signMessageAsync: jest.fn() });
});

function renderPage () {
  return render(
    <MemoryRouter>
      <CreateTask />
    </MemoryRouter>,
  );
}

describe('CreateTask', () => {
  it('prompts to connect a wallet when disconnected', () => {
    mockAccount.mockReturnValue({ address: undefined, isConnected: false } as unknown as ReturnType<typeof useAccount>);
    mockContractAddress.mockReturnValue(undefined);

    renderPage();

    expect(screen.getByText('You need to connect a wallet to post a task.')).toBeInTheDocument();
  });

  it('shows an unsupported-network notice when the chain has no contract', () => {
    mockAccount.mockReturnValue({ address: '0xabc', isConnected: true } as unknown as ReturnType<typeof useAccount>);
    mockContractAddress.mockReturnValue(undefined);

    renderPage();

    expect(screen.getByText('Unsupported network')).toBeInTheDocument();
  });

  it('renders the task form when connected on a supported chain', () => {
    mockAccount.mockReturnValue({ address: '0xabc', isConnected: true } as unknown as ReturnType<typeof useAccount>);
    mockContractAddress.mockReturnValue('0xcontract');

    renderPage();

    expect(screen.getByText('Post a Task')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Build a smart contract/i)).toBeInTheDocument();
  });
});
