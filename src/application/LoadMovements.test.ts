import { describe, expect, it } from 'vitest';
import { MovementsFileError } from '../domain/MovementsFileError';
import type { SheetRows, SpreadsheetReader } from '../domain/SpreadsheetReader';
import { LoadMovements } from './LoadMovements';

const readerReturning = (rows: SheetRows): SpreadsheetReader => ({
  read: async () => [{ name: 'Sheet1', rows }],
});

describe('LoadMovements', () => {
  it('reads the movements of the file', async () => {
    const useCase = new LoadMovements(
      readerReturning([
        ['Date', 'Description', 'Débit', 'Crédit', 'Raison', 'Tag', 'Solde'],
        ['01/02/2025', 'Cotisation Alice', null, 30, 'Cotisation', null, 130],
      ]),
    );

    const movements = await useCase.execute(new Blob());

    expect(movements).toEqual([
      expect.objectContaining({ description: 'Cotisation Alice', credit: 30, balance: 130 }),
    ]);
  });

  it('reports files that cannot be read', async () => {
    const useCase = new LoadMovements({
      read: async () => {
        throw new Error('not a zip file');
      },
    });

    await expect(useCase.execute(new Blob())).rejects.toEqual(
      new MovementsFileError('unreadableFile'),
    );
  });
});
