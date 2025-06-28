import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

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

if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASS) {
  console.error("❌ ERROR: EMAIL_FROM o EMAIL_PASS no están definidos.");
  process.exit(1);
}

const app = express();

// Webhook (Stripe) - debe ir ANTES del body parser
app.use("/api/webhook", express.raw({ type: "application/json" }), webhookRoutes);

// Parsers normales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Middleware CORS
app.use(
  cors({
    origin: "*", // o especifica ["https://tudominio.vercel.app"]
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

// Ruta base
app.get("/", (req, res) => res.send("🚀 API corriendo correctamente"));

// Middleware de errores
app.use((err, req, res, next) => {
  console.error("❌ Error global:", err.stack);
  res.status(500).json({ mensaje: "Error interno", error: err.message });
});

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => {
    console.error("❌ Error al conectar MongoDB:", err);
    process.exit(1);
  });

// Keep alive para Railway
const PORT = process.env.PORT || 5003;
setInterval(() => {
  fetch("https://abarrotes-backend.up.railway.app").catch((err) =>
    console.error("Keep-alive error:", err.message)
  );
}, 60_000);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
