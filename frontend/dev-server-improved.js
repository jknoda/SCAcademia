const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const app = express();
const PORT = 4200;

app.use(cors());

// esbuild plugin: replaces templateUrl/styleUrls with inlined content
const angularTemplatePlugin = {
  name: 'angular-template',
  setup(build) {
    build.onLoad({ filter: /\.component\.ts$/ }, async (args) => {
      let contents = await fs.promises.readFile(args.path, 'utf8');
      const dir = path.dirname(args.path);

      // Replace templateUrl: './foo.html'  →  template: `...content...`
      contents = contents.replace(
        /templateUrl:\s*['"`](.+?)['"`]/g,
        (match, templatePath) => {
          const absolutePath = path.resolve(dir, templatePath);
          try {
            const raw = fs.readFileSync(absolutePath, 'utf8');
            const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
            return `template: \`${escaped}\``;
          } catch (e) {
            console.warn(`⚠  Could not read templateUrl: ${absolutePath}`);
            return match;
          }
        }
      );

      // Replace styleUrls: ['./foo.scss', ...]  →  styles: [`...`, ...]
      contents = contents.replace(
        /styleUrls:\s*\[([^\]]*)\]/gs,
        (match, pathsStr) => {
          const stylePaths = [...pathsStr.matchAll(/['"`](.+?)['"`]/g)].map(m => m[1]);
          const inlined = stylePaths.map((stylePath) => {
            const absolutePath = path.resolve(dir, stylePath);
            try {
              const raw = fs.readFileSync(absolutePath, 'utf8');
              const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
              return `\`${escaped}\``;
            } catch (e) {
              console.warn(`⚠  Could not read styleUrl: ${absolutePath}`);
              return '``';
            }
          });
          return `styles: [${inlined.join(', ')}]`;
        }
      );

      return { contents, loader: 'ts' };
    });
  },
};

// Middleware to compile TypeScript to JavaScript on-demand
app.get('/main.js', async (req, res) => {
  try {
    const mainTsPath = path.join(__dirname, 'src', 'main.ts');
    
    const result = await esbuild.build({
      entryPoints: [mainTsPath],
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: 'es2020',
      logLevel: 'silent',
      write: false,
      external: [],
      plugins: [angularTemplatePlugin],
    });
    
    res.type('application/javascript').send(result.outputFiles[0].text);
    console.log('✅ Compiled main.ts to JavaScript');
  } catch (error) {
    console.error('❌ Compilation error:', error.message);
    res.status(500).type('text/plain').send('Compilation error: ' + error.message);
  }
});

// Serve static files from src
app.use(express.static(path.join(__dirname, 'src')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Frontend dev server ready' });
});

// SPA fallback - serve index.html
app.use((req, res) => {
  const indexPath = path.join(__dirname, 'src', 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    // Ensure we point to compiled JavaScript
    html = html.replace(/<script src="main\.ts"><\/script>/g, '<script src="main.js"><\/script>');
    res.type('text/html').send(html);
  } else {
    res.status(404).send('index.html not found');
  }
});

try {
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Frontend dev server running on http://localhost:${PORT}`);
    console.log(`📱 Setup wizard: http://localhost:${PORT}/setup`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 TypeScript compilation: ENABLED\n`);
  });
  
  server.on('error', (err) => {
    console.error('Server error:', err);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
