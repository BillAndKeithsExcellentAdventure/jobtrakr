export function formatDate(date?: Date, notSpecifiedString = 'Not Specified'): string {
  if (!date) return notSpecifiedString;

  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so add 1
  const day = String(date.getDate()).padStart(2, '0'); // Ensure day is two digits
  const year = String(date.getFullYear()).slice(-2); // Get the last two digits of the year

  return `${month}/${day}/${year}`;
}

export function formatCurrency(amount?: number): string {
  if (amount === undefined || amount === null) return '';

  const roundedAmount = Math.round(amount); // Round the amount to the nearest whole number
  return `$${roundedAmount.toLocaleString()}`; // Format with commas and add dollar sign
}
