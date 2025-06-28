import mongoose from "mongoose";

const supplierOrderSchema = new mongoose.Schema({
  proveedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productos: [
    {
      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      cantidadSolicitada: { type: Number, required: true },
      precioUnitario: { type: Number }, // ← editable por el proveedor
    },
  ],
  metodoPago: {
    type: String,
    enum: ["efectivo", "transferencia"],
    required: true,
  },
  estadoPago: {
    type: String,
    enum: ["pendiente", "pagado", "confirmado", "rechazado"],
    default: "pendiente",
  },
  pendienteRevisionAdmin: {
    type: Boolean,
    default: false, // ← indica si el pedido está pendiente de aprobación del admin
  },
  confirmadoPorProveedor: {
    type: Boolean,
    default: false,
  },
  creadoEn: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("SupplierOrder", supplierOrderSchema);
