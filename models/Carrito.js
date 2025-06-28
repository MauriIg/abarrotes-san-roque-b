// models/Carrito.js

import mongoose from "mongoose";

// Subdocumento para los productos dentro del carrito
const productoSchema = new mongoose.Schema({
  // Referencia al producto (asume que hay un modelo "Product")
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  
  // Cantidad de ese producto en el carrito
  cantidad: { type: Number, required: true },
  
  // Precio del producto en el momento de agregarlo al carrito (útil para conservar precios históricos)
  precio: { type: Number, required: true }
});

// Esquema principal del carrito de compras
const carritoSchema = new mongoose.Schema({
  // Referencia al usuario dueño del carrito (asume que hay un modelo "Usuario")
  usuario: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Usuario", 
    required: true, 
    unique: true // Un usuario solo puede tener un carrito activo
  },

  // Lista de productos dentro del carrito
  productos: [productoSchema],
}, {
  timestamps: true // Agrega automáticamente createdAt y updatedAt
});

// Exportamos el modelo de carrito
export default mongoose.model("Carrito", carritoSchema);