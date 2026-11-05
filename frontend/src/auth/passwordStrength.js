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
/** The longest run of 4+ consecutive ascending or descending letters or digits, e.g. "123456" or "dcba". */
function sequenceRun(value) {
  let best = '';
  for (const step of [1, -1]) {
    let start = 0;
    for (let i = 1; i <= value.length; i++) {
      const a = value.charCodeAt(i - 1), b = value.charCodeAt(i), alnum = /[a-z0-9]/i;
      const continues = i < value.length && alnum.test(value[i]) && alnum.test(value[i - 1]) && b - a === step && /\d/.test(value[i]) === /\d/.test(value[i - 1]);
      if (!continues) { if (i - start >= 4 && i - start > best.length) best = value.slice(start, i); start = i; }
    }
  }
  return best;
}

/** The part of the password that makes it predictable, or '' when there is none. */
function predictablePart(value) {
  const lower = value.toLowerCase();
  const common = COMMON.filter(word => lower.includes(word)).sort((a, b) => b.length - a.length)[0];
  if (common) return value.substr(lower.indexOf(common), common.length);
  return value.match(/(.)\1{3,}/)?.[0] || sequenceRun(value);
}

export function passwordStrength(password = '', context) {
  const value = String(password), lower = value.toLowerCase();
  const pattern = predictablePart(value);
  const personal = personalWords(context).find(word => lower.includes(word));
  const shown = text => `“${text}”`;
  const checks = [
    {id: 'length', label: `At least ${MIN_PASSWORD_LENGTH} characters`, met: value.length >= MIN_PASSWORD_LENGTH, required: true,
      fix: `Add ${MIN_PASSWORD_LENGTH - value.length} more character${MIN_PASSWORD_LENGTH - value.length === 1 ? '' : 's'}`},
    {id: 'lower', label: 'A lowercase letter', met: /[a-z]/.test(value)},
    {id: 'upper', label: 'An uppercase letter', met: /[A-Z]/.test(value)},
    {id: 'number', label: 'A number', met: /\d/.test(value)},
    {id: 'symbol', label: 'A symbol, such as ! ? # or %', met: /[^A-Za-z0-9\s]/.test(value)},
    {id: 'pattern', label: 'No common words, sequences or repeats', met: !!value && !pattern, required: true,
      fix: pattern ? `Change ${shown(pattern)}: it’s a common pattern that is guessed first` : ''},
    {id: 'personal', label: 'Doesn’t contain your name or email', met: !!value && !personal, required: true,
      fix: personal ? `Remove ${shown(personal)}: it’s part of your name or email` : ''},
  ];
  const acceptable = checks.every(check => !check.required || check.met);
  let level;
  if (!value) level = LEVELS[0];
  else if (!acceptable) level = LEVELS[1];
  else {
    const points = checks.filter(check => !check.required && check.met).length + (value.length >= 16 ? 1 : 0);
    level = points <= 2 ? LEVELS[2] : points === 3 ? LEVELS[3] : LEVELS[4];
  }
  // What to change first: the unmet required rules, in checklist order.
  const fixes = value ? checks.filter(check => check.required && !check.met).map(check => check.fix || check.label) : [];
  return {level, checks, acceptable, fixes};
}
