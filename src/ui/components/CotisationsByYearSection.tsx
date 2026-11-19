import { Fragment, useState } from 'react';
import type { YearCotisations } from '../../domain/FinancialSummary';
import { yearLabel } from '../../domain/Year';
import { formatAmount, formatDate } from '../format';
import { useI18n } from '../i18n/I18nProvider';

/**
 * Membership fees of the whole period: one row per year, with the number of members who paid
 * and the total of their fees. Clicking on a year lists its members, which are not printed.
 */
export function CotisationsByYearSection({ years }: { years: YearCotisations[] }) {
  const { t, locale } = useI18n();

  // Nothing to show: no empty section in the report.
  if (years.every(({ cotisations }) => cotisations.length === 0)) return null;

  const count = years.reduce((sum, { cotisations }) => sum + cotisations.length, 0);
  const total = years.reduce((sum, year) => sum + year.total, 0);

  return (
    <section className="card" aria-labelledby="cotisations-title">
      <h2 id="cotisations-title">{t('cotisationsTitle')}</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{t('yearColumn')}</th>
            <th scope="col" className="amount">
              {t('payingMembersColumn')}
            </th>
            <th scope="col" className="amount">
              {t('cotisationsTotalColumn')}
            </th>
          </tr>
        </thead>
        <tbody>
          {years.map((yearCotisations) => (
            <YearRows key={yearLabel(yearCotisations.year)} yearCotisations={yearCotisations} />
          ))}
        </tbody>
        <tfoot>
          <tr className="total-row">
            <th scope="row">{t('total')}</th>
            <td className="amount">{count}</td>
            <td className="amount">{formatAmount(Math.round(total * 100) / 100, locale)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

function YearRows({ yearCotisations: { year, cotisations, total } }: { yearCotisations: YearCotisations }) {
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const label = yearLabel(year);

  return (
    <Fragment>
      <tr>
        <td>
          {cotisations.length > 0 ? (
            <button
              type="button"
              className="category-toggle"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((open) => !open)}
            >
              {label}
            </button>
          ) : (
            // Aligned with the years that can be opened.
            <span className="toggle-placeholder">{label}</span>
          )}
        </td>
        <td className="amount">{cotisations.length}</td>
        <td className="amount">{formatAmount(total, locale)}</td>
      </tr>
      {isOpen && (
        <tr className="category-movements no-print">
          <td colSpan={3}>
            <table aria-label={t('yearMembers', { year: label })}>
              <tbody>
                {cotisations.map((cotisation, index) => (
                  <tr key={index}>
                    <td>{formatDate(cotisation.date, locale, 'short')}</td>
                    <td>{cotisation.memberName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </Fragment>
  );
}
