import type { Movement } from '../../domain/Movement';
import { useI18n } from '../i18n/I18nProvider';
import { formatAmount, formatDate } from '../format';

export function CotisationsSection({ cotisations, total }: { cotisations: Movement[]; total: number }) {
  const { t, locale } = useI18n();

  return (
    <section className="card" aria-labelledby="cotisations-title">
      <h2 id="cotisations-title">{t('cotisationsTitle')}</h2>
      {cotisations.length === 0 ? (
        <p className="muted">{t('cotisationsEmpty')}</p>
      ) : (
        <>
          <p className="muted">
            {t('cotisationsCount', {
              count: cotisations.length,
              total: formatAmount(total, locale),
            })}
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t('date')}</th>
                <th scope="col">{t('description')}</th>
                <th scope="col" className="amount">
                  {t('amount')}
                </th>
              </tr>
            </thead>
            <tbody>
              {cotisations.map((cotisation, index) => (
                <tr key={index}>
                  <td>{formatDate(cotisation.date, locale, 'short')}</td>
                  <td>{cotisation.description}</td>
                  <td className="amount">{formatAmount(cotisation.credit, locale)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <th scope="row" colSpan={2}>
                  {t('total')}
                </th>
                <td className="amount">{formatAmount(total, locale)}</td>
              </tr>
            </tfoot>
          </table>
        </>
      )}
    </section>
  );
}
