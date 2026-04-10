const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const fs = require('fs');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/**
 * Resolve symlinks in pnpm node_modules so Metro can find all transitive deps.
 * pnpm stores real packages in node_modules/.pnpm — Metro needs to follow those.
 */
function getResolvedNodeModulesPaths() {
  const paths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
  ];

  // Also add the pnpm virtual store so Metro can resolve transitive deps
  const pnpmStore = path.resolve(monorepoRoot, 'node_modules', '.pnpm', 'node_modules');
  if (fs.existsSync(pnpmStore)) {
    paths.push(pnpmStore);
  }

  return paths;
}

const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: getResolvedNodeModulesPaths(),
    unstable_enableSymlinks: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
