const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const app = express();
const PORT = 4200;

// Compile TypeScript to JavaScript on-demand
async function compileTypeScript(filePath) {
  try {
    const result = await esbuild.build({
      entryPoints: [filePath],
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: 'es2020',
      loader: { '.ts': 'ts' },
      write: false,
      logLevel: 'silent',
      external: []
    });
    return result.outputFiles[0].text;
  } catch (error) {
    console.error(`Error compiling ${filePath}:`, error.message);
    return null;
  }
}

// Serve compiled main.ts as JavaScript
app.get('/main.js', async (req, res) => {
  const compiled = await compileTypeScript(path.join(__dirname, 'src', 'main.ts'));
  if (compiled) {
    res.type('application/javascript').send(compiled);
  } else {
    res.status(500).send('Failed to compile main.ts');
  }
});

// Static files from src
app.use(express.static(path.join(__dirname, 'src')));
app.use(cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Frontend dev server running' });
});

// SPA fallback - serve index.html for all routes except static files and API
app.get(/^(?!\/api).*/, (req, res) => {
  const indexPath = path.join(__dirname, 'src', 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Replace main.ts with main.js in the HTML
  html = html.replace('<script src="main.ts"></script>', '<script src="main.js"></script>');
  
  res.type('text/html').send(html);
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend server running on http://localhost:${PORT}`);
  console.log(`📱 Setup wizard available at http://localhost:${PORT}/setup`);
  console.log(`🔧 TypeScript compilation enabled`);
});
