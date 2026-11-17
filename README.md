# agm-dashboard

A finance visualizer for AGM meetings: upload the bank export (`.xlsx`) of the association and get
an overview of the financial year, in French or English. Everything happens in the browser, the file
is never sent anywhere.

## Expected file

One of the sheets must contain a header row with these columns (any order, a title above is fine).
When the file has several sheets, the first one with these columns is used:

| Column      | Usage                                                        |
| ----------- | ------------------------------------------------------------ |
| Date        | date of the movement                                         |
| Description | shown in the list of cotisations                             |
| Type        | ignored                                                      |
| Débit       | money leaving the account                                    |
| Crédit      | money received on the account                                |
| Raison      | category; `cotisation` rows are listed as membership fees    |
| Tag         | `cmd:<key>` groups the row in the "grouped orders" section   |
| Solde       | balance after the movement, used for the initial/final balance |

When the file covers several school years (1st of September to 31st of August), a selector lets
you pick the year to present; the most recent one is shown first, and the whole period is also
available.

A sample file is available in [`public/sample-movements.xlsx`](public/sample-movements.xlsx)
(regenerate it with `npm run fixture`), and from the "Try with a sample file" link in the app.

## Development

```bash
npm install
npm run dev     # start the app on http://localhost:5173
npm test        # run the tests
npm run build   # production build in dist/
```

The code follows a clean architecture layout:

- `src/domain`: models (`Movement`, `FinancialSummary`) and ports (`SpreadsheetReader`)
- `src/application`: parsing of the rows and computation of the summary (`LoadFinancialSummary` use case)
- `src/infra`: the Excel reader, based on `read-excel-file`
- `src/ui`: React components, charts (recharts) and translations

## Deployment

Every push on `main` runs the tests, builds the app and publishes it on GitHub Pages
(`.github/workflows/deploy.yml`). In the repository settings, set **Pages → Source** to
**GitHub Actions** once.
