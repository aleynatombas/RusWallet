/** Web src/lib/authValidation.ts ile aynı kurallar */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SPECIAL_CHARS = [
  ..."!@#$%^&*()_+-=[]{}|;:',.<>?/",
  '`',
  '~',
  '\\',
  '"',
].join('');

export function isValidEmailFormat(email: string): boolean {
  const t = email.trim();
  if (t.length < 5 || t.length > 254) return false;
  return EMAIL_RE.test(t);
}

export const PASSWORD_RULES_HINT =
  'En az 8 karakter; en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter (!@#$% vb.).';

export function validatePassword(password: string): { ok: true } | { ok: false; message: string } {
  if (!password) return { ok: false, message: 'Şifre gerekli.' };
  if (password.length < 8) return { ok: false, message: 'Şifre en az 8 karakter olmalıdır.' };
  if (!/[A-Z]/.test(password)) return { ok: false, message: 'Şifre en az bir büyük harf içermelidir.' };
  if (!/[a-z]/.test(password)) return { ok: false, message: 'Şifre en az bir küçük harf içermelidir.' };
  if (!/[0-9]/.test(password)) return { ok: false, message: 'Şifre en az bir rakam içermelidir.' };
  if (![...password].some((c) => SPECIAL_CHARS.includes(c)))
    return { ok: false, message: 'Şifre en az bir özel karakter içermelidir (! @ # $ % vb.).' };
  return { ok: true };
}
