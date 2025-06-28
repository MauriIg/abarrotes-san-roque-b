import express from "express";
import {
  crearPedidoProveedor,
  obtenerPedidosPorProveedor,
  actualizarPreciosProveedor,
  confirmarPagoProveedor,
  obtenerPedidosPendientesRevision,
  revisarPedidoPorAdmin
} from "../controllers/supplierOrderController.js";

import { verificarUsuario, verificarAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Ruta para crear un nuevo pedido (admin)
router.post("/", verificarAdmin, crearPedidoProveedor);

// Ruta para que el proveedor vea sus pedidos
router.get("/mis-pedidos", verificarUsuario, obtenerPedidosPorProveedor);

// Ruta para que el proveedor actualice precios
router.put("/actualizar-precios", verificarUsuario, actualizarPreciosProveedor);

// Ruta para que el proveedor confirme el pago
router.put("/confirmar-pago/:id", verificarUsuario, confirmarPagoProveedor);

// 🚨 NUEVO: Ruta para que el admin vea pedidos pendientes de revisión
router.get("/pendientes-revision", verificarAdmin, obtenerPedidosPendientesRevision);

// 🚨 NUEVO: Ruta para que el admin acepte o rechace el pedido
router.put("/revision/:id", verificarAdmin, revisarPedidoPorAdmin);

export default router;
