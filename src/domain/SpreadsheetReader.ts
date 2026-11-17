export type Cell = string | number | boolean | Date | null;

export type SheetRows = Cell[][];

export interface Sheet {
  name: string;
  rows: SheetRows;
}

/** Port: reads all the sheets of a spreadsheet file, each one as a 2D array of cells. */
export interface SpreadsheetReader {
  read(file: Blob): Promise<Sheet[]>;
}
