import { useId } from 'react';
import { yearLabel } from '../../domain/Year';
import type { Year, YearKind } from '../../domain/Year';
import { useI18n } from '../i18n/I18nProvider';

const WHOLE_PERIOD = 'all';
const KINDS: YearKind[] = ['school', 'calendar'];

interface Props {
  kind: YearKind;
  onKindChange: (kind: YearKind) => void;
  /** The years of the selected kind, most recent first. */
  years: Year[];
  /** `null` means the whole period covered by the file. */
  selected: Year | null;
  onSelect: (year: Year | null) => void;
}

/** Picks the kind of year (school or calendar), then the year to present. Not printed. */
export function YearSelector({ kind, onKindChange, years, selected, onSelect }: Props) {
  const { t } = useI18n();
  const id = useId();

  return (
    <div className="year-selector no-print">
      <label htmlFor={id}>{t('yearSelectLabel')}</label>
      <div className="segmented" role="group" aria-label={t('yearKindLabel')}>
        {KINDS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={kind === option}
            onClick={() => onKindChange(option)}
          >
            {t(option === 'school' ? 'yearKindSchool' : 'yearKindCalendar')}
          </button>
        ))}
      </div>
      <select
        id={id}
        value={selected ? String(selected.startYear) : WHOLE_PERIOD}
        onChange={(event) =>
          onSelect(
            event.target.value === WHOLE_PERIOD
              ? null
              : { kind, startYear: Number(event.target.value) },
          )
        }
      >
        {years.map((year) => (
          <option key={year.startYear} value={year.startYear}>
            {yearLabel(year)}
          </option>
        ))}
        <option value={WHOLE_PERIOD}>{t('wholePeriod')}</option>
      </select>
    </div>
  );
}
