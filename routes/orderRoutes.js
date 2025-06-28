import express from "express";
import {
  crearOrden,
  marcarOrdenComoEntregada,
  marcarOrdenComoFinalizada,
  cortarCaja
} from "../controllers/orderController.js";

import Order from "../models/Order.js";
import { verificarUsuario, verificarAdmin } from "../middleware/authMiddleware.js";

import { enviarCorreo } from "../utils/emailService.js";
import User from "../models/User.js";

const router = express.Router();

// 1. Crear una orden desde el carrito (Clientes)
router.post("/", verificarUsuario, crearOrden);

// 2. Obtener órdenes (Admin o Cajero con filtro por estado)
router.get("/", verificarUsuario, async (req, res) => {
  try {
    if (!req.usuario || !["admin", "cajero"].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: "Acceso denegado" });
    }

    let query = {};
    if (req.query.estado) {
      query.estado = req.query.estado;
    }

    const ordenes = await Order.find(query)
      .populate("usuario", "nombre email")
      .populate("asignadoA", "nombre");

    res.json(ordenes);
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    res.status(500).json({ mensaje: "Error al obtener órdenes", error });
  }
});

// 3. Eliminar una orden (solo admin)
router.delete("/:id", verificarAdmin, async (req, res) => {
  try {
    const orden = await Order.findByIdAndDelete(req.params.id);
    if (!orden) {
      return res.status(404).json({ mensaje: "Orden no encontrada" });
    }
    res.json({ mensaje: "Orden eliminada" });
  } catch (error) {
    console.error("Error al eliminar orden:", error);
    res.status(500).json({ mensaje: "Error del servidor al eliminar la orden" });
  }
});

// 4. Obtener las órdenes del usuario autenticado (Clientes)
router.get("/mis-ordenes", verificarUsuario, async (req, res) => {
  try {
    const ordenes = await Order.find({ usuario: req.usuario._id });
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener ordenes", error });
  }
});

// 5. Ver órdenes asignadas al repartidor (Rapidito)
router.get("/asignadas", verificarUsuario, async (req, res) => {
  try {
    if (req.usuario.rol !== "rapidito") {
      return res.status(403).json({ mensaje: "Acceso denegado" });
    }

    const ordenes = await Order.find({
      asignadoA: req.usuario._id
    }).populate("usuario", "nombre direccion");

    console.log("Órdenes entregadas al rapidito:", ordenes.length);
    res.json(ordenes);
  } catch (error) {
    console.error("Error al obtener órdenes del rapidito:", error);
    res.status(500).json({ mensaje: "Error al obtener órdenes", error });
  }
});

// 6. Marcar orden como entregada (solo rapidito asignado)
router.put("/:id/entregada", verificarUsuario, marcarOrdenComoEntregada);

// 7. Marcar orden como finalizada (Cajero)
router.put("/:id/estado", verificarUsuario, marcarOrdenComoFinalizada);

// 8. Obtener ventas realizadas por el cajero autenticado (solo las que no han sido cortadas)
router.get("/ventas/cajero", verificarUsuario, async (req, res) => {
  try {
    if (req.usuario.rol !== "cajero") {
      return res.status(403).json({ mensaje: "Acceso denegado" });
    }

    const ordenes = await Order.find({
      cashier: req.usuario._id,
      corteCaja: false
    })
      .populate("usuario", "nombre")
      .sort({ createdAt: -1 });

    res.json(ordenes);
  } catch (error) {
    console.error("Error al obtener ventas del cajero:", error);
    res.status(500).json({ mensaje: "Error al obtener ventas", error });
  }
});

// 9. Ruta para cortar caja (marcar órdenes del cajero como cerradas)
router.put("/corte-caja", verificarUsuario, cortarCaja);

// 10. Asignar rapidito manualmente (solo admin)
router.put("/:id/asignar-rapidito", verificarAdmin, async (req, res) => {
  try {
    const { rapiditoId } = req.body;

    const orden = await Order.findByIdAndUpdate(
      req.params.id,
      { asignadoA: rapiditoId },
      { new: true }
    )
      .populate("usuario", "nombre email")
      .populate("asignadoA", "nombre email");

    if (!orden) {
      return res.status(404).json({ mensaje: "Orden no encontrada" });
    }

    const rapidito = await User.findById(rapiditoId);
    console.log("📬 Rapidito encontrado:", rapidito);

    if (rapidito?.email) {
      await enviarCorreo(
        rapidito.email,
        "Nueva orden asignada",
        `<p>Hola <strong>${rapidito.nombre}</strong>,</p>
         <p>Se te ha asignado una nueva orden para entrega a domicilio.</p>
         <p>Ingresa a tu panel para ver los detalles.</p>
         <p>Gracias,<br><strong>Abarrotes San Roque</strong></p>`
      );
      console.log("📨 Correo enviado a:", rapidito.email);
    } else {
      console.log("⚠️ El rapidito no tiene email registrado");
    }

    res.json({ mensaje: "Rapidito asignado correctamente", orden });
  } catch (error) {
    console.error("❌ Error al asignar rapidito:", error);
    res.status(500).json({ mensaje: "Error al asignar rapidito", error });
  }
});

// 11. Obtener órdenes asignadas a un rapidito específico (admin)
router.get("/rapidito/:id", verificarAdmin, async (req, res) => {
  try {
    const ordenes = await Order.find({ asignadoA: req.params.id });
    res.json(ordenes);
  } catch (error) {
    console.error("Error al obtener órdenes del rapidito:", error);
    res.status(500).json({ mensaje: "Error al obtener órdenes del rapidito", error });
  }
});

export default router;
