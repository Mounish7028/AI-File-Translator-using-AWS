import { resolve as _resolve } from 'path';

export const entry = './src/App.js';
export const output = {
    filename: 'bundle.js',
    path: _resolve(__dirname, 'dist'),
};

export const resolve = {
  resolve: {
    fallback: {  
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "timers": require.resolve("timers-browserify"),
      "net": false, // No polyfill available
      "tls": false, // No polyfill available
      "fs": false, // No polyfill available
    },
  },
};
export const module = {
    rules: [
        {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
            },
        },
    ],
};
