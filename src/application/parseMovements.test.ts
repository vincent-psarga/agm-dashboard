import { describe, expect, it } from 'vitest';
import { MovementsFileError } from '../domain/MovementsFileError';
import type { Sheet, SheetRows } from '../domain/SpreadsheetReader';
import { parseMovements } from './parseMovements';

const HEADER = ['Date', 'Description', 'Type', 'Débit', 'Crédit', 'Raison', 'Tag', 'Solde'];

const aSheet = (rows: SheetRows, name = 'Sheet1'): Sheet => ({ name, rows });

function parseError(sheets: Sheet[]): MovementsFileError {
  try {
    parseMovements(sheets);
  } catch (error) {
    if (error instanceof MovementsFileError) return error;
    throw error;
  }
  throw new Error('parseMovements was expected to fail');
}

describe('parseMovements', () => {
  it('maps each row to a movement', () => {
    const rows: SheetRows = [
      HEADER,
      [new Date('2025-01-05T00:00:00Z'), 'Cotisation Alice', 'Virement', null, 30, 'Cotisation', null, 130],
    ];

    expect(parseMovements([aSheet(rows)])).toEqual([
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

    const [movement] = parseMovements([aSheet(rows)]);

    expect(movement).toMatchObject({ debit: 12, tag: 'cmd:sword', balance: 88, description: 'Épée' });
  });

  it('stores debits as positive amounts even when the bank exports them as negative numbers', () => {
    const rows: SheetRows = [HEADER, ['05/01/2025', 'Frais', '', -12, null, 'Frais', null, 100]];

    expect(parseMovements([aSheet(rows)])[0].debit).toBe(12);
  });

  it('ignores rows without a valid date', () => {
    const rows: SheetRows = [
      HEADER,
      ['05/01/2025', 'Frais', '', 12, null, 'Frais', null, 100],
      [null, null, null, null, null, null, null, null],
      ['Total', null, null, 12, 0, null, null, null],
    ];

    expect(parseMovements([aSheet(rows)])).toHaveLength(1);
  });

  it('reports the missing required columns by their name in the bank export', () => {
    const error = parseError([aSheet([['Date', 'Description', 'Débit', 'Crédit']])]);

    expect(error.code).toBe('missingColumns');
    expect(error.details).toEqual(['Raison', 'Solde']);
    expect(error.sheetName).toBeUndefined();
  });

  it('fails when the file contains no movement', () => {
    expect(parseError([aSheet([HEADER])]).code).toBe('noMovements');
  });

  describe('when the file has several sheets', () => {
    const movementsRows: SheetRows = [HEADER, ['05/01/2025', 'Frais', '', 12, null, 'Frais', null, 100]];

    it('uses the sheet having the movements columns', () => {
      const movements = parseMovements([
        aSheet([['Budget prévisionnel'], ['Recettes', 1000]], 'Budget'),
        aSheet(movementsRows, 'Mouvements'),
      ]);

      expect(movements).toHaveLength(1);
      expect(movements[0].description).toBe('Frais');
    });

    it('skips a sheet having the columns but no movement', () => {
      const movements = parseMovements([aSheet([HEADER], 'Template'), aSheet(movementsRows, '2025')]);

      expect(movements).toHaveLength(1);
    });

    it('reports the missing columns of the closest sheet, with its name', () => {
      const error = parseError([
        aSheet([['Notes']], 'Notes'),
        aSheet([['Date', 'Débit', 'Crédit', 'Solde']], 'Banque'),
      ]);

      expect(error.code).toBe('missingColumns');
      expect(error.details).toEqual(['Raison']);
      expect(error.sheetName).toBe('Banque');
    });
  });
});
