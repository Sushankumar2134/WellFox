function validateAge(age) {
  if (age === null || age === undefined || age === '') return true;
  const n = Number(age);
  return Number.isInteger(n) && n >= 0 && n <= 150;
}

function validatePhone(phone) {
  if (!phone) return true;
  const cleaned = phone.replace(/[\s\-()+]/g, '');
  return /^\d{7,15}$/.test(cleaned);
}

function validateEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[\s\-()+]/g, '');
}

function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

module.exports = { validateAge, validatePhone, validateEmail, normalizePhone, normalizeName };
