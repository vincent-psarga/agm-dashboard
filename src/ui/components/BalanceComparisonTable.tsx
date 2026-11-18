import { isSameYear, yearLabel } from '../../domain/Year';
import type { Year, YearBalance } from '../../domain/Year';
import { useI18n } from '../i18n/I18nProvider';
import { formatAmount, formatSignedAmount } from '../format';

interface Props {
  /** From the oldest year to the selected one. */
  balances: YearBalance[];
  selected: Year;
}

/** Account balance of the selected year, compared with the previous ones. */
export function BalanceComparisonTable({ balances, selected }: Props) {
  const { t, locale } = useI18n();

  return (
    <section className="card" aria-labelledby="balance-title">
      <h2 id="balance-title">{t('balanceTitle')}</h2>
      <table className="data-table balance-comparison">
        <thead>
          <tr>
            <th scope="col">{t('yearColumn')}</th>
            <th scope="col" className="amount">
              {t(selected.kind === 'school' ? 'schoolOpeningBalanceColumn' : 'calendarOpeningBalanceColumn')}
            </th>
            <th scope="col" className="amount">
              {t(selected.kind === 'school' ? 'schoolClosingBalanceColumn' : 'calendarClosingBalanceColumn')}
            </th>
            <th scope="col" className="amount">
              {t('balanceVariation')}
            </th>
          </tr>
        </thead>
        <tbody>
          {balances.map(({ year, openingBalance, closingBalance, change }) => {
            const isSelected = isSameYear(year, selected);
            return (
              <tr
                key={year.startYear}
                className={isSelected ? 'selected-year' : undefined}
                aria-current={isSelected ? 'true' : undefined}
              >
                <th scope="row">{yearLabel(year)}</th>
                <td className="amount">{formatAmount(openingBalance, locale)}</td>
                <td className="amount">{formatAmount(closingBalance, locale)}</td>
                <td className={`amount ${change < 0 ? 'negative' : 'positive'}`}>
                  {formatSignedAmount(change, locale)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
