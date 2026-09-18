require("dotenv").config();

const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/products");
const purchaseRoutes = require("./routes/purchase");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "AI Purchasing Agent API",
    status: "running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "AI Purchasing Agent",
  });
});

app.use("/api/products", productRoutes);
app.use("/api/purchases", purchaseRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});