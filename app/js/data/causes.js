// The cause catalogue.
//
// Causes are grouped into six pillars so that people who give to the same kind of cause
// (feeding, teaching, sheltering…) find each other. Every cause must have: a named field
// partner, a concrete unit with a published cost, a funding goal, and a monthly settlement
// cycle with evidence. See docs/VISION.md, "Cataloguing causes", for the admission criteria.
//
// DEMO DATA: the projects, unit costs and reports below are illustrative placeholders to
// show the mechanics. No real organisation is named or implied.

export const PILLARS = [
  { id: 'nourish', label: 'Nourish', verb: 'feeds', color: '#f2b84b' },
  { id: 'learn', label: 'Learn', verb: 'teaches', color: '#7cc4ff' },
  { id: 'shelter', label: 'Shelter', verb: 'shelters', color: '#e88a6a' },
  { id: 'heal', label: 'Heal', verb: 'heals', color: '#ff7aa8' },
  { id: 'water', label: 'Water', verb: 'quenches', color: '#5fe0d0' },
  { id: 'rebuild', label: 'Rebuild', verb: 'rebuilds', color: '#b59cff' },
];

export const pillarOf = (cause) => PILLARS.find((p) => p.id === cause.pillar);

/** Monthly settlement: gifts up to the cutoff are wired, spent, then verified with evidence. */
function monthlyBatches(causeId, reports, { firstMonth = 1, lastMonth = 9, year = 2026 } = {}) {
  const batches = [];
  for (let m = firstMonth; m <= lastMonth; m++) {
    const cutoff = new Date(Date.UTC(year, m, 0)); // last day of month m
    const plus = (days) => new Date(cutoff.getTime() + days * 864e5).toISOString().slice(0, 10);
    batches.push({
      id: `${causeId}-${year}-${String(m).padStart(2, '0')}`,
      cutoff: cutoff.toISOString().slice(0, 10),
      transferredOn: plus(8),
      deployedOn: plus(35),
      verifiedOn: plus(70),
      report: reports[(m - firstMonth) % reports.length],
    });
  }
  return batches;
}

export const CAUSES = [
  {
    id: 'nice-food-parcels',
    pillar: 'nourish',
    title: 'Food parcels for families in L’Ariane',
    place: 'Nice, France',
    lat: 43.733,
    lon: 7.302,
    partner: 'Local food bank (partner to be confirmed)',
    story:
      'Where the line began. Weekly parcels of fresh and dry food for families in Nice’s eastern districts, packed by volunteers from the neighbourhood.',
    unit: { singular: 'family food parcel', plural: 'family food parcels', cost: 12 },
    partnerOverhead: 0.06,
    goal: 60000,
    reports: [
      { title: 'Parcels handed out at the Saturday distribution', evidence: 'Distribution log + photos' },
      { title: 'Fresh produce bought from the MIN (wholesale market)', evidence: 'Supplier invoices' },
    ],
  },
  {
    id: 'thies-school-meals',
    pillar: 'nourish',
    title: 'Hot school meals in the Thiès region',
    place: 'Thiès, Senegal',
    lat: 14.79,
    lon: -16.93,
    partner: 'Community school canteens (partner to be confirmed)',
    story:
      'A hot lunch keeps children in class. Canteens run by parents’ associations buy millet, rice and fish from local producers.',
    unit: { singular: 'school meal', plural: 'school meals', cost: 0.45 },
    partnerOverhead: 0.08,
    goal: 90000,
    reports: [
      { title: 'Rice and fish delivered to 12 canteens', evidence: 'Delivery notes signed by head teachers' },
      { title: 'Attendance and meals-served registers', evidence: 'Monthly registers, spot-checked' },
    ],
  },
  {
    id: 'marseille-class-libraries',
    pillar: 'learn',
    title: 'A library in every classroom',
    place: 'Marseille, France',
    lat: 43.34,
    lon: 5.38,
    partner: 'Primary schools network (partner to be confirmed)',
    story:
      'Thirty books chosen with each teacher, so that every child in the northern districts can take one home each week.',
    unit: { singular: 'book', plural: 'books', cost: 6 },
    partnerOverhead: 0.05,
    goal: 40000,
    reports: [
      { title: 'Book boxes delivered to classrooms', evidence: 'Photos + teacher sign-off' },
      { title: 'Books bought from independent bookshops', evidence: 'Invoices' },
    ],
  },
  {
    id: 'kisumu-childrens-home',
    pillar: 'shelter',
    title: 'Rebuilding a children’s home',
    place: 'Kisumu, Kenya',
    lat: -0.09,
    lon: 34.77,
    partner: 'Children’s home trust (partner to be confirmed)',
    story:
      'Forty children, one leaking roof. A new dormitory block, built by local masons, with safe water and solar light.',
    unit: { singular: 'square metre built', plural: 'square metres built', cost: 140 },
    partnerOverhead: 0.07,
    goal: 120000,
    reports: [
      { title: 'Foundations poured and inspected', evidence: 'Site photos + engineer’s note' },
      { title: 'Walls up to roof level', evidence: 'Site photos + contractor invoice' },
    ],
  },
  {
    id: 'bekaa-mobile-clinic',
    pillar: 'heal',
    title: 'Mobile clinic days in the Bekaa valley',
    place: 'Bekaa, Lebanon',
    lat: 33.85,
    lon: 35.9,
    partner: 'Medical NGO (partner to be confirmed)',
    story:
      'A doctor, a nurse and a pharmacy on wheels, visiting villages and settlements where the nearest clinic is hours away.',
    unit: { singular: 'consultation', plural: 'consultations', cost: 9 },
    partnerOverhead: 0.09,
    goal: 75000,
    reports: [
      { title: 'Clinic days held and patients seen', evidence: 'Anonymised consultation register' },
      { title: 'Medicines restocked', evidence: 'Pharmacy invoices' },
    ],
  },
  {
    id: 'tahoua-water-points',
    pillar: 'water',
    title: 'Clean water points in Tahoua',
    place: 'Tahoua, Niger',
    lat: 14.89,
    lon: 5.26,
    partner: 'Water & sanitation NGO (partner to be confirmed)',
    story:
      'Solar-pumped boreholes, maintained by village water committees, so that girls stop walking hours to fetch water instead of going to school.',
    unit: { singular: 'person with safe water for a year', plural: 'people with safe water for a year', cost: 15 },
    partnerOverhead: 0.08,
    goal: 100000,
    reports: [
      { title: 'Borehole drilled and water tested', evidence: 'Lab water-quality report + photos' },
      { title: 'Water committee trained', evidence: 'Training attendance sheet' },
    ],
  },
  {
    id: 'alhaouz-classrooms',
    pillar: 'rebuild',
    title: 'Classrooms after the earthquake',
    place: 'Al Haouz, Morocco',
    lat: 31.2,
    lon: -7.9,
    partner: 'Reconstruction association (partner to be confirmed)',
    story:
      'Mountain villages still teaching in tents. Earthquake-resistant classrooms and a school kit for every pupil.',
    unit: { singular: 'school kit', plural: 'school kits', cost: 25 },
    partnerOverhead: 0.07,
    goal: 80000,
    reports: [
      { title: 'School kits distributed', evidence: 'Distribution list signed by teachers' },
      { title: 'Classroom frame completed', evidence: 'Site photos + invoice' },
    ],
  },
].map((c) => ({ ...c, batches: monthlyBatches(c.id, c.reports) }));

export const causeById = (id) => CAUSES.find((c) => c.id === id);
