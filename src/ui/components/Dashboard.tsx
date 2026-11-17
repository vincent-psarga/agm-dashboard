import type { FinancialSummary } from '../../domain/FinancialSummary';
import { useI18n } from '../i18n/I18nProvider';
import { formatDate } from '../format';
import { BalanceTable } from './BalanceTable';
import { BreakdownSection } from './BreakdownSection';
import { CommandsSection } from './CommandsSection';
import { CotisationsSection } from './CotisationsSection';

export function Dashboard({ summary }: { summary: FinancialSummary }) {
  const { t, locale } = useI18n();

  return (
    <div className="dashboard">
      <h2 className="period">
        {t('periodTitle', {
          start: formatDate(summary.period.start, locale),
          end: formatDate(summary.period.end, locale),
        })}
      </h2>
      <BalanceTable summary={summary} />
      <CotisationsSection cotisations={summary.cotisations} total={summary.cotisationsTotal} />
      <BreakdownSection id="expenses" title={t('expensesTitle')} breakdown={summary.expenses} />
      <BreakdownSection id="incomes" title={t('incomesTitle')} breakdown={summary.incomes} />
      <CommandsSection commands={summary.groupedCommands} />
    </div>
  );
}
