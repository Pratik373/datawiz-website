function priceFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

export const STARTER_PRICE_INR = priceFromEnv('REACT_APP_STARTER_PRICE_INR', 99);
export const STARTER_ORIGINAL_PRICE_INR = priceFromEnv('REACT_APP_STARTER_ORIGINAL_PRICE_INR', 499);

export function formatINR(amount) {
  return `₹${amount}`;
}
