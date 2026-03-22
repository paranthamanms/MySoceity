const webpack = require('webpack');

module.exports = {
  devServer: {
    headers: {
      'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data:; font-src * data:; connect-src * ws: wss:; media-src *; object-src *; frame-src *; child-src *;"
    }
  }
};
