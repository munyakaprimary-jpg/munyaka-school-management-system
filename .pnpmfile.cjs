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

      const depTypes = ['dependencies', 'devDependencies', 'peerDependencies'];
      for (const type of depTypes) {
        if (pkg[type] && pkg[type]['rollup']) {
          pkg[type]['rollup'] = 'npm:@rollup/wasm-node@4.28.0';
        }
      }

      return pkg;
    }
  }
};