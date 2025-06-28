import RestockRequest from "../models/RestockRequest.js";

export const obtenerPedidosProveedor = async (req, res) => {
  try {
    const proveedorId = req.usuario._id;

    const pedidos = await RestockRequest.find({ proveedor: proveedorId })
      .populate("producto", "nombre") // solo mostrar el nombre del producto
      .sort({ createdAt: -1 });

    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener pedidos del proveedor", error });
  }
};
