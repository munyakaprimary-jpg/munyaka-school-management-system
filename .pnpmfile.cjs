module.exports = {
  hooks: {
    readPackage(pkg) {
      const depTypes = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
      depTypes.forEach((type) => {
        if (pkg[type]) {
          if (pkg[type]['rollup']) {
            pkg[type]['rollup'] = 'npm:@rollup/wasm-node@*';
          }
          delete pkg[type]['@rollup/rollup-win32-x64-msvc'];
          delete pkg[type]['@rollup/rollup-win32-arm64-msvc'];
          delete pkg[type]['@rollup/rollup-win32-ia32-msvc'];
        }
      });
      return pkg;
    }
  }
};