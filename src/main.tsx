import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LoadMovements } from './application/LoadMovements';
import { ExcelSpreadsheetReader } from './infra/ExcelSpreadsheetReader';
import { App } from './ui/App';
import { I18nProvider } from './ui/i18n/I18nProvider';
import './ui/styles.css';

const loadMovements = new LoadMovements(new ExcelSpreadsheetReader());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App loadMovements={loadMovements} />
    </I18nProvider>
  </StrictMode>,
);
