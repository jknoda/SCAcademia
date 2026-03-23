import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

const app: Express = express();
const PORT = 4200;

app.use(express.static(path.join(__dirname, 'src')));
app.use(cors());

// SPA fallback - serve index.html for all routes
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend server running on http://localhost:${PORT}`);
  console.log(`📱 Setup wizard available at http://localhost:${PORT}/setup`);
});
