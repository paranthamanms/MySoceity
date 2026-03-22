const express = require('express');
const path = require('path');
const http = require('http');

// Spawn ng serve in the background
const { spawn } = require('child_process');
const ngServe = spawn('ng', ['serve', '--port', '4204', '--disable-host-check'], {
  cwd: __dirname,
  stdio: 'inherit'
});

// Wait for ng serve to start, then create proxy
setTimeout(() => {
  const app = express();

  // Set permissive CSP headers for development
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data:; font-src *; connect-src * ws: wss:; media-src *; object-src *; frame-src *; child-src *;");
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

  // Proxy requests to ng serve
  const http_proxy = require('http-proxy');
  const proxy = http_proxy.createProxyServer({ target: 'http://localhost:4204', ws: true });

  proxy.on('error', (err, req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Proxy error');
  });

  app.all('*', (req, res) => proxy.web(req, res));

  http.createServer(app).listen(4203, () => {
    console.log('Dashboard MFE running on http://localhost:4203');
    console.log('(ng serve backend on port 4204)');
  });
}, 3000);

process.on('SIGINT', () => {
  ngServe.kill();
  process.exit(0);
});
