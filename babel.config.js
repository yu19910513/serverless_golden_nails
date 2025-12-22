export default {
    presets: [
      '@babel/preset-env', // Transpile modern JS to support older environments
      '@babel/preset-react', // If you're using React, include this preset
    ],
    plugins: [
        '@babel/plugin-transform-modules-commonjs', // To transform ES modules to CommonJS
        'transform-import-meta', // To transform import.meta for Jest/CJS
    ],
  };
