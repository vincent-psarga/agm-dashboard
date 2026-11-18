import { describe, expect, it } from 'vitest';
import { DEFAULT_PIE_LAYOUT, layoutPie, wrap } from './pieLayout';
import type { PieSliceInput, PieSliceLayout } from './pieLayout';

// The data of a real report, where Recharts drew overlapping and cut labels.
const EXPENSES: PieSliceInput[] = [
  { name: 'commande groupée', value: 3149.35 },
  { name: 'matériel', value: 2518.5 },
  { name: 'cheval', value: 2400 },
  { name: 'entrainements', value: 270 },
  { name: 'site web', value: 86.26 },
  { name: 'frais bancaires', value: 22.3 },
];

const INCOMES: PieSliceInput[] = [
  { name: 'remboursement commande groupée', value: 1648 },
  { name: 'presta', value: 890 },
  { name: 'cotisation', value: 210 },
  { name: 'remboursement frais bancaires', value: 15.3 },
];

const { width, height, fontSize, charWidthRatio } = DEFAULT_PIE_LAYOUT;

function labelBox({ label }: PieSliceLayout) {
  const longestLine = Math.max(...label.nameLines.map((line) => line.length), '100,0 %'.length);
  const textWidth = longestLine * fontSize * charWidthRatio;
  const left = label.textAnchor === 'start' ? label.anchor.x : label.anchor.x - textWidth;
  return {
    left,
    right: left + textWidth,
    top: label.centerY - label.height / 2,
    bottom: label.centerY + label.height / 2,
  };
}

function overlap(a: ReturnType<typeof labelBox>, b: ReturnType<typeof labelBox>) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

describe.each([
  ['expenses', EXPENSES],
  ['incomes', INCOMES],
])('layoutPie with the %s of a real report', (_, slices) => {
  const layout = layoutPie(slices);
  const boxes = layout.map(labelBox);

  it('does not overlap labels', () => {
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(overlap(boxes[i], boxes[j]), `${slices[i].name} / ${slices[j].name}`).toBe(false);
      }
    }
  });

  it('keeps the labels inside the chart', () => {
    for (const box of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(height);
    }
  });
});

describe('layoutPie', () => {
  it('wraps long names', () => {
    const [first] = layoutPie(INCOMES);

    expect(first.label.nameLines.length).toBeGreaterThan(1);
    expect(first.label.nameLines.join(' ')).toBe('remboursement commande groupée');
  });

  it('draws a full circle for a single category', () => {
    const [only] = layoutPie([{ name: 'cotisation', value: 100 }]);

    expect(only.path).toContain('A');
    expect(only.path).not.toContain('NaN');
  });

  it('keeps the labels apart when many small slices are next to each other', () => {
    const slices = [
      { name: 'big', value: 1000 },
      ...Array.from({ length: 5 }, (_, index) => ({ name: `small ${index}`, value: 1 })),
    ];
    const boxes = layoutPie(slices).map(labelBox);

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(overlap(boxes[i], boxes[j])).toBe(false);
      }
    }
  });
});

describe('wrap', () => {
  it('cuts between words', () => {
    expect(wrap('remboursement commande groupée', 18)).toEqual(['remboursement', 'commande groupée']);
  });

  it('keeps short names on one line', () => {
    expect(wrap('cheval', 18)).toEqual(['cheval']);
  });
});
