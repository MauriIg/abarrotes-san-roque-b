import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import carritoRoutes from "./routes/carritoRoutes.js";
import restockRoutes from "./routes/restockRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import supplierOrderRoutes from "./routes/supplierOrderRoutes.js";
import categoriaRoutes from "./routes/categoriaRoutes.js";

dotenv.config();
console.log("🔍 EMAIL:", process.env.EMAIL);


const app = express();


// Webhook primero (sin JSON parser para evitar problemas con Stripe)
app.use("/api/webhook", express.raw({ type: 'application/json' }), webhookRoutes);



// Parsers generales (deben venir después del webhook)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Uso de variable de entorno
    credentials: true,
  })
);

// Rutas API
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api/restock", restockRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/pedidos-proveedor", supplierOrderRoutes);
app.use("/api/categorias", categoriaRoutes);

// Ruta raíz de prueba
app.get("/", (req, res) => res.send("¡Servidor funcionando! 🚀"));

// Middleware para manejar errores globalmente
app.use((err, req, res, next) => {
  console.error(err.stack); // Imprime el error en consola
  res.status(500).json({ mensaje: "Algo salió mal", error: err.message });
});

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => {
    console.error(" Error de conexión:", err);
    process.exit(1); // Termina el proceso si hay un error de conexión
  });

// Levantar el servidor
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
