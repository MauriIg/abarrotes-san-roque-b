import express from "express";
import { obtenerPedidosProveedor } from "../controllers/restockController.js";
import { verificarUsuario } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/mis-pedidos", verificarUsuario, obtenerPedidosProveedor);

export default router;
