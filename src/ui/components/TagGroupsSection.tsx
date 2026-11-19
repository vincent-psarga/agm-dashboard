import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { TagGroup } from '../../domain/FinancialSummary';
import { useChartPalette } from '../charts/palette';
import { formatAmount, formatSignedAmount } from '../format';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  id: string;
  title: string;
  groups: TagGroup[];
}

/**
 * Expenses and incomes of the movements sharing a tag (grouped orders, prestations...),
 * with one small chart per tag key.
 */
export function TagGroupsSection({ id, title, groups }: Props) {
  // All the charts share the same scale so that they can be compared.
  const maxAmount = Math.max(0, ...groups.flatMap((group) => [group.expenses, group.incomes]));

  // The section is only shown when some movements have the tag.
  if (groups.length === 0) return null;

  const titleId = `${id}-title`;
  return (
    <section className="card" aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      <div className="tag-groups">
        {groups.map((group) => (
          <TagGroupChart key={group.key} group={group} maxAmount={maxAmount} />
        ))}
      </div>
    </section>
  );
}

function TagGroupChart({ group, maxAmount }: { group: TagGroup; maxAmount: number }) {
  const { t, locale } = useI18n();
  const palette = useChartPalette();

  const bars = [
    { name: t('commandExpenses'), value: group.expenses, color: palette.expense },
    { name: t('commandIncomes'), value: group.incomes, color: palette.income },
  ];

  return (
    <article className="tag-group" aria-label={group.key}>
      <h3>{group.key}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={bars} margin={{ top: 24, right: 8, bottom: 0, left: 8 }} barCategoryGap="20%">
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={{ stroke: palette.axis }}
            tick={{ fill: palette.text, fontSize: 13 }}
          />
          <YAxis hide domain={[0, maxAmount || 1]} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {bars.map((bar) => (
              <Cell key={bar.name} fill={bar.color} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              fill={palette.text}
              fontSize={13}
              formatter={(value) => formatAmount(Number(value), locale)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="tag-group-difference">
        {t('commandDifference')}{' '}
        <strong className={group.difference < 0 ? 'negative' : 'positive'}>
          {formatSignedAmount(group.difference, locale)}
        </strong>
      </p>
    </article>
  );
}
