import { config } from "../config.js";
import { storage } from "./storage.js";
import { request } from "./http.js";

const KEY = "products";
const SEED = [
  {id:"p-1001",name:"iPhone 15 Pro",sku:"APL-IP15P-256",category:"Smartphones",price:1250000,stock:8,reorderLevel:4,condition:"UK used",createdAt:"2025-04-12T09:00:00.000Z"},
  {id:"p-1002",name:"MacBook Air M2",sku:"APL-MBA-M2",category:"Laptops",price:1850000,stock:3,reorderLevel:5,condition:"Brand new",createdAt:"2025-04-11T09:00:00.000Z"},
  {id:"p-1003",name:"Samsung Galaxy S24",sku:"SAM-S24-128",category:"Smartphones",price:980000,stock:12,reorderLevel:5,condition:"Brand new",createdAt:"2025-04-10T09:00:00.000Z"},
  {id:"p-1004",name:"iPad Air 5th Gen",sku:"APL-IPAD-A5",category:"Tablets",price:760000,stock:6,reorderLevel:3,condition:"UK used",createdAt:"2025-04-09T09:00:00.000Z"},
  {id:"p-1005",name:"Sony WH-1000XM5",sku:"SNY-WH1000XM5",category:"Accessories",price:540000,stock:2,reorderLevel:5,condition:"Brand new",createdAt:"2025-04-08T09:00:00.000Z"},
  {id:"p-1006",name:"PlayStation 5 Slim",sku:"SNY-PS5-SLIM",category:"Gaming",price:920000,stock:0,reorderLevel:2,condition:"Brand new",createdAt:"2025-04-07T09:00:00.000Z"},
  {id:"p-1007",name:"Google Pixel 8",sku:"GOO-PIX8-128",category:"Smartphones",price:690000,stock:9,reorderLevel:4,condition:"UK used",createdAt:"2025-04-06T09:00:00.000Z"},
  {id:"p-1008",name:"Dell XPS 13",sku:"DEL-XPS13-I7",category:"Laptops",price:1600000,stock:4,reorderLevel:4,condition:"Brand new",createdAt:"2025-04-05T09:00:00.000Z"}
];

function allLocal() {
  let products = storage.get(KEY);
  if (!Array.isArray(products)) {
    products = SEED;
    storage.set(KEY, products);
  }
  return products;
}

export const productService = {
  async list() {
    if (config.mode === "api") return request("/products");
    return allLocal();
  },
  async create(product) {
    if (config.mode === "api") return request("/products", {method:"POST", body:JSON.stringify(product)});
    const products = allLocal();
    const saved = {...product, id:crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}`, createdAt:new Date().toISOString()};
    storage.set(KEY, [saved, ...products]);
    return saved;
  },
  async update(id, changes) {
    if (config.mode === "api") return request(`/products/${encodeURIComponent(id)}`, {method:"PATCH", body:JSON.stringify(changes)});
    const products = allLocal();
    const index = products.findIndex(p => p.id === id);
    if (index < 0) throw new Error("Product not found.");
    products[index] = {...products[index], ...changes};
    storage.set(KEY, products);
    return products[index];
  },
  async remove(id) {
    if (config.mode === "api") return request(`/products/${encodeURIComponent(id)}`, {method:"DELETE"});
    storage.set(KEY, allLocal().filter(p => p.id !== id));
  },
  async updateStock(id, stock) {
    return this.update(id, {stock});
  }
};
