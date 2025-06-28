import mongoose from "mongoose";

const restockRequestSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  cantidadSugerida: {
    type: Number,
    required: true
  },
  estado: {
    type: String,
    enum: ["pendiente", "enviado", "completado"],
    default: "pendiente"
  },
  proveedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

const RestockRequest = mongoose.model("RestockRequest", restockRequestSchema);
export default RestockRequest;
