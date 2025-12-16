export function isInteger(number: string | number): boolean {
  return Number.isInteger(parseFloat(String(number))) && !/\.0+$/.test(String(number));
}
