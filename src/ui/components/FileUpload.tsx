import { useId } from 'react';
import type { ChangeEvent } from 'react';
import { useI18n } from '../i18n/I18nProvider';

const SAMPLE_URL = `${import.meta.env.BASE_URL}sample-movements.xlsx`;

interface Props {
  onFile: (file: Blob) => void;
  isLoading: boolean;
  error: string | null;
}

export function FileUpload({ onFile, isLoading, error }: Props) {
  const { t } = useI18n();
  const inputId = useId();

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.target.value = '';
  };

  const loadSample = async () => {
    const response = await fetch(SAMPLE_URL);
    onFile(await response.blob());
  };

  return (
    <section className="card upload">
      <h2>{t('uploadTitle')}</h2>
      <p className="muted">{t('uploadHelp')}</p>

      <label htmlFor={inputId} className="button-primary">
        {t('uploadButton')}
      </label>
      <input
        id={inputId}
        className="visually-hidden"
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={onChange}
        disabled={isLoading}
      />

      <button type="button" className="button-link" onClick={loadSample} disabled={isLoading}>
        {t('trySample')}
      </button>

      {isLoading && <p role="status">{t('loading')}</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
