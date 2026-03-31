const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = Number(process.env.PORT || 8787);
const ROOT = __dirname;
const SUMMARY_FILE = path.join(ROOT, 'data cloud', 'data', 'lake-summary.json');
const DMO_ANALYTICS_FILE = path.join(ROOT, 'data cloud', 'data', 'dmo-analytics.json');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(body);
}

function readSummary() {
  if (!fs.existsSync(SUMMARY_FILE)) {
    return {
      processedCsvFiles: [],
      entityCounts: {},
      modelObjectCounts: {},
      metadata: { ingestedFiles: [] },
      modelMetadata: { unresolvedLinks: {} },
      dmoAnalyticsGeneratedAt: null
    };
  }

  return JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf8'));
}

function readDmoAnalytics() {
  if (!fs.existsSync(DMO_ANALYTICS_FILE)) {
    return {
      generatedAt: null,
      charts: {
        funnelEfficiency: [],
        engagementVsConversion: [],
        cartDropRate: [],
        customerLoyalty: [],
        loginImpact: []
      }
    };
  }

  return JSON.parse(fs.readFileSync(DMO_ANALYTICS_FILE, 'utf8'));
}

function runIngest() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['src/index.js'], {
      cwd: path.join(ROOT, 'data cloud'),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `ingest failed with code ${code}`));
        return;
      }

      resolve({ stdout, summary: readSummary(), analytics: readDmoAnalytics() });
    });
  });
}

function safeResolve(requestPath) {
  const normalized = requestPath === '/' ? '/dashboard view/index.html' : requestPath;
  const decoded = decodeURIComponent(normalized);
  const fullPath = path.resolve(ROOT, `.${decoded}`);

  if (!fullPath.startsWith(ROOT)) {
    return null;
  }

  return fullPath;
}

function serveFile(filePath, res) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      send(res, 404, 'Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = contentTypes[ext] || 'application/octet-stream';

    const stream = fs.createReadStream(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    stream.pipe(res);

    stream.on('error', () => {
      send(res, 500, 'Server error');
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/api/summary' && req.method === 'GET') {
    send(res, 200, JSON.stringify(readSummary()), 'application/json; charset=utf-8');
    return;
  }

  if (req.url === '/api/dmo-analytics' && req.method === 'GET') {
    send(res, 200, JSON.stringify(readDmoAnalytics()), 'application/json; charset=utf-8');
    return;
  }

  if (req.url === '/api/ingest' && req.method === 'POST') {
    try {
      const result = await runIngest();
      send(res, 200, JSON.stringify(result), 'application/json; charset=utf-8');
    } catch (error) {
      send(res, 500, JSON.stringify({ error: error.message }), 'application/json; charset=utf-8');
    }
    return;
  }

  const filePath = safeResolve(req.url || '/');

  if (!filePath) {
    send(res, 400, 'Invalid path');
    return;
  }

  serveFile(filePath, res);
});

server.listen(PORT, () => {
  console.log(`Data Console server running at http://localhost:${PORT}`);
  console.log('Dashboard: /dashboard view/index.html');
  console.log('Explorer: /dashboard view/data-explorer-template.html');
  console.log('API: GET /api/summary, GET /api/dmo-analytics, POST /api/ingest');
});
