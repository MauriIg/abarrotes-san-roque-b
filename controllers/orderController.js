import Order from "../models/Order.js";
import { ESTADOS_ORDEN } from "../utils/estadosOrden.js";
import { asignarRapidito } from "../utils/asignarRapidito.js";
import { updateProductStock } from "../utils/updateStock.js";
import { enviarCorreo } from "../utils/emailService.js";
import User from "../models/User.js";

// Crear orden
export async function crearOrden(req, res) {
  try {
    const {
      productos,
      total,
      tipoEntrega,
      direccion,
      referencias,
      telefono,
      estado,
      metodoPago
    } = req.body;

    let estadoInicial = estado;

    if (!estadoInicial) {
      if (req.usuario.rol === "cajero") {
        estadoInicial =
          metodoPago === "efectivo" || metodoPago === "transferencia"
            ? ESTADOS_ORDEN.COMPLETADA
            : ESTADOS_ORDEN.PAGADO;
      } else {
        estadoInicial =
          tipoEntrega === "domicilio"
            ? ESTADOS_ORDEN.PENDIENTE
            : ESTADOS_ORDEN.PARA_RECOGER;
      }
    }

    const rapiditoAsignado =
      tipoEntrega === "domicilio" ? await asignarRapidito() : null;

    const nuevaOrden = new Order({
      productos,
      total,
      usuario: req.usuario._id,
      tipoEntrega,
      direccion,
      referencias,
      telefono,
      metodoPago,
      asignadoA: rapiditoAsignado,
      estado: estadoInicial,
      cashier: req.usuario.rol === "cajero" ? req.usuario._id : undefined
    });

    await nuevaOrden.save();

    // ✅ FORMATEAR productos antes de actualizar stock
    console.log("📦 productos recibidos desde el frontend:");
    console.log(JSON.stringify(productos, null, 2));

    const productosConCantidad = productos.map((p) => {
      const id = typeof p.producto === "string" ? p.producto : p.producto?._id || p._id || p.id;
      return {
        _id: id,
        cantidad: p.cantidad || 1
      };
    });

    console.log("🧾 Productos formateados:");
    productosConCantidad.forEach(p => {
      console.log(`- ID: ${p._id} | Cantidad: ${p.cantidad}`);
    });

    await updateProductStock(productosConCantidad, "decrease");

    // Enviar correo al rapidito asignado si aplica
if (rapiditoAsignado) {
  const rapidito = await User.findById(rapiditoAsignado);
  if (rapidito?.email) {
    console.log("📨 Enviando correo a rapidito:", rapidito.email);
    try {
      await enviarCorreo(
        rapidito.email,
        "Nueva orden asignada",
        `<p>Hola <strong>${rapidito.nombre}</strong>,</p>
         <p>Se te ha asignado una nueva orden para entrega a domicilio.</p>
         <p>Ingresa a tu panel para ver los detalles.</p>
         <p>Gracias,<br><strong>Abarrotes San Roque</strong></p>`
      );
      console.log("✅ Correo enviado al rapidito");
    } catch (emailError) {
      console.error("❌ Error al enviar correo:", emailError);
    }
  }
}

    res.status(201).json({
      mensaje: "Orden creada exitosamente",
      orden: nuevaOrden
    });
  } catch (error) {
    console.error("Error al crear orden:", error);
    res.status(500).json({ mensaje: "Error al crear la orden", error });
  }
}

// Marcar orden como entregada (por rapidito)
export async function marcarOrdenComoEntregada(req, res) {
  try {
    const orden = await Order.findById(req.params.id);

    if (!orden) {
      return res.status(404).json({ mensaje: "Orden no encontrada" });
    }

    if (
      req.usuario.rol !== "rapidito" ||
      orden.asignadoA?.toString() !== req.usuario._id.toString()
    ) {
      return res.status(403).json({ mensaje: "No autorizado para actualizar esta orden" });
    }

    orden.estado = ESTADOS_ORDEN.COMPLETADA;
    await orden.save();

    res.json({ mensaje: "Orden actualizada a completada" });
  } catch (error) {
    console.error("Error al actualizar orden:", error);
    res.status(500).json({ mensaje: "Error al actualizar orden" });
  }
}

// Marcar orden como finalizada (por admin o cajero)
export async function marcarOrdenComoFinalizada(req, res) {
  try {
    const { estado } = req.body;
    const orden = await Order.findById(req.params.id);

    if (!orden) {
      return res.status(404).json({ mensaje: "Orden no encontrada" });
    }

    if (!["admin", "cajero"].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: "No autorizado para finalizar la orden" });
    }

    const permitidos = Object.values(ESTADOS_ORDEN);
    if (!estado || !permitidos.includes(estado)) {
      return res.status(400).json({ mensaje: "Estado inválido" });
    }

    orden.estado = estado;
    await orden.save();

    res.json({ mensaje: "Estado de orden actualizado", orden });
  } catch (error) {
    console.error("Error al finalizar orden:", error);
    res.status(500).json({ mensaje: "Error al finalizar orden", error });
  }
}

// Cortar caja - marcar todas las órdenes del cajero como corte realizadas
export async function cortarCaja(req, res) {
  try {
    const usuarioId = req.usuario._id;

    if (req.usuario.rol !== "cajero") {
      return res.status(403).json({ mensaje: "Acceso denegado" });
    }

    await Order.updateMany(
      { cashier: usuarioId, corteCaja: false },
      { $set: { corteCaja: true } }
    );

    res.json({ mensaje: "Corte de caja realizado con éxito" });
  } catch (error) {
    console.error("Error en corte de caja:", error);
    res.status(500).json({ mensaje: "Error al realizar el corte de caja" });
  }
}
