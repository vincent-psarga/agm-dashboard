import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LoadFinancialSummary } from './application/LoadFinancialSummary';
import { ExcelSpreadsheetReader } from './infra/ExcelSpreadsheetReader';
import { App } from './ui/App';
import { I18nProvider } from './ui/i18n/I18nProvider';
import './ui/styles.css';

const loadSummary = new LoadFinancialSummary(new ExcelSpreadsheetReader());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App loadSummary={loadSummary} />
    </I18nProvider>
  </StrictMode>,
);
