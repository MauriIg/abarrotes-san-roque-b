// controllers/authMiddleware.js

// Importamos jwt para verificar tokens y el modelo User para consultar usuarios en BD
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware para verificar que el usuario esté autenticado
const verificarUsuario = async (req, res, next) => {
  // Leemos el encabezado Authorization
  const authHeader = req.headers.authorization;

  // Verificamos que exista el token y que comience con "Bearer"
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      // Extraemos el token del encabezado
      const token = authHeader.split(" ")[1];

      // Verificamos y decodificamos el token usando la clave secreta
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscamos el usuario en la base de datos usando el ID decodificado, excluyendo la contraseña
      const usuario = await User.findById(decoded.id).select("-password");

      // Si no se encuentra el usuario, retornamos error
      if (!usuario) {
        return res.status(401).json({ mensaje: "Usuario no encontrado" });
      }

      // Si todo está bien, adjuntamos el usuario al objeto `req` para usarlo después
      req.usuario = usuario;

      // Continuamos con el siguiente middleware o controlador
      next();
    } catch (error) {
      console.error("Error al verificar token:", error.message);
      return res.status(401).json({ mensaje: "Token inválido o expirado" });
    }
  } else {
    // Si no hay token en el encabezado
    return res.status(401).json({ mensaje: "No autorizado, token no proporcionado" });
  }
};

// Middleware para verificar que el usuario autenticado sea un Admin
const verificarAdmin = async (req, res, next) => {
  try {
    // Reutilizamos el middleware anterior para asegurarnos que el usuario esté autenticado
    await verificarUsuario(req, res, async () => {
      // Verificamos que el rol del usuario sea "admin"
      if (req.usuario.rol !== "admin") {
        return res.status(403).json({ mensaje: "Acceso denegado, solo Admin" });
      }

      // Si es admin, continuamos con la siguiente función
      next();
    });
  } catch (error) {
    console.error("Error al verificar Admin:", error.message);
    res.status(401).json({ mensaje: "Acceso inválido" });
  }
};

// Exportamos los middlewares para usarlos en rutas protegidas
export { verificarUsuario, verificarAdmin };