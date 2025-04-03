const { override, addBabelPlugins, addWebpackAlias } = require('customize-cra');

const frameworkOverrides = require('framework-sdk/path/to/config-overrides.js'); // Adjust the path accordingly

const myOverrides = (config, env) => {
  // Apply the framework's overrides first
  config = frameworkOverrides(config, env);

  // Now apply your custom overrides
  return override(
    // Add fallbacks for crypto, stream, and timers
    (config) => {
      config.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fallback: {
            crypto: require.resolve("crypto-browserify"),
            stream: require.resolve("stream-browserify"),
            timers: require.resolve("timers-browserify"),
            fs: false,
          },
        },
      });
      return config;
    },
    // Example: Add Babel plugins
    ...addBabelPlugins(
      'babel-plugin-styled-components',
      '@babel/plugin-proposal-optional-chaining'
    ),
    // Example: Add Webpack alias
    addWebpackAlias({
      '@components': path.resolve(__dirname, 'src/components')
    })
  )(config, env);
};

module.exports = myOverrides;