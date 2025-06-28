// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // Nombre del usuario
    nombre: { type: String, required: true },

    // Correo electrónico único
    email: { type: String, required: true, unique: true },

    // Contraseña encriptada
    password: { type: String, required: true },

    // Rol del usuario
    rol: {
      type: String,
      enum: ["admin", "cajero", "cliente", "rapidito", "proveedor"],
      default: "cliente",
    },

    // Verificación de correo
    verified: {
      type: Boolean,
      default: false,
    },
    verificationCode: String,
    codeExpires: Date,
  },
  { timestamps: true } // Agrega los campos createdAt y updatedAt
);

// Middleware para encriptar la contraseña antes de guardar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar contraseñas
userSchema.methods.verificarPassword = async function (passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

// Modelo
const User = mongoose.model("User", userSchema);
export default User;
