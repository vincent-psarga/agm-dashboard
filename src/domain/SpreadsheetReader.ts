export type Cell = string | number | boolean | Date | null;

export type SheetRows = Cell[][];

/** Port: reads the first sheet of a spreadsheet file as a 2D array of cells. */
export interface SpreadsheetReader {
  read(file: Blob): Promise<SheetRows>;
}
