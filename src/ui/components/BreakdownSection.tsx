import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { CategoryBreakdown } from '../../domain/FinancialSummary';
import { useChartPalette } from '../charts/palette';
import { formatAmount, formatPercent } from '../format';
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
            {breakdown.categories.map(({ category, amount }) => (
              <tr key={category}>
                <td>{categoryName(category)}</td>
                <td className="amount">{formatAmount(amount, locale)}</td>
                <td className="amount muted">{formatPercent(amount / breakdown.total, locale)}</td>
              </tr>
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
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                outerRadius="70%"
                stroke={palette.surface}
                strokeWidth={2}
                isAnimationActive={false}
                label={(props: PieLabelRenderProps) => (
                  <PercentLabel {...props} locale={locale} color={palette.text} />
                )}
                labelLine={{ stroke: palette.axis }}
              >
                {slices.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                itemSorter={null}
                formatter={(value) => <span className="legend-label">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </figure>
      </div>
    </section>
  );
}

/** Percentage shown next to each slice, so it stays readable once printed. */
function PercentLabel({
  x,
  y,
  textAnchor,
  percent,
  locale,
  color,
}: PieLabelRenderProps & { locale: string; color: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      dominantBaseline="central"
      fill={color}
      fontSize={13}
      fontWeight={600}
    >
      {formatPercent(percent ?? 0, locale)}
    </text>
  );
}
