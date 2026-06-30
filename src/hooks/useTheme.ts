import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getInitialTheme (): Theme {
  const stored: string | null = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return 'dark';
}

export function useTheme (): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle: () => void = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return [theme, toggle];
}
