const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const app = express();
const PORT = Number(process.env.PORT || 4200);
const distPath = path.join(__dirname, 'dist', 'frontend', 'browser');
const srcPath = path.join(__dirname, 'src');
const hasProductionBuild = fs.existsSync(path.join(distPath, 'index.html'));

app.use(cors());

// Compile TypeScript to JavaScript on-demand for local fallback mode
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

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    mode: hasProductionBuild ? 'production-build' : 'fallback-dev',
  });
});

if (hasProductionBuild) {
  app.use(express.static(distPath));

  app.get(/^(?!\/api|\/health).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/main.js', async (_req, res) => {
    const compiled = await compileTypeScript(path.join(srcPath, 'main.ts'));
    if (compiled) {
      res.type('application/javascript').send(compiled);
    } else {
      res.status(500).send('Failed to compile main.ts');
    }
  });

  app.use(express.static(srcPath));

  app.get(/^(?!\/api|\/health).*/, (_req, res) => {
    const indexPath = path.join(srcPath, 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');
    html = html.replace('<script src="main.ts"></script>', '<script src="main.js"></script>');
    res.type('text/html').send(html);
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend server running on port ${PORT}`);
  console.log(`📦 Serving ${hasProductionBuild ? 'dist/frontend/browser' : 'src fallback mode'}`);
});
