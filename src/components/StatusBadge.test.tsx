import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders the human-readable label for each status', () => {
    render(<StatusBadge status="OPEN" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders Under Review with the warn styling class', () => {
    render(<StatusBadge status="UNDER_REVIEW" />);
    const el: HTMLElement = screen.getByText('Under Review');
    expect(el.className).toContain('text-warn');
  });

  it('renders Disputed with the danger styling class', () => {
    render(<StatusBadge status="DISPUTED" />);
    const el: HTMLElement = screen.getByText('Disputed');
    expect(el.className).toContain('text-danger');
  });
});
