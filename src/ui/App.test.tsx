import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LoadFinancialSummary } from '../application/LoadFinancialSummary';
import type { SheetRows } from '../domain/SpreadsheetReader';
import { App } from './App';
import { I18nProvider } from './i18n/I18nProvider';
import type { Language } from './i18n/translations';

const ROWS: SheetRows = [
  ['Date', 'Description', 'Type', 'Débit', 'Crédit', 'Raison', 'Tag', 'Solde'],
  ['05/01/2025', 'Cotisation Alice', '', null, 30, 'Cotisation', null, 130],
  ['10/02/2025', 'Achat épées', '', 450, null, 'Commande', 'cmd:sword', -320],
  ['12/02/2025', 'Remboursement épée', '', null, 300, 'Commande', 'cmd:sword', -20],
  ['20/12/2025', 'Location salle', '', 80, null, 'Location', null, -100],
];

function renderApp({ rows = ROWS, language = 'en' }: { rows?: SheetRows; language?: Language } = {}) {
  const loadSummary = new LoadFinancialSummary({ read: async () => [{ name: 'Sheet1', rows }] });
  render(
    <I18nProvider initialLanguage={language}>
      <App loadSummary={loadSummary} />
    </I18nProvider>,
  );
}

async function uploadFile() {
  const file = new File(['content'], 'movements.xlsx');
  await userEvent.upload(screen.getByLabelText('Choose an Excel file'), file);
}

describe('App', () => {
  it('asks for the Excel file first', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Import the bank movements' })).toBeInTheDocument();
  });

  it('shows the overview once the file is uploaded', async () => {
    renderApp();

    await uploadFile();

    expect(
      await screen.findByRole('heading', {
        name: 'Financial year from 5 January 2025 to 20 December 2025',
      }),
    ).toBeInTheDocument();

    const balance = screen.getByRole('region', { name: 'Account balance' });
    expect(within(balance).getByRole('row', { name: /Balance on 5 January 2025/ })).toHaveTextContent('€100.00');
    expect(within(balance).getByRole('row', { name: /Balance on 20 December 2025/ })).toHaveTextContent('-€100.00');

    const cotisations = screen.getByRole('region', { name: 'Membership fees' });
    const [, firstMember] = within(cotisations).getAllByRole('row');
    expect(within(firstMember).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'Alice',
      '05/01/2025',
    ]);
    expect(within(cotisations).getByRole('row', { name: /Number of membership fees/ })).toHaveTextContent('1');
    expect(within(cotisations).getByRole('row', { name: /Total/ })).toHaveTextContent('€30.00');

    const expenses = screen.getByRole('region', { name: 'Expenses' });
    const expenseRows = within(expenses).getAllByRole('row').map((row) => row.textContent);
    expect(expenseRows).toEqual([
      'CategoryAmountShare',
      'Commande€450.0084.9%',
      'Location€80.0015.1%',
      'Total€530.00',
    ]);

    const commands = screen.getByRole('region', { name: 'Grouped orders' });
    expect(within(commands).queryByText(/cmd:/)).not.toBeInTheDocument();
    expect(within(commands).getByRole('article', { name: 'sword' })).toHaveTextContent(
      'Difference: -€150.00',
    );
  });

  it('can be displayed in French', async () => {
    renderApp({ language: 'fr' });

    await userEvent.upload(screen.getByLabelText('Choisir un fichier Excel'), new File([''], 'a.xlsx'));

    expect(
      await screen.findByRole('heading', { name: 'Exercice du 5 janvier 2025 au 20 décembre 2025' }),
    ).toBeInTheDocument();
  });

  it('switches language', async () => {
    renderApp({ language: 'fr' });

    await userEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(screen.getByRole('heading', { name: 'Import the bank movements' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('explains why a file cannot be used', async () => {
    renderApp({ rows: [['Date', 'Description']] });

    await uploadFile();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Columns not found in the file: Débit, Crédit, Raison, Solde.',
    );
  });
});
