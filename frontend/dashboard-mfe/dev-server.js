#!/usr/bin/env node

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('@angular-devkit/build-angular/plugins/webpack');
const path = require('path');

const webpackConfig = {
  mode: 'development',
  devServer: {
    port: 4203,
    historyApiFallback: true,
    hot: true,
    headers: {
      'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data:; font-src *; connect-src * ws: wss:; media-src *; object-src *;"
    }
  }
};

const compiler = webpack(webpackConfig);
const server = new WebpackDevServer(webpackConfig.devServer, compiler);

server.start().then(() => {
  console.log('Dev server running on http://localhost:4203');
}).catch(err => {
  console.error('Dev server error:', err);
  process.exit(1);
});
