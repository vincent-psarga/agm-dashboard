import { useState } from 'react';
import type { LoadMovements } from '../application/LoadMovements';
import type { Movement } from '../domain/Movement';
import { MovementsFileError } from '../domain/MovementsFileError';
import { Dashboard } from './components/Dashboard';
import { FileUpload } from './components/FileUpload';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useI18n } from './i18n/I18nProvider';
import type { Translate } from './i18n/I18nProvider';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'ready'; movements: Movement[] };

export function App({ loadMovements }: { loadMovements: LoadMovements }) {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ status: 'idle' });

  const onFile = async (file: Blob) => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'ready', movements: await loadMovements.execute(file) });
    } catch (error) {
      setState({ status: 'error', error });
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>{t('appTitle')}</h1>
          <p className="muted">{t('appSubtitle')}</p>
        </div>
        <div className="app-header-actions">
          {state.status === 'ready' && (
            <button type="button" className="button-secondary no-print" onClick={() => setState({ status: 'idle' })}>
              {t('changeFile')}
            </button>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      <main>
        {state.status === 'ready' ? (
          <Dashboard movements={state.movements} />
        ) : (
          <FileUpload
            onFile={onFile}
            isLoading={state.status === 'loading'}
            error={state.status === 'error' ? errorMessage(state.error, t) : null}
          />
        )}
      </main>
    </div>
  );
}

function errorMessage(error: unknown, t: Translate): string {
  if (!(error instanceof MovementsFileError)) return t('errorUnknown');
  switch (error.code) {
    case 'missingColumns':
      return error.sheetName
        ? t('errorMissingColumnsInSheet', { sheet: error.sheetName, columns: error.details.join(', ') })
        : t('errorMissingColumns', { columns: error.details.join(', ') });
    case 'noMovements':
      return error.sheetName
        ? t('errorNoMovementsInSheet', { sheet: error.sheetName })
        : t('errorNoMovements');
    case 'unreadableFile':
      return t('errorUnreadableFile');
  }
}
