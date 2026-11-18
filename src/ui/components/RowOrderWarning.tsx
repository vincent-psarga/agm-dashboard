import type { RowOrder } from '../../domain/RowOrder';
import { formatDate, formatSignedAmount } from '../format';
import { useI18n } from '../i18n/I18nProvider';

/**
 * Warns the treasurer about rows which are not sorted by date (usually a typo in the date):
 * the balances of the school years are wrong until they are fixed. Not printed.
 */
export function RowOrderWarning({ rowOrder }: { rowOrder: RowOrder }) {
  const { t, locale } = useI18n();
  const { misplaced, mostRecentFirst } = rowOrder;
  if (misplaced.length === 0) return null;

  const date = (movement: { date: Date } | null) =>
    movement ? formatDate(movement.date, locale, 'short') : '—';

  return (
    <details className="warning no-print">
      <summary>
        <span aria-hidden="true">⚠ </span>
        <strong>{t('rowOrderWarningTitle', { count: misplaced.length })}</strong>{' '}
        {t(mostRecentFirst ? 'rowOrderExpectedMostRecentFirst' : 'rowOrderExpectedOldestFirst')}{' '}
        <span className="warning-toggle">{t('rowOrderShowRows')}</span>
      </summary>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{t('rowNumber')}</th>
            <th scope="col">{t('date')}</th>
            <th scope="col">{t('description')}</th>
            <th scope="col" className="amount">
              {t('amount')}
            </th>
            <th scope="col">{t('previousRowDate')}</th>
            <th scope="col">{t('nextRowDate')}</th>
          </tr>
        </thead>
        <tbody>
          {misplaced.map(({ movement, previous, next }) => (
            <tr key={movement.rowNumber}>
              <th scope="row">{movement.rowNumber}</th>
              <td>
                <strong>{date(movement)}</strong>
              </td>
              <td>{movement.description}</td>
              <td className="amount">{formatSignedAmount(movement.credit - movement.debit, locale)}</td>
              <td>{date(previous)}</td>
              <td>{date(next)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
