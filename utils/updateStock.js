import Product from "../models/Product.js";

export const updateProductStock = async (items, operation = "decrease") => {
  try {
    for (const item of items) {
      const product = await Product.findById(item._id);
      if (!product) continue;

      const newStock = operation === "increase"
        ? product.stock + item.cantidad
        : product.stock - item.cantidad;

      product.stock = newStock >= 0 ? newStock : 0;

      await product.save();
    }
  } catch (error) {
    console.error("❌ Error updating stock:", error);
  }
};
