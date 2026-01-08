export function formatDate(
  date?: Date | string | number,
  notSpecifiedString = 'Not Specified',
  includeTime = false,
): string {
  if (!date) return notSpecifiedString;

  if (typeof date === 'string') {
    const actDate = new Date(date);
    return formatDate(actDate, notSpecifiedString, includeTime);
  }

  if (typeof date === 'number') {
    const actDate = new Date(date);
    return formatDate(actDate, notSpecifiedString, includeTime);
  }

  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so add 1
  const day = String(date.getDate()).padStart(2, '0'); // Ensure day is two digits
  const year = String(date.getFullYear()).slice(-2); // Get the last two digits of the year

  if (!includeTime) return `${month}/${day}/${year}`;

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${month}/${day}/${year}  ${timeStr}`;
}

export function formatCurrency(amount?: number, addDollarSign = false, includeCents = false): string {
  if (amount === undefined || amount === null) return '';
  const prefix = addDollarSign ? '$' : '';
  if (!includeCents) {
    const roundedAmount = Math.round(amount); // Round the amount to the nearest whole number
    return `${prefix}${roundedAmount.toLocaleString()}`; // Format with commas
  }

  return `${prefix}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(amount?: number, numDecimalPlaces = 2): string {
  if (amount === undefined || amount === null) return (0.0).toFixed(numDecimalPlaces);

  return `${amount.toFixed(numDecimalPlaces)}`;
}

export function formatPhoneNumber(value?: string): string {
  if (!value) return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  const digits = (trimmed.match(/\d/g) ?? []).join('').slice(0, 10);
  if (!digits) return '';

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    const prefix = digits.slice(0, 3);
    const line = digits.slice(3);
    return line ? `${prefix}-${line}` : prefix;
  }

  const area = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const line = digits.slice(6);

  return `(${area})${prefix}${line ? `-${line}` : ''}`;
}

export function replaceNonPrintable(str: string): string {
  return str.replace(/[^\x20-\x7E]/g, ' ');
}
