// routes/stockRoutes.js
import express from "express";
import { obtenerProductosBajoStock } from "../controllers/stockController.js";
import { verificarAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Solo el administrador puede acceder a este recurso
router.get("/bajo", verificarAdmin, obtenerProductosBajoStock);

export default router;
