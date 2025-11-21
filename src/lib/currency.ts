// Base prices in INR
export const BASE_PRICES = {
  bronze: 169,
  silver: 299,
  gold: 499,
  highlife: 799,
  skylife: 999,
  prio200: 200,
  whitelisted: 500,
};

// Exchange rates relative to INR
const EXCHANGE_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AUD: 0.019,
  CAD: 0.017,
  SGD: 0.016,
  AED: 0.044,
};

// Currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  AED: "AED",
};

// Detect user's currency based on locale
export const detectUserCurrency = (): string => {
  const locale = navigator.language || 'en-IN';
  
  // Map common locales to currencies
  const localeToCurrency: Record<string, string> = {
    'en-US': 'USD',
    'en-GB': 'GBP',
    'en-IN': 'INR',
    'en-AU': 'AUD',
    'en-CA': 'CAD',
    'en-SG': 'SGD',
    'ar-AE': 'AED',
  };
  
  // Try exact match first
  if (localeToCurrency[locale]) {
    return localeToCurrency[locale];
  }
  
  // Try language match
  const language = locale.split('-')[0];
  const country = locale.split('-')[1];
  
  if (country === 'IN') return 'INR';
  if (country === 'US') return 'USD';
  if (country === 'GB') return 'GBP';
  if (country === 'AU') return 'AUD';
  if (country === 'CA') return 'CAD';
  if (country === 'SG') return 'SGD';
  if (country === 'AE') return 'AED';
  
  // Default to INR
  return 'INR';
};

// Convert price from INR to target currency
export const convertPrice = (priceInINR: number, targetCurrency: string): number => {
  const rate = EXCHANGE_RATES[targetCurrency] || 1;
  return Math.round(priceInINR * rate);
};

// Format price with currency symbol
export const formatPrice = (price: number, currency: string): string => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${price}`;
};

// Get converted and formatted price
export const getDisplayPrice = (basePrice: number, currency: string): string => {
  const convertedPrice = convertPrice(basePrice, currency);
  return formatPrice(convertedPrice, currency);
};
