import readExcelFile from 'read-excel-file/universal';
import type { Sheet, SheetRows, SpreadsheetReader } from '../domain/SpreadsheetReader';

/** Reads `.xlsx` files in the browser, without any server. */
export class ExcelSpreadsheetReader implements SpreadsheetReader {
  async read(file: Blob): Promise<Sheet[]> {
    const sheets = await readExcelFile(file);
    return sheets.map(({ sheet, data }) => ({ name: sheet, rows: data as unknown as SheetRows }));
  }
}
