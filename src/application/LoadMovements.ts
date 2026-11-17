import type { Movement } from '../domain/Movement';
import { MovementsFileError } from '../domain/MovementsFileError';
import type { Sheet, SpreadsheetReader } from '../domain/SpreadsheetReader';
import { parseMovements } from './parseMovements';

/** Use case: reads the movements of the uploaded bank export. */
export class LoadMovements {
  constructor(private readonly reader: SpreadsheetReader) {}

  async execute(file: Blob): Promise<Movement[]> {
    let sheets: Sheet[];
    try {
      sheets = await this.reader.read(file);
    } catch {
      throw new MovementsFileError('unreadableFile');
    }
    return parseMovements(sheets);
  }
}
