function priceFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

export const STARTER_PRICE_INR = priceFromEnv('REACT_APP_STARTER_PRICE_INR', 199);

export function formatINR(amount) {
  return `₹${amount}`;
}
