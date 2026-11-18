import { useMemo, useState } from 'react';
import { computeSummary } from '../../application/computeSummary';
import { analyzeRowOrder } from '../../application/rowOrder';
import { compareWithPreviousYears, listYears, movementsOfYear } from '../../application/years';
import type { Movement } from '../../domain/Movement';
import { yearLabel } from '../../domain/Year';
import type { Year, YearKind } from '../../domain/Year';
import { useI18n } from '../i18n/I18nProvider';
import { formatDate } from '../format';
import { BalanceComparisonTable } from './BalanceComparisonTable';
import { BalanceTable } from './BalanceTable';
import { BreakdownSection } from './BreakdownSection';
import { CommandsSection } from './CommandsSection';
import { CotisationsSection } from './CotisationsSection';
import { RowOrderWarning } from './RowOrderWarning';
import { YearSelector } from './YearSelector';

export function Dashboard({ movements }: { movements: Movement[] }) {
  const { t, locale } = useI18n();
  const rowOrder = useMemo(() => analyzeRowOrder(movements), [movements]);
  // The association works on school years: the most recent one is usually presented at the meeting.
  const [kind, setKind] = useState<YearKind>('school');
  const years = useMemo(() => listYears(movements, kind), [movements, kind]);
  const [year, setYear] = useState<Year | null>(years[0]);
  const hasSeveralYears =
    listYears(movements, 'school').length > 1 || listYears(movements, 'calendar').length > 1;

  const changeKind = (newKind: YearKind) => {
    setKind(newKind);
    // The whole period stays selected; otherwise, the most recent year of the new kind.
    if (year !== null) setYear(listYears(movements, newKind)[0]);
  };

  const summary = useMemo(
    () => computeSummary(movementsOfYear(movements, year), rowOrder.mostRecentFirst),
    [movements, year, rowOrder],
  );
  const period = {
    start: formatDate(summary.period.start, locale),
    end: formatDate(summary.period.end, locale),
  };

  return (
    <div className="dashboard">
      <RowOrderWarning rowOrder={rowOrder} />
      {hasSeveralYears && (
        <YearSelector
          kind={kind}
          onKindChange={changeKind}
          years={years}
          selected={year}
          onSelect={setYear}
        />
      )}
      <div className="period">
        {year ? (
          <>
            <h2>
              {t(year.kind === 'school' ? 'schoolYearTitle' : 'calendarYearTitle', {
                year: yearLabel(year),
              })}
            </h2>
            <p className="muted">{t('movementsPeriod', period)}</p>
          </>
        ) : (
          <h2>{t('periodTitle', period)}</h2>
        )}
      </div>
      {year ? (
        <BalanceComparisonTable balances={compareWithPreviousYears(movements, year)} selected={year} />
      ) : (
        <BalanceTable summary={summary} />
      )}
      <CotisationsSection cotisations={summary.cotisations} total={summary.cotisationsTotal} />
      <BreakdownSection id="expenses" title={t('expensesTitle')} breakdown={summary.expenses} />
      <BreakdownSection id="incomes" title={t('incomesTitle')} breakdown={summary.incomes} />
      <CommandsSection commands={summary.groupedCommands} />
    </div>
  );
}
