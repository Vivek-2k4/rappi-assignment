
import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:5000/api";

function App() {
  const [productId, setProductId] = useState(1);
  const [quantity, setQuantity] = useState(100);
  const [approved, setApproved] = useState(false);

  const [result, setResult] = useState(null);
  const [agentAnalysis, setAgentAnalysis] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);

  async function evaluatePurchase() {
    setLoading(true);
    setError("");
    setResult(null);
    setApproved(false);
    setAgentAnalysis(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/purchases/evaluate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: Number(productId),
            requestedQuantity: Number(quantity),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Evaluation failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function executePurchase() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/purchases/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: Number(productId),
            requestedQuantity: Number(quantity),
            approved: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Execution failed");
      }

      setResult(data);

      if (data.success) {
        fetchPurchaseHistory();
      }

      setApproved(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeWithAgent() {
    setAgentLoading(true);
    setAgentAnalysis(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/purchases/agent-tool-analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: Number(productId),
            requestedQuantity: Number(quantity),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Agent analysis failed");
      }

      setAgentAnalysis(data.decision);
    } catch (err) {
      setAgentAnalysis({
        error: err.message,
      });
    } finally {
      setAgentLoading(false);
    }
  }

  async function fetchPurchaseHistory() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/purchases/history`
      );

      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(
        "Failed to fetch purchase history:",
        err
      );
    }
  }

  useEffect(() => {
    fetchPurchaseHistory();
  }, []);

  const evaluation = result?.evaluation ?? result;
  const analysis = evaluation?.analysis;
  const checks = analysis?.checks;

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">AI SUPPLY CHAIN</p>

          <h1>Purchasing Agent</h1>

          <p className="subtitle">
            Evaluate inventory requirements and manage
            purchase approvals.
          </p>
        </div>

        <span className="status-badge">
          <span className="status-dot"></span>
          API Connected
        </span>
      </header>

      <main className="dashboard">
        {/* PURCHASE REQUEST */}
        <section className="card request-card">
          <div className="card-heading">
            <div>
              <p className="section-label">
                01 / PURCHASE REQUEST
              </p>

              <h2>Request Details</h2>
            </div>

            <span className="icon-box">📦</span>
          </div>

          <div className="form-group">
            <label htmlFor="productId">
              Product ID
            </label>

            <input
              id="productId"
              type="number"
              min="1"
              value={productId}
              onChange={(e) =>
                setProductId(e.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="quantity">
              Requested Quantity
            </label>

            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
            />
          </div>

          <button
            className="primary-button"
            onClick={evaluatePurchase}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : "Evaluate Purchase →"}
          </button>

          <button
            className="secondary-button"
            onClick={analyzeWithAgent}
            disabled={agentLoading}
          >
            {agentLoading
              ? "Analyzing..."
              : "Analyze with AI Agent →"}
          </button>

          {/* STRUCTURED AI AGENT ANALYSIS */}
          {agentAnalysis && (
            <div className="agent-analysis">
              <h3>AI Agent Analysis</h3>

              {agentAnalysis.error ? (
                <p className="error-message">
                  Error: {agentAnalysis.error}
                </p>
              ) : (
                <>
                  <div className="agent-decision">
                    <span>Decision</span>

                    <strong>
                      {agentAnalysis.decision}
                    </strong>
                  </div>

                  <div className="agent-section">
                    <h4>Summary</h4>

                    <p>
                      {agentAnalysis.summary}
                    </p>
                  </div>

                  <div className="agent-section">
                    <h4>Key Factors</h4>

                    <ul>
                      {agentAnalysis.key_factors?.map(
                        (factor, index) => (
                          <li key={index}>
                            {factor}
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div className="agent-section">
                    <h4>Recommended Action</h4>

                    <p>
                      {agentAnalysis.recommended_action}
                    </p>
                  </div>

                  <div className="agent-section">
                    <h4>Human Approval</h4>

                    <p>
                      {agentAnalysis.human_approval_required ||
                      ["MODIFY", "INVESTIGATE"].includes(
                        agentAnalysis.decision
                      )
                        ? "Required"
                        : "Not Required"}
                    </p>
                  </div>

                  <div className="agent-source">
                    Source:{" "}
                    {agentAnalysis.source ||
                      "Gemini"}
                  </div>

                  {agentAnalysis.fallback_reason && (
                    <div className="agent-source">
                      Fallback Reason:{" "}
                      {agentAnalysis.fallback_reason}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <p className="helper-text">
            The agent checks supplier availability,
            MOQ, budget, and storage.
          </p>
        </section>

        {/* EVALUATION RESULT */}
        <section className="card result-card">
          <div className="card-heading">
            <div>
              <p className="section-label">
                02 / AGENT DECISION
              </p>

              <h2>Evaluation Result</h2>
            </div>

            <span className="icon-box">🤖</span>
          </div>

          {!result && !error && (
            <div className="empty-state">
              <span>⌛</span>

              <p>
                Submit a purchase request to view
                the agent's decision.
              </p>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {result && (
            <div className="result-content">
              <div
                className={`decision decision-${evaluation?.decision}`}
              >
                <span className="decision-label">
                  Decision
                </span>

                <strong>
                  {evaluation?.decision ||
                    result.stage}
                </strong>
              </div>

              <p className="reason">
                {evaluation?.reason}
              </p>

              {analysis && (
                <div className="metrics">
                  <div className="metric">
                    <span>Forecast Demand</span>

                    <strong>
                      {analysis.forecastDemand}
                    </strong>
                  </div>

                  <div className="metric">
                    <span>Incoming Quantity</span>

                    <strong>
                      {analysis.incomingQuantity}
                    </strong>
                  </div>

                  <div className="metric">
                    <span>Projected Inventory</span>

                    <strong>
                      {analysis.projectedInventory}
                    </strong>
                  </div>

                  <div className="metric">
                    <span>Purchase Cost</span>

                    <strong>
                      ₹{analysis.purchaseCost}
                    </strong>
                  </div>
                </div>
              )}

              {checks && (
                <div className="checks">
                  <h3>Constraint Checks</h3>

                  {Object.entries(checks).map(
                    ([name, passed]) => (
                      <div
                        className="check-row"
                        key={name}
                      >
                        <span>
                          {name
                            .replace(
                              /([A-Z])/g,
                              " $1"
                            )
                            .replace(
                              /^./,
                              (char) =>
                                char.toUpperCase()
                            )}
                        </span>

                        <strong
                          className={
                            passed
                              ? "passed"
                              : "failed"
                          }
                        >
                          {passed
                            ? "✓ Passed"
                            : "✕ Failed"}
                        </strong>
                      </div>
                    )
                  )}
                </div>
              )}

              {evaluation?.recommendedQuantity !==
                null &&
                evaluation?.recommendedQuantity !==
                  undefined &&
                evaluation?.recommendedQuantity !==
                  Number(quantity) && (
                  <div className="recommendation">
                    <strong>
                      Recommended Quantity
                    </strong>

                    <p>
                      The agent recommends{" "}
                      <b>
                        {evaluation.recommendedQuantity}
                      </b>{" "}
                      units.
                    </p>

                    <button
                      className="secondary-button"
                      onClick={() => {
                        setQuantity(
                          evaluation.recommendedQuantity
                        );

                        setResult(null);
                      }}
                    >
                      Use Recommended Quantity
                    </button>
                  </div>
                )}

              {result.stage === "COMPLETED" && (
                <div className="success-message">
                  ✓ Purchase order created and
                  validated successfully.
                  <br />
                  PO ID:{" "}
                  {result.execution?.purchaseOrderId}
                </div>
              )}
            </div>
          )}
        </section>

        {/* HUMAN APPROVAL */}
        <section className="card approval-card">
          <div className="card-heading">
            <div>
              <p className="section-label">
                03 / HUMAN APPROVAL
              </p>

              <h2>Purchase Authorization</h2>
            </div>

            <span className="icon-box">🔐</span>
          </div>

          <p className="approval-description">
            Purchase orders require explicit human
            approval before creation.
          </p>

          <label className="approval-toggle">
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) =>
                setApproved(e.target.checked)
              }
            />

            <span>
              I approve this purchase request.
            </span>
          </label>

          <button
            className="primary-button"
            onClick={executePurchase}
            disabled={
              loading ||
              !approved ||
              evaluation?.decision !== "ACCEPT"
            }
          >
            {loading
              ? "Executing..."
              : "Create Purchase Order →"}
          </button>

          {!approved && (
            <p className="helper-text">
              Approval is required before a purchase
              order can be created.
            </p>
          )}

          {evaluation?.decision !== "ACCEPT" &&
            result && (
              <p className="helper-text">
                Only purchases that satisfy all
                constraints can be executed.
              </p>
            )}
        </section>

        {/* PURCHASE HISTORY */}
        <section className="card history-card">
          <div className="card-heading">
            <div>
              <p className="section-label">
                04 / PURCHASE HISTORY
              </p>

              <h2>Purchase Orders</h2>
            </div>

            <span className="icon-box">📋</span>
          </div>

          {orders.length === 0 ? (
            <p className="helper-text">
              No purchase orders found.
            </p>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>PO ID</th>
                    <th>Product</th>
                    <th>Supplier</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.purchaseOrderId}
                    >
                      <td>
                        #{order.purchaseOrderId}
                      </td>

                      <td>
                        {order.productName}
                      </td>

                      <td>
                        {order.supplierName}
                      </td>

                      <td>{order.quantity}</td>

                      <td>
                        <span className="order-status">
                          {order.status}
                        </span>
                      </td>

                      <td>{order.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;