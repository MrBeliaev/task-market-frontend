import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { TaskResponse } from '../types';
import TaskCard from './TaskCard';

const BASE_TASK: TaskResponse = {
  id: 1,
  onChainId: 1,
  chainId: 11155111,
  client: '0xabc',
  executor: null,
  reward: '1000000000000000000',
  deadline: new Date(Date.now() + 86_400_000).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'OPEN',
  metadataHash: '0xhash',
  title: 'Build a thing',
  description: 'Build a really nice thing for me please',
  contactInfo: 'tg:foo',
  referenceLink: null,
  category: null,
  skills: [],
  clientConfirmed: false,
  executorConfirmed: false,
} as unknown as TaskResponse;

function renderCard (task: TaskResponse) {
  return render(
    <MemoryRouter>
      <TaskCard task={task} />
    </MemoryRouter>,
  );
}

describe('TaskCard', () => {
  it('renders the title, description, status, and reward in ETH', () => {
    renderCard(BASE_TASK);

    expect(screen.getByText('Build a thing')).toBeInTheDocument();
    expect(screen.getByText('Build a really nice thing for me please')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('1 ETH')).toBeInTheDocument();
  });

  it('links to the task detail page', () => {
    renderCard(BASE_TASK);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/tasks/1');
  });

  it('shows up to 4 skill tags plus an overflow count', () => {
    renderCard({ ...BASE_TASK, skills: ['Go', 'Rust', 'TS', 'Solidity', 'Vue'] });

    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('Solidity')).toBeInTheDocument();
    expect(screen.queryByText('Vue')).not.toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('flags an expired deadline visually via the danger text class', () => {
    const pastDeadline: Date = new Date(Date.now() - 86_400_000);
    renderCard({ ...BASE_TASK, deadline: pastDeadline.toISOString() });

    const deadlineLabel: HTMLElement = screen.getByText(pastDeadline.toLocaleDateString());
    expect(deadlineLabel.className).toContain('text-danger');
  });
});
