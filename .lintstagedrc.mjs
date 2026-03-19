export default {
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml,css}': ['prettier --write'],
  'apps/api/**/*.ts': () => 'pnpm --filter @gallery/api exec tsc --noEmit',
  'apps/web/**/*.{ts,tsx}': () => 'pnpm --filter @gallery/web exec tsc --noEmit',
  'packages/shared/**/*.ts': () => 'pnpm --filter @gallery/shared exec tsc --noEmit',
};
