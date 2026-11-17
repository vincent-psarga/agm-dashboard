// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { ExcelSpreadsheetReader } from './ExcelSpreadsheetReader';

const SAMPLE = new URL('../../public/sample-movements.xlsx', import.meta.url);

describe('ExcelSpreadsheetReader', () => {
  it('reads the first sheet of an xlsx file as rows of cells', async () => {
    const file = new Blob([await readFile(SAMPLE)]);

    const rows = await new ExcelSpreadsheetReader().read(file);

    expect(rows[0]).toEqual(['Date', 'Description', 'Type', 'Débit', 'Crédit', 'Raison', 'Tag', 'Solde']);
    expect(rows[1]).toEqual([
      new Date('2025-12-31T00:00:00Z'),
      'Frais bancaires',
      'Prélèvement',
      12,
      null,
      'Frais bancaires',
      null,
      1191.2,
    ]);
  });

  it('fails on files that are not spreadsheets', async () => {
    await expect(new ExcelSpreadsheetReader().read(new Blob(['hello']))).rejects.toThrow();
  });
});
