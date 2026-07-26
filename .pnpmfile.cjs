module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.optionalDependencies) {
        Object.keys(pkg.optionalDependencies).forEach((dep) => {
          if (dep.startsWith('@rollup/rollup-')) {
            delete pkg.optionalDependencies[dep];
          }
        });
      }

      ['dependencies', 'devDependencies', 'peerDependencies'].forEach((depType) => {
        if (pkg[depType] && pkg[depType]['rollup']) {
          pkg[depType]['rollup'] = 'npm:@rollup/wasm-node@4.28.0';
        }
      });

      return pkg;
    }
  }
};