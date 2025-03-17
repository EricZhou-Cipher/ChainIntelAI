import express from 'express';
import { getAddresses } from '../controllers/address.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getAddresses);

export default router;
