import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { Link, useNavigate, type NavigateFunction } from 'react-router-dom';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
} from 'wagmi';
import { injected } from 'wagmi/connectors';
import { zeroAddress } from 'viem';
import {
  Plus,
  LogOut,
  Shield,
  Sun,
  Moon,
  Wallet,
  Menu,
  X,
} from 'lucide-react';
import { taskMarketAbi, ADMIN_ROLE } from '../lib';
import { useContractAddress, useTheme } from '../hooks';

function Header (): React.ReactElement {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const contractAddress: `0x${string}` | undefined = useContractAddress();
  const [theme, toggleTheme] = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: isAdmin } = useReadContract({
    address: contractAddress,
    abi: taskMarketAbi,
    functionName: 'hasRole',
    args: [ADMIN_ROLE, address ?? zeroAddress],
    query: { enabled: !!contractAddress && isConnected && !!address },
  });

  // Redirect admins straight into the admin panel when their wallet connects.
  const navigate: NavigateFunction = useNavigate();
  const hasRedirected: RefObject<boolean> = useRef(false);

  useEffect(() => {
    if (isConnected && isAdmin && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/admin');
    }

    if (!isConnected) {
      hasRedirected.current = false;
    }
  }, [isConnected, isAdmin, navigate]);

  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur border-b-2 border-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-display font-black tracking-tight text-ink">
                TaskMarket
              </span>
              <span
                className="label text-accent border border-accent rounded px-1.5 py-0.5
                  group-hover:bg-accent group-hover:text-accent-ink transition-colors"
              >
                v1
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {isAdmin
                ? (
                  <Link
                    to="/admin"
                    className="label text-warn hover:text-accent transition-colors flex items-center gap-1.5"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                )
                : (
                  <>
                    <Link
                      to="/"
                      className="label hover:text-accent transition-colors"
                    >
                      Browse
                    </Link>
                    {isConnected && (
                      <>
                        <Link
                          to="/create"
                          className="label hover:text-accent transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Post Task
                        </Link>
                        <Link
                          to="/my-tasks"
                          className="label hover:text-accent transition-colors"
                        >
                          My Tasks
                        </Link>
                      </>
                    )}
                  </>
                )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="btn-ghost !px-2"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isConnected
              ? (
                <div className="flex items-center gap-2">
                  <span className="label border border-border rounded px-2.5 py-1.5 text-ink hidden sm:inline">
                    {address?.slice(0, 6)}…{address?.slice(-4)}
                  </span>
                  <button
                    onClick={() => disconnect()}
                    className="btn-ghost !px-2"
                    title="Disconnect"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )
              : (
                <button onClick={() => connect({ connector: injected() })} className="btn-primary">
                  <Wallet className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Connect Wallet</span>
                  <span className="sm:hidden">Connect</span>
                </button>
              )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="btn-ghost !px-2 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-paper px-4 py-3 flex flex-col gap-3">
          {isAdmin
            ? (
              <Link
                to="/admin"
                className="label text-warn hover:text-accent transition-colors flex items-center gap-1.5"
                onClick={() => setMobileOpen(false)}
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Link>
            )
            : (
              <>
                <Link
                  to="/"
                  className="label hover:text-accent transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Browse
                </Link>
                {isConnected && (
                  <>
                    <Link
                      to="/create"
                      className="label hover:text-accent transition-colors flex items-center gap-1.5"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Post Task
                    </Link>
                    <Link
                      to="/my-tasks"
                      className="label hover:text-accent transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      My Tasks
                    </Link>
                  </>
                )}
              </>
            )}
        </div>
      )}
    </header>
  );
}

export default Header;
