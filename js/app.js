import { productService } from "./services/productService.js";
import { inventoryService } from "./services/inventoryService.js";
import { dashboardService } from "./services/dashboardService.js";
import { config } from "./config.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let products = [];
let toastTimer;

const money = (amount) => new Intl.NumberFormat("en-NG", {style:"currency", currency:"NGN", maximumFractionDigits:0}).format(Number(amount || 0));
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const categoryClass = (category) => ({Smartphones:"thumb-phone",Laptops:"thumb-laptop",Tablets:"thumb-tablet",Accessories:"thumb-accessory",Gaming:"thumb-gaming"}[category] || "thumb-phone");
const categoryIcon = (category) => ({Smartphones:"▯",Laptops:"▱",Tablets:"▯",Accessories:"◈",Gaming:"◉"}[category] || "▣");
const stockState = (p) => Number(p.stock) === 0 ? "out" : Number(p.stock) <= Number(p.reorderLevel) ? "low" : "healthy";
const stockLabel = (state) => ({healthy:"In stock",low:"Low stock",out:"Out of stock"}[state]);
const badge = (state) => `<span class="status-badge badge-${state}">${stockLabel(state)}</span>`;

function showToast(message) {
  $("#toastMessage").textContent = message;
  $("#toast").classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.add("hidden"), 2600);
}
function showError(message) {
  $("#formError").textContent = message;
  $("#formError").classList.remove("hidden");
}
function productCell(p) {
  return `<div class="product-cell"><span class="product-thumb ${categoryClass(p.category)}">${categoryIcon(p.category)}</span><span><span class="product-name">${escapeHtml(p.name)}</span><span class="product-sub">${escapeHtml(p.condition || "Gadget")}</span></span></div>`;
}
function renderDashboard(summary) {
  $("#metricProducts").textContent = summary.totalProducts;
  $("#metricUnits").textContent = summary.totalUnits.toLocaleString("en-NG");
  $("#metricLowStock").textContent = summary.lowStock;
  $("#metricValue").textContent = money(summary.catalogueValue);
  $("#healthyCount").textContent = summary.healthy;
  $("#lowCount").textContent = summary.lowStock;
  $("#outCount").textContent = summary.outOfStock;
  const pct = summary.totalProducts ? Math.round(summary.healthy / summary.totalProducts * 100) : 0;
  $("#stockHealthPercent").innerHTML = `${pct}<small>%</small>`;
  $("#stockHealthBar").style.width = `${pct}%`;
  $("#productNavCount").textContent = summary.totalProducts;
  $("#recentProductsBody").innerHTML = products.slice(0,5).map(p => `<tr><td>${productCell(p)}</td><td>${escapeHtml(p.category)}</td><td class="price">${money(p.price)}</td><td>${p.stock}</td><td>${badge(stockState(p))}</td></tr>`).join("");
}
function renderProducts() {
  const query = $("#productSearch").value.trim().toLowerCase();
  const category = $("#categoryFilter").value;
  const filtered = products.filter(p => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query) && (category === "all" || p.category === category));
  $("#productsBody").innerHTML = filtered.map(p => `<tr><td>${productCell(p)}</td><td>${escapeHtml(p.sku)}</td><td>${escapeHtml(p.category)}</td><td class="price">${money(p.price)}</td><td>${p.stock}</td><td>${badge(stockState(p))}</td><td><div class="row-actions"><button class="small-action" data-edit="${escapeHtml(p.id)}">Edit</button><button class="small-action" data-delete="${escapeHtml(p.id)}" aria-label="Delete ${escapeHtml(p.name)}">Delete</button></div></td></tr>`).join("");
  $("#productResultsCount").textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;
  $("#productsEmpty").classList.toggle("hidden", filtered.length > 0);
  $(".products-table")?.classList.toggle("hidden", filtered.length === 0);
}
function renderInventory() {
  const query = $("#inventorySearch").value.trim().toLowerCase();
  const filter = $("#stockFilter").value;
  const filtered = products.filter(p => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query) && (filter === "all" || stockState(p) === filter));
  $("#inventoryBody").innerHTML = filtered.map(p => `<tr><td>${productCell(p)}</td><td>${escapeHtml(p.sku)}</td><td><strong>${p.stock}</strong></td><td>${p.reorderLevel}</td><td>${badge(stockState(p))}</td><td><div class="quantity-control"><input type="number" min="0" step="1" value="${p.stock}" aria-label="New quantity for ${escapeHtml(p.name)}" id="qty-${escapeHtml(p.id)}"><button data-update-stock="${escapeHtml(p.id)}">Save</button></div></td></tr>`).join("");
  $("#inventoryResultsCount").textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;
  $("#inventoryEmpty").classList.toggle("hidden", filtered.length > 0);
}
async function refresh() {
  try {
    products = await productService.list();
    const summary = await dashboardService.summary();
    renderDashboard(summary);
    renderProducts();
    renderInventory();
  } catch (error) {
    console.error(error);
    showToast(`Could not load data: ${error.message}`);
  }
}
function navigate(view) {
  const valid = ["dashboard","products","inventory"].includes(view) ? view : "dashboard";
  $$(".view").forEach(el => el.classList.toggle("active", el.id === `${valid}View`));
  $$(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.view === valid));
  $("#breadcrumbCurrent").textContent = valid.charAt(0).toUpperCase() + valid.slice(1);
  $("#sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}
function openModal(product = null) {
  $("#productForm").reset();
  $("#productId").value = product?.id || "";
  $("#modalTitle").textContent = product ? "Edit product" : "Add a product";
  $("#productName").value = product?.name || "";
  $("#productSku").value = product?.sku || "";
  $("#productCategory").value = product?.category || "Smartphones";
  $("#productPrice").value = product?.price ?? "";
  $("#productStock").value = product?.stock ?? "";
  $("#productReorder").value = product?.reorderLevel ?? config.lowStockDefault;
  $("#productCondition").value = product?.condition || "Brand new";
  $("#formError").classList.add("hidden");
  $("#productModal").classList.remove("hidden");
  $("#productName").focus();
}
function closeModal() { $("#productModal").classList.add("hidden"); }
function downloadCsv() {
  const rows = [["Name","SKU","Category","Price (NGN)","Stock","Reorder level","Condition","Status"], ...products.map(p => [p.name,p.sku,p.category,p.price,p.stock,p.reorderLevel,p.condition,stockLabel(stockState(p))])];
  const csv = rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8;"}));
  const a = document.createElement("a"); a.href = url; a.download = "cloudstock-inventory.csv"; a.click(); URL.revokeObjectURL(url);
}

document.addEventListener("click", async (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) { navigate(nav.dataset.view); return; }
  const action = event.target.closest("[data-action]");
  if (action?.dataset.action === "add-product") { openModal(); return; }
  const edit = event.target.closest("[data-edit]");
  if (edit) { const product = products.find(p => p.id === edit.dataset.edit); if (product) openModal(product); return; }
  const del = event.target.closest("[data-delete]");
  if (del) {
    const product = products.find(p => p.id === del.dataset.delete);
    if (product && window.confirm(`Delete "${product.name}" from the catalogue?`)) {
      try { await productService.remove(product.id); await refresh(); showToast("Product deleted."); } catch (error) { showToast(error.message); }
    }
    return;
  }
  const stockButton = event.target.closest("[data-update-stock]");
  if (stockButton) {
    const id = stockButton.dataset.updateStock;
    const input = $(`#qty-${CSS.escape(id)}`);
    const quantity = Number(input.value);
    if (!Number.isInteger(quantity) || quantity < 0) { showToast("Enter a valid quantity."); return; }
    try { await inventoryService.updateQuantity(id, quantity); await refresh(); showToast("Inventory updated."); } catch (error) { showToast(error.message); }
  }
});
$$(".nav-item").forEach(button => button.addEventListener("click", () => navigate(button.dataset.view)));
$("#productSearch").addEventListener("input", renderProducts);
$("#categoryFilter").addEventListener("change", renderProducts);
$("#inventorySearch").addEventListener("input", renderInventory);
$("#stockFilter").addEventListener("change", renderInventory);
$("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#closeModal").addEventListener("click", closeModal);
$("#cancelModal").addEventListener("click", closeModal);
$("#productModal").addEventListener("click", e => { if (e.target.id === "productModal") closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
$("#exportInventory").addEventListener("click", downloadCsv);
$("#notificationsButton").addEventListener("click", () => showToast("You're all caught up."));
$("#productForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = $("#productId").value;
  const product = {
    name: $("#productName").value.trim(),
    sku: $("#productSku").value.trim(),
    category: $("#productCategory").value,
    price: Number($("#productPrice").value),
    stock: Number($("#productStock").value),
    reorderLevel: Number($("#productReorder").value),
    condition: $("#productCondition").value
  };
  if (!product.name || !product.sku || !Number.isFinite(product.price) || product.price < 0 || !Number.isInteger(product.stock) || product.stock < 0 || !Number.isInteger(product.reorderLevel) || product.reorderLevel < 0) {
    showError("Please check the product details and enter valid non-negative numbers."); return;
  }
  if (products.some(p => p.sku.toLowerCase() === product.sku.toLowerCase() && p.id !== id)) {
    showError("That SKU is already in use. Please enter a unique SKU."); return;
  }
  try {
    if (id) await productService.update(id, product); else await productService.create(product);
    closeModal(); await refresh(); navigate("products"); showToast(id ? "Product updated." : "Product added.");
  } catch (error) { showError(error.message || "Unable to save product."); }
});

if ("serviceWorker" in navigator && location.protocol.startsWith("https")) {
  // Intentionally no service worker by default; add one if offline caching is required.
}
await refresh();
