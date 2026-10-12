// ContractIQ – FastAPI-style REST backend (Express.js)
// Endpoints mirror FastAPI conventions: /api/v1/contracts, /api/v1/renewals
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = 8000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// ─── In-memory stores ─────────────────────────────────────────────────────────
let contracts = [
  { id: "CTR-2401", name: "Microsoft Azure SLA",         category: "Technology",  owner: "Sarah Chen",   start: "2024-01-15", expiry: "2025-01-14", value: "$95,000",  status: "Active",   risk: "Low",    notes: "", createdAt: new Date().toISOString() },
  { id: "CTR-2402", name: "Global Logistics Agreement",  category: "Procurement", owner: "James Miller", start: "2023-06-01", expiry: "2024-07-31", value: "$85,000",  status: "Expiring", risk: "High",   notes: "", createdAt: new Date().toISOString() },
  { id: "CTR-2403", name: "Employment Contract – Legal", category: "HR",          owner: "Priya Nair",   start: "2024-03-01", expiry: "2026-02-28", value: "$60,000",  status: "Active",   risk: "Low",    notes: "", createdAt: new Date().toISOString() },
  { id: "CTR-2404", name: "Oracle ERP License",          category: "Technology",  owner: "Daniel Park",  start: "2022-11-01", expiry: "2024-10-31", value: "$120,000", status: "Active",   risk: "Medium", notes: "", createdAt: new Date().toISOString() },
  { id: "CTR-2405", name: "Marketing Agency Retainer",   category: "Marketing",   owner: "Emma Walsh",   start: "2024-02-01", expiry: "2024-12-31", value: "$72,000",  status: "Active",   risk: "Low",    notes: "", createdAt: new Date().toISOString() },
  { id: "CTR-2406", name: "Office Lease – HQ",           category: "Facilities",  owner: "Tom Reeves",   start: "2021-01-01", expiry: "2024-12-31", value: "$240,000", status: "Expiring", risk: "High",   notes: "", createdAt: new Date().toISOString() },
  { id: "CTR-2407", name: "Vendor NDA – FinTech Corp",   category: "Legal",       owner: "Sarah Chen",   start: "2024-04-01", expiry: "2027-03-31", value: "$10,000",  status: "Active",   risk: "Low",    notes: "", createdAt: new Date().toISOString() },
  { id: "CTR-2408", name: "Insurance Policy – D&O",      category: "Finance",     owner: "James Miller", start: "2024-01-01", expiry: "2024-12-31", value: "$45,000",  status: "Pending",  risk: "Medium", notes: "", createdAt: new Date().toISOString() },
];

let renewals = [
  { id: "RNW-001", contractId: "CTR-2406", name: "Office Lease – HQ",         owner: "Tom Reeves",   expiry: "2024-12-31", value: "$240,000", daysLeft: 184, status: "Action Required", notes: "", renewedOn: null, extendedTo: null, terminatedOn: null, createdAt: new Date().toISOString() },
  { id: "RNW-002", contractId: "CTR-2402", name: "Global Logistics Agreement", owner: "James Miller", expiry: "2024-07-31", value: "$85,000",  daysLeft: 31,  status: "Critical",        notes: "", renewedOn: null, extendedTo: null, terminatedOn: null, createdAt: new Date().toISOString() },
  { id: "RNW-003", contractId: "CTR-2404", name: "Oracle ERP License",         owner: "Daniel Park",  expiry: "2024-10-31", value: "$120,000", daysLeft: 123, status: "Upcoming",         notes: "", renewedOn: null, extendedTo: null, terminatedOn: null, createdAt: new Date().toISOString() },
  { id: "RNW-004", contractId: "CTR-2408", name: "Insurance Policy – D&O",     owner: "James Miller", expiry: "2024-12-31", value: "$45,000",  daysLeft: 184, status: "Upcoming",         notes: "", renewedOn: null, extendedTo: null, terminatedOn: null, createdAt: new Date().toISOString() },
  { id: "RNW-005", contractId: "CTR-2405", name: "Marketing Agency Retainer",  owner: "Emma Walsh",   expiry: "2024-12-31", value: "$72,000",  daysLeft: 184, status: "Upcoming",         notes: "", renewedOn: null, extendedTo: null, terminatedOn: null, createdAt: new Date().toISOString() },
];

// ─── Validation helpers ───────────────────────────────────────────────────────
function validateContract(body) {
  const errors = {};
  if (!body.name?.trim())     errors.name     = "Contract name is required";
  if (!body.category?.trim()) errors.category = "Category is required";
  if (!body.owner?.trim())    errors.owner    = "Owner is required";
  if (!body.start)            errors.start    = "Start date is required";
  if (!body.expiry)           errors.expiry   = "Expiry date is required";
  if (body.start && body.expiry && body.start >= body.expiry)
    errors.expiry = "Expiry date must be after start date";
  const validStatuses = ["Active", "Expiring", "Pending", "Archived", "Draft", "Under Review"];
  if (body.status && !validStatuses.includes(body.status))
    errors.status = `Status must be one of: ${validStatuses.join(", ")}`;
  const validRisks = ["Low", "Medium", "High"];
  if (body.risk && !validRisks.includes(body.risk))
    errors.risk = `Risk must be one of: ${validRisks.join(", ")}`;
  return errors;
}

function validateRenewal(body) {
  const errors = {};
  if (!body.name?.trim())  errors.name  = "Renewal name is required";
  if (!body.owner?.trim()) errors.owner = "Owner is required";
  if (!body.expiry)        errors.expiry = "Expiry date is required";
  const validStatuses = ["Critical", "Action Required", "Upcoming", "Renewed", "Extended", "Terminated"];
  if (body.status && !validStatuses.includes(body.status))
    errors.status = `Status must be one of: ${validStatuses.join(", ")}`;
  return errors;
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    name: "ContractIQ API",
    version: "1.0.0",
    docs: "http://localhost:8000/api/v1/openapi",
    endpoints: [
      "GET  /api/v1/contracts",
      "POST /api/v1/contracts",
      "GET  /api/v1/contracts/:id",
      "PUT  /api/v1/contracts/:id",
      "DELETE /api/v1/contracts/:id",
      "GET  /api/v1/renewals",
      "POST /api/v1/renewals",
      "GET  /api/v1/renewals/:id",
      "PUT  /api/v1/renewals/:id",
      "POST /api/v1/renewals/:id/renew",
      "POST /api/v1/renewals/:id/extend",
      "POST /api/v1/renewals/:id/terminate",
      "DELETE /api/v1/renewals/:id",
    ],
  });
});

// OpenAPI-style schema endpoint
app.get("/api/v1/openapi", (_req, res) => {
  res.json({
    openapi: "3.0.0",
    info: { title: "ContractIQ API", version: "1.0.0" },
    paths: {
      "/api/v1/contracts": { get: { summary: "List all contracts" }, post: { summary: "Create contract" } },
      "/api/v1/contracts/{id}": { get: { summary: "Get contract" }, put: { summary: "Update contract" }, delete: { summary: "Delete contract" } },
      "/api/v1/renewals": { get: { summary: "List all renewals" }, post: { summary: "Create renewal" } },
      "/api/v1/renewals/{id}": { get: { summary: "Get renewal" }, put: { summary: "Update renewal" }, delete: { summary: "Delete renewal" } },
      "/api/v1/renewals/{id}/renew": { post: { summary: "Renew contract" } },
      "/api/v1/renewals/{id}/extend": { post: { summary: "Extend contract" } },
      "/api/v1/renewals/{id}/terminate": { post: { summary: "Terminate contract" } },
    },
  });
});

// ─── CONTRACTS ────────────────────────────────────────────────────────────────

// GET /api/v1/contracts — list with optional filtering
app.get("/api/v1/contracts", (req, res) => {
  let result = [...contracts];
  const { status, category, risk, search, date_from, date_to } = req.query;
  if (status && status !== "All")   result = result.filter(c => c.status === status);
  if (category && category !== "All") result = result.filter(c => c.category === category);
  if (risk && risk !== "All")       result = result.filter(c => c.risk === risk);
  if (date_from) result = result.filter(c => c.expiry >= date_from);
  if (date_to)   result = result.filter(c => c.expiry <= date_to);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.owner.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  }
  res.json({ data: result, total: result.length });
});

// GET /api/v1/contracts/:id
app.get("/api/v1/contracts/:id", (req, res) => {
  const contract = contracts.find(c => c.id === req.params.id);
  if (!contract) return res.status(404).json({ detail: "Contract not found" });
  res.json(contract);
});

// POST /api/v1/contracts — create
app.post("/api/v1/contracts", (req, res) => {
  const errors = validateContract(req.body);
  if (Object.keys(errors).length) return res.status(422).json({ detail: errors });

  const newId = `CTR-${2400 + contracts.length + 1}`;
  const contract = {
    id: newId,
    name:     req.body.name.trim(),
    category: req.body.category || "Technology",
    owner:    req.body.owner.trim(),
    start:    req.body.start,
    expiry:   req.body.expiry,
    value:    req.body.value || "$0",
    status:   req.body.status || "Draft",
    risk:     req.body.risk || "Low",
    notes:    req.body.notes || "",
    createdAt: new Date().toISOString(),
  };
  contracts.unshift(contract);
  res.status(201).json(contract);
});

// PUT /api/v1/contracts/:id — update
app.put("/api/v1/contracts/:id", (req, res) => {
  const idx = contracts.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: "Contract not found" });
  const errors = validateContract({ ...contracts[idx], ...req.body });
  if (Object.keys(errors).length) return res.status(422).json({ detail: errors });
  contracts[idx] = { ...contracts[idx], ...req.body, id: contracts[idx].id, updatedAt: new Date().toISOString() };
  res.json(contracts[idx]);
});

// DELETE /api/v1/contracts/:id
app.delete("/api/v1/contracts/:id", (req, res) => {
  const idx = contracts.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: "Contract not found" });
  const deleted = contracts.splice(idx, 1)[0];
  res.json({ message: `Contract "${deleted.name}" deleted`, id: deleted.id });
});

// ─── RENEWALS ─────────────────────────────────────────────────────────────────

// GET /api/v1/renewals
app.get("/api/v1/renewals", (req, res) => {
  let result = [...renewals];
  const { status, search } = req.query;
  if (status && status !== "All") result = result.filter(r => r.status === status);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(r => r.name.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q));
  }
  const stats = {
    critical:  result.filter(r => r.daysLeft < 30 && r.status !== "Terminated").length,
    upcoming:  result.filter(r => r.daysLeft >= 30 && r.daysLeft <= 90 && r.status !== "Terminated").length,
    scheduled: result.filter(r => r.daysLeft > 90 && r.status !== "Terminated").length,
    total:     result.length,
  };
  res.json({ data: result, stats, total: result.length });
});

// GET /api/v1/renewals/:id
app.get("/api/v1/renewals/:id", (req, res) => {
  const renewal = renewals.find(r => r.id === req.params.id);
  if (!renewal) return res.status(404).json({ detail: "Renewal not found" });
  res.json(renewal);
});

// POST /api/v1/renewals — create
app.post("/api/v1/renewals", (req, res) => {
  const errors = validateRenewal(req.body);
  if (Object.keys(errors).length) return res.status(422).json({ detail: errors });
  const renewal = {
    id: `RNW-${String(renewals.length + 1).padStart(3, "0")}`,
    contractId:   req.body.contractId || null,
    name:         req.body.name.trim(),
    owner:        req.body.owner.trim(),
    expiry:       req.body.expiry,
    value:        req.body.value || "$0",
    daysLeft:     req.body.daysLeft ?? 0,
    status:       req.body.status || "Upcoming",
    notes:        req.body.notes || "",
    renewedOn:    null,
    extendedTo:   null,
    terminatedOn: null,
    createdAt:    new Date().toISOString(),
  };
  renewals.unshift(renewal);
  res.status(201).json(renewal);
});

// PUT /api/v1/renewals/:id — update
app.put("/api/v1/renewals/:id", (req, res) => {
  const idx = renewals.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: "Renewal not found" });
  renewals[idx] = { ...renewals[idx], ...req.body, id: renewals[idx].id, updatedAt: new Date().toISOString() };
  res.json(renewals[idx]);
});

// POST /api/v1/renewals/:id/renew — renew action
app.post("/api/v1/renewals/:id/renew", (req, res) => {
  const idx = renewals.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: "Renewal not found" });
  const months = parseInt(req.body.term_months ?? "12", 10);
  if (isNaN(months) || months <= 0) return res.status(422).json({ detail: { term_months: "Must be a positive number" } });
  const today = new Date().toISOString().slice(0, 10);
  const newExpiry = addMonths(renewals[idx].expiry, months);
  renewals[idx] = {
    ...renewals[idx],
    expiry: newExpiry,
    daysLeft: renewals[idx].daysLeft + months * 30,
    status: "Renewed",
    renewedOn: today,
    notes: req.body.notes || renewals[idx].notes,
    updatedAt: new Date().toISOString(),
  };
  res.json({ message: `Renewed for ${months} months`, renewal: renewals[idx] });
});

// POST /api/v1/renewals/:id/extend — extend action
app.post("/api/v1/renewals/:id/extend", (req, res) => {
  const idx = renewals.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: "Renewal not found" });
  const months = parseInt(req.body.extend_months ?? "3", 10);
  if (isNaN(months) || months <= 0) return res.status(422).json({ detail: { extend_months: "Must be a positive number" } });
  const newExpiry = addMonths(renewals[idx].expiry, months);
  renewals[idx] = {
    ...renewals[idx],
    expiry: newExpiry,
    daysLeft: renewals[idx].daysLeft + months * 30,
    status: "Extended",
    extendedTo: newExpiry,
    notes: req.body.notes || renewals[idx].notes,
    updatedAt: new Date().toISOString(),
  };
  res.json({ message: `Extended by ${months} months`, renewal: renewals[idx] });
});

// POST /api/v1/renewals/:id/terminate — terminate action
app.post("/api/v1/renewals/:id/terminate", (req, res) => {
  const idx = renewals.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: "Renewal not found" });
  if (!req.body.reason?.trim()) return res.status(422).json({ detail: { reason: "Termination reason is required" } });
  const today = new Date().toISOString().slice(0, 10);
  renewals[idx] = {
    ...renewals[idx],
    status: "Terminated",
    terminatedOn: today,
    notes: req.body.reason,
    updatedAt: new Date().toISOString(),
  };
  res.json({ message: "Contract terminated", renewal: renewals[idx] });
});

// DELETE /api/v1/renewals/:id
app.delete("/api/v1/renewals/:id", (req, res) => {
  const idx = renewals.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: "Renewal not found" });
  const deleted = renewals.splice(idx, 1)[0];
  res.json({ message: `Renewal "${deleted.name}" deleted`, id: deleted.id });
});

// ─── Stats endpoint ───────────────────────────────────────────────────────────
app.get("/api/v1/stats", (_req, res) => {
  res.json({
    contracts: {
      total:    contracts.length,
      active:   contracts.filter(c => c.status === "Active").length,
      expiring: contracts.filter(c => c.status === "Expiring").length,
      pending:  contracts.filter(c => c.status === "Pending").length,
      archived: contracts.filter(c => c.status === "Archived").length,
    },
    renewals: {
      total:     renewals.length,
      critical:  renewals.filter(r => r.daysLeft < 30 && r.status !== "Terminated").length,
      upcoming:  renewals.filter(r => r.daysLeft >= 30 && r.daysLeft <= 90 && r.status !== "Terminated").length,
      scheduled: renewals.filter(r => r.daysLeft > 90 && r.status !== "Terminated").length,
    },
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ detail: "Endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`\n  ContractIQ API running on http://localhost:${PORT}`);
  console.log(`  Docs: http://localhost:${PORT}/api/v1/openapi\n`);
});
