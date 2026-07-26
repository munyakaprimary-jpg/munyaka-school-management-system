module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.optionalDependencies) {
        for (const dep of Object.keys(pkg.optionalDependencies)) {
          if (dep.includes('rollup')) {
            delete pkg.optionalDependencies[dep];
          }
        }
      }

      for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
        if (pkg[field] && pkg[field]['rollup']) {
          pkg[field]['rollup'] = 'npm:@rollup/wasm-node@4.28.0';
        }
      }

      return pkg;
    }
  }
};