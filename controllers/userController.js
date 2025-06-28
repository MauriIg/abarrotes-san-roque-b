
// controllers/userController.js
import User from "../models/User.js";
import generarToken from "../utils/generarToken.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Configurar transporter para Nodemailer
console.log("⛳ ENV EMAIL:", process.env.EMAIL_FROM, process.env.EMAIL_PASS);
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS,
  },
});

// Registro de usuario con código de verificación por correo
const registerUser = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
    }

    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: "El email ya está registrado" });
    }

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    const usuario = new User({
      nombre,
      email,
      password,
      rol: "cliente",
      verificationCode,
      codeExpires,
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Código de verificación",
        text: `Tu código de verificación es: ${verificationCode}`,
      });
    } catch (mailError) {
      console.error("❌ Error al enviar el correo:", mailError);
      return res.status(500).json({ mensaje: "No se pudo enviar el correo", error: mailError.message });
    }

    await usuario.save();
    res.status(201).json({ mensaje: "Registro exitoso. Revisa tu correo para verificar la cuenta." });
  } catch (error) {
    console.error("❌ Error en registro:", error);
    res.status(500).json({ mensaje: "Error al registrar usuario", error: error.message });
  }
};

// Verificación de correo con código
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    if (user.verified) return res.status(400).json({ mensaje: "Ya verificado" });
    if (user.verificationCode !== code) return res.status(400).json({ mensaje: "Código incorrecto" });
    if (user.codeExpires < new Date()) return res.status(400).json({ mensaje: "El código ha expirado" });

    user.verified = true;
    user.verificationCode = undefined;
    user.codeExpires = undefined;
    await user.save();

    res.json({ mensaje: "Correo verificado correctamente" });
  } catch (error) {
    console.error("Error al verificar correo:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// Envío de código para recuperación de contraseña
const sendResetCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const code = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = code;
    user.codeExpires = expires;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Recuperación de contraseña",
      text: `Tu código para restablecer tu contraseña es: ${code}`,
    });

    res.json({ mensaje: "Código de recuperación enviado al correo" });
  } catch (error) {
    console.error("Error al enviar código de recuperación:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// Restablecer contraseña con código
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.verificationCode !== code) {
      return res.status(400).json({ mensaje: "Código incorrecto" });
    }

    if (user.codeExpires < new Date()) {
      return res.status(400).json({ mensaje: "El código ha expirado" });
    }

    user.password = newPassword;
    user.verificationCode = undefined;
    user.codeExpires = undefined;
    await user.save();

    res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al restablecer contraseña", error });
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await User.findOne({ email });

    if (!usuario || !(await usuario.verificarPassword(password))) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });
    }

    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      token: generarToken(usuario._id, usuario.rol),
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al iniciar sesión", error });
  }
};

// Obtener perfil
const getProfile = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario._id).select("-password");
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener perfil", error });
  }
};

// Crear usuario (admin)
const createUser = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
    }

    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: "El email ya está registrado" });
    }

    const nuevoUsuario = new User({ nombre, email, password, rol });
    await nuevoUsuario.save();

    res.status(201).json({ mensaje: "Usuario creado con éxito", usuario: nuevoUsuario });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear usuario", error });
  }
};

// Obtener todos los usuarios
const getUsers = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.rol) filtro.rol = req.query.rol;

    const usuarios = await User.find(filtro).select("-password");
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener usuarios", error });
  }
};

// Eliminar usuario
const deleteUser = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    await usuario.deleteOne();
    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar usuario", error });
  }
};

// Obtener usuarios por rol
const getUsersByRol = async (req, res) => {
  try {
    const { rol } = req.query;
    if (!rol) {
      return res.status(400).json({ mensaje: "Falta el parámetro 'rol'" });
    }

    const usuarios = await User.find({ rol }).select("-password");
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener usuarios por rol", error });
  }
};

// Exportar todas las funciones
export {
  registerUser,
  verifyEmail,
  sendResetCode,
  resetPassword,
  loginUser,
  getProfile,
  createUser,
  getUsers,
  deleteUser,
  getUsersByRol,
};
