module.exports = {
  hooks: {
    readPackage(pkg) {
      const depTypes = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
      depTypes.forEach((type) => {
        if (pkg[type] && pkg[type].rollup) {
          pkg[type].rollup = 'npm:@rollup/wasm-node@4.28.0';
        }
      });
      if (pkg.optionalDependencies) {
        delete pkg.optionalDependencies['@rollup/rollup-win32-x64-msvc'];
        delete pkg.optionalDependencies['@rollup/rollup-win32-arm64-msvc'];
        delete pkg.optionalDependencies['@rollup/rollup-win32-ia32-msvc'];
      }
      return pkg;
    }
  }
};