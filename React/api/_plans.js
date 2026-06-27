function priceFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

module.exports = {
  starter: {
    amount: priceFromEnv('REACT_APP_STARTER_PRICE_INR', 99),
    original_amount: priceFromEnv('REACT_APP_STARTER_ORIGINAL_PRICE_INR', 499),
    tests: 5,
    name: 'Starter Pack',
  },
  pro: {
    amount: priceFromEnv('REACT_APP_PRO_PRICE_INR', 149),
    original_amount: priceFromEnv('REACT_APP_PRO_ORIGINAL_PRICE_INR', 999),
    tests: 10,
    name: 'Complete Pack',
  },
};
