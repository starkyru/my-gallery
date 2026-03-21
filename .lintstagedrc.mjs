export default {
  '*.{ts,tsx,js,jsx}': ['eslint --fix --max-warnings 0', 'prettier --write'],
  '*.{json,md,yml,yaml,css}': ['prettier --write'],
  'apps/api/**/*.ts': () => 'pnpm --filter @gallery/api exec tsc --noEmit',
  'apps/web/**/*.{ts,tsx}': () => 'pnpm --filter @gallery/web exec tsc --noEmit',
  'packages/shared/**/*.ts': () => 'pnpm --filter @gallery/shared exec tsc --noEmit',
};
