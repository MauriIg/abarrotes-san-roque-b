// controllers/stockController.js
import { detectarBajoStock } from "../utils/detectarBajoStock.js";

// Controlador para obtener productos con bajo stock agrupados por proveedor
export const obtenerProductosBajoStock = async (req, res) => {
  try {
    const agrupados = await detectarBajoStock(5); // umbral de stock bajo
    res.json(agrupados);
  } catch (error) {
    console.error("Error en obtenerProductosBajoStock:", error);
    res.status(500).json({ mensaje: "Error al obtener productos con bajo stock", error });
  }
};
