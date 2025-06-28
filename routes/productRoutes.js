import express from "express";
import Product from "../models/Product.js";
import { verificarAdmin, verificarUsuario } from "../middleware/authMiddleware.js";

const router = express.Router();
// 🔹 Obtener todos los productos visibles (público)
router.get("/", async (req, res) => {
  try {
    const productos = await Product.find({ visible: true }).populate("categoria", "nombre");
    res.json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener productos", error });
  }
});

// 🔹 Obtener todos los productos sin filtro (solo admin)
router.get("/admin/all", verificarAdmin, async (req, res) => {
  try {
    const productos = await Product.find().populate("categoria", "nombre");
    res.json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener productos para admin", error });
  }
});

// 🔹 Obtener un producto por ID
router.get("/:id", async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id).populate("categoria", "nombre");
    if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" });

    res.json(producto);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener producto", error });
  }
});

// 🔹 Crear un nuevo producto (solo admin)
router.post("/", verificarAdmin, async (req, res) => {
  try {
    const { nombre, codigos, categoria, precio, stock, imagen, favorito, visible } = req.body;

    // Validar que codigos sea un array
    if (!Array.isArray(codigos) || codigos.length === 0) {
      return res.status(400).json({ mensaje: "Se requiere al menos un código alfanumérico" });
    }

    // Validar que no exista un producto con alguno de los códigos
    const productoExistente = await Product.findOne({ codigos: { $in: codigos } });
    if (productoExistente) {
      return res.status(400).json({ mensaje: "Alguno de los códigos ya está en uso" });
    }

    const producto = new Product({ nombre, codigos, categoria, precio, stock, imagen, favorito, visible });
    await producto.save();

    res.status(201).json({ mensaje: "Producto creado con éxito", producto });
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ mensaje: "Error al crear producto", error });
  }
});

// 🔹 Actualizar un producto (solo admin)
router.put("/:id", verificarAdmin, async (req, res) => {
  try {
    const producto = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: false }
    );

    if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" });

    res.json({ mensaje: "Producto actualizado", producto });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar producto", error });
  }
});

// 🔹 Eliminar un producto (solo admin)
router.delete("/:id", verificarAdmin, async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id);
    if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" });

    await producto.deleteOne();
    res.json({ mensaje: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar producto", error });
  }
});

// 🔹 Alternar favorito (usuarios autenticados)
router.put("/:id/favorito", verificarUsuario, async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id);
    if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" });

    const actualizado = await Product.findByIdAndUpdate(
      req.params.id,
      { favorito: !producto.favorito },
      { new: true, runValidators: false }
    );

    res.json({
      mensaje: "Favorito actualizado",
      favorito: actualizado.favorito,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar favorito", error });
  }
});

export default router;
