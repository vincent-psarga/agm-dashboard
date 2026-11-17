import type { FinancialSummary } from '../../domain/FinancialSummary';
import { useI18n } from '../i18n/I18nProvider';
import { formatAmount, formatDate, formatSignedAmount } from '../format';

export function BalanceTable({ summary }: { summary: FinancialSummary }) {
  const { t, locale } = useI18n();
  const variation = summary.finalBalance - summary.initialBalance;

  return (
    <section className="card" aria-labelledby="balance-title">
      <h2 id="balance-title">{t('balanceTitle')}</h2>
      <table className="data-table">
        <tbody>
          <tr>
            <th scope="row">
              {t('initialBalance', { date: formatDate(summary.period.start, locale) })}
            </th>
            <td className="amount">{formatAmount(summary.initialBalance, locale)}</td>
          </tr>
          <tr>
            <th scope="row">{t('finalBalance', { date: formatDate(summary.period.end, locale) })}</th>
            <td className="amount">{formatAmount(summary.finalBalance, locale)}</td>
          </tr>
          <tr className="total-row">
            <th scope="row">{t('balanceVariation')}</th>
            <td className={`amount ${variation < 0 ? 'negative' : 'positive'}`}>
              {formatSignedAmount(variation, locale)}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
