import { Link } from 'react-router-dom';
import {
  Clock,
  Coins,
  MessageSquare,
  Users,
} from 'lucide-react';
import { formatEther } from 'viem';
import type { TaskResponse } from '../types';
import StatusBadge from './StatusBadge';

function TaskCard ({ task }: { task: TaskResponse }): React.ReactElement {
  const deadlineDate: Date = new Date(task.deadline);
  const isExpired: boolean = deadlineDate < new Date();

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="card block p-6 hover:border-accent transition-colors group"
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <h3
          className="font-display text-lg font-semibold text-ink line-clamp-1
            group-hover:text-accent transition-colors"
        >
          {task.title}
        </h3>
        <StatusBadge status={task.status} />
      </div>

      <p className="text-sm text-muted line-clamp-2 mb-4">{task.description}</p>

      {task.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {task.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="tag">
              {skill}
            </span>
          ))}
          {task.skills.length > 4 && (
            <span className="label">+{task.skills.length - 4}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-mono font-semibold text-ink">
            <Coins className="h-4 w-4 text-accent" />
            {formatEther(BigInt(task.reward))} ETH
          </span>
          <span
            className={`flex items-center gap-1 label ${isExpired ? 'text-danger' : ''}`}
          >
            <Clock className="h-3.5 w-3.5" />
            {deadlineDate.toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-3 text-muted">
          <span className="flex items-center gap-1 label">
            <Users className="h-3.5 w-3.5" />
            {task._count?.applications || 0}
          </span>
          <span className="flex items-center gap-1 label">
            <MessageSquare className="h-3.5 w-3.5" />
            {task._count?.comments || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default TaskCard;
