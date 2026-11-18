import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LoadMovements } from '../application/LoadMovements';
import type { SheetRows } from '../domain/SpreadsheetReader';
import { App } from './App';
import { I18nProvider } from './i18n/I18nProvider';
import type { Language } from './i18n/translations';

const ROWS: SheetRows = [
  ['Date', 'Description', 'Type', 'Débit', 'Crédit', 'Raison', 'Tag', 'Solde'],
  ['05/01/2025', 'Cotisation Alice', '', null, 30, 'Cotisation', null, 130],
  ['10/02/2025', 'Achat épées', '', 450, null, 'Commande', 'cmd:sword', -320],
  ['12/02/2025', 'Remboursement épée', '', null, 300, 'Commande', 'cmd:sword', -20],
  ['20/06/2025', 'Location salle', '', 80, null, 'Location', null, -100],
];

/** Two school years: 2023-2024 and 2024-2025. */
const TWO_YEARS_ROWS: SheetRows = [
  ['Date', 'Description', 'Type', 'Débit', 'Crédit', 'Raison', 'Tag', 'Solde'],
  ['15/09/2023', 'Cotisation Zoé', '', null, 25, 'Cotisation', null, 525],
  ['10/03/2024', 'Assurance', '', 200, null, 'Assurance', null, 325],
  ['15/09/2024', 'Cotisation Alice', '', null, 30, 'Cotisation', null, 355],
  ['01/06/2025', 'Location salle', '', 80, null, 'Location', null, 275],
];

function renderApp({ rows = ROWS, language = 'en' }: { rows?: SheetRows; language?: Language } = {}) {
  const loadMovements = new LoadMovements({ read: async () => [{ name: 'Sheet1', rows }] });
  render(
    <I18nProvider initialLanguage={language}>
      <App loadMovements={loadMovements} />
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
      await screen.findByRole('heading', { name: 'School year 2024-2025' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Movements from 5 January 2025 to 20 June 2025')).toBeInTheDocument();

    const balance = screen.getByRole('region', { name: 'Account balance' });
    expect(within(balance).getAllByRole('row').map((row) => row.textContent)).toEqual([
      'YearOn 1 SeptOn 31 AugChange',
      '2024-2025€100.00-€100.00-€200.00',
    ]);

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

  it('does not show the grouped orders section when no movement is tagged "cmd:..."', async () => {
    renderApp({ rows: ROWS.map((row) => row.map((cell) => (cell === 'cmd:sword' ? null : cell))) });

    await uploadFile();

    expect(await screen.findByRole('region', { name: 'Expenses' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Grouped orders' })).not.toBeInTheDocument();
  });

  describe('when the file covers several school years', () => {
    it('shows the most recent school year first', async () => {
      renderApp({ rows: TWO_YEARS_ROWS });

      await uploadFile();

      expect(await screen.findByRole('heading', { name: 'School year 2024-2025' })).toBeInTheDocument();
      const balance = screen.getByRole('region', { name: 'Account balance' });
      expect(within(balance).getAllByRole('row').map((row) => row.textContent)).toEqual([
        'YearOn 1 SeptOn 31 AugChange',
        '2023-2024€500.00€325.00-€175.00',
        '2024-2025€325.00€275.00-€50.00',
      ]);
      expect(within(balance).getByRole('row', { current: true })).toHaveTextContent('2024-2025');
      const cotisations = screen.getByRole('region', { name: 'Membership fees' });
      expect(within(cotisations).getByText('Alice')).toBeInTheDocument();
      expect(within(cotisations).queryByText('Zoé')).not.toBeInTheDocument();
    });

    it('shows the selected school year', async () => {
      renderApp({ rows: TWO_YEARS_ROWS });
      await uploadFile();

      await userEvent.selectOptions(await screen.findByLabelText('School year'), '2023-2024');

      expect(screen.getByRole('heading', { name: 'School year 2023-2024' })).toBeInTheDocument();
      const balance = screen.getByRole('region', { name: 'Account balance' });
      expect(within(balance).getAllByRole('row')).toHaveLength(2);
      expect(within(balance).getByRole('row', { current: true })).toHaveTextContent('2023-2024');
      const cotisations = screen.getByRole('region', { name: 'Membership fees' });
      expect(within(cotisations).getByText('Zoé')).toBeInTheDocument();
      expect(within(cotisations).queryByText('Alice')).not.toBeInTheDocument();
      const expenses = screen.getByRole('region', { name: 'Expenses' });
      expect(within(expenses).getByRole('row', { name: /Total/ })).toHaveTextContent('€200.00');
    });

    it('can show the whole period of the file', async () => {
      renderApp({ rows: TWO_YEARS_ROWS });
      await uploadFile();

      await userEvent.selectOptions(await screen.findByLabelText('School year'), 'Whole period');

      expect(
        screen.getByRole('heading', { name: 'Financial year from 15 September 2023 to 1 June 2025' }),
      ).toBeInTheDocument();
      const balance = screen.getByRole('region', { name: 'Account balance' });
      expect(within(balance).getByRole('row', { name: /Balance on 15 September 2023/ })).toHaveTextContent('€500.00');
    });
  });

  describe('when rows are not sorted by date', () => {
    // Row 3 was typed 2026 instead of 2025.
    const rowsWithTypo: SheetRows = [
      ['Date', 'Description', 'Type', 'Débit', 'Crédit', 'Raison', 'Tag', 'Solde'],
      ['10/08/2025', 'Frais', '', 10, null, 'Frais', null, 490],
      ['20/08/2026', 'Don', '', null, 150, 'Don', null, 640],
      ['25/08/2025', 'Location', '', 40, null, 'Location', null, 600],
      ['02/09/2025', 'Cotisation Alice', '', null, 30, 'Cotisation', null, 630],
    ];

    it('warns that the balances may be wrong', async () => {
      renderApp({ rows: rowsWithTypo });

      await uploadFile();

      expect(
        await screen.findByText('1 row(s) of the file are not at their place.'),
      ).toBeInTheDocument();
    });

    it('lists the misplaced rows when clicking on the warning', async () => {
      renderApp({ rows: rowsWithTypo });
      await uploadFile();

      const toggle = await screen.findByText('Show the rows');
      await userEvent.click(toggle);

      const warning = toggle.closest('details')!;
      expect(warning).toHaveAttribute('open');
      const rows = within(warning).getAllByRole('row');
      expect(rows.map((row) => row.textContent)).toEqual([
        'RowDateDescriptionAmountDate of the row aboveDate of the row below',
        '320/08/2026Don+€150.0010/08/202525/08/2025',
      ]);
    });
  });

  it('does not warn about the rows order when the file is sorted', async () => {
    renderApp();

    await uploadFile();

    await screen.findByRole('heading', { name: 'School year 2024-2025' });
    expect(screen.queryByText(/not at their place/)).not.toBeInTheDocument();
  });

  it('does not offer to select a school year when the file covers only one', async () => {
    renderApp();

    await uploadFile();

    await screen.findByRole('heading', { name: 'School year 2024-2025' });
    expect(screen.queryByLabelText('School year')).not.toBeInTheDocument();
  });

  it('can be displayed in French', async () => {
    renderApp({ language: 'fr' });

    await userEvent.upload(screen.getByLabelText('Choisir un fichier Excel'), new File([''], 'a.xlsx'));

    expect(
      await screen.findByRole('heading', { name: 'Année scolaire 2024-2025' }),
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
