/**
 * JWT settings, resolved in one place.
 *
 * If JWT_SECRET is not set the app still runs (so it works with no .env file),
 * but it uses a fixed development secret and prints a warning. Always set a
 * real JWT_SECRET in .env before deploying anywhere public.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!process.env.JWT_SECRET) {
  console.warn('[warn] JWT_SECRET is not set - using an insecure development default.');
  console.warn('       Add JWT_SECRET=... to backend/.env before deploying.');
}

module.exports = { JWT_SECRET, JWT_EXPIRES_IN };
