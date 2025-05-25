export const toBase62 = (num: number): string => {
  const base62Chars =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let base62String = '';

  while (num > 0) {
    base62String = base62Chars[num % 62] + base62String;
    num = Math.floor(num / 62);
  }

  return base62String || '0'; // Return '0' if num is 0
};
