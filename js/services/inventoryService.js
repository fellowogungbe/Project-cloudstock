import { config } from "../config.js";
import { request } from "./http.js";
import { productService } from "./productService.js";

// In demo mode inventory is persisted with each product. In API mode,
// change these paths to match the endpoints exposed by your inventory service.
export const inventoryService = {
  async list() {
    if (config.mode === "api") return request("/inventory");
    return productService.list();
  },
  async updateQuantity(productId, quantity) {
    if (config.mode === "api") {
      return request(`/inventory/${encodeURIComponent(productId)}`, {
        method: "PATCH", body: JSON.stringify({quantity})
      });
    }
    return productService.updateStock(productId, quantity);
  }
};
