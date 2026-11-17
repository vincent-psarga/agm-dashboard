// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { ExcelSpreadsheetReader } from './ExcelSpreadsheetReader';

const SAMPLE = new URL('../../public/sample-movements.xlsx', import.meta.url);

describe('ExcelSpreadsheetReader', () => {
  it('reads every sheet of an xlsx file, as rows of cells', async () => {
    const file = new Blob([await readFile(SAMPLE)]);

    const sheets = await new ExcelSpreadsheetReader().read(file);

    expect(sheets.map((sheet) => sheet.name)).toEqual(['Notes', 'Mouvements']);
    const { rows } = sheets[1];

    expect(rows[0]).toEqual(['Date', 'Description', 'Type', 'Débit', 'Crédit', 'Raison', 'Tag', 'Solde']);
    expect(rows[1]).toEqual([
      new Date('2025-08-31T00:00:00Z'),
      'Frais bancaires',
      'Prélèvement',
      12,
      null,
      'Frais bancaires',
      null,
      1194.2,
    ]);
  });

  it('fails on files that are not spreadsheets', async () => {
    await expect(new ExcelSpreadsheetReader().read(new Blob(['hello']))).rejects.toThrow();
  });
});
