// controllers/paymentController.js

import dotenv from 'dotenv';
dotenv.config();

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

import Order from '../models/Order.js';
import { ESTADOS_ORDEN } from "../utils/estadosOrden.js";

export const createCheckoutSession = async (req, res) => {
  const {
    cartItems,
    usuarioId,
    tipoEntrega,
    direccion,
    referencias
  } = req.body;

  try {
    // Validaciones básicas
    if (!usuarioId || !cartItems?.length || !tipoEntrega) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Formatear productos
    const productosFormateados = cartItems.map(item => ({
      producto: item.productoId,
      cantidad: item.quantity,
      precio: item.precio
    }));

    // Crear orden en base de datos con estado "pendiente"
    const nuevaOrden = new Order({
      usuario: usuarioId,
      productos: productosFormateados,
      total: cartItems.reduce((acc, item) => acc + item.precio * item.quantity, 0),
      estado: ESTADOS_ORDEN.PENDIENTE_PAGO,
      tipoEntrega,
      direccion: tipoEntrega === "domicilio" ? direccion : undefined,
      referencias,
      metodoPago: "tarjeta"
    });

    await nuevaOrden.save();
    console.log("✅ Orden guardada con ID:", nuevaOrden._id);

    // Crear sesión de pago en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: cartItems.map(item => ({
        price_data: {
          currency: 'mxn',
          product_data: {
            name: item.nombre,
          },
          unit_amount: Math.round(item.precio * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/pago-exitoso`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        orderId: nuevaOrden._id.toString(),   // 👈 Esto es lo importante
        userId: usuarioId,
        tipoEntrega,
        direccion: direccion || "",
        referencias: referencias || ""
      }
    });

    console.log("🧾 Sesión de Stripe creada:", session.url);
    res.json({ url: session.url });

  } catch (error) {
    console.error("❌ Error creando sesión de pago:", error);
    res.status(500).json({ error: 'No se pudo crear la sesión de pago' });
  }
};
