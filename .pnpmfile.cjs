module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.dependencies && pkg.dependencies.rollup) {
        pkg.dependencies.rollup = 'npm:@rollup/wasm-node@4.28.0';
      }
      if (pkg.devDependencies && pkg.devDependencies.rollup) {
        pkg.devDependencies.rollup = 'npm:@rollup/wasm-node@4.28.0';
      }
      if (pkg.peerDependencies && pkg.peerDependencies.rollup) {
        pkg.peerDependencies.rollup = 'npm:@rollup/wasm-node@4.28.0';
      }
      if (pkg.optionalDependencies) {
        delete pkg.optionalDependencies['@rollup/rollup-win32-x64-msvc'];
        delete pkg.optionalDependencies['@rollup/rollup-win32-arm64-msvc'];
        delete pkg.optionalDependencies['@rollup/rollup-win32-ia32-msvc'];
      }
      return pkg;
    }
  }
};