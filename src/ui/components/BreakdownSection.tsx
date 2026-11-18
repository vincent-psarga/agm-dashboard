import { Fragment, useState } from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { CategoryBreakdown, CategoryTotal } from '../../domain/FinancialSummary';
import { useChartPalette } from '../charts/palette';
import { formatAmount, formatDate, formatPercent } from '../format';
import { useI18n } from '../i18n/I18nProvider';

const PIE_WIDTH = 460;
const PIE_HEIGHT = 300;

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

  if (breakdown.categories.length === 0) {
    return (
      <section className="card" aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        <p className="muted">{t('breakdownEmpty')}</p>
      </section>
    );
  }

  const slices = breakdown.slices.map((slice, index) => ({
    name: categoryName(slice.category),
    value: slice.amount,
    color: slice.category === null ? palette.others : palette.categorical[index],
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
          {/*
            Drawn at a fixed size then scaled to the column by CSS: the labels shrink
            with the pie instead of being cut when the column is narrow (e.g. printed).
          */}
          <PieChart width={PIE_WIDTH} height={PIE_HEIGHT}>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              outerRadius="62%"
              stroke={palette.surface}
              strokeWidth={2}
              isAnimationActive={false}
              label={(props: PieLabelRenderProps) => (
                <SliceLabel {...props} locale={locale} color={palette.text} />
              )}
              labelLine={{ stroke: palette.axis }}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </figure>
      </div>
    </section>
  );
}

/**
 * Category name and percentage written next to each slice: the chart can be read
 * without matching colors (color-blind readers, black and white prints).
 */
function SliceLabel({
  x,
  y,
  textAnchor,
  name,
  percent,
  locale,
  color,
}: PieLabelRenderProps & { locale: string; color: string }) {
  return (
    <text x={x} y={y} textAnchor={textAnchor} fill={color} fontSize={13}>
      <tspan x={x} dy="-0.2em">
        {name}
      </tspan>
      <tspan x={x} dy="1.2em" fontWeight={600}>
        {formatPercent(percent ?? 0, locale)}
      </tspan>
    </text>
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
