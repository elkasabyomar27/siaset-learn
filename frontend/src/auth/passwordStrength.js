// Client-side guidance only. Supabase Auth still enforces its own password policy on the server.
export const MIN_PASSWORD_LENGTH = 12;
const COMMON = ['password', 'passw0rd', 'qwerty', 'azerty', '123456', '654321', 'letmein', 'welcome', 'admin', 'iloveyou', 'abc123', 'monkey', 'dragon', 'football', 'siaset'];
export const LEVELS = [
  {id: 'empty', label: '', bars: 0},
  {id: 'weak', label: 'Weak', bars: 1},
  {id: 'fair', label: 'Fair', bars: 2},
  {id: 'good', label: 'Good', bars: 3},
  {id: 'strong', label: 'Strong', bars: 4},
];

/** Personal words worth refusing: the email's local part and each word of the display name. */
function personalWords({email = '', name = ''} = {}) {
  const local = String(email).toLowerCase().split('@')[0];
  return [local, ...String(name).toLowerCase().split(/\s+/)].filter(word => word.length >= 4);
}

/**
 * Returns {level, checks, acceptable}. `checks` lists each rule with whether it is met; rules marked
 * `required` must pass before the form can be submitted, the rest only raise the strength.
 */
export function passwordStrength(password = '', context) {
  const value = String(password), lower = value.toLowerCase();
  const pattern = COMMON.some(word => lower.includes(word)) || /(.)\1{3,}/.test(value) || /(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef)/i.test(value);
  const personal = personalWords(context).some(word => lower.includes(word));
  const checks = [
    {id: 'length', label: `At least ${MIN_PASSWORD_LENGTH} characters`, met: value.length >= MIN_PASSWORD_LENGTH, required: true},
    {id: 'lower', label: 'A lowercase letter', met: /[a-z]/.test(value)},
    {id: 'upper', label: 'An uppercase letter', met: /[A-Z]/.test(value)},
    {id: 'number', label: 'A number', met: /\d/.test(value)},
    {id: 'symbol', label: 'A symbol, such as ! ? # or %', met: /[^A-Za-z0-9\s]/.test(value)},
    {id: 'pattern', label: 'No common words, sequences or repeats', met: !!value && !pattern, required: true},
    {id: 'personal', label: 'Doesn’t contain your name or email', met: !!value && !personal, required: true},
  ];
  const acceptable = checks.every(check => !check.required || check.met);
  let level;
  if (!value) level = LEVELS[0];
  else if (!acceptable) level = LEVELS[1];
  else {
    const points = checks.filter(check => !check.required && check.met).length + (value.length >= 16 ? 1 : 0);
    level = points <= 2 ? LEVELS[2] : points === 3 ? LEVELS[3] : LEVELS[4];
  }
  return {level, checks, acceptable};
}
