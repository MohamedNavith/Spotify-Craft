export function jwtSecret(name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const value = process.env[name];
  if (!value?.trim() || value.startsWith('wavelength-dev-')) {
    throw new Error(`Set ${name} before starting the backend`);
  }
  return value;
}
