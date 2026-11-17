// Generates a sample bank export used by the tests and to try the app locally.
// Usage: npm run fixture
import writeExcelFile from 'write-excel-file/node';

const header = ['Date', 'Description', 'Type', 'Débit', 'Crédit', 'Raison', 'Tag', 'Solde'];

// [date, description, type, debit, credit, category, tag]
const movements = [
  ['2025-01-05', 'Cotisation Alice Martin', 'Virement', 0, 30, 'Cotisation', ''],
  ['2025-01-08', 'Cotisation Bob Durand', 'Virement', 0, 30, 'Cotisation', ''],
  ['2025-01-15', 'Location salle janvier', 'Prélèvement', 120, 0, 'Location salle', ''],
  ['2025-02-02', 'Achat épées fournisseur', 'Carte', 450, 0, 'Commande groupée', 'cmd:sword'],
  ['2025-02-10', 'Remboursement épée Alice', 'Virement', 0, 150, 'Commande groupée', 'cmd:sword'],
  ['2025-02-11', 'Remboursement épée Bob', 'Virement', 0, 150, 'Commande groupée', 'cmd:sword'],
  ['2025-02-12', 'Remboursement épée Chloé', 'Virement', 0, 140, 'Commande groupée', 'cmd:sword'],
  ['2025-03-01', 'Cotisation Chloé Petit', 'Virement', 0, 30, 'Cotisation', ''],
  ['2025-03-15', 'Assurance annuelle', 'Prélèvement', 210.5, 0, 'Assurance', ''],
  ['2025-04-03', 'Achat masques', 'Carte', 320, 0, 'Commande groupée', 'cmd:mask'],
  ['2025-04-20', 'Remboursement masque David', 'Virement', 0, 80, 'Commande groupée', 'cmd:mask'],
  ['2025-04-21', 'Remboursement masque Emma', 'Virement', 0, 80, 'Commande groupée', 'cmd:mask'],
  ['2025-05-10', 'Subvention mairie', 'Virement', 0, 500, 'Subvention', ''],
  ['2025-05-18', 'Frais bancaires', 'Prélèvement', 12, 0, 'Frais bancaires', ''],
  ['2025-06-01', 'Tournoi - inscriptions', 'Virement', 0, 240, 'Tournoi', ''],
  ['2025-06-02', 'Tournoi - trophées', 'Carte', 95.9, 0, 'Tournoi', ''],
  ['2025-06-30', 'Location salle juin', 'Prélèvement', 120, 0, 'Location salle', ''],
  ['2025-07-14', 'Buvette fête de l\'été', 'Espèces', 0, 185, 'Buvette', ''],
  ['2025-07-15', 'Achat boissons buvette', 'Carte', 65.4, 0, 'Buvette', ''],
  ['2025-09-05', 'Matériel premiers secours', 'Carte', 48, 0, 'Matériel', ''],
  ['2025-09-12', 'Cotisation David Leroy', 'Virement', 0, 30, 'Cotisation', ''],
  ['2025-09-13', 'Cotisation Emma Moreau', 'Virement', 0, 30, 'Cotisation', ''],
  ['2025-10-01', 'Formation arbitrage', 'Virement', 150, 0, 'Formation', ''],
  ['2025-11-11', 'Don anonyme', 'Chèque', 0, 100, 'Don', ''],
  ['2025-12-20', 'Repas de fin d\'année', 'Carte', 230, 0, 'Événements', ''],
  ['2025-12-31', 'Frais bancaires', 'Prélèvement', 12, 0, 'Frais bancaires', ''],
];

let balance = 1250;
const rows = movements.map(([date, description, type, debit, credit, category, tag]) => {
  balance = Math.round((balance - debit + credit) * 100) / 100;
  return [
    { value: new Date(`${date}T00:00:00Z`), type: Date, format: 'dd/mm/yyyy' },
    description,
    type,
    debit === 0 ? null : debit,
    credit === 0 ? null : credit,
    category,
    tag === '' ? null : tag,
    balance,
  ];
});

// Bank exports usually list the most recent movement first.
rows.reverse();

const output = new URL('../public/sample-movements.xlsx', import.meta.url).pathname;
await writeExcelFile([header, ...rows]).toFile(output);
console.log(`Sample written to ${output}`);
