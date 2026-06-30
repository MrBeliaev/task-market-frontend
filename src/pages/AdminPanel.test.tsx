import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  useAccount,
  useChainId,
  useSignMessage,
  useReadContract,
} from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useContractAddress } from '../hooks';
import AdminPanel from './AdminPanel';

jest.mock('wagmi');
jest.mock('../hooks');
jest.mock('../api');
jest.mock('@tanstack/react-query');

const mockAccount: jest.MockedFunction<typeof useAccount> = jest.mocked(useAccount);

beforeEach(() => {
  jest.clearAllMocks();
  (useChainId as jest.Mock).mockReturnValue(11155111);
  (useSignMessage as jest.Mock).mockReturnValue({ signMessageAsync: jest.fn() });
  (useReadContract as jest.Mock).mockReturnValue({ data: false });
  (useContractAddress as jest.Mock).mockReturnValue('0xcontract');
  (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: null });
  (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: jest.fn() });
});

function renderPage () {
  return render(
    <MemoryRouter>
      <AdminPanel />
    </MemoryRouter>,
  );
}

describe('AdminPanel', () => {
  it('prompts to connect a wallet when disconnected', () => {
    mockAccount.mockReturnValue({ address: undefined, isConnected: false } as unknown as ReturnType<typeof useAccount>);

    renderPage();

    expect(screen.getByText('Connect your wallet to access the admin panel.')).toBeInTheDocument();
  });

  it('renders the panel heading once a wallet is connected', () => {
    mockAccount.mockReturnValue({ address: '0xabc', isConnected: true } as unknown as ReturnType<typeof useAccount>);

    renderPage();

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });
});
