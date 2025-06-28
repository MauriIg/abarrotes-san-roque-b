import express from "express";
import {
  registerUser,
  verifyEmail,
  sendResetCode,
  resetPassword, // 👈 nuevo import
  loginUser,
  getProfile,
  createUser,
  getUsers,
  deleteUser,
  getUsersByRol,
} from "../controllers/userController.js";
import { verificarAdmin, verificarUsuario } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rutas públicas
router.post("/register", registerUser);
router.post("/verify", verifyEmail);
router.post("/recover/send-code", sendResetCode);
router.post("/recover/reset", resetPassword); // 👈 nueva ruta
router.post("/login", loginUser);

// Rutas protegidas
router.get("/perfil", verificarUsuario, getProfile);
router.post("/crear-usuario", verificarAdmin, createUser);
router.get("/", verificarAdmin, getUsers);
router.delete("/:id", verificarAdmin, deleteUser);
router.get("/por-rol", verificarAdmin, getUsersByRol);

export default router;
