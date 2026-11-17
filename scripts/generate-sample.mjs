// Generates a sample bank export used by the tests and to try the app locally.
// Usage: npm run fixture
import writeExcelFile from 'write-excel-file/node';

const header = ['Date', 'Description', 'Type', 'Débit', 'Crédit', 'Raison', 'Tag', 'Solde'];

// [date, description, type, debit, credit, category, tag]
const movements = [
  // School year 2023-2024
  ['2023-09-10', 'Cotisation Alice Martin', 'Virement', 0, 25, 'Cotisation', ''],
  ['2023-09-12', 'Cotisation Bob Durand', 'Virement', 0, 25, 'Cotisation', ''],
  ['2023-09-20', 'Cotisation Chloé Petit', 'Virement', 0, 25, 'Cotisation', ''],
  ['2023-10-15', 'Location salle octobre', 'Prélèvement', 110, 0, 'Location salle', ''],
  ['2023-12-05', 'Assurance annuelle', 'Prélèvement', 200, 0, 'Assurance', ''],
  ['2024-02-10', 'Subvention mairie', 'Virement', 0, 450, 'Subvention', ''],
  ['2024-03-18', 'Frais bancaires', 'Prélèvement', 12, 0, 'Frais bancaires', ''],
  ['2024-04-06', 'Tournoi de printemps - inscriptions', 'Virement', 0, 180, 'Tournoi', ''],
  ['2024-04-07', 'Tournoi de printemps - trophées', 'Carte', 70, 0, 'Tournoi', ''],
  ['2024-06-25', 'Repas de fin d\'année', 'Carte', 210, 0, 'Événements', ''],
  // School year 2024-2025
  ['2024-09-05', 'Cotisation Alice Martin', 'Virement', 0, 30, 'Cotisation', ''],
  ['2024-09-08', 'Cotisation Bob Durand', 'Virement', 0, 30, 'Cotisation', ''],
  ['2024-09-15', 'Location salle septembre', 'Prélèvement', 120, 0, 'Location salle', ''],
  ['2024-10-02', 'Achat épées fournisseur', 'Carte', 450, 0, 'Commande groupée', 'cmd:sword'],
  ['2024-10-10', 'Remboursement épée Alice', 'Virement', 0, 150, 'Commande groupée', 'cmd:sword'],
  ['2024-10-11', 'Remboursement épée Bob', 'Virement', 0, 150, 'Commande groupée', 'cmd:sword'],
  ['2024-10-12', 'Remboursement épée Chloé', 'Virement', 0, 140, 'Commande groupée', 'cmd:sword'],
  ['2024-11-01', 'Cotisation Chloé Petit', 'Virement', 0, 30, 'Cotisation', ''],
  ['2024-11-15', 'Assurance annuelle', 'Prélèvement', 210.5, 0, 'Assurance', ''],
  ['2024-12-03', 'Achat masques', 'Carte', 320, 0, 'Commande groupée', 'cmd:mask'],
  ['2024-12-20', 'Remboursement masque David', 'Virement', 0, 80, 'Commande groupée', 'cmd:mask'],
  ['2024-12-21', 'Remboursement masque Emma', 'Virement', 0, 80, 'Commande groupée', 'cmd:mask'],
  ['2025-01-10', 'Subvention mairie', 'Virement', 0, 500, 'Subvention', ''],
  ['2025-01-18', 'Frais bancaires', 'Prélèvement', 12, 0, 'Frais bancaires', ''],
  ['2025-02-01', 'Tournoi - inscriptions', 'Virement', 0, 240, 'Tournoi', ''],
  ['2025-02-02', 'Tournoi - trophées', 'Carte', 95.9, 0, 'Tournoi', ''],
  ['2025-02-28', 'Location salle février', 'Prélèvement', 120, 0, 'Location salle', ''],
  ['2025-03-14', 'Buvette carnaval', 'Espèces', 0, 185, 'Buvette', ''],
  ['2025-03-15', 'Achat boissons buvette', 'Carte', 65.4, 0, 'Buvette', ''],
  ['2025-05-05', 'Matériel premiers secours', 'Carte', 48, 0, 'Matériel', ''],
  ['2025-05-12', 'Cotisation David Leroy', 'Virement', 0, 30, 'Cotisation', ''],
  ['2025-05-13', 'Cotisation Emma Moreau', 'Virement', 0, 30, 'Cotisation', ''],
  ['2025-06-01', 'Formation arbitrage', 'Virement', 150, 0, 'Formation', ''],
  ['2025-07-11', 'Don anonyme', 'Chèque', 0, 100, 'Don', ''],
  ['2025-06-28', 'Repas de fin d\'année', 'Carte', 230, 0, 'Événements', ''],
  ['2025-08-31', 'Frais bancaires', 'Prélèvement', 12, 0, 'Frais bancaires', ''],
];

let balance = 1150;
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
// Real exports may hold other sheets before the movements: the app must find the right one.
const notes = [['Notes'], ['Export des mouvements du compte courant de l’association.']];

await writeExcelFile([
  { sheet: 'Notes', data: notes },
  { sheet: 'Mouvements', data: [header, ...rows] },
]).toFile(output);
console.log(`Sample written to ${output}`);
