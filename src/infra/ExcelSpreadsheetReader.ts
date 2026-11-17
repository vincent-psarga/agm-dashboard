import { readSheet } from 'read-excel-file/universal';
import type { SheetRows, SpreadsheetReader } from '../domain/SpreadsheetReader';

/** Reads `.xlsx` files in the browser, without any server. */
export class ExcelSpreadsheetReader implements SpreadsheetReader {
  async read(file: Blob): Promise<SheetRows> {
    const rows = await readSheet(file);
    return rows as unknown as SheetRows;
  }
}
