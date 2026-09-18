const express = require("express");
const db = require("../db/database");

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const products = db
      .prepare(`
        SELECT
          p.id,
          p.sku,
          p.name,
          p.unit_cost,
          s.name AS supplier_name,
          s.lead_time_days,
          s.minimum_order_quantity,
          s.available_quantity
        FROM products p
        JOIN suppliers s
          ON p.supplier_id = s.id
      `)
      .all();

    res.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);

    res.status(500).json({
      error: "Failed to fetch products",
    });
  }
});

module.exports = router;