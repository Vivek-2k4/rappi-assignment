const db = require("./database");

db.exec(`
  DROP TABLE IF EXISTS agent_decisions;
  DROP TABLE IF EXISTS purchase_orders;
  DROP TABLE IF EXISTS budgets;
  DROP TABLE IF EXISTS demand_forecasts;
  DROP TABLE IF EXISTS inventory;
  DROP TABLE IF EXISTS suppliers;
  DROP TABLE IF EXISTS products;

  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    unit_cost REAL NOT NULL,
    supplier_id INTEGER
  );

  CREATE TABLE suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lead_time_days INTEGER NOT NULL,
    minimum_order_quantity INTEGER NOT NULL,
    available_quantity INTEGER NOT NULL
  );

  CREATE TABLE inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    node_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    storage_capacity INTEGER NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE demand_forecasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    daily_demand INTEGER NOT NULL,
    forecast_days INTEGER NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL,
    available_amount REAL NOT NULL
  );

  CREATE TABLE agent_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    original_quantity INTEGER NOT NULL,
    recommended_quantity INTEGER,
    decision TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const supplier = db.prepare(`
  INSERT INTO suppliers (
    name,
    lead_time_days,
    minimum_order_quantity,
    available_quantity
  )
  VALUES (?, ?, ?, ?)
`).run(
  "Acme Foods",
  3,
  100,
  250
);

const product = db.prepare(`
  INSERT INTO products (
    sku,
    name,
    unit_cost,
    supplier_id
  )
  VALUES (?, ?, ?, ?)
`).run(
  "COF-001",
  "Premium Coffee Beans",
  60,
  supplier.lastInsertRowid
);

db.prepare(`
  INSERT INTO inventory (
    product_id,
    node_id,
    quantity,
    storage_capacity
  )
  VALUES (?, ?, ?, ?)
`).run(
  product.lastInsertRowid,
  "DEL-NODE-01",
  320,
  1000
);

db.prepare(`
  INSERT INTO demand_forecasts (
    product_id,
    daily_demand,
    forecast_days
  )
  VALUES (?, ?, ?)
`).run(
  product.lastInsertRowid,
  70,
  7
);

db.prepare(`
  INSERT INTO purchase_orders (
    product_id,
    supplier_id,
    quantity,
    status
  )
  VALUES (?, ?, ?, ?)
`).run(
  product.lastInsertRowid,
  supplier.lastInsertRowid,
  300,
  "OPEN"
);

db.prepare(`
  INSERT INTO budgets (
    node_id,
    available_amount
  )
  VALUES (?, ?)
`).run(
  "DEL-NODE-01",
  50000
);

console.log("Database seeded successfully.");

db.close();