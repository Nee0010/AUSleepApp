import * as Crypto from 'expo-crypto';
export function normalizeUsername(name: string) { return name.trim().toLowerCase(); }
export function validateUsername(name: string, parentName: string, childName: string) {
  const n = normalizeUsername(name);
  if (!/^[a-z][a-z0-9_]{7,23}$/.test(n)) return 'Username must be 8–24 letters, numbers, or underscores, starting with a letter.';
  if (/\d{4,}/.test(n)) return 'Avoid dates, birth years, or phone numbers in the username.';
  const compact = n.replace(/_/g, '');
  for (const given of [parentName, childName]) {
    const cleaned = given.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleaned.length >= 4 && compact.includes(cleaned)) return 'Do not include a parent or child name in the username.';
  }
  return null;
}
export function validatePassword(password: string) {
  return password.length < 8 ? 'Use at least 8 characters for a new password.' : null;
}
export function randomId() { return Crypto.randomUUID(); }
export function newSalt() { return Array.from(Crypto.getRandomBytes(16)).map(x => x.toString(16).padStart(2,'0')).join(''); }
// Legacy-compatible development-only local hash. Not a production password KDF.
// Replace with managed authentication in Cycle 3. Never send real credentials to this prototype.
export function passwordHash(password: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `sleep-greenhouse-local-v1:${salt}:${password}`);
}
export function randomUsername() {
  const a = ['quiet','calm','soft','dreamy','gentle','restful'];
  const b = ['fern','clover','meadow','cedar','willow','moss'];
  const x = Crypto.getRandomBytes(3);
  return `${a[x[0] % a.length]}_${b[x[1] % b.length]}${(x[2] + 10).toString()}`;
}
