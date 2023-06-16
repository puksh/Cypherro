const path = require('path');

module.exports = {
  entry: './script.js', // Replace with the correct path to your script file
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    fallback: {
      zlib: require.resolve('browserify-zlib'),
      querystring: require.resolve('querystring-es3'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      fs: false,
      url: require.resolve('url/'),
      path: require.resolve('path-browserify'),
      crypto: require.resolve('crypto-browserify')
    },
  },
};
