import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // Usuario que hizo la compra
    usuario: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    // Lista de productos comprados con cantidad y precio
    productos: [
      {
        producto: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Product", 
          required: true 
        },
        cantidad: { 
          type: Number, 
          required: true 
        },
        precio: { 
          type: Number, 
          required: true 
        }
      }
    ],

    // Monto total de la orden
    total: { 
      type: Number, 
      required: true 
    },

    // Estado de la orden
    estado: {
      type: String,
      enum: [
        "pendiente", 
        "pendiente_pago", 
        "pendiente para recoger", 
        "completada", 
        "cancelada", 
        "en camino", 
        "pagado"
      ],
      default: "pendiente"
    },

    // Tipo de entrega: tienda o domicilio
    tipoEntrega: { 
      type: String, 
      enum: ["tienda", "domicilio"], 
      default: "tienda" 
    },

    // Dirección para entrega a domicilio
    direccion: {
      type: String,
      required: function () {
        return this.tipoEntrega === "domicilio";
      }
    },

    // Referencias adicionales para el domicilio
    referencias: {
      type: String
    },

    // Teléfono del cliente
    telefono: {
      type: String,
      default: "",
    },

    // Método de pago
    metodoPago: {
      type: String,
      enum: ["efectivo", "tarjeta", "transferencia"],
      default: "efectivo"
    },

    // Repartidor asignado (usuario con rol "rapidito")
    asignadoA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    // Cajero que procesó la orden (nuevo campo)
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    corteCaja: {
  type: Boolean,
  default: false
},

  },
  { timestamps: true } // createdAt y updatedAt
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
