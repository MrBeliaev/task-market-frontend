import { Suspense, lazy, type LazyExoticComponent } from 'react';
import {
  Routes,
  Route,
  Navigate,
  Link,
} from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import { zeroAddress } from 'viem';
import Header from './components/Header';
import { taskMarketAbi, ADMIN_ROLE } from './lib';
import { useContractAddress } from './hooks';

// Route components are code-split so the initial bundle stays small; each page
// (and its heavy wagmi/viem usage) loads on first navigation.
const TaskList: LazyExoticComponent<() => React.ReactElement> = lazy(() => import('./pages/TaskList'));
const TaskDetail: LazyExoticComponent<() => React.ReactElement> = lazy(() => import('./pages/TaskDetail'));
const CreateTask: LazyExoticComponent<() => React.ReactElement> = lazy(() => import('./pages/CreateTask'));
const MyTasks: LazyExoticComponent<() => React.ReactElement> = lazy(() => import('./pages/MyTasks'));
const AdminPanel: LazyExoticComponent<() => React.ReactElement> = lazy(() => import('./pages/AdminPanel'));

function RequireAdmin ({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const contractAddress: `0x${string}` | undefined = useContractAddress();

  const { data: isAdmin, isLoading } = useReadContract({
    address: contractAddress,
    abi: taskMarketAbi,
    functionName: 'hasRole',
    args: [ADMIN_ROLE, address ?? zeroAddress],
    query: { enabled: !!contractAddress && isConnected && !!address },
  });

  // Still waiting for wallet or contract response, so show nothing to avoid a flash
  if (!isConnected || isLoading) {
    return null;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function NotFound () {
  return (
    <div className="text-center py-24">
      <p className="label text-accent mb-2">404</p>
      <h1 className="text-4xl font-display font-bold text-ink mb-4">Page not found</h1>
      <p className="text-muted mb-8">The page you are looking for does not exist.</p>
      <Link to="/" className="btn-primary">Back to Browse</Link>
    </div>
  );
}

function App (): React.ReactElement {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="animate-pulse h-24 card" />}>
          <Routes>
            <Route path="/" element={<TaskList />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/create" element={<CreateTask />} />
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
