module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.optionalDependencies) {
        for (const dep of Object.keys(pkg.optionalDependencies)) {
          if (dep.startsWith('@rollup/')) {
            delete pkg.optionalDependencies[dep];
          }
        }
      }
      return pkg;
    }
  }
};