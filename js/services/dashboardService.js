import { config } from "../config.js";
import { request } from "./http.js";
import { productService } from "./productService.js";

export const dashboardService = {
  async summary() {
    if (config.mode === "api") return request("/dashboard/summary");
    const products = await productService.list();
    const units = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    const low = products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel).length;
    const out = products.filter(p => Number(p.stock) === 0).length;
    const healthy = products.filter(p => p.stock > p.reorderLevel).length;
    const value = products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0), 0);
    return {totalProducts:products.length, totalUnits:units, lowStock:low, outOfStock:out, healthy, catalogueValue:value};
  }
};
