export type MovementsFileErrorCode = 'missingColumns' | 'noMovements' | 'unreadableFile';

/** Raised when an uploaded file cannot be turned into a list of movements. */
export class MovementsFileError extends Error {
  constructor(
    readonly code: MovementsFileErrorCode,
    readonly details: string[] = [],
  ) {
    super(`${code}${details.length ? `: ${details.join(', ')}` : ''}`);
    this.name = 'MovementsFileError';
  }
}
