// routes/paymentRoutes.js
import express from "express";
import { createCheckoutSession } from "../controllers/paymentController.js"; // Importa la función para crear la sesión de pago
import { verificarUsuario } from "../middleware/authMiddleware.js"; // Middleware para verificar si el usuario está autenticado

const router = express.Router();

// Ruta para crear una sesión de pago, solo accesible por usuarios autenticados
router.post("/create-checkout-session", verificarUsuario, createCheckoutSession);

export default router;