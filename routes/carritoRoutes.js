// routes/carritoRoutes.js
import express from "express";
import {
  obtenerCarrito,
  actualizarCarrito,
  vaciarCarrito
} from "../controllers/carritoController.js"; // Importa las funciones del controlador
import { verificarUsuario } from "../middleware/authMiddleware.js"; // Importa el middleware de autenticación

const router = express.Router();

// Ruta GET para obtener el carrito del usuario
// Solo un usuario autenticado puede acceder
router.get("/", verificarUsuario, obtenerCarrito);

// Ruta POST para actualizar el carrito del usuario
// Solo un usuario autenticado puede actualizar su carrito
router.post("/", verificarUsuario, actualizarCarrito);

// Ruta DELETE para vaciar el carrito del usuario
// Solo un usuario autenticado puede vaciar su carrito
router.delete("/", verificarUsuario, vaciarCarrito);

export default router;