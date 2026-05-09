export class UrlValidator {
  /**
   * Validates if the given string is a valid HTTP/HTTPS URL.
   * @param url The string to validate
   * @returns true if valid, false otherwise
   */
  static isValid(url: string): boolean {
    try {
      new URL(url);
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}
