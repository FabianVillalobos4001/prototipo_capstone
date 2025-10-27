// my-app/server/routes/receipts.js (ESM)
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Receipt from '../models/Receipt.js';
import { parseReceipt } from '../utils/parseReceipt.js';

const router = express.Router();

// preparar carpeta de uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads', 'receipts');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const ext = path.extname(file.originalname || '.jpg');
    cb(null, `receipt_${ts}${ext}`);
  },
});
const upload = multer({ storage });

// POST /api/receipts/upload
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const publicPath = `/uploads/receipts/${req.file.filename}`;
  res.json({ imageUrl: publicPath });
});

// POST /api/receipts/parse
router.post('/parse', express.json(), (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing text' });
  const parsed = parseReceipt(text);
  res.json(parsed);
});

// POST /api/receipts
router.post('/', express.json(), async (req, res) => {
  try {
    const { text, parsed, imageUrl } = req.body || {};
    const fields = parsed || (text ? parseReceipt(text) : {});
    const createdBy = req.user?.id || undefined; // si tienes auth
    const doc = await Receipt.create({
      ...fields,
      rawText: text || '',
      imageUrl,
      createdBy,
    });
    res.status(201).json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create receipt' });
  }
});

// GET /api/receipts
router.get('/', async (req, res) => {
  const list = await Receipt.find().sort({ createdAt: -1 }).limit(50);
  res.json(list);
});

// GET /api/receipts/:id
router.get('/:id', async (req, res) => {
  const item = await Receipt.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export default router;
