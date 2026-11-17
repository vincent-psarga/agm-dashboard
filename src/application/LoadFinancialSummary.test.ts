import { describe, expect, it } from 'vitest';
import { MovementsFileError } from '../domain/MovementsFileError';
import type { SheetRows, SpreadsheetReader } from '../domain/SpreadsheetReader';
import { LoadFinancialSummary } from './LoadFinancialSummary';

const readerReturning = (rows: SheetRows): SpreadsheetReader => ({
  read: async () => [{ name: 'Sheet1', rows }],
});

describe('LoadFinancialSummary', () => {
  it('reads the file and summarizes its movements', async () => {
    const useCase = new LoadFinancialSummary(
      readerReturning([
        ['Date', 'Description', 'Débit', 'Crédit', 'Raison', 'Tag', 'Solde'],
        ['01/02/2025', 'Cotisation', null, 30, 'Cotisation', null, 130],
      ]),
    );

    const summary = await useCase.execute(new Blob());

    expect(summary.initialBalance).toBe(100);
    expect(summary.cotisationsTotal).toBe(30);
  });

  it('reports files that cannot be read', async () => {
    const useCase = new LoadFinancialSummary({
      read: async () => {
        throw new Error('not a zip file');
      },
    });

    await expect(useCase.execute(new Blob())).rejects.toEqual(
      new MovementsFileError('unreadableFile'),
    );
  });
});
