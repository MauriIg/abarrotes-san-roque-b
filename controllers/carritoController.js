// controllers/carritoController.js

// Importamos el modelo Carrito y Producto
import Carrito from "../models/Carrito.js";
import Product from "../models/Product.js";

// Obtener carrito del usuario autenticado
export const obtenerCarrito = async (req, res) => {
  try {
    // Se busca un carrito que pertenezca al usuario actual
    // populate para obtener los detalles del producto
    const carrito = await Carrito.findOne({ usuario: req.usuario._id })
      .populate("productos.producto");

    // Si no se encuentra un carrito, devolvemos una lista vacía
    if (!carrito) {
      return res.status(200).json({ productos: [] });
    }

    // Devolvemos el carrito encontrado
    res.json(carrito);
  } catch (error) {
    // mensaje y el error
    res.status(500).json({ mensaje: "Error al obtener el carrito", error });
  }
};

// ACTUALIZAR carrito
export const actualizarCarrito = async (req, res) => {
  try {
    // Transformamos los productos recibidos en el cuerpo de la petición
    // aseguramos de obtener solo los IDs de los productos (en caso de que vengan como objetos)
    const productos = req.body.productos.map(p => ({
      producto: typeof p.producto === "object" ? p.producto._id : p.producto,
      cantidad: p.cantidad,
      precio: p.precio
    }));

    // Buscamos el carrito del usuario y lo actualizamos
    // new: true => devuelve el documento actualizado
    // upsert: true => lo crea si no existe
    // setDefaultsOnInsert => aplica los valores por defecto al insertar
    const carritoActualizado = await Carrito.findOneAndUpdate(
      { usuario: req.usuario._id },
      { productos },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("productos.producto"); // Cargamos detalles de los productos

    // Responde con el carrito actualizado
    res.status(200).json(carritoActualizado);
  } catch (error) {
    //mensaje y el error
    res.status(500).json({ mensaje: "Error al actualizar el carrito", error });
  }
};

// Vaciar carrito del usuario
export const vaciarCarrito = async (req, res) => {
  try {
    // Buscamos el carrito del usuario
    const carrito = await Carrito.findOne({ usuario: req.usuario._id });

    // Si existe, eliminamos todos los productos del carrito
    if (carrito) {
      carrito.productos = []; // Vaciamos la lista de productos
      await carrito.save(); // Guardamos los cambios
    }

    // Respondemos con estado 204
    res.status(204).send();
  } catch (error) {
    //mensaje y el error
    res.status(500).json({ mensaje: "Error al vaciar el carrito", error });
  }
};