import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

/**
 * Validated categorical palette (fixed order, never cycled), stepped per color scheme.
 * Six slots: a pie shows at most 5 named categories + "others", or 6 named ones.
 */
const CATEGORICAL = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c'],
};

export interface ChartPalette {
  categorical: string[];
  others: string;
  expense: string;
  income: string;
  surface: string;
  axis: string;
  text: string;
}

const PALETTES: Record<'light' | 'dark', ChartPalette> = {
  light: {
    categorical: CATEGORICAL.light,
    others: '#898781',
    expense: '#e34948',
    income: '#008300',
    surface: '#fcfcfb',
    axis: '#c3c2b7',
    text: '#52514e',
  },
  dark: {
    categorical: CATEGORICAL.dark,
    others: '#6f6e69',
    expense: '#e66767',
    income: '#0ca30c',
    surface: '#1a1a19',
    axis: '#383835',
    text: '#c3c2b7',
  },
};

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function useChartPalette(): ChartPalette {
  const [isDark, setIsDark] = useState(() => matchesDark());
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    // The charts must be repainted in light colors before the page is printed.
    const onBeforePrint = () => flushSync(() => setIsPrinting(true));
    const onAfterPrint = () => setIsPrinting(false);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  return PALETTES[isDark && !isPrinting ? 'dark' : 'light'];
}

function matchesDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;
}
