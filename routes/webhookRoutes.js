// routes/webhookRoutes.js
import express from "express";
import { stripeWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// ⚠️ Esta ruta DEBE SER vacía ("")
router.post("/", stripeWebhook);

export default router;
