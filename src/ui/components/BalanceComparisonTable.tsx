import { schoolYearLabel } from '../../domain/SchoolYear';
import type { SchoolYear, SchoolYearBalance } from '../../domain/SchoolYear';
import { useI18n } from '../i18n/I18nProvider';
import { formatAmount, formatSignedAmount } from '../format';

interface Props {
  /** From the oldest school year to the selected one. */
  balances: SchoolYearBalance[];
  selected: SchoolYear;
}

/** Account balance of the selected school year, compared with the previous ones. */
export function BalanceComparisonTable({ balances, selected }: Props) {
  const { t, locale } = useI18n();

  return (
    <section className="card" aria-labelledby="balance-title">
      <h2 id="balance-title">{t('balanceTitle')}</h2>
      <table className="data-table balance-comparison">
        <thead>
          <tr>
            <th scope="col">{t('schoolYearColumn')}</th>
            <th scope="col" className="amount">
              {t('openingBalanceColumn')}
            </th>
            <th scope="col" className="amount">
              {t('closingBalanceColumn')}
            </th>
            <th scope="col" className="amount">
              {t('balanceVariation')}
            </th>
          </tr>
        </thead>
        <tbody>
          {balances.map(({ schoolYear, openingBalance, closingBalance, change }) => {
            const isSelected = schoolYear.startYear === selected.startYear;
            return (
              <tr
                key={schoolYear.startYear}
                className={isSelected ? 'selected-year' : undefined}
                aria-current={isSelected ? 'true' : undefined}
              >
                <th scope="row">{schoolYearLabel(schoolYear)}</th>
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
