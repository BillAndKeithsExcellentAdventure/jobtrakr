export function formatDate(date?: Date | string | number, notSpecifiedString = 'Not Specified'): string {
  if (!date) return notSpecifiedString;

  if (typeof date === 'string') {
    const actDate = new Date(date);
    return formatDate(actDate);
  }

  if (typeof date === 'number') {
    const actDate = new Date(date);
    return formatDate(actDate);
  }

  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so add 1
  const day = String(date.getDate()).padStart(2, '0'); // Ensure day is two digits
  const year = String(date.getFullYear()).slice(-2); // Get the last two digits of the year

  return `${month}/${day}/${year}`;
}

export function formatCurrency(amount?: number, includeCents = false): string {
  if (amount === undefined || amount === null) return '';

  if (!includeCents) {
    const roundedAmount = Math.round(amount); // Round the amount to the nearest whole number
    return `$${roundedAmount.toLocaleString()}`; // Format with commas and add dollar sign
  }
  return `$${amount.toFixed(2)}`;
}

export function formatNumber(amount?: number, numDecimalPlaces = 2): string {
  if (amount === undefined || amount === null) return (0.0).toFixed(numDecimalPlaces);

  return `${amount.toFixed(numDecimalPlaces)}`;
}
