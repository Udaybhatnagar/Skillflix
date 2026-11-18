import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './auth/routes.js';
import learningRoutes from './learning/routes.js';
import publicRoutes from './public/routes.js';
import adminRoutes from './admin/routes.js';
import adminRoadmaps from './admin/roadmaps.js';
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use((req, res, next) => {
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    req.headers.origin &&
    req.headers.origin !== (process.env.WEB_ORIGIN || 'http://localhost:5173')
  )
    return res.status(403).json({ error: 'Origin not allowed' });
  next();
});
app.use(express.json({ limit: '100kb' }));
app.use(['/api/auth', '/api/me', '/api/admin'], (_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  next();
});
app.use('/api/auth', authRoutes);
app.use('/api/me/learning', learningRoutes);
app.use('/api/admin/roadmaps', adminRoadmaps);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`Skillflix API on port ${port}`));
