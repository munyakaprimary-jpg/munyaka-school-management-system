module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.dependencies && pkg.dependencies['rollup']) {
        pkg.dependencies['rollup'] = 'npm:@rollup/wasm-node@^4.0.0';
      }
      if (pkg.devDependencies && pkg.devDependencies['rollup']) {
        pkg.devDependencies['rollup'] = 'npm:@rollup/wasm-node@^4.0.0';
      }
      if (pkg.optionalDependencies) {
        Object.keys(pkg.optionalDependencies).forEach((dep) => {
          if (dep.startsWith('@rollup/rollup-win32')) {
            pkg.optionalDependencies[dep] = 'npm:@rollup/wasm-node@^4.0.0';
          }
        });
      }
      return pkg;
    }
  }
};