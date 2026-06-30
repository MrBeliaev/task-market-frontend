import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useChainId, useAccount } from 'wagmi';
import { Search } from 'lucide-react';
import { fetchTasks } from '../api';
import TaskCard from '../components/TaskCard';

function TaskList (): React.ReactElement {
  const chainId: number = useChainId();
  const { address } = useAccount();
  const [allChains, setAllChains] = useState(false);
  const [page, setPage] = useState(1);

  const params: Record<string, string> = {
    page: String(page),
    limit: '12',
    status: 'OPEN',
    deadlineAfter: new Date().toISOString(),
  };
  if (!allChains) {
    params.chainId = String(chainId);
  }

  if (address) {
    params.excludeClient = address;
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', page, allChains ? 'all' : chainId, address ?? 'anon'],
    queryFn: () => fetchTasks(params),
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <p className="label text-accent mb-1">Marketplace</p>
          <h1 className="text-3xl font-display font-bold text-ink">Task Ledger</h1>
          <p className="text-sm text-muted mt-1">
            Find and complete tasks to earn crypto
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setAllChains((v) => !v); setPage(1);
            }}
            className={allChains ? 'btn-primary !py-2' : 'btn-secondary !py-2'}
          >
            {allChains ? 'All chains' : `Chain ${chainId}`}
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-border rounded w-3/4 mb-3" />
              <div className="h-4 bg-border/60 rounded w-full mb-2" />
              <div className="h-4 bg-border/60 rounded w-2/3 mb-4" />
              <div className="h-4 bg-border/60 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="card border-danger p-4 text-danger text-sm">
          Failed to load tasks. Make sure the backend is running.
        </div>
      )}

      {data && (
        <>
          {data.tasks.length === 0
            ? (
              <div className="text-center py-16">
                <p className="text-muted label">No tasks found</p>
              </div>
            )
            : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}

          {data.pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary !py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="label text-muted">
                Page {page} of {data.pagination.pages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(data.pagination.pages, p + 1))
                }
                disabled={page === data.pagination.pages}
                className="btn-secondary !py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TaskList;
