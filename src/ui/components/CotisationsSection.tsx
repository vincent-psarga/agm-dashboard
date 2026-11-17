import type { Cotisation } from '../../domain/FinancialSummary';
import { useI18n } from '../i18n/I18nProvider';
import { formatAmount, formatDate } from '../format';

export function CotisationsSection({ cotisations, total }: { cotisations: Cotisation[]; total: number }) {
  const { t, locale } = useI18n();

  return (
    <section className="card" aria-labelledby="cotisations-title">
      <h2 id="cotisations-title">{t('cotisationsTitle')}</h2>
      {cotisations.length === 0 ? (
        <p className="muted">{t('cotisationsEmpty')}</p>
      ) : (
        <>
          <table className="data-table members">
            <thead>
              <tr>
                <th scope="col">{t('memberName')}</th>
                <th scope="col">{t('cotisationDate')}</th>
              </tr>
            </thead>
            <tbody>
              {cotisations.map((cotisation, index) => (
                <tr key={index}>
                  <td>{cotisation.memberName}</td>
                  <td>{formatDate(cotisation.date, locale, 'short')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="data-table">
            <tbody>
              <tr>
                <th scope="row">{t('cotisationsCount')}</th>
                <td className="amount">{cotisations.length}</td>
              </tr>
              <tr className="total-row">
                <th scope="row">{t('total')}</th>
                <td className="amount">{formatAmount(total, locale)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
