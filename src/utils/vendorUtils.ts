// function to take in a full vendor name and return the first word that is not "A", "An", or "The"
export function getVendorSearchTerm(vendorName: string): string {
  if (!vendorName) return '';
  const words = vendorName.split(' ');
  for (const word of words) {
    const lowerWord = word.toLowerCase();
    if (lowerWord !== 'a' && lowerWord !== 'an' && lowerWord !== 'the') {
      return word;
    }
  }
  return vendorName; // fallback to full name if all words are "A", "An", or "The"
}
