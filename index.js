import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Routes
import dashboardRoutes from './routes/dashboard.js';
import diseaseRoutes from './routes/diseases.js';
import userRoutes from './routes/users.js';
import patientRoutes from './routes/patients.js';
import prescriptionRoutes from './routes/prescriptions.js';
import inventoryRoutes from './routes/inventory.js';
import appointmentRoutes from './routes/appointments.js';
import billingRoutes from './routes/billing.js';
import followUpRoutes from './routes/followup.js';
import contactRoutes from './routes/contact.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
// Set CORS headers manually first — reliable on Vercel serverless
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed =
    !origin ||
    /^http:\/\/localhost(:\d+)?$/.test(origin) ||
    /^https:\/\/.*\.vercel\.app$/.test(origin) ||
    origin === process.env.FRONTEND_URL;

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }

  // Respond immediately to preflight requests
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json());

// ─── MongoDB Connection ───────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI, { dbName: 'ayurclinic' })
  .then(() => console.log('✅ Connected to MongoDB Atlas — database: ayurclinic'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ─── API Routes (all protected by Firebase token via verifyToken middleware) ──
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/followup', followUpRoutes);
app.use('/api/contact', contactRoutes);   // public — no verifyToken

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server (local dev only — Vercel uses the exported app) ─────────────
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`AyurClinic backend running on http://localhost:${PORT}`);
  });
}

export default app;
