
const db = require("../db/database");

console.log("\n=== PURCHASE ORDERS SCHEMA ===");
console.table(
  db.prepare("PRAGMA table_info(purchase_orders)").all()
);

console.log("\n=== PRODUCTS SCHEMA ===");
console.table(
  db.prepare("PRAGMA table_info(products)").all()
);

console.log("\n=== PRODUCTS DATA ===");
console.table(
  db.prepare("SELECT * FROM products").all()
);