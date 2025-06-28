import jwt from "jsonwebtoken";

// Función para generar el token JWT
const generarToken = (id, rol) => {
  // Validación de entradas
  if (!id || !rol) {
    throw new Error("El id y el rol son requeridos para generar el token");
  }

  try {
    // Generación del token con expiración configurable
    const token = jwt.sign({ id, rol }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || "7d", // Permite configurar la expiración desde el entorno
    });

    return token;
  } catch (error) {
    console.error("Error al generar el token:", error);
    throw new Error("No se pudo generar el token");
  }
};

export default generarToken;