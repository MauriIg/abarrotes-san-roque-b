// models/Product.js

import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // Nombre del producto
    nombre: { type: String, required: true },

    // Código del producto con validación de formato alfanumérico
    codigos: [{ 
      type: String,
      match: [/^[a-zA-Z0-9-]+$/, 'Cada código debe ser alfanumérico'],
    }],
    

    // Categoría del producto
    categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categoria",
  required: false,
  default: null
    },

    // Precio del producto con validación para evitar valores negativos
    precio: { 
      type: Number, 
      required: true, 
      min: [0, 'El precio no puede ser negativo'] 
    },

    // Stock disponible del producto
    stock: { 
      type: Number, 
      required: true, 
      min: [0, 'El stock no puede ser negativo'] 
    },
    
    // Proveedor asignado
proveedor: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User", // usuario con rol proveedor
  required: false
},

    // Imagen del producto (URL)
    imagen: { type: String, required: false },

    // Indica si el producto es favorito o no
    favorito: { type: Boolean, default: false },

    // Visibilidad del producto en el catálogo
    visible: { type: Boolean, default: true }, // Si se muestra en el catÃ¡logo
  },
  { timestamps: true } // Agrega createdAt y updatedAt
);

// Crea el modelo "Product" a partir del esquema
const Product = mongoose.model("Product", productSchema);
export default Product;