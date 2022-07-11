const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
  config.resolve.fallback = Object.assign({}, config.resolve.fallback, {
    stream: require.resolve('url'),
    buffer: require.resolve('buffer'),
  });
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ];
  config.resolve.alias = Object.assign({}, config.resolve.alias, {
    '@': path.resolve(__dirname, 'src')
  });
  return config;
};
