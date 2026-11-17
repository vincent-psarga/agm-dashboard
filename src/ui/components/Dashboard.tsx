import { useMemo, useState } from 'react';
import { computeSummary } from '../../application/computeSummary';
import { listSchoolYears, movementsOfSchoolYear } from '../../application/schoolYears';
import type { Movement } from '../../domain/Movement';
import { schoolYearLabel } from '../../domain/SchoolYear';
import type { SchoolYear } from '../../domain/SchoolYear';
import { useI18n } from '../i18n/I18nProvider';
import { formatDate } from '../format';
import { BalanceTable } from './BalanceTable';
import { BreakdownSection } from './BreakdownSection';
import { CommandsSection } from './CommandsSection';
import { CotisationsSection } from './CotisationsSection';
import { SchoolYearSelector } from './SchoolYearSelector';

export function Dashboard({ movements }: { movements: Movement[] }) {
  const { t, locale } = useI18n();
  const schoolYears = useMemo(() => listSchoolYears(movements), [movements]);
  // The most recent school year is the one usually presented at the meeting.
  const [schoolYear, setSchoolYear] = useState<SchoolYear | null>(schoolYears[0]);

  const summary = useMemo(
    () => computeSummary(movementsOfSchoolYear(movements, schoolYear)),
    [movements, schoolYear],
  );
  const period = {
    start: formatDate(summary.period.start, locale),
    end: formatDate(summary.period.end, locale),
  };

  return (
    <div className="dashboard">
      {schoolYears.length > 1 && (
        <SchoolYearSelector schoolYears={schoolYears} selected={schoolYear} onSelect={setSchoolYear} />
      )}
      <div className="period">
        {schoolYear ? (
          <>
            <h2>{t('schoolYearTitle', { year: schoolYearLabel(schoolYear) })}</h2>
            <p className="muted">{t('movementsPeriod', period)}</p>
          </>
        ) : (
          <h2>{t('periodTitle', period)}</h2>
        )}
      </div>
      <BalanceTable summary={summary} />
      <CotisationsSection cotisations={summary.cotisations} total={summary.cotisationsTotal} />
      <BreakdownSection id="expenses" title={t('expensesTitle')} breakdown={summary.expenses} />
      <BreakdownSection id="incomes" title={t('incomesTitle')} breakdown={summary.incomes} />
      <CommandsSection commands={summary.groupedCommands} />
    </div>
  );
}
