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

// ⚠️ Validación crítica para evitar errores silenciosos
if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASS) {
  console.error("❌ ERROR: EMAIL_FROM o EMAIL_PASS no están definidos.");
  process.exit(1);
}

const app = express();

// Webhook (sin JSON parser para evitar romper firma Stripe)
app.use("/api/webhook", express.raw({ type: "application/json" }), webhookRoutes);

// Parsers generales (después del webhook)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS: permite múltiples orígenes (Vercel y localhost)
const allowedOrigins = [
  "http://localhost:5173",
  "https://abarrotes-san-roque-f.vercel.app",
  "https://abarrotes-san-roque-iyjeqzd8u-mauricios-projects-4b766890.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    },
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

// Middleware de error global
app.use((err, req, res, next) => {
  console.error("❌ Error no manejado:", err.stack);
  res.status(500).json({ mensaje: "Algo salió mal", error: err.message });
});

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => {
    console.error("❌ Error de conexión a MongoDB:", err);
    process.exit(1);
  });

// Iniciar el servidor
const PORT = process.env.PORT || 5003;
import fetch from "node-fetch"; // 👈 si usas type: "module"

setInterval(() => {
  fetch("https://abarrotes-san-roque-b.up.railway.app/").catch((err) =>
    console.error("Keep-alive failed:", err.message)
  );
}, 60_000); // cada 60 segundos

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
