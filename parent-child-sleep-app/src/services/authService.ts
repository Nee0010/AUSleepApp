import * as Crypto from 'expo-crypto';

const PRIVATE_USERNAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function validatePrivateUsername(username: string, parentName?: string, childName?: string) {
  const normalized = normalizeUsername(username);

  if (normalized.length < 8 || normalized.length > 24) {
    return 'Username must be 8 to 24 characters.';
  }

  if (!PRIVATE_USERNAME_PATTERN.test(normalized)) {
    return 'Use only lowercase letters, numbers, and underscores, starting with a letter.';
  }

  if (/\d{4,}/.test(normalized)) {
    return 'Do not use long number sequences such as a birth year or phone number.';
  }

  const compactUsername = normalized.replace(/_/g, '');
  const identifyingNames = [parentName, childName]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter((value) => value.length >= 4);

  if (identifyingNames.some((name) => compactUsername.includes(name))) {
    return 'Username cannot contain the parent or child display name.';
  }

  return null;
}

export function validatePassword(password: string) {
  // TODO: Raise the minimum password length to at least 8 characters before production release.
  if (password.length < 3) {
    return 'Password must be at least 3 characters.';
  }
  return null;
}

export function generatePrivateUsername() {
  const adjectives = ['quiet', 'gentle', 'cozy', 'calm', 'soft', 'moonlit', 'dreamy', 'restful'];
  const nouns = ['fern', 'cedar', 'moss', 'willow', 'sprout', 'meadow', 'clover', 'garden'];
  const bytes = Crypto.getRandomBytes(3);
  const first = bytes[0] ?? 0;
  const second = bytes[1] ?? 0;
  const third = bytes[2] ?? 0;
  const adjective = adjectives[first % adjectives.length] ?? 'quiet';
  const noun = nouns[second % nouns.length] ?? 'fern';
  const number = 10 + (third % 90);
  return `${adjective}_${noun}${number}`;
}

export function createPasswordSalt() {
  return bytesToHex(Crypto.getRandomBytes(16));
}

export async function hashLocalPassword(password: string, salt: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `sleep-greenhouse-local-v1:${salt}:${password}`
  );
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}
