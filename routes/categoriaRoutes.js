import express from "express";
import Categoria from "../models/Categoria.js";

const router = express.Router();

// Obtener todas las categorías
router.get("/", async (req, res) => {
  const categorias = await Categoria.find();
  res.json(categorias);
});

// Crear una nueva categoría
router.post("/", async (req, res) => {
  try {
    const { nombre } = req.body;
    const nuevaCategoria = new Categoria({ nombre });
    await nuevaCategoria.save();
    res.status(201).json(nuevaCategoria);
  } catch (err) {
    res.status(500).json({ error: "No se pudo crear la categoría." });
  }
});

// Eliminar categoría
router.delete("/:id", async (req, res) => {
  try {
    await Categoria.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Categoría eliminada" });
  } catch (err) {
    res.status(500).json({ error: "No se pudo eliminar la categoría" });
  }
});

// Actualizar categoría
router.put("/:id", async (req, res) => {
  try {
    const { nombre } = req.body;
    const categoriaActualizada = await Categoria.findByIdAndUpdate(
      req.params.id,
      { nombre },
      { new: true }
    );
    res.json(categoriaActualizada);
  } catch (err) {
    res.status(500).json({ error: "No se pudo actualizar la categoría" });
  }
});


export default router;
