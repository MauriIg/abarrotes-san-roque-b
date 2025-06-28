import Product from "../models/Product.js";

// Detecta productos con bajo stock agrupados por proveedor
export const detectarBajoStock = async (limite = 5) => {
  try {
    // Encuentra productos con stock igual o menor al límite y que tengan proveedor asignado
    const productosBajoStock = await Product.find({
      stock: { $lte: limite },
      proveedor: { $ne: null } // ← importante para evitar errores
    }).populate("proveedor", "nombre email");

    const agrupadosPorProveedor = {};

    productosBajoStock.forEach((producto) => {
      const proveedorId = producto.proveedor._id.toString();

      if (!agrupadosPorProveedor[proveedorId]) {
        agrupadosPorProveedor[proveedorId] = {
          supplier: producto.proveedor,     // ← frontend espera "supplier"
          products: []                      // ← frontend espera "products"
        };
      }

      agrupadosPorProveedor[proveedorId].products.push({
        _id: producto._id,
        nombre: producto.nombre,
        stock: producto.stock
      });
    });

    return agrupadosPorProveedor;

  } catch (error) {
    console.error("Error al detectar productos con bajo stock:", error);
    throw error;
  }
};
