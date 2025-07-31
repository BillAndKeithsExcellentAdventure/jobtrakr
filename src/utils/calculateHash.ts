import * as Crypto from 'expo-crypto';

export async function calculateHash(
  storeId: string,
  changeIdNum: string,
  endDateNum: number,
): Promise<string> {
  const hashHeader = 'PROJECTHOUND-HEADER-2024'; // Example static header
  const hashFooter = 'PROJECTHOUND-FOOTER-2024'; // Example static footer

  const strToHash = `${hashHeader}${storeId}${changeIdNum}${endDateNum}${hashFooter}`;

  console.log('String to hash:', strToHash);

  try {
    // Use expo-crypto for hashing
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, strToHash);
    return hash;
  } catch (error) {
    console.error('Error calculating hash:', error);
  }

  return '';
}
