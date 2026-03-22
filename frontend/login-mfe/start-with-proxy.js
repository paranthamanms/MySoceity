#!/usr/bin/env node
/**
 * Simple proxy server for Login MFE
 * Removes restrictive CSP headers from Angular dev server
 */

const http = require('http');
const { spawn } = require('child_process');

// Start ng serve on port 4205
console.log('Starting Angular dev server on port 4205...');
const ngProc = spawn('npx ng serve --port 4205 --poll 2000', {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

// Log ng output
ngProc.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('compiled successfully') || output.includes('Application bundle generated')) {
    console.log('✅ Angular app ready!');
  }
});

ngProc.stderr.on('data', (data) => {
  console.error(data.toString());
});

// Wait for ng serve to start, then create proxy
setTimeout(() => {
  const proxyServer = http.createServer((req, res) => {
    const options = {
      hostname: 'localhost',
      port: 4205,
      path: req.url,
      method: req.method,
      headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
      // Remove restrictive CSP header
      delete proxyRes.headers['content-security-policy'];
      
      // Add permissive CSP for development
      proxyRes.headers['content-security-policy'] = 
        "default-src * 'unsafe-inline' 'unsafe-eval'; " +
        "script-src * 'unsafe-inline' 'unsafe-eval'; " +
        "style-src * 'unsafe-inline'; " +
        "img-src * data:; " +
        "font-src *; " +
        "connect-src * ws: wss:; " +
        "media-src *; " +
        "object-src *; " +
        "frame-src *";

      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err);
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Service unavailable');
    });

    req.pipe(proxyReq);
  });

  proxyServer.listen(4201, () => {
    console.log('\n🚀 Login MFE Proxy READY!');
    console.log('   📍 Public URL: http://localhost:4201');
    console.log('   🔗 Backend:   http://localhost:4205 (Angular)\n');
  });

  // Shutdown handler
  process.on('SIGINT', () => {
    console.log('\nShutting down proxy...');
    proxyServer.close();
    ngProc.kill();
    process.exit(0);
  });
}, 3000);
