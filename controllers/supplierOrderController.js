import SupplierOrder from "../models/SupplierOrder.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { enviarCorreo } from "../utils/emailService.js";

// Crear pedido a proveedor
export const crearPedidoProveedor = async (req, res) => {
  try {
    const { proveedor, productos, metodoPago } = req.body;

    if (!proveedor || !productos || !productos.length || !metodoPago) {
      return res.status(400).json({ mensaje: "Faltan datos del pedido" });
    }

    for (const item of productos) {
      const producto = await Product.findById(item.producto);
      if (!producto) {
        return res.status(404).json({ mensaje: `Producto no encontrado: ${item.producto}` });
      }
    }

    const nuevoPedido = new SupplierOrder({
      proveedor,
      productos,
      metodoPago,
      estadoPago: "pendiente",
      confirmadoPorProveedor: false,
      pendienteRevisionAdmin: false
    });

    await nuevoPedido.save();

    try {
      const proveedorInfo = await User.findById(proveedor);
      if (proveedorInfo?.email) {
        await enviarCorreo(
          proveedorInfo.email,
          "Nuevo pedido de reabastecimiento",
          `
            <p>Hola <strong>${proveedorInfo.nombre}</strong>,</p>
            <p>Se te ha asignado un nuevo pedido con productos por surtir.</p>
            <p>Por favor, ingresa a tu panel de proveedor para revisar y confirmar precios.</p>
            <p><strong>Abarrotes San Roque</strong></p>
          `
        );
        console.log("✅ Correo enviado al proveedor:", proveedorInfo.email);
      } else {
        console.warn("⚠️ Proveedor sin correo:", proveedor);
      }
    } catch (correoError) {
      console.error("❌ Error al enviar correo al proveedor:", correoError);
    }

    res.status(201).json({ mensaje: "Pedido creado correctamente", pedido: nuevoPedido });
  } catch (error) {
    console.error("Error al crear pedido:", error);
    res.status(500).json({ mensaje: "Error en el servidor", error });
  }
};

// Obtener pedidos por proveedor
export const obtenerPedidosPorProveedor = async (req, res) => {
  try {
    const proveedorId = req.usuario._id;
    const pedidos = await SupplierOrder.find({ proveedor: proveedorId }).populate("productos.producto");
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener pedidos", error });
  }
};

// Actualizar precios por el proveedor
export const actualizarPreciosProveedor = async (req, res) => {
  try {
    const { pedidoId, productos } = req.body;
    const pedido = await SupplierOrder.findById(pedidoId);
    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });

    if (pedido.proveedor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    pedido.productos.forEach((p) => {
      const actualizado = productos.find((prod) => prod.producto === p.producto.toString());
      if (actualizado) {
        p.precioUnitario = actualizado.precioUnitario;
      }
    });

    pedido.pendienteRevisionAdmin = true;
    pedido.confirmadoPorProveedor = true;
    await pedido.save();

    res.json({ mensaje: "Precios enviados al administrador", pedido });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar precios", error });
  }
};

// Confirmar pago + actualizar stock + notificación
export const confirmarPagoProveedor = async (req, res) => {
  try {
    const pedido = await SupplierOrder.findById(req.params.id).populate("proveedor");
    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });

    if (pedido.metodoPago === "efectivo") {
      if (pedido.proveedor.toString() !== req.usuario._id.toString()) {
        return res.status(403).json({ mensaje: "No autorizado" });
      }
    }

    pedido.estadoPago = "pagado";
    await pedido.save();

    for (const item of pedido.productos) {
      const producto = await Product.findById(item.producto);
      if (producto) {
        producto.stock += item.cantidadSolicitada;
        await producto.save();
      }
    }

    try {
      const proveedor = pedido.proveedor;
      if (proveedor?.email) {
        await enviarCorreo(
          proveedor.email,
          "Pedido confirmado y pagado",
          `
            <p>Hola <strong>${proveedor.nombre}</strong>,</p>
            <p>Tu pedido ha sido <strong>confirmado y pagado</strong>. El stock ha sido actualizado en el sistema.</p>
            <p>Gracias por tu servicio.<br><strong>Abarrotes San Roque</strong></p>
          `
        );
      }
    } catch (errorCorreo) {
      console.error("❌ Error al enviar correo de confirmación de pago:", errorCorreo);
    }

    res.json({ mensaje: "Pedido marcado como pagado y stock actualizado" });
  } catch (error) {
    console.error("Error al confirmar pago:", error);
    res.status(500).json({ mensaje: "Error al confirmar pago", error });
  }
};

// Obtener pedidos pendientes de revisión por el administrador
export const obtenerPedidosPendientesRevision = async (req, res) => {
  try {
    const pedidos = await SupplierOrder.find({ pendienteRevisionAdmin: true })
      .populate("proveedor", "nombre email")
      .populate("productos.producto", "nombre");
    res.json(pedidos);
  } catch (error) {
    console.error("Error al obtener pedidos pendientes:", error);
    res.status(500).json({ mensaje: "Error en el servidor", error });
  }
};

// Revisar pedido + notificar proveedor
export const revisarPedidoPorAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { accion } = req.body;
    const pedido = await SupplierOrder.findById(id).populate("proveedor");

    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });

    if (!pedido.pendienteRevisionAdmin) {
      return res.status(400).json({ mensaje: "Este pedido no está pendiente de revisión" });
    }

    if (accion === "aceptar") {
      pedido.estadoPago = "confirmado";
    } else if (accion === "rechazar") {
      pedido.estadoPago = "rechazado";
    } else {
      return res.status(400).json({ mensaje: "Acción inválida. Usa 'aceptar' o 'rechazar'" });
    }

    pedido.pendienteRevisionAdmin = false;
    await pedido.save();

    try {
      const proveedor = pedido.proveedor;
      if (proveedor?.email) {
        await enviarCorreo(
          proveedor.email,
          `Tu cotización fue ${accion}da`,
          `
            <p>Hola <strong>${proveedor.nombre}</strong>,</p>
            <p>El administrador ha <strong>${accion}do</strong> los precios que propusiste para un pedido.</p>
            <p>Estado actual: <strong>${pedido.estadoPago}</strong></p>
            <p>Gracias por tu atención.<br><strong>Abarrotes San Roque</strong></p>
          `
        );
      }
    } catch (correoError) {
      console.error("❌ Error al enviar notificación al proveedor:", correoError);
    }

    res.json({ mensaje: `Pedido ${accion}do correctamente`, pedido });
  } catch (error) {
    console.error("Error al revisar pedido:", error);
    res.status(500).json({ mensaje: "Error en el servidor", error });
  }
};
