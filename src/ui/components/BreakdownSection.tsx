import { Fragment, useState } from 'react';
import type { CategoryBreakdown, CategoryTotal } from '../../domain/FinancialSummary';
import { PieChart } from '../charts/PieChart';
import { useChartPalette } from '../charts/palette';
import { formatAmount, formatDate, formatPercent } from '../format';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  id: string;
  title: string;
  breakdown: CategoryBreakdown;
}

export function BreakdownSection({ id, title, breakdown }: Props) {
  const { t, locale } = useI18n();
  const palette = useChartPalette();
  const titleId = `${id}-title`;
  const categoryName = (category: string | null) =>
    category === null ? t('others') : category || t('uncategorized');

  // Nothing to show: no empty section in the report.
  if (breakdown.categories.length === 0) return null;

  const slices = breakdown.slices.map((slice, index) => ({
    name: categoryName(slice.category),
    value: slice.amount,
    color: slice.category === null ? palette.others : palette.categorical[index],
    percentLabel: formatPercent(slice.amount / breakdown.total, locale),
  }));

  return (
    <section className="card" aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      <div className="breakdown">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">{t('category')}</th>
              <th scope="col" className="amount">
                {t('amount')}
              </th>
              <th scope="col" className="amount">
                {t('share')}
              </th>
            </tr>
          </thead>
          <tbody>
            {breakdown.categories.map((categoryTotal) => (
              <CategoryRows
                key={categoryTotal.category}
                categoryTotal={categoryTotal}
                name={categoryName(categoryTotal.category)}
                total={breakdown.total}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <th scope="row">{t('total')}</th>
              <td className="amount">{formatAmount(breakdown.total, locale)}</td>
              <td />
            </tr>
          </tfoot>
        </table>

        <figure className="chart" aria-label={t('chartLabel', { title: title.toLowerCase() })}>
          <PieChart slices={slices} palette={palette} />
        </figure>
      </div>
    </section>
  );
}

/**
 * A category of the table. Clicking on it shows its movements below it, to check where the
 * amount comes from during the meeting. The movements are not printed.
 */
function CategoryRows({
  categoryTotal: { amount, movements },
  name,
  total,
}: {
  categoryTotal: CategoryTotal;
  name: string;
  total: number;
}) {
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Fragment>
      <tr>
        <td>
          <button
            type="button"
            className="category-toggle"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((open) => !open)}
          >
            {name}
          </button>
        </td>
        <td className="amount">{formatAmount(amount, locale)}</td>
        <td className="amount muted">{formatPercent(amount / total, locale)}</td>
      </tr>
      {isOpen && (
        <tr className="category-movements no-print">
          <td colSpan={3}>
            <table aria-label={t('categoryMovements', { category: name })}>
              <tbody>
                {movements.map((movement, index) => (
                  <tr key={index}>
                    <td>{formatDate(movement.date, locale, 'short')}</td>
                    <td>{movement.description}</td>
                    <td className="amount">{formatAmount(movement.amount, locale)}</td>
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
