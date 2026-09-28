// Impact maths: where every euro of a donation goes, and what it becomes on the ground.

/** Card processing modelled on typical EEA consumer-card pricing: 1.5% + €0.25. */
export const PAYMENT_FEE = { rate: 0.015, fixed: 0.25 };

/** Share kept by the platform to run itself. Shown to donors on every gift, never hidden. */
export const PLATFORM_RATE = 0.05;

const cents = (v) => Math.round(v * 100) / 100;

/**
 * Split a gift into payment fees, platform share, partner overhead and the money that
 * reaches the programme. All four parts always add back up to `amount`.
 */
export function allocate(amount, cause) {
  if (!(amount > 0)) throw new RangeError('Donation amount must be positive');
  const payment = cents(Math.min(amount, amount * PAYMENT_FEE.rate + PAYMENT_FEE.fixed));
  const platform = cents((amount - payment) * PLATFORM_RATE);
  const partner = cents((amount - payment - platform) * cause.partnerOverhead);
  const programme = cents(amount - payment - platform - partner);
  return { amount: cents(amount), payment, platform, partner, programme };
}

/** Concrete units funded (meals, books, m² of roof…) from the programme share. */
export function unitsFunded(programmeEuros, cause) {
  return programmeEuros / cause.unit.cost;
}

/** Human phrase, e.g. "≈ 37 school meals" or "≈ 0.4 m² of roof". */
export function describeUnits(units, cause) {
  const { singular, plural } = cause.unit;
  if (units >= 10) return `≈ ${Math.floor(units).toLocaleString('en-GB')} ${plural}`;
  if (units >= 1) {
    const n = Math.round(units * 10) / 10;
    return `≈ ${n.toLocaleString('en-GB')} ${n === 1 ? singular : plural}`;
  }
  return `≈ ${Math.round(units * 100)}% of one ${singular}`;
}

export function formatEuros(v, { decimals } = {}) {
  const d = decimals ?? (Number.isInteger(v) ? 0 : 2);
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(v);
}
