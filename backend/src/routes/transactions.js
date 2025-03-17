import express from 'express';
import { getTransactions } from '../controllers/transactions.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getTransactions);

export default router;
