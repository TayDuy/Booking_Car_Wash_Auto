/**
 * Helper utility for validating and formatting Vietnamese license plates.
 * Common valid formats:
 * - Cars: 30A-123.45, 51F-888.88, 80A-123.45, 50LD-123.45, 29A-1234
 * - Motorcycles: 29H1-123.45, 59X3-123.45, 29-H1 12345
 */

// Matches province (2 digits), series (1-2 letters + optional 1 digit), and 4 or 5 digits
const VIETNAM_LICENSE_PLATE_CLEAN_REGEX = /^(1[1-9]|[2-9][0-9])([A-Z]{1,2}\d?|[A-Z]{1,2})(\d{4,5})$/;

/**
 * Checks if a string is a valid Vietnamese license plate.
 * @param {string} plate
 * @returns {boolean}
 */
export const isValidVietnameseLicensePlate = (plate) => {
  if (!plate || typeof plate !== 'string') return false;
  const clean = plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return VIETNAM_LICENSE_PLATE_CLEAN_REGEX.test(clean);
};

/**
 * Formats a raw license plate input string into standardized Vietnamese format (e.g. "30A-123.45").
 * If input doesn't match standard VN plate, returns trimmed uppercase string.
 * @param {string} plate
 * @returns {string}
 */
export const formatVietnameseLicensePlate = (plate) => {
  if (!plate || typeof plate !== 'string') return '';
  const clean = plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = clean.match(VIETNAM_LICENSE_PLATE_CLEAN_REGEX);
  if (match) {
    const province = match[1];
    const series = match[2];
    const number = match[3];
    if (number.length === 5) {
      return `${province}${series}-${number.slice(0, 3)}.${number.slice(3)}`;
    }
    return `${province}${series}-${number}`;
  }
  return plate.trim().toUpperCase();
};
