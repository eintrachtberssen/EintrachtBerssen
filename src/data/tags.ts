// Feste Tag-Liste. Neue Tags hier UND in .pages.yml ergänzen.
export const TAGS = [
  'Verein', 'Fußball', 'Herren', 'Damen', 'Junioren', 'Juniorinnen',
  '1. Herren', '2. Herren', '1. Damen', '2. Damen', 'Alte Herren',
  'A-Jugend', 'B-Jugend', 'C-Jugend', 'D-Jugend', 'E-Jugend', 'F-Jugend', 'Minikicker',
  'B-Juniorinnen', 'C-Juniorinnen', 'D-Juniorinnen', 'E-Juniorinnen',
  'Tennis', 'Volleyball', 'Rückensport', 'Fitness/Gymnastik',
  'Veranstaltung', 'Nachruf', 'Sponsoren',
] as const;
export type Tag = (typeof TAGS)[number];
