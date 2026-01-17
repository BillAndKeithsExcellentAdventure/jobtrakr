/**
 * Utility functions for project accounting IDs
 */

/**
 * Validates that a project abbreviation is not empty
 * @param abbreviation - The project abbreviation to validate
 * @param projectId - The project ID for logging
 * @returns The validated abbreviation or throws an error
 */
export function validateProjectAbbreviation(
  abbreviation: string | undefined | null,
  projectId: string,
): string {
  const validAbbreviation = abbreviation?.trim();
  
  if (!validAbbreviation) {
    const errorMsg = `Project abbreviation is missing for projectId: ${projectId}`;
    console.error(errorMsg);
    throw new Error('Unable to generate accounting ID. Project abbreviation is missing.');
  }
  
  return validAbbreviation;
}
