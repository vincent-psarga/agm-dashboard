import { describe, expect, it } from 'vitest';
import { MovementsFileError } from '../domain/MovementsFileError';
import type { SheetRows } from '../domain/SpreadsheetReader';
import { parseMovements } from './parseMovements';

const HEADER = ['Date', 'Description', 'Type', 'Débit', 'Crédit', 'Raison', 'Tag', 'Solde'];

describe('parseMovements', () => {
  it('maps each row to a movement', () => {
    const rows: SheetRows = [
      HEADER,
      [new Date('2025-01-05T00:00:00Z'), 'Cotisation Alice', 'Virement', null, 30, 'Cotisation', null, 130],
    ];

    expect(parseMovements(rows)).toEqual([
      {
        date: new Date('2025-01-05T00:00:00Z'),
        description: 'Cotisation Alice',
        debit: 0,
        credit: 30,
        category: 'Cotisation',
        tag: '',
        balance: 130,
      },
    ]);
  });

  it('finds the header even when the export starts with a title and columns are in another order', () => {
    const rows: SheetRows = [
      ['Relevé de compte'],
      [],
      ['Solde', 'Tag', 'Raison', 'Crédit', 'Débit', 'Description', 'Date'],
      [88, 'cmd:sword', 'Commande', null, '12,00', 'Épée', '02/03/2025'],
    ];

    const [movement] = parseMovements(rows);

    expect(movement).toMatchObject({ debit: 12, tag: 'cmd:sword', balance: 88, description: 'Épée' });
  });

  it('stores debits as positive amounts even when the bank exports them as negative numbers', () => {
    const rows: SheetRows = [HEADER, ['05/01/2025', 'Frais', '', -12, null, 'Frais', null, 100]];

    expect(parseMovements(rows)[0].debit).toBe(12);
  });

  it('ignores rows without a valid date', () => {
    const rows: SheetRows = [
      HEADER,
      ['05/01/2025', 'Frais', '', 12, null, 'Frais', null, 100],
      [null, null, null, null, null, null, null, null],
      ['Total', null, null, 12, 0, null, null, null],
    ];

    expect(parseMovements(rows)).toHaveLength(1);
  });

  it('reports the missing required columns', () => {
    const rows: SheetRows = [['Date', 'Description', 'Débit', 'Crédit']];

    expect(() => parseMovements(rows)).toThrow(
      new MovementsFileError('missingColumns', ['category', 'balance']),
    );
  });

  it('fails when the file contains no movement', () => {
    expect(() => parseMovements([HEADER])).toThrow(new MovementsFileError('noMovements'));
  });
});
