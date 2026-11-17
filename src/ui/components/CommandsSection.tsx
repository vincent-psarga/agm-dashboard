import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { GroupedCommand } from '../../domain/FinancialSummary';
import { useChartPalette } from '../charts/palette';
import { formatAmount, formatSignedAmount } from '../format';
import { useI18n } from '../i18n/I18nProvider';

export function CommandsSection({ commands }: { commands: GroupedCommand[] }) {
  const { t } = useI18n();
  // All the charts share the same scale so that the orders can be compared.
  const maxAmount = Math.max(0, ...commands.flatMap((command) => [command.expenses, command.incomes]));

  return (
    <section className="card" aria-labelledby="commands-title">
      <h2 id="commands-title">{t('commandsTitle')}</h2>
      {commands.length === 0 ? (
        <p className="muted">{t('commandsEmpty')}</p>
      ) : (
        <>
          <p className="muted">{t('commandsHelp')}</p>
          <div className="commands">
            {commands.map((command) => (
              <CommandChart key={command.key} command={command} maxAmount={maxAmount} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function CommandChart({ command, maxAmount }: { command: GroupedCommand; maxAmount: number }) {
  const { t, locale } = useI18n();
  const palette = useChartPalette();

  const bars = [
    { name: t('commandExpenses'), value: command.expenses, color: palette.expense },
    { name: t('commandIncomes'), value: command.incomes, color: palette.income },
  ];

  return (
    <article className="command" aria-label={command.key}>
      <h3>{command.key}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={bars} margin={{ top: 24, right: 8, bottom: 0, left: 8 }} barCategoryGap="20%">
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={{ stroke: palette.axis }}
            tick={{ fill: palette.text, fontSize: 13 }}
          />
          <YAxis hide domain={[0, maxAmount || 1]} />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            formatter={(value) => [formatAmount(Number(value), locale)]}
          />
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
      <p className="command-difference">
        {t('commandDifference')}{' '}
        <strong className={command.difference < 0 ? 'negative' : 'positive'}>
          {formatSignedAmount(command.difference, locale)}
        </strong>
      </p>
    </article>
  );
}
