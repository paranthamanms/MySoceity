#!/usr/bin/env node
/**
 * Proxy server for Dashboard MFE that removes restrictive CSP headers
 * Runs ng serve on port 4204 internally and proxies to 4203 with permissive CSP
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process');
const path = require('path');

const app = express();

// Start ng serve on internal port 4204
console.log('Starting ng serve on internal port 4204...');
const ngProcess = spawn('ng', ['serve', '--port', '4204', '--poll', '2000'], {
  cwd: __dirname,
  stdio: 'inherit'
});

// Wait for ng serve to start
setTimeout(() => {
  console.log('Starting proxy on port 4203...');

  // Middleware to remove/replace restrictive CSP headers
  app.use((req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Remove any restrictive CSP headers
      res.removeHeader('Content-Security-Policy');
      
      // Set permissive CSP for development
      res.setHeader('Content-Security-Policy', 
        "default-src * 'unsafe-inline' 'unsafe-eval'; " +
        "script-src * 'unsafe-inline' 'unsafe-eval'; " +
        "style-src * 'unsafe-inline'; " +
        "img-src * data:; " +
        "font-src *; " +
        "connect-src * ws: wss:; " +
        "media-src *; " +
        "object-src *; " +
        "frame-src *"
      );
      
      return originalSend.call(this, data);
    };
    
    next();
  });

  // Proxy all requests to internal ng serve
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:4204',
    changeOrigin: true,
    ws: true,
    logLevel: 'warn'
  }));

  app.listen(4203, () => {
    console.log('\n✅ Dashboard MFE proxy running on http://localhost:4203');
    console.log('   (ng serve backend on port 4204)\n');
  });
}, 3000);

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  ngProcess.kill();
  process.exit(0);
});
