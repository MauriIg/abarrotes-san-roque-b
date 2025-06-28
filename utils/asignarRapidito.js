// utils/asignarRapidito.js
import User from "../models/User.js";
import Order from "../models/Order.js";

export async function asignarRapidito() {
  const rapiditos = await User.find({ rol: "rapidito" });

  let menorCarga = Infinity;
  let seleccionado = null;

  for (const r of rapiditos) {
    const carga = await Order.countDocuments({
      asignadoA: r._id,
      estado: "pendiente"
    });

    if (carga < menorCarga) {
      menorCarga = carga;
      seleccionado = r._id;
    }
  }

  return seleccionado;
}
