import { useId } from 'react';
import { schoolYearLabel } from '../../domain/SchoolYear';
import type { SchoolYear } from '../../domain/SchoolYear';
import { useI18n } from '../i18n/I18nProvider';

const WHOLE_PERIOD = 'all';

interface Props {
  schoolYears: SchoolYear[];
  /** `null` means the whole period covered by the file. */
  selected: SchoolYear | null;
  onSelect: (schoolYear: SchoolYear | null) => void;
}

export function SchoolYearSelector({ schoolYears, selected, onSelect }: Props) {
  const { t } = useI18n();
  const id = useId();

  return (
    <div className="school-year-selector no-print">
      <label htmlFor={id}>{t('schoolYearLabel')}</label>
      <select
        id={id}
        value={selected ? String(selected.startYear) : WHOLE_PERIOD}
        onChange={(event) =>
          onSelect(
            event.target.value === WHOLE_PERIOD ? null : { startYear: Number(event.target.value) },
          )
        }
      >
        {schoolYears.map((schoolYear) => (
          <option key={schoolYear.startYear} value={schoolYear.startYear}>
            {schoolYearLabel(schoolYear)}
          </option>
        ))}
        <option value={WHOLE_PERIOD}>{t('wholePeriod')}</option>
      </select>
    </div>
  );
}
