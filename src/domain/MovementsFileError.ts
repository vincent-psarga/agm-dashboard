export type MovementsFileErrorCode = 'missingColumns' | 'noMovements' | 'unreadableFile';

/** Raised when an uploaded file cannot be turned into a list of movements. */
export class MovementsFileError extends Error {
  constructor(
    readonly code: MovementsFileErrorCode,
    /** For `missingColumns`: the names of the columns that were not found. */
    readonly details: string[] = [],
    /** The sheet the error relates to, when the file has several sheets. */
    readonly sheetName?: string,
  ) {
    super(
      [code, sheetName && `sheet "${sheetName}"`, details.length > 0 && details.join(', ')]
        .filter(Boolean)
        .join(': '),
    );
    this.name = 'MovementsFileError';
  }
}
