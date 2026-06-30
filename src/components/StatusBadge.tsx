import type { TaskStatus } from '../types';

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  OPEN: { label: 'Open', className: 'border-accent text-accent' },
  ASSIGNED: { label: 'Assigned', className: 'border-border text-ink' },
  IN_PROGRESS: { label: 'In Progress', className: 'border-warn text-warn' },
  UNDER_REVIEW: { label: 'Under Review', className: 'border-warn text-warn' },
  COMPLETED: { label: 'Completed', className: 'border-border text-muted' },
  DISPUTED: { label: 'Disputed', className: 'border-danger text-danger' },
  CANCELLED: { label: 'Cancelled', className: 'border-border text-muted' },
};

function StatusBadge ({ status }: { status: TaskStatus }): React.ReactElement {
  const config: { label: string; className: string } = STATUS_CONFIG[status];
  return <span className={`stamp ${config.className}`}>{config.label}</span>;
}

export default StatusBadge;
