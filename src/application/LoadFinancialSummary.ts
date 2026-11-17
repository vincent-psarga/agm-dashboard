import type { FinancialSummary } from '../domain/FinancialSummary';
import { MovementsFileError } from '../domain/MovementsFileError';
import type { Sheet, SpreadsheetReader } from '../domain/SpreadsheetReader';
import { computeSummary } from './computeSummary';
import { parseMovements } from './parseMovements';

/** Use case: turns the uploaded bank export into the summary shown during the meeting. */
export class LoadFinancialSummary {
  constructor(private readonly reader: SpreadsheetReader) {}

  async execute(file: Blob): Promise<FinancialSummary> {
    let sheets: Sheet[];
    try {
      sheets = await this.reader.read(file);
    } catch {
      throw new MovementsFileError('unreadableFile');
    }
    return computeSummary(parseMovements(sheets));
  }
}
