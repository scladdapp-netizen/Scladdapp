// services/currencyService.js
export const getExchangeRate = async () => {
  try {
    // Using a free currency API (you can replace with any API you prefer)
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate");
    }

    const data = await response.json();
    const nairaRate = data.rates.NGN;

    return {
      success: true,
      rate: nairaRate,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    // Fallback rate (you can update this manually)
    return {
      success: false,
      rate: 1500, // Fallback rate
      error: error.message,
      source: "fallback",
    };
  }
};

export const convertToNaira = async (amountInUSD) => {
  try {
    const exchangeRate = await getExchangeRate();
    const amountInNaira = amountInUSD * exchangeRate.rate;

    return {
      success: true,
      amountInNaira: Math.round(amountInNaira), // Round to whole number
      exchangeRate: exchangeRate.rate,
      amountInUSD: amountInUSD,
      source: exchangeRate.source || "api",
    };
  } catch (error) {
    console.error("Error converting currency:", error);
    return {
      success: false,
      error: error.message,
      amountInNaira: null,
      amountInUSD: amountInUSD,
    };
  }
};
