module.exports = {
  hooks: {
    readPackage(pkg) {
      const depTypes = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
      depTypes.forEach((type) => {
        if (pkg[type]) {
          if (pkg[type]['rollup']) {
            pkg[type]['rollup'] = 'npm:@rollup/wasm-node@4.28.0';
          }
          Object.keys(pkg[type]).forEach((dep) => {
            if (dep.startsWith('@rollup/rollup-')) {
              delete pkg[type][dep];
            }
          });
        }
      });
      return pkg;
    }
  }
};