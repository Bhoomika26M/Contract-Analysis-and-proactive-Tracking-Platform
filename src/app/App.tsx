import { useState, useEffect, useRef, useCallback } from "react";
import { contractsApi, renewalsApi, notificationsApi, auditLogsApi } from "../api/client";
import type { Contract as ApiContract, Renewal as ApiRenewal } from "../api/client";
import { toast, Toaster } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LayoutDashboard, FileText, FolderOpen, CheckSquare, RefreshCw, ShieldCheck,
  BarChart2, Bell, BookOpen, Users, Settings, User, ChevronLeft, ChevronRight,
  Search, MessageSquare, LogOut, Plus, Download, Archive, Edit2, Eye,
  AlertTriangle, CheckCircle, Clock, XCircle, Filter, Upload,
  Calendar, Activity, ArrowUpRight, Printer, FileSpreadsheet,
  Mail, Phone, Lock, Globe, Zap, Target, AlertCircle, Info, X,
  Building2, Briefcase, Shield, RotateCcw, Send, ThumbsUp,
  UserPlus, Database, Cpu, Award, UserCheck, GitMerge,
  ChevronDown, Key, Palette, BellRing, ClipboardList, Hash, Monitor,
  Smartphone, BadgeCheck, MapPin, UserCog, Sun, Moon
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type UserRole = "administrator" | "legal" | "compliance" | "contract-manager" | "department-head" | "employee";
type Page =
  | "login" | "register" | "dashboard"
  | "contracts" | "contract-repository" | "contract-detail"
  | "contract-create" | "contract-approval"
  | "obligations" | "renewals" | "compliance"
  | "notifications" | "reports" | "audit-logs"
  | "users" | "profile" | "settings";

// ─── Color palette (exact reference values) ────────────────────────────────────
const C = {
  purple: "#A05AFF", violet: "#9E58FF", teal: "#1BCFB4",
  sky:    "#4BCBEB", coral:  "#FE9496",
  bg: "#F8F9FC", border: "#E8EAF0",
};

// ─── Gradient helpers ──────────────────────────────────────────────────────────
const G = {
  primary:   `linear-gradient(135deg, #A05AFF, #9E58FF)`,
  secondary: `linear-gradient(135deg, #1BCFB4, #0fb89f)`,
  sky:       `linear-gradient(135deg, #4BCBEB, #1fa8d4)`,
  coral:     `linear-gradient(135deg, #FE9496, #fc6572)`,
  violet:    `linear-gradient(135deg, #9E58FF, #A05AFF)`,
};

// ─── Per-color card gradients (soft pastel, matches reference dashboard) ───────
const CARD_GRAD: Record<string, string> = {
  "#A05AFF": `linear-gradient(135deg, #A05AFF 0%, #c084fc 100%)`,
  "#9E58FF": `linear-gradient(135deg, #9E58FF 0%, #A05AFF 100%)`,
  "#1BCFB4": `linear-gradient(135deg, #1BCFB4 0%, #0fb89f 100%)`,
  "#4BCBEB": `linear-gradient(135deg, #4BCBEB 0%, #1fa8d4 100%)`,
  "#FE9496": `linear-gradient(135deg, #FE9496 0%, #fc6572 100%)`,
};

// ─── Role metadata ─────────────────────────────────────────────────────────────
const roleUsers: Record<UserRole, { name: string; initials: string; title: string }> = {
  administrator:      { name: "Tom Reeves",   initials: "TR", title: "Administrator"     },
  legal:              { name: "Sarah Chen",   initials: "SC", title: "Legal Manager"     },
  compliance:         { name: "Priya Nair",   initials: "PN", title: "Compliance Officer"},
  "contract-manager": { name: "James Miller", initials: "JM", title: "Contract Manager"  },
  "department-head":  { name: "Daniel Park",  initials: "DP", title: "Department Head"   },
  employee:           { name: "Alex Turner",  initials: "AT", title: "Employee"           },
};

// ─── Role-based navigation ─────────────────────────────────────────────────────
type NavItem = { icon: any; label: string; page: Page };
const navByRole: Record<UserRole, NavItem[]> = {
  // Administrator — all management tabs
  administrator: [
    { icon: LayoutDashboard, label: "Dashboard",           page: "dashboard"           },
    { icon: Users,           label: "User Management",     page: "users"               },
    { icon: FileText,        label: "Contracts",           page: "contracts"           },
    { icon: FolderOpen,      label: "Contract Repository", page: "contract-repository" },
    { icon: ThumbsUp,        label: "Contract Approval",   page: "contract-approval"   },
    { icon: CheckSquare,     label: "Obligations",         page: "obligations"         },
    { icon: RefreshCw,       label: "Renewals",            page: "renewals"            },
    { icon: ShieldCheck,     label: "Compliance",          page: "compliance"          },
    { icon: BarChart2,       label: "Reports",             page: "reports"             },
    { icon: Bell,            label: "Notifications",       page: "notifications"       },
    { icon: BookOpen,        label: "Audit Logs",          page: "audit-logs"          },
    { icon: Settings,        label: "Settings",            page: "settings"            },
  ],
  // Legal Manager — legal / contract review tabs
  legal: [
    { icon: LayoutDashboard, label: "Dashboard",           page: "dashboard"           },
    { icon: FileText,        label: "Contracts",           page: "contracts"           },
    { icon: FolderOpen,      label: "Contract Repository", page: "contract-repository" },
    { icon: ThumbsUp,        label: "Contract Approval",   page: "contract-approval"   },
    { icon: CheckSquare,     label: "Obligations",         page: "obligations"         },
    { icon: RefreshCw,       label: "Renewals",            page: "renewals"            },
    { icon: BarChart2,       label: "Reports",             page: "reports"             },
    { icon: Bell,            label: "Notifications",       page: "notifications"       },
    { icon: Settings,        label: "Settings",            page: "settings"            },
  ],
  // Compliance Officer — Compliance, Obligations, Reports, Audit Logs
  compliance: [
    { icon: LayoutDashboard, label: "Dashboard",   page: "dashboard"  },
    { icon: ShieldCheck,     label: "Compliance",  page: "compliance" },
    { icon: CheckSquare,     label: "Obligations", page: "obligations"},
    { icon: BarChart2,       label: "Reports",     page: "reports"    },
    { icon: BookOpen,        label: "Audit Logs",  page: "audit-logs" },
  ],
  // Contract Manager — Contracts, Repository, Approvals, Obligations, Renewals
  "contract-manager": [
    { icon: LayoutDashboard, label: "Dashboard",           page: "dashboard"           },
    { icon: FileText,        label: "Contracts",           page: "contracts"           },
    { icon: FolderOpen,      label: "Contract Repository", page: "contract-repository" },
    { icon: ThumbsUp,        label: "Contract Approval",   page: "contract-approval"   },
    { icon: CheckSquare,     label: "Obligations",         page: "obligations"         },
    { icon: RefreshCw,       label: "Renewals",            page: "renewals"            },
  ],
  // Department Head — My Contracts, Obligations, Approvals, Reports
  "department-head": [
    { icon: LayoutDashboard, label: "Dashboard",     page: "dashboard"         },
    { icon: FileText,        label: "My Contracts",  page: "contracts"         },
    { icon: CheckSquare,     label: "Obligations",   page: "obligations"       },
    { icon: ThumbsUp,        label: "Approvals",     page: "contract-approval" },
    { icon: BarChart2,       label: "Reports",       page: "reports"           },
  ],
  // Employee — My Contracts, My Tasks, Notifications only
  employee: [
    { icon: LayoutDashboard, label: "Dashboard",     page: "dashboard"     },
    { icon: FileText,        label: "My Contracts",  page: "contracts"     },
    { icon: CheckSquare,     label: "My Tasks",      page: "obligations"   },
    { icon: Bell,            label: "Notifications", page: "notifications" },
  ],
};

// ─── Mock data ─────────────────────────────────────────────────────────────────
const contractsData = [
  { id: "CTR-2401", name: "Microsoft Azure SLA",        category: "Technology",  owner: "Sarah Chen",   start: "2024-01-15", expiry: "2025-01-14", status: "Active",   risk: "Low"    },
  { id: "CTR-2402", name: "Global Logistics Agreement", category: "Procurement", owner: "James Miller", start: "2023-06-01", expiry: "2024-07-31", status: "Expiring", risk: "High"   },
  { id: "CTR-2403", name: "Employment Contract – Legal",category: "HR",          owner: "Priya Nair",   start: "2024-03-01", expiry: "2026-02-28", status: "Active",   risk: "Low"    },
  { id: "CTR-2404", name: "Oracle ERP License",         category: "Technology",  owner: "Daniel Park",  start: "2022-11-01", expiry: "2024-10-31", status: "Active",   risk: "Medium" },
  { id: "CTR-2405", name: "Marketing Agency Retainer",  category: "Marketing",   owner: "Emma Walsh",   start: "2024-02-01", expiry: "2024-12-31", status: "Active",   risk: "Low"    },
  { id: "CTR-2406", name: "Office Lease – HQ",          category: "Facilities",  owner: "Tom Reeves",   start: "2021-01-01", expiry: "2024-12-31", status: "Expiring", risk: "High"   },
  { id: "CTR-2407", name: "Vendor NDA – FinTech Corp",  category: "Legal",       owner: "Sarah Chen",   start: "2024-04-01", expiry: "2027-03-31", status: "Active",   risk: "Low"    },
  { id: "CTR-2408", name: "Insurance Policy – D&O",     category: "Finance",     owner: "James Miller", start: "2024-01-01", expiry: "2024-12-31", status: "Pending",  risk: "Medium" },
];

const obligationsData = [
  { id: 1, name: "Quarterly Compliance Report",       person: "Priya Nair",   due: "2024-07-31", progress: 75,  status: "In Progress" },
  { id: 2, name: "Annual Vendor Audit",               person: "Daniel Park",  due: "2024-08-15", progress: 30,  status: "Pending"     },
  { id: 3, name: "GDPR Data Review",                  person: "Emma Walsh",   due: "2024-07-20", progress: 100, status: "Completed"   },
  { id: 4, name: "ISO 27001 Renewal",                 person: "Tom Reeves",   due: "2024-07-10", progress: 10,  status: "Overdue"     },
  { id: 5, name: "Software License Audit",            person: "Sarah Chen",   due: "2024-08-30", progress: 55,  status: "In Progress" },
  { id: 6, name: "Employment Law Update",             person: "James Miller", due: "2024-07-25", progress: 0,   status: "Pending"     },
  { id: 7, name: "Supplier Code of Conduct Sign-off", person: "Priya Nair",   due: "2024-07-05", progress: 15,  status: "Delayed"     },
];

const renewalData = [
  { id: 1, name: "Office Lease – HQ",          owner: "Tom Reeves",   expiry: "2024-12-31", value: "$240,000", daysLeft: 184, status: "Action Required" },
  { id: 2, name: "Global Logistics Agreement", owner: "James Miller", expiry: "2024-07-31", value: "$85,000",  daysLeft: 31,  status: "Critical"        },
  { id: 3, name: "Oracle ERP License",         owner: "Daniel Park",  expiry: "2024-10-31", value: "$120,000", daysLeft: 123, status: "Upcoming"        },
  { id: 4, name: "Insurance Policy – D&O",     owner: "James Miller", expiry: "2024-12-31", value: "$45,000",  daysLeft: 184, status: "Upcoming"        },
  { id: 5, name: "Marketing Agency Retainer",  owner: "Emma Walsh",   expiry: "2024-12-31", value: "$72,000",  daysLeft: 184, status: "Upcoming"        },
];

// ── File download helpers ─────────────────────────────────────────────────────
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function dlCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  triggerDownload(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }), filename);
}
function dlExcel(filename: string, rows: (string | number)[][]) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, filename);
}
function dlPDF(filename: string, title: string, rows: (string | number)[][]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`ContractIQ  ·  Generated ${new Date().toLocaleDateString()}`, 14, 25);
  autoTable(doc, {
    head: [rows[0].map(String)],
    body: rows.slice(1).map(r => r.map(String)),
    startY: 30,
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [160, 90, 255], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 249, 252] },
  });
  doc.save(filename);
}
function dlFile(format: "PDF" | "Excel" | "CSV", baseName: string, title: string, rows: (string | number)[][]) {
  if (format === "CSV")   dlCSV(`${baseName}.csv`,   rows);
  if (format === "Excel") dlExcel(`${baseName}.xlsx`, rows);
  if (format === "PDF")   dlPDF(`${baseName}.pdf`,    title, rows);
}

const auditLogs = [
  { user: "Sarah Chen",   action: "Contract Approved",    date: "2024-07-01 09:14", ip: "192.168.1.45", module: "Contracts",   status: "Success" },
  { user: "James Miller", action: "Document Uploaded",    date: "2024-07-01 10:32", ip: "10.0.0.12",    module: "Repository",  status: "Success" },
  { user: "Priya Nair",   action: "Login Attempt",        date: "2024-07-01 11:00", ip: "172.16.0.8",   module: "Auth",        status: "Failed"  },
  { user: "Daniel Park",  action: "Obligation Updated",   date: "2024-07-01 13:45", ip: "192.168.1.50", module: "Obligations", status: "Success" },
  { user: "Emma Walsh",   action: "Report Exported",      date: "2024-07-01 14:22", ip: "10.0.0.15",    module: "Reports",     status: "Success" },
  { user: "Tom Reeves",   action: "User Deactivated",     date: "2024-07-01 15:10", ip: "192.168.1.60", module: "Users",       status: "Success" },
  { user: "Sarah Chen",   action: "Settings Changed",     date: "2024-07-01 16:05", ip: "192.168.1.45", module: "Settings",    status: "Success" },
  { user: "Admin",        action: "System Backup",        date: "2024-07-01 18:00", ip: "localhost",    module: "System",      status: "Success" },
];

const usersData = [
  { name: "Sarah Chen",   role: "Legal Manager",     dept: "Legal",       status: "Active",   email: "s.chen@contractiq.com",   avatar: "SC" },
  { name: "James Miller", role: "Contract Manager",  dept: "Procurement", status: "Active",   email: "j.miller@contractiq.com", avatar: "JM" },
  { name: "Priya Nair",   role: "Compliance Officer",dept: "Compliance",  status: "Active",   email: "p.nair@contractiq.com",   avatar: "PN" },
  { name: "Daniel Park",  role: "Department Head",   dept: "Technology",  status: "Active",   email: "d.park@contractiq.com",   avatar: "DP" },
  { name: "Emma Walsh",   role: "Employee",          dept: "Marketing",   status: "Inactive", email: "e.walsh@contractiq.com",  avatar: "EW" },
  { name: "Tom Reeves",   role: "Administrator",     dept: "Operations",  status: "Active",   email: "t.reeves@contractiq.com", avatar: "TR" },
];

const notifications = [
  { type: "renewal",    title: "Contract Renewal Due",        desc: "Global Logistics Agreement expires in 31 days.", time: "2 hours ago", read: false },
  { type: "compliance", title: "Compliance Alert",            desc: "ISO 27001 obligation is overdue by 3 days.",     time: "4 hours ago", read: false },
  { type: "approval",   title: "Approval Request",            desc: "Sarah Chen requested approval for CTR-2407.",    time: "Yesterday",   read: false },
  { type: "system",     title: "System Update",               desc: "ContractIQ v2.4 has been deployed successfully.",time: "2 days ago",  read: true  },
  { type: "renewal",    title: "Reminder: Oracle ERP",        desc: "Oracle ERP License expires in 123 days.",        time: "3 days ago",  read: true  },
  { type: "compliance", title: "GDPR Review Complete",        desc: "GDPR Data Review obligation marked completed.",  time: "4 days ago",  read: true  },
];

const recentActivity = [
  { action: "Contract CTR-2407 approved by Sarah Chen",    time: "09:14 AM", type: "success" },
  { action: "New obligation added: Employment Law Update", time: "10:32 AM", type: "info"    },
  { action: "ISO 27001 renewal obligation overdue",        time: "11:00 AM", type: "warning" },
  { action: "User Emma Walsh deactivated",                 time: "03:10 PM", type: "error"   },
  { action: "Q2 Compliance Report exported",               time: "04:22 PM", type: "success" },
];

// Charts data
const contractStatusDist = [
  { name: "Active",   value: 68, color: C.teal  },
  { name: "Expiring", value: 15, color: C.coral    },
  { name: "Pending",  value: 10, color: C.sky      },
  { name: "Archived", value: 7,  color: C.violet },
];

const monthlyGrowth = [
  { month: "Jan", contracts: 12, obligations: 34 },
  { month: "Feb", contracts: 19, obligations: 42 },
  { month: "Mar", contracts: 15, obligations: 38 },
  { month: "Apr", contracts: 23, obligations: 51 },
  { month: "May", contracts: 28, obligations: 60 },
  { month: "Jun", contracts: 22, obligations: 48 },
  { month: "Jul", contracts: 31, obligations: 67 },
];

const complianceTrend = [
  { month: "Jan", score: 82 }, { month: "Feb", score: 78 }, { month: "Mar", score: 85 },
  { month: "Apr", score: 88 }, { month: "May", score: 91 }, { month: "Jun", score: 87 },
  { month: "Jul", score: 93 },
];

const deptCompliance = [
  { dept: "Legal",   score: 96, fill: C.purple   },
  { dept: "Finance", score: 88, fill: C.teal  },
  { dept: "HR",      score: 79, fill: C.sky      },
  { dept: "Tech",    score: 92, fill: C.violet },
  { dept: "Ops",     score: 74, fill: C.coral    },
];

// New data for role dashboards
const userRoleDist = [
  { name: "Administrator", value: 3,  color: C.purple },
  { name: "Legal Manager", value: 8,  color: C.teal   },
  { name: "Contract Mgr",  value: 12, color: C.sky    },
  { name: "Compliance",    value: 5,  color: C.violet },
  { name: "Employee",      value: 28, color: C.coral  },
];

const deptStats = [
  { dept: "Legal",       contracts: 24, users: 8  },
  { dept: "Procurement", contracts: 38, users: 12 },
  { dept: "Finance",     contracts: 19, users: 6  },
  { dept: "Tech",        contracts: 31, users: 15 },
  { dept: "HR",          contracts: 14, users: 9  },
];

const monthlyActivity = [
  { month: "Jan", created: 8,  approved: 6,  expired: 2 },
  { month: "Feb", created: 12, approved: 10, expired: 3 },
  { month: "Mar", created: 9,  approved: 8,  expired: 1 },
  { month: "Apr", created: 15, approved: 13, expired: 4 },
  { month: "May", created: 11, approved: 9,  expired: 2 },
  { month: "Jun", created: 18, approved: 16, expired: 5 },
  { month: "Jul", created: 14, approved: 12, expired: 3 },
];

const approvalTimeline = [
  { month: "Jan", approved: 8,  rejected: 2, pending: 3 },
  { month: "Feb", approved: 12, rejected: 1, pending: 5 },
  { month: "Mar", approved: 10, rejected: 3, pending: 4 },
  { month: "Apr", approved: 15, rejected: 2, pending: 6 },
  { month: "May", approved: 11, rejected: 1, pending: 3 },
  { month: "Jun", approved: 18, rejected: 2, pending: 7 },
  { month: "Jul", approved: 14, rejected: 3, pending: 5 },
];

const contractCategories = [
  { name: "Technology",  value: 32, color: C.purple },
  { name: "Procurement", value: 28, color: C.teal   },
  { name: "Legal",       value: 14, color: C.sky    },
  { name: "HR",          value: 19, color: C.violet },
  { name: "Facilities",  value: 9,  color: C.coral  },
];

const riskDist = [
  { name: "High Risk",   value: 9,   color: C.coral   },
  { name: "Medium Risk", value: 23,  color: C.sky     },
  { name: "Low Risk",    value: 110, color: C.teal    },
];

const auditPerf = [
  { month: "Jan", passed: 18, failed: 2 }, { month: "Feb", passed: 22, failed: 3 },
  { month: "Mar", passed: 20, failed: 1 }, { month: "Apr", passed: 25, failed: 4 },
  { month: "May", passed: 23, failed: 2 }, { month: "Jun", passed: 28, failed: 3 },
  { month: "Jul", passed: 26, failed: 2 },
];

const pendingApprovalsList = [
  { id: "CTR-2409", name: "AWS Cloud Services Agreement", submitter: "Daniel Park", submitted: "2024-07-01", urgency: "High"   },
  { id: "CTR-2410", name: "External Counsel Retainer",    submitter: "Emma Walsh",  submitted: "2024-07-02", urgency: "Medium" },
  { id: "CTR-2411", name: "SaaS Platform License",        submitter: "Tom Reeves",  submitted: "2024-07-03", urgency: "Low"    },
  { id: "CTR-2412", name: "Vendor NDA – HealthTech Inc.", submitter: "James Miller",submitted: "2024-07-04", urgency: "High"   },
];

// ─── Utility components ────────────────────────────────────────────────────────
const badgeStyles: Record<string, { bg: string; text: string }> = {
  Active:           { bg: "#d1fae5", text: "#065f46" },
  Expiring:         { bg: "#fef3c7", text: "#92400e" },
  Pending:          { bg: "#dbeafe", text: "#1e40af" },
  Archived:         { bg: "#f3f4f6", text: "#374151" },
  Completed:        { bg: "#d1fae5", text: "#065f46" },
  "In Progress":    { bg: "#ede9fe", text: "#5b21b6" },
  Overdue:          { bg: "#fee2e2", text: "#991b1b" },
  Delayed:          { bg: "#fef3c7", text: "#92400e" },
  Critical:         { bg: "#fee2e2", text: "#991b1b" },
  Upcoming:         { bg: "#dbeafe", text: "#1e40af" },
  "Action Required":{ bg: "#fef3c7", text: "#92400e" },
  Success:          { bg: "#d1fae5", text: "#065f46" },
  Failed:           { bg: "#fee2e2", text: "#991b1b" },
  Low:              { bg: "#d1fae5", text: "#065f46" },
  Medium:           { bg: "#fef3c7", text: "#92400e" },
  High:             { bg: "#fee2e2", text: "#991b1b" },
  Inactive:         { bg: "#f3f4f6", text: "#374151" },
  Draft:            { bg: "#f3f4f6", text: "#374151" },
  "Under Review":   { bg: "#ede9fe", text: "#5b21b6" },
  Approved:         { bg: "#d1fae5", text: "#065f46" },
  Rejected:         { bg: "#fee2e2", text: "#991b1b" },
};

const Badge = ({ label }: { label: string }) => {
  const s = badgeStyles[label] || { bg: "#f3f4f6", text: "#374151" };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.text }}>
      {label}
    </span>
  );
};

const ProgressBar = ({ value, color = C.purple }: { value: number; color?: string }) => {
  const fill = CARD_GRAD[color] != null
    ? CARD_GRAD[color].replace("135deg", "90deg")
    : `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`;
  return (
    <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
      <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${value}%`, background: fill }} />
    </div>
  );
};

const Avatar = ({ initials, size = "sm", color = C.purple }: { initials: string; size?: "sm" | "md" | "lg"; color?: string }) => {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl" };
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`} style={{ background: `linear-gradient(135deg, ${color}, ${C.violet})` }}>
      {initials}
    </div>
  );
};

const StatCard = ({ label, value, sub, icon: Icon, color, trend }: any) => {
  const gradient = CARD_GRAD[color] ?? `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`;
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden cursor-default transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      style={{ background: gradient }}
    >
      {/* decorative circles — identical to reference */}
      <div className="absolute -top-5 -right-5 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-7 right-3 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-white/80 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white leading-none">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 flex-shrink-0">
          <Icon size={22} className="text-white" />
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-1 text-xs">
        <ArrowUpRight size={13} className="text-white/90" />
        <span className="text-white/90 font-semibold">{trend}</span>
        <span className="text-white/70">{sub}</span>
      </div>
    </div>
  );
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-[#E8EAF0] dark:border-gray-700/50 ${className}`}>{children}</div>
);

const Spinner = () => (
  <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin flex-shrink-0" />
);

const PrimaryBtn = ({ children, onClick, className = "", icon: Icon, loading = false }: any) => (
  <button
    onClick={loading ? undefined : onClick}
    disabled={loading}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
    style={{ background: G.primary }}
  >
    {loading ? <Spinner /> : Icon && <Icon size={15} />}{children}
  </button>
);

const SecondaryBtn = ({ children, onClick, className = "", icon: Icon, loading = false }: any) => (
  <button
    onClick={loading ? undefined : onClick}
    disabled={loading}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 text-sm font-semibold border transition-all hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
    style={{ borderColor: C.purple, color: C.purple }}
  >
    {loading ? <Spinner /> : Icon && <Icon size={15} />}{children}
  </button>
);

// hook: simulates async processing with a loading state + success toast
function useLoadingBtn(delayMs = 1400) {
  const [busy, setBusy] = useState(false);
  const fire = (action: () => void, successMsg: string) => {
    if (busy) return;
    setBusy(true);
    action();
    setTimeout(() => { setBusy(false); toast.success(successMsg); }, delayMs);
  };
  return { busy, fire };
}

const Req = () => <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>;

const Input = ({ label, type = "text", placeholder, value, onChange, icon: Icon, required }: any) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {label}{required && <Req />}
      </label>
    )}
    <div className="relative">
      {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        className={`w-full border border-[#E8EAF0] dark:border-gray-700 rounded-xl py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 transition-all ${Icon ? "pl-9 pr-4" : "px-4"}`}
        style={{ "--tw-ring-color": C.purple } as any} />
    </div>
  </div>
);

const Select = ({ label, options, value, onChange, required }: any) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {label}{required && <Req />}
      </label>
    )}
    <select value={value} onChange={onChange} className="w-full border border-[#E8EAF0] dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none appearance-none">
      {options.map((o: string) => <option key={o}>{o}</option>)}
    </select>
  </div>
);

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({
  page, setPage, role, collapsed, setCollapsed, displayUser,
}: {
  page: Page; setPage: (p: Page) => void;
  role: UserRole; collapsed: boolean; setCollapsed: (v: boolean) => void;
  displayUser: { name: string; initials: string; title: string };
}) {
  const navItems = navByRole[role];
  const user = displayUser;

  return (
    <aside
      className="flex flex-col h-full border-r border-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
      style={{ width: collapsed ? 64 : 224, background: "linear-gradient(180deg, #1a0533 0%, #230b45 40%, #0d2b26 100%)" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 min-h-[64px]">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: G.primary }}>
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm whitespace-nowrap">
              Contract<span style={{ color: C.teal }}>IQ</span>
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ background: G.primary }}>
            <Shield size={16} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="text-white/40 hover:text-white/90 transition-colors p-1 rounded-lg hover:bg-white/10">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button onClick={() => setCollapsed(false)} className="flex justify-center py-2.5 text-white/40 hover:text-white/90 border-b border-white/10 hover:bg-white/10 transition-all">
          <ChevronRight size={16} />
        </button>
      )}

      {/* Nav items */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ icon: Icon, label, page: itemPage }) => {
          const active = page === itemPage;
          return (
            <button
              key={`${role}-${itemPage}`}
              onClick={() => setPage(itemPage)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150 relative group
                ${active ? "bg-white/15" : "hover:bg-white/8"}`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full" style={{ background: G.secondary }} />
              )}
              <Icon
                size={18}
                className="flex-shrink-0 transition-colors duration-150"
                style={{ color: active ? C.teal : "rgba(255,255,255,0.45)" }}
              />
              {!collapsed && (
                <span
                  className="transition-colors duration-150 whitespace-nowrap text-sm"
                  style={{ color: active ? "#ffffff" : "rgba(255,255,255,0.6)" }}
                >
                  {label}
                </span>
              )}
              {!collapsed && active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: C.teal }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User card at bottom */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => setPage("profile")}
          className={`flex items-center gap-3 p-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors w-full ${collapsed ? "justify-center" : ""}`}
        >
          <Avatar initials={user.initials} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-white/50 truncate">{user.title}</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

// ─── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({
  setPage, role, dark, setDark, displayUser, hasUnread,
}: {
  page: Page; setPage: (p: Page) => void; role: UserRole;
  dark: boolean; setDark: (v: boolean) => void;
  displayUser: { name: string; initials: string; title: string };
  hasUnread: boolean;
}) {
  const user = displayUser;
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Change Password modal
  const [cpOpen,    setCpOpen]    = useState(false);
  const [cpCurrent, setCpCurrent] = useState("");
  const [cpNew,     setCpNew]     = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpErrors,  setCpErrors]  = useState<{ current?: string; newPw?: string; confirm?: string }>({});
  const [cpBusy,    setCpBusy]    = useState(false);
  const [cpDone,    setCpDone]    = useState(false);

  const openCp = () => { setCpOpen(true); setShowDropdown(false); setCpCurrent(""); setCpNew(""); setCpConfirm(""); setCpErrors({}); setCpDone(false); };
  const closeCp = () => { if (cpBusy) return; setCpOpen(false); };
  const handleCpSave = () => {
    const errs: typeof cpErrors = {};
    if (!cpCurrent.trim())            errs.current = "Current password is required.";
    if (cpNew.length < 8)             errs.newPw   = "New password must be at least 8 characters.";
    if (cpNew !== cpConfirm)          errs.confirm  = "Passwords do not match.";
    if (Object.keys(errs).length) { setCpErrors(errs); return; }
    setCpBusy(true);
    setTimeout(() => {
      setCpBusy(false);
      setCpDone(true);
      toast.success("Password updated successfully.");
      setTimeout(() => setCpOpen(false), 1200);
    }, 1000);
  };

  const menuItems = [
    { icon: User,     label: "My Profile",      action: () => { setPage("profile");  setShowDropdown(false); } },
    { icon: UserCog,  label: "Account Settings", action: () => { setPage("settings"); setShowDropdown(false); } },
    { icon: Key,      label: "Change Password",  action: openCp },
  ];

  const iconBtn = "w-9 h-9 rounded-xl bg-[#F8F9FC] dark:bg-gray-800 border border-[#E8EAF0] dark:border-gray-700/50 flex items-center justify-center transition-all hover:border-purple-300 dark:hover:border-purple-600";

  return (
    <>
    <header className="h-16 bg-white dark:bg-[#111827] border-b border-[#E8EAF0] dark:border-gray-700/50 flex items-center px-4 sm:px-6 gap-3 flex-shrink-0 relative z-30 transition-colors duration-200">

      {/* Desktop search — hidden on mobile */}
      <div className="hidden sm:flex flex-1 relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          className="w-full pl-9 pr-4 py-2 bg-[#F8F9FC] dark:bg-gray-800 border border-[#E8EAF0] dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none transition-colors"
          placeholder="Search contracts, obligations…"
        />
      </div>

      {/* Mobile expanded search — full-width overlay row */}
      {searchOpen && (
        <div className="flex sm:hidden absolute inset-x-0 top-0 h-16 bg-white dark:bg-[#111827] px-4 items-center gap-2 z-40">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              autoFocus
              className="w-full pl-9 pr-4 py-2 bg-[#F8F9FC] dark:bg-gray-800 border border-[#E8EAF0] dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none transition-colors"
              placeholder="Search contracts, obligations…"
            />
          </div>
          <button
            onClick={() => setSearchOpen(false)}
            className="w-9 h-9 rounded-xl bg-[#F8F9FC] dark:bg-gray-800 border border-[#E8EAF0] dark:border-gray-700 flex items-center justify-center flex-shrink-0"
          >
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Mobile search toggle */}
        <button
          className={`sm:hidden ${iconBtn}`}
          onClick={() => setSearchOpen(true)}
        >
          <Search size={17} className="text-gray-500 dark:text-gray-400" />
        </button>
        {/* Notifications */}
        <button className={`${iconBtn} relative`} onClick={() => setPage("notifications")}>
          <Bell size={17} className="text-gray-500 dark:text-gray-500" />
          {hasUnread && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: C.coral }} />}
        </button>

        {/* Settings */}
        <button className={iconBtn} onClick={() => setPage("settings")}>
          <Settings size={17} className="text-gray-500 dark:text-gray-500" />
        </button>

        {/* ── Dark / Light toggle ── */}
        <button
          onClick={() => setDark(!dark)}
          className={`${iconBtn} group`}
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {dark
            ? <Sun size={17} className="text-amber-400 group-hover:text-amber-500 transition-colors" />
            : <Moon size={17} className="text-gray-500 dark:text-gray-500 group-hover:text-purple-500 transition-colors" />
          }
        </button>

        {/* ── Profile avatar + dropdown ── */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowDropdown(v => !v)}
            className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl border border-[#E8EAF0] dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-[#A05AFF]/8 dark:hover:bg-purple-900/20 hover:border-[#A05AFF]/40 dark:hover:border-purple-600 transition-all"
          >
            <Avatar initials={user.initials} size="sm" />
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-tight">{user.name}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{user.title}</p>
            </div>
            <ChevronDown
              size={13}
              className="text-gray-400 dark:text-gray-500 transition-transform duration-200 flex-shrink-0"
              style={{ transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />

              <div
                className="absolute right-0 top-[calc(100%+8px)] w-60 bg-white dark:bg-[#1F2937] rounded-2xl border border-[#E8EAF0] dark:border-gray-700/50 z-50 overflow-hidden"
                style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.1)" }}
              >
                {/* dropdown header */}
                <div className="px-4 py-3.5 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${C.purple}18, ${C.violet}10)` }}>
                  <Avatar initials={user.initials} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{user.title}</p>
                  </div>
                </div>

                <div className="border-t border-[#E8EAF0] dark:border-gray-700/50" />

                <div className="py-1">
                  {menuItems.map(({ icon: Icon, label, action }) => (
                    <button key={label} onClick={action}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-[#A05AFF]/8 dark:hover:bg-purple-900/20 hover:text-[#A05AFF] dark:hover:text-[#c084fc] transition-colors group">
                      <Icon size={15} className="text-gray-400 dark:text-gray-500 group-hover:text-purple-500 flex-shrink-0" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-[#E8EAF0] dark:border-gray-700/50 py-1">
                  <button
                    onClick={() => { setPage("login"); setShowDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={15} className="flex-shrink-0" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>

    {/* ── Change Password Modal ── */}
    {cpOpen && (
      <>
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={closeCp} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${C.purple}18` }}>
                  <Key size={16} style={{ color: C.purple }} />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Change Password</h3>
              </div>
              <button onClick={closeCp} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={18} /></button>
            </div>

            {cpDone ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${C.teal}18` }}>
                  <Check size={22} style={{ color: C.teal }} />
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Password updated!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Current Password <span className="text-red-400">*</span></label>
                  <input
                    type="password"
                    value={cpCurrent}
                    onChange={e => { setCpCurrent(e.target.value); setCpErrors(p => ({ ...p, current: undefined })); }}
                    placeholder="Enter current password"
                    className={`w-full border rounded-xl px-3 py-2 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none transition-colors ${cpErrors.current ? "border-red-400" : "border-[#E8EAF0] dark:border-gray-700/50"}`}
                  />
                  {cpErrors.current && <p className="text-xs text-red-500 mt-1">{cpErrors.current}</p>}
                </div>

                {/* New password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">New Password <span className="text-red-400">*</span></label>
                  <input
                    type="password"
                    value={cpNew}
                    onChange={e => { setCpNew(e.target.value); setCpErrors(p => ({ ...p, newPw: undefined })); }}
                    placeholder="Min. 8 characters"
                    className={`w-full border rounded-xl px-3 py-2 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none transition-colors ${cpErrors.newPw ? "border-red-400" : "border-[#E8EAF0] dark:border-gray-700/50"}`}
                  />
                  {cpErrors.newPw && <p className="text-xs text-red-500 mt-1">{cpErrors.newPw}</p>}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Confirm New Password <span className="text-red-400">*</span></label>
                  <input
                    type="password"
                    value={cpConfirm}
                    onChange={e => { setCpConfirm(e.target.value); setCpErrors(p => ({ ...p, confirm: undefined })); }}
                    placeholder="Re-enter new password"
                    className={`w-full border rounded-xl px-3 py-2 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none transition-colors ${cpErrors.confirm ? "border-red-400" : "border-[#E8EAF0] dark:border-gray-700/50"}`}
                  />
                  {cpErrors.confirm && <p className="text-xs text-red-500 mt-1">{cpErrors.confirm}</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-1">
                  <button onClick={closeCp} disabled={cpBusy} className="px-4 py-2 rounded-xl text-sm border border-[#E8EAF0] dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50">Cancel</button>
                  <button onClick={handleCpSave} disabled={cpBusy} className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-60" style={{ background: G.primary }}>
                    {cpBusy && <Spinner size={13} />}
                    Save Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    )}
    </>
  );
}

// ─── LOGIN PAGE ────────────────────────────────────────────────────────────────
function LoginPage({ setPage, setRole }: { setPage: (p: Page) => void; setRole: (r: UserRole) => void }) {
  const [email, setEmail] = useState("admin@contractiq.com");
  const [pw, setPw] = useState("••••••••");
  const [selectedRole, setSelectedRole] = useState<UserRole>("administrator");

  // Forgot Password modal state
  const [fpOpen, setFpOpen]   = useState(false);
  const [fpVisible, setFpVisible] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [fpError, setFpError] = useState("");
  const [fpSending, setFpSending] = useState(false);
  const [fpSent, setFpSent]   = useState(false);

  const openFp = () => { setFpOpen(true); requestAnimationFrame(() => setFpVisible(true)); };
  const closeFp = () => {
    setFpVisible(false);
    setTimeout(() => { setFpOpen(false); setFpEmail(""); setFpError(""); setFpSending(false); setFpSent(false); }, 260);
  };

  const handleFpSubmit = () => {
    if (!fpEmail.trim()) { setFpError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fpEmail)) { setFpError("Please enter a valid email address."); return; }
    setFpError("");
    setFpSending(true);
    setTimeout(() => { setFpSending(false); setFpSent(true); }, 1600);
  };

  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  const roleOptions: { value: UserRole; label: string; color: string }[] = [
    { value: "administrator",    label: "Administrator",     color: C.purple },
    { value: "legal",            label: "Legal Manager",     color: C.teal   },
    { value: "compliance",       label: "Compliance Officer",color: C.violet },
    { value: "contract-manager", label: "Contract Manager",  color: C.sky    },
    { value: "department-head",  label: "Department Head",   color: C.coral  },
    { value: "employee",         label: "Employee",          color: "#6B7280" },
  ];

  const handleLogin = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address.";
    if (!pw.trim()) errs.pw = "Password is required.";
    setLoginErrors(errs);
    if (Object.keys(errs).length) return;
    setRole(selectedRole);
    setPage("dashboard");
  };

  return (
    <>
    <div className="min-h-screen flex" style={{ background: `linear-gradient(135deg, #1a0533 0%, #2d0f5e 25%, #A05AFF 55%, #1BCFB4 100%)` }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center text-white p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold">ContractIQ</h1>
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">Manage Contracts.<br />Stay Compliant.<br />Never Miss a Deadline.</h2>
          <p className="text-white/70 text-lg mb-8">Enterprise contract lifecycle management trusted by 500+ legal teams worldwide.</p>
          <div className="grid grid-cols-3 gap-4">
            {[["12K+", "Contracts Managed"], ["98%", "Compliance Rate"], ["500+", "Enterprise Clients"]].map(([v, l]) => (
              <div key={l} className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold">{v}</div>
                <div className="text-white/70 text-xs mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#1F2937] rounded-3xl shadow-2xl p-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <Shield size={22} style={{ color: C.purple }} />
              <span className="font-bold text-gray-800 dark:text-gray-100">ContractIQ</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Sign in to your account to continue</p>

            <div className="space-y-4">
              <div>
                <Input label="Email address" type="email" placeholder="you@company.com" value={email} onChange={(e: any) => { setEmail(e.target.value); setLoginErrors(p => ({ ...p, email: "" })); }} icon={Mail} required />
                {loginErrors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{loginErrors.email}</p>}
              </div>
              <div>
                <Input label="Password" type="password" placeholder="••••••••" value={pw} onChange={(e: any) => { setPw(e.target.value); setLoginErrors(p => ({ ...p, pw: "" })); }} icon={Lock} required />
                {loginErrors.pw && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{loginErrors.pw}</p>}
              </div>

              {/* Role Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Sign in as</label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map(({ value, label, color }) => {
                    const active = selectedRole === value;
                    return (
                      <button key={value} onClick={() => setSelectedRole(value)}
                        className="relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200 focus:outline-none"
                        style={active ? { borderColor: color, background: `${color}14`, boxShadow: `0 0 0 3px ${color}22` } : { borderColor: C.border, background: "transparent" }}>
                        {active && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: color }}>
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        )}
                        <div className="w-6 h-0.5 rounded-full" style={{ background: active ? color : C.border }} />
                        <span className="text-xs font-bold leading-tight text-center" style={{ color: active ? color : "#6b7280" }}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" className="rounded" /> Remember me
                </label>
                <button onClick={openFp} className="font-semibold transition-opacity hover:opacity-70" style={{ color: C.purple }}>Forgot password?</button>
              </div>

              <button onClick={handleLogin} className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95" style={{ background: G.primary }}>
                Sign In
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <button onClick={() => setPage("register")} className="font-semibold transition-opacity hover:opacity-70" style={{ color: C.purple }}>Create account</button>
            </div>
            <div className="mt-5 pt-5 border-t border-[#E8EAF0] dark:border-gray-700/50 flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-[#F8F9FC] dark:bg-gray-800/70 border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl p-3 text-xs text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-[#A05AFF]/8 transition-colors">
                <Globe size={14} style={{ color: C.sky }} /><span>SSO Login</span>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-[#F8F9FC] dark:bg-gray-800/70 border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl p-3 text-xs text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-[#A05AFF]/8 transition-colors">
                <Building2 size={14} style={{ color: C.teal }} /><span>Azure AD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ── Forgot Password Modal ── */}
    {fpOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-250"
        style={{ backgroundColor: fpVisible ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)", backdropFilter: "blur(4px)" }}
        onClick={e => { if (e.target === e.currentTarget) closeFp(); }}
      >
        <div
          className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-sm p-7 transition-all duration-260"
          style={{ opacity: fpVisible ? 1 : 0, transform: fpVisible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)" }}
        >
          {!fpSent ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${C.purple}14` }}>
                    <Lock size={17} style={{ color: C.purple }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">Reset Password</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">We&apos;ll email you a reset link</p>
                  </div>
                </div>
                <button onClick={closeFp} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <X size={15} className="text-gray-500" />
                </button>
              </div>

              {/* Email field */}
              <div className="mb-1">
                <Input label="Registered email address" type="email" placeholder="you@company.com" icon={Mail} required
                  value={fpEmail}
                  onChange={(e: any) => { setFpEmail(e.target.value); setFpError(""); }}
                />
                {fpError && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-500">{fpError}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-5">
                <SecondaryBtn className="flex-1 justify-center" onClick={closeFp}>Cancel</SecondaryBtn>
                <button
                  onClick={handleFpSubmit}
                  disabled={fpSending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: G.primary }}
                >
                  {fpSending ? <><Spinner /> Sending…</> : <><Send size={14} /> Send Reset Link</>}
                </button>
              </div>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${C.teal}18` }}>
                <Mail size={26} style={{ color: C.teal }} />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-2">Check your inbox</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Password reset link sent to
              </p>
              <p className="text-sm font-semibold mb-5" style={{ color: C.teal }}>{fpEmail}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button onClick={() => { setFpSent(false); setFpEmail(""); }} className="font-semibold underline underline-offset-2" style={{ color: C.purple }}>try again</button>.
              </p>
              <button
                onClick={closeFp}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: G.primary }}
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}

const RegField = ({ err, children }: { label?: string; err?: string; children: React.ReactNode }) => (
  <div>
    {children}
    {err && (
      <div className="flex items-center gap-1.5 mt-1.5">
        <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
        <p className="text-xs text-red-500">{err}</p>
      </div>
    )}
  </div>
);

// ─── REGISTER PAGE ─────────────────────────────────────────────────────────────
function RegisterPage({ setPage }: { setPage: (p: Page) => void }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", employeeId: "",
    department: "Legal", role: "Employee",
    password: "", confirmPassword: "",
  });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const f = (k: string) => (e: any) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrors(p => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim())  e.firstName  = "First name is required";
    if (!form.lastName.trim())   e.lastName   = "Last name is required";
    if (!form.email.trim())      e.email      = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.employeeId.trim()) e.employeeId = "Employee ID is required";
    if (form.role === "Select a role…") e.role = "Please select a role";
    if (!form.password)          e.password   = "Password is required";
    else if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (!form.confirmPassword)   e.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!agree)                  e.agree      = "You must accept the Terms of Service to continue";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Account created successfully. Please sign in.");
      setPage("login");
    }, 1600);
  };

  const pwStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength];
  const strengthColor = ["", C.coral, C.sky, C.teal, C.teal][pwStrength];

  return (
    <div className="min-h-screen flex" style={{ background: `linear-gradient(135deg, #1a0533 0%, #2d0f5e 25%, #A05AFF 55%, #1BCFB4 100%)` }}>
      {/* Left accent panel */}
      <div className="hidden lg:flex flex-col justify-center items-center flex-shrink-0 w-80 p-10 text-white">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"><Shield size={20} className="text-white" /></div>
          <span className="text-xl font-bold">ContractIQ</span>
        </div>
        <div className="space-y-5 w-full">
          {[
            { icon: ShieldCheck, title: "Enterprise Security",   desc: "SOC 2 Type II · ISO 27001 certified" },
            { icon: CheckCircle, title: "99.9% Uptime SLA",      desc: "Built for mission-critical workflows" },
            { icon: Users,       title: "500+ Legal Teams",      desc: "Trusted by Fortune 500 companies"    },
          ].map(({ icon: Ic, title, desc }) => (
            <div key={title} className="flex items-start gap-3 bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0"><Ic size={15} className="text-white" /></div>
              <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-white/60 mt-0.5">{desc}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-lg my-6">
          <div className="bg-white dark:bg-[#1F2937] rounded-3xl shadow-2xl p-8">
            <div className="flex items-center gap-2 mb-1 lg:hidden">
              <Shield size={20} style={{ color: C.purple }} />
              <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">ContractIQ</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Create your account</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Join thousands of legal professionals on ContractIQ</p>

            <div className="space-y-3.5">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <RegField label="First Name" err={errors.firstName}>
                  <Input label="First Name" placeholder="John" icon={User} value={form.firstName} onChange={f("firstName")} required />
                </RegField>
                <RegField label="Last Name" err={errors.lastName}>
                  <Input label="Last Name" placeholder="Doe" icon={User} value={form.lastName} onChange={f("lastName")} required />
                </RegField>
              </div>

              {/* Email */}
              <RegField label="Email" err={errors.email}>
                <Input label="Work Email" type="email" placeholder="you@company.com" icon={Mail} value={form.email} onChange={f("email")} required />
              </RegField>

              {/* Employee ID + Dept row */}
              <div className="grid grid-cols-2 gap-3">
                <RegField label="Employee ID" err={errors.employeeId}>
                  <Input label="Employee ID" placeholder="EMP-0001" icon={Hash} value={form.employeeId} onChange={f("employeeId")} required />
                </RegField>
                <Select label="Department" options={["Legal", "Procurement", "HR", "Finance", "Technology", "Operations", "Marketing"]} value={form.department} onChange={(e: any) => setForm(p => ({ ...p, department: e.target.value }))} />
              </div>

              {/* Role */}
              <RegField label="Role" err={errors.role}>
                <Select label="Your Role" options={["Select a role…", "Administrator", "Legal Manager", "Compliance Officer", "Contract Manager", "Department Head", "Employee"]} value={form.role} onChange={(e: any) => { setForm(p => ({ ...p, role: e.target.value })); setErrors(p => ({ ...p, role: "" })); }} required />
              </RegField>

              {/* Password */}
              <RegField label="Password" err={errors.password}>
                <div className="relative">
                  <Input label="Password" type={showPw ? "text" : "password"} placeholder="Min. 8 characters" icon={Lock} value={form.password} onChange={f("password")} required />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors text-xs font-medium">{showPw ? "Hide" : "Show"}</button>
                </div>
                {form.password && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex gap-1 flex-1">
                      {[1,2,3,4].map(n => (
                        <div key={n} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ background: n <= pwStrength ? strengthColor : C.border }} />
                      ))}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </RegField>

              {/* Confirm Password */}
              <RegField label="Confirm Password" err={errors.confirmPassword}>
                <div className="relative">
                  <Input label="Confirm Password" type={showCpw ? "text" : "password"} placeholder="Re-enter password" icon={Lock} value={form.confirmPassword} onChange={f("confirmPassword")} required />
                  <button type="button" onClick={() => setShowCpw(v => !v)} className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors text-xs font-medium">{showCpw ? "Hide" : "Show"}</button>
                </div>
              </RegField>

              {/* Agreement */}
              <div>
                <label className="flex items-start gap-2.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">
                  <input type="checkbox" checked={agree} onChange={e => { setAgree(e.target.checked); setErrors(p => ({ ...p, agree: "" })); }} className="mt-0.5 rounded accent-purple-500" />
                  <span>I agree to the <span style={{ color: C.purple }} className="font-semibold cursor-pointer">Terms of Service</span> and <span style={{ color: C.purple }} className="font-semibold cursor-pointer">Privacy Policy</span></span>
                </label>
                {errors.agree && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-500">{errors.agree}</p>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: G.primary }}
              >
                {submitting ? <><Spinner /> Creating account…</> : "Create Account"}
              </button>
            </div>

            <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
              <button onClick={() => setPage("login")} className="font-semibold transition-opacity hover:opacity-70" style={{ color: C.purple }}>Sign in</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
function AdminDashboard({ setPage }: { setPage: (p: Page) => void }) {
  const [activitySearch, setActivitySearch] = useState("");
  const [chartMonths,    setChartMonths]    = useState(7);
  const [deptFilter,     setDeptFilter]     = useState("All");
  const exportBtn = useLoadingBtn(1800);

  const chartData = monthlyActivity.slice(-chartMonths);

  const filteredActivity = auditLogs.slice(0, 8).filter(l => {
    const q = activitySearch.toLowerCase();
    return !q || l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.module.toLowerCase().includes(q);
  });

  const filteredDeptStats = deptFilter === "All"
    ? deptStats
    : deptStats.filter(d => d.dept === deptFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Administrator Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">System-wide overview — users, contracts, health & activity.</p>
        </div>
        <div className="flex gap-2">
          <SecondaryBtn icon={Download} loading={exportBtn.busy} onClick={() => exportBtn.fire(() => {
            const csv = ["Month,Created,Approved,Expired", ...chartData.map(r => `${r.month},${r.created},${r.approved},${r.expired}`)].join("\n");
            const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv],{type:"text/csv"})), download: "dashboard-activity.csv" });
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          }, "CSV exported successfully.")}>Export</SecondaryBtn>
          <PrimaryBtn icon={Plus} onClick={() => setPage("contract-create")}>New Contract</PrimaryBtn>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Users"        value="56"   sub="registered"      trend="+4 this week" icon={Users}         color={C.purple} />
        <StatCard label="Active Contracts"   value="142"  sub="in force"        trend="+8 this month" icon={FileText}     color={C.teal}   />
        <StatCard label="Expired Contracts"  value="23"   sub="need attention"  trend="↓ from 29"    icon={XCircle}       color={C.coral}  />
        <StatCard label="Pending Approvals"  value="11"   sub="awaiting action" trend="3 urgent"      icon={Clock}        color={C.sky}    />
        <StatCard label="Upcoming Renewals"  value="18"   sub="within 90 days"  trend="5 critical"    icon={RefreshCw}    color={C.violet} />
        <StatCard label="System Health"      value="99.8%" sub="uptime"         trend="All systems go" icon={Cpu}         color={C.teal}   />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-semibold text-gray-800 dark:text-gray-100">Monthly Activity</h3><p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Contracts created, approved & expired</p></div>
            <select
              value={chartMonths}
              onChange={e => setChartMonths(Number(e.target.value))}
              className="text-xs border border-[#E8EAF0] dark:border-gray-700/50 rounded-lg px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none"
            >
              <option value={3}>Last 3 months</option>
              <option value={5}>Last 5 months</option>
              <option value={7}>Last 7 months</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.7} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
              <Legend />
              <Bar key="created"  dataKey="created"  fill={C.violet} radius={[4, 4, 0, 0]} name="Created"  />
              <Bar key="approved" dataKey="approved" fill={C.teal}   radius={[4, 4, 0, 0]} name="Approved" />
              <Bar key="expired"  dataKey="expired"  fill={C.coral}  radius={[4, 4, 0, 0]} name="Expired"  />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Contract Status</h3>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Distribution by status</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={contractStatusDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {contractStatusDist.map((entry, i) => <Cell key={`admin-csd-${entry.name}-${i}`} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {contractStatusDist.map(({ name, value, color }) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /><span className="text-gray-600 dark:text-gray-300">{name}</span></div>
                <span className="font-semibold text-gray-800 dark:text-gray-100">{value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">User Role Distribution</h3>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Total: 56 active users</p>
          <div className="flex items-center gap-4">
            <PieChart width={140} height={140}>
              <Pie data={userRoleDist} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                {userRoleDist.map((e, i) => <Cell key={`admin-urd-${e.name}-${i}`} fill={e.color} />)}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-2">
              {userRoleDist.map(({ name, value, color }) => (
                <div key={name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /><span className="text-gray-600 dark:text-gray-300">{name}</span></div>
                  <span className="font-bold text-gray-800 dark:text-gray-100">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Department Statistics</h3>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="text-xs border border-[#E8EAF0] dark:border-gray-700/50 rounded-lg px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none"
            >
              {["All","Legal","Procurement","Finance","Tech","HR"].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={filteredDeptStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.7} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="dept" type="category" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
              <Bar key="contracts" dataKey="contracts" fill={C.purple} radius={[0, 4, 4, 0]} name="Contracts" />
              <Bar key="users"     dataKey="users"     fill={C.sky}    radius={[0, 4, 4, 0]} name="Users"     />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent activity + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Recent Activities</h3>
            <button className="text-xs font-semibold" style={{ color: C.purple }} onClick={() => setPage("audit-logs")}>View all →</button>
          </div>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={activitySearch}
              onChange={e => setActivitySearch(e.target.value)}
              placeholder="Search by user, action, or module…"
              className="w-full pl-8 pr-4 py-2 text-xs border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none transition-colors"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-[#E8EAF0] dark:border-gray-700/50">
                {["User", "Action", "Module", "Time", "Status"].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-500 pb-2.5 pr-4 uppercase tracking-wide">{h}</th>)}
              </tr></thead>
              <tbody className="transition-all duration-200">
                {filteredActivity.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">No matching activities</td></tr>
                ) : filteredActivity.map((l, i) => (
                  <tr key={i} className="border-b border-[#E8EAF0] dark:border-gray-700/50 last:border-0 hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <Avatar initials={l.user.slice(0, 2).toUpperCase()} size="sm" color={[C.purple, C.teal, C.sky, C.violet, C.coral][i % 5]} />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{l.user}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-gray-600 dark:text-gray-300">{l.action}</td>
                    <td className="py-2.5 pr-4"><span className="text-xs bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-lg">{l.module}</span></td>
                    <td className="py-2.5 pr-4 text-xs text-gray-400 dark:text-gray-500 font-mono">{l.date.split(" ")[1]}</td>
                    <td className="py-2.5"><Badge label={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { icon: UserPlus,       label: "Add User",           color: C.purple, action: () => setPage("users")            },
              { icon: Upload,         label: "Upload Contract",     color: C.teal,   action: () => setPage("contract-create")  },
              { icon: BarChart2,      label: "Generate Reports",    color: C.sky,    action: () => setPage("reports")          },
              { icon: Building2,      label: "Manage Departments",  color: C.violet, action: () => setPage("settings")         },
              { icon: ShieldCheck,    label: "Compliance Overview",  color: C.coral,  action: () => setPage("compliance")      },
            ].map(({ icon: Icon, label, color, action }) => (
              <button key={label} onClick={action} className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 hover:border-[#A05AFF]/40 hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 transition-all group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 group-hover:text-purple-700">{label}</span>
                <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-purple-400" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── LEGAL DASHBOARD ───────────────────────────────────────────────────────────
function LegalDashboard({ setPage }: { setPage: (p: Page) => void }) {
  const [urgencyFilter,   setUrgencyFilter]   = useState("All");
  const [approvalSearch,  setApprovalSearch]  = useState("");
  const [categoryFilter,  setCategoryFilter]  = useState("All");
  const exportBtn = useLoadingBtn(1600);

  type DashApproval = typeof pendingApprovalsList[0] & { approvalStatus: "Pending" | "Approved" | "Rejected" };
  const [contracts,    setContracts]    = useState<DashApproval[]>(pendingApprovalsList.map(a => ({ ...a, approvalStatus: "Pending" as const })));
  const [approvingId,  setApprovingId]  = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DashApproval | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError,  setRejectError]  = useState("");
  const [rejecting,    setRejecting]    = useState(false);

  const pendingCount = contracts.filter(c => c.approvalStatus === "Pending").length;

  const handleApprove = (a: DashApproval) => {
    setApprovingId(a.id);
    setTimeout(() => {
      setContracts(prev => prev.map(c => c.id === a.id ? { ...c, approvalStatus: "Approved" } : c));
      setApprovingId(null);
      toast.success(`${a.name} approved successfully.`);
    }, 900);
  };

  const openReject = (a: DashApproval) => { setRejectTarget(a); setRejectReason(""); setRejectError(""); };
  const closeReject = () => { if (rejecting) return; setRejectTarget(null); };
  const handleReject = () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) { setRejectError("Please provide a rejection reason."); return; }
    setRejecting(true);
    setTimeout(() => {
      setContracts(prev => prev.map(c => c.id === rejectTarget.id ? { ...c, approvalStatus: "Rejected" } : c));
      setRejecting(false);
      setRejectTarget(null);
      toast.error(`${rejectTarget.name} rejected.`);
    }, 900);
  };

  const filteredApprovals = contracts.filter(a => {
    if (urgencyFilter !== "All" && a.urgency !== urgencyFilter) return false;
    const q = approvalSearch.toLowerCase();
    if (q && !a.name.toLowerCase().includes(q) && !a.submitter.toLowerCase().includes(q)) return false;
    return true;
  });

  const filteredCategories = categoryFilter === "All"
    ? contractCategories
    : contractCategories.filter(c => c.name === categoryFilter);

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Legal Manager Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">Contract reviews, approvals, and legal task management.</p>
        </div>
        <div className="flex gap-2">
          <SecondaryBtn icon={Download} loading={exportBtn.busy} onClick={() => exportBtn.fire(() => {
            const csv = ["ID,Name,Submitter,Urgency", ...pendingApprovalsList.map(a => `${a.id},"${a.name}",${a.submitter},${a.urgency}`)].join("\n");
            const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv],{type:"text/csv"})), download: "approvals.csv" });
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          }, "CSV exported successfully.")}>Export</SecondaryBtn>
          <PrimaryBtn icon={Plus} onClick={() => setPage("contract-create")}>Create Contract</PrimaryBtn>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Contracts Under Review" value={String(pendingCount)}  sub="need your review" trend="2 urgent"      icon={Eye}          color={C.purple} />
        <StatCard label="Pending Approvals"       value={String(pendingCount)}  sub="awaiting sign-off" trend="1 overdue"   icon={ThumbsUp}     color={C.coral}  />
        <StatCard label="Active Contracts"        value="42" sub="in force"          trend="+3 this week" icon={FileText}    color={C.teal}   />
        <StatCard label="Expiring Soon"           value="7"  sub="within 60 days"    trend="2 critical"   icon={Clock}       color={C.sky}    />
        <StatCard label="Legal Tasks"             value="8"  sub="open tasks"        trend="3 due today"  icon={ClipboardList}color={C.violet} />
      </div>

      {/* Pending approvals list + Approval status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Pending Approvals</h3>
            <button className="text-xs font-semibold" style={{ color: C.purple }} onClick={() => setPage("contract-approval")}>View all →</button>
          </div>
          {/* Search + urgency filter */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="relative flex-1 min-w-[140px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={approvalSearch}
                onChange={e => setApprovalSearch(e.target.value)}
                placeholder="Search contracts…"
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none"
              />
            </div>
            <div className="flex gap-1">
              {["All","High","Medium","Low"].map(u => (
                <button key={u} onClick={() => setUrgencyFilter(u)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                  style={urgencyFilter === u ? { background: G.primary, color: "#fff", borderColor: "transparent" } : { borderColor: C.border, color: "#6b7280" }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {filteredApprovals.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No approvals match the current filter.</p>
            ) : filteredApprovals.map((a) => (
              <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${
                  a.approvalStatus === "Approved" ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800/40 dark:bg-emerald-900/10"
                  : a.approvalStatus === "Rejected" ? "border-red-200 bg-red-50/30 dark:border-red-800/40 dark:bg-red-900/10"
                  : a.urgency === "High" ? "border-red-200 bg-red-50/30"
                  : "border-[#E8EAF0] dark:border-gray-700/50"
                }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{a.id}</span>
                    <Badge label={a.urgency === "High" ? "High" : a.urgency === "Medium" ? "Medium" : "Low"} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5 truncate">{a.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Submitted by {a.submitter} · {a.submitted}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0 items-center">
                  {a.approvalStatus === "Approved" ? (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: C.teal }}>Approved</span>
                  ) : a.approvalStatus === "Rejected" ? (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: C.coral }}>Rejected</span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApprove(a)}
                        disabled={approvingId === a.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center gap-1"
                        style={{ backgroundColor: C.teal }}>
                        {approvingId === a.id ? <Spinner size={11} /> : null}
                        Approve
                      </button>
                      <button
                        onClick={() => openReject(a)}
                        disabled={approvingId === a.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-all disabled:opacity-60">
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Approval Status</h3>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">This month</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={[
                { name: "Approved", value: 14, color: C.teal   },
                { name: "Rejected", value: 3,  color: C.coral  },
                { name: "Pending",  value: 5,  color: C.sky    },
              ]} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                {[C.teal, C.coral, C.sky].map((c, i) => <Cell key={`legal-as-${i}-${c}`} fill={c} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {[{ label: "Approved", val: 14, color: C.teal }, { label: "Rejected", val: 3, color: C.coral }, { label: "Pending", val: 5, color: C.sky }].map(({ label, val, color }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /><span className="text-gray-600 dark:text-gray-300">{label}</span></div>
                <span className="font-bold text-gray-800 dark:text-gray-100">{val}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Approval Timeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={approvalTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.7} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
              <Legend />
              <Bar key="approved" dataKey="approved" fill={C.teal}  radius={[4, 4, 0, 0]} name="Approved" />
              <Bar key="rejected" dataKey="rejected" fill={C.coral} radius={[4, 4, 0, 0]} name="Rejected" />
              <Bar key="pending"  dataKey="pending"  fill={C.sky}   radius={[4, 4, 0, 0]} name="Pending"  />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Contract Categories</h3>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs border border-[#E8EAF0] dark:border-gray-700/50 rounded-lg px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none"
            >
              {["All", ...contractCategories.map(c => c.name)].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={160}>
              <PieChart>
                <Pie data={filteredCategories} cx="50%" cy="50%" outerRadius={65} paddingAngle={2} dataKey="value">
                  {filteredCategories.map((e, i) => <Cell key={`legal-cc-${e.name}-${i}`} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {filteredCategories.map(({ name, value, color }) => (
                <div key={name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /><span className="text-gray-600 dark:text-gray-300">{name}</span></div>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{value}</span>
                  </div>
                  <ProgressBar value={(value / 32) * 100} color={color} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Plus,       label: "Create Contract",  color: C.purple, action: () => setPage("contract-create")   },
            { icon: Eye,        label: "Review Contract",  color: C.teal,   action: () => setPage("contract-repository")},
            { icon: ThumbsUp,   label: "Approve Contract", color: C.sky,    action: () => setPage("contract-approval") },
            { icon: Upload,     label: "Upload Contract",  color: C.violet, action: () => setPage("contract-create")   },
          ].map(({ icon: Icon, label, color, action }) => (
            <button key={label} onClick={action} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 hover:border-[#A05AFF]/40 hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 group-hover:text-purple-700 text-center">{label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>

    {/* Reject modal */}
    {rejectTarget && (
      <>
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={closeReject} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Reject Contract</h3>
              <button onClick={closeReject} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              You are rejecting: <span className="font-semibold text-gray-800 dark:text-gray-100">{rejectTarget.name}</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Submitted by {rejectTarget.submitter} · {rejectTarget.submitted}</p>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Reason for rejection <span className="text-red-400">*</span></label>
            <textarea
              value={rejectReason}
              onChange={e => { setRejectReason(e.target.value); setRejectError(""); }}
              rows={3}
              placeholder="Describe why this contract is being rejected…"
              className="w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-3 py-2 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none resize-none"
            />
            {rejectError && <p className="text-xs text-red-500 mt-1">{rejectError}</p>}
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={closeReject} disabled={rejecting} className="px-4 py-2 rounded-xl text-sm border border-[#E8EAF0] dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50">Cancel</button>
              <button onClick={handleReject} disabled={rejecting} className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: C.coral }}>
                {rejecting && <Spinner size={13} />}
                Reject Contract
              </button>
            </div>
          </div>
        </div>
      </>
    )}
    </>
  );
}

// ─── COMPLIANCE DASHBOARD ──────────────────────────────────────────────────────
function ComplianceDashboard({ setPage }: { setPage: (p: Page) => void }) {
  const [deptFilter,   setDeptFilter]   = useState("All");
  const [riskFilter,   setRiskFilter]   = useState("All");
  const [trendMonths,  setTrendMonths]  = useState(7);
  const exportBtn = useLoadingBtn(1800);

  const filteredDeptCompliance = deptFilter === "All"
    ? deptCompliance
    : deptCompliance.filter(d => d.dept === deptFilter);

  const filteredRiskDist = riskFilter === "All"
    ? riskDist
    : riskDist.filter(r => r.name === riskFilter);

  const trendData = complianceTrend.slice(-trendMonths);

  const filteredObligations = obligationsData
    .filter(o => (o.status === "Overdue" || o.status === "Delayed"))
    .filter(o => riskFilter === "All" || (riskFilter === "High Risk" ? o.status === "Overdue" : o.status === "Delayed"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Compliance Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">Monitor organization-wide compliance, risks, and audit performance.</p>
        </div>
        <PrimaryBtn
          icon={Download}
          loading={exportBtn.busy}
          onClick={() => exportBtn.fire(() => {
            const csv = ["Dept,Score", ...deptCompliance.map(d => `${d.dept},${d.score}`)].join("\n");
            const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv],{type:"text/csv"})), download: "compliance-report.csv" });
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          }, "CSV exported successfully.")}
        >Export Audit Report</PrimaryBtn>
      </div>

      {/* Compliance score + cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-5 sm:col-span-2 flex items-center gap-5" style={{ background: `linear-gradient(135deg, ${C.teal}08, ${C.purple}08)` }}>
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E8EAF0" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.teal} strokeWidth="2.5" strokeDasharray="93 7" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">93%</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">Overall Compliance Score</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">Excellent</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight size={13} style={{ color: C.teal }} />
              <span className="text-xs font-semibold" style={{ color: C.teal }}>+5%</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">vs last quarter</span>
            </div>
          </div>
        </Card>
        <StatCard label="High Risk Contracts"  value="3"  sub="need attention"  trend="↓ from 6"      icon={AlertTriangle} color={C.coral}  />
        <StatCard label="Missed Obligations"   value="2"  sub="overdue"         trend="↑ from 1"      icon={XCircle}       color={C.coral}  />
        <StatCard label="Pending Reviews"      value="7"  sub="scheduled"       trend="Due this week"  icon={Clock}        color={C.sky}    />
        <StatCard label="Compliance Deadlines" value="5"  sub="upcoming"        trend="Next: Jul 31"   icon={Calendar}     color={C.violet} />
      </div>

      {/* Trends + risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Compliance Score Trend</h3>
            <select
              value={trendMonths}
              onChange={e => setTrendMonths(Number(e.target.value))}
              className="text-xs border border-[#E8EAF0] dark:border-gray-700/50 rounded-lg px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none"
            >
              <option value={3}>Last 3 months</option>
              <option value={5}>Last 5 months</option>
              <option value={7}>Last 7 months</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.7} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
              <Area key="score" type="monotone" dataKey="score" stroke={C.teal} strokeWidth={2.5} fill={C.teal} fillOpacity={0.12} name="Score %" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Risk Distribution</h3>
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              className="text-xs border border-[#E8EAF0] dark:border-gray-700/50 rounded-lg px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none"
            >
              {["All", ...riskDist.map(r => r.name)].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Across all contracts</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={filteredRiskDist} cx="50%" cy="50%" outerRadius={60} paddingAngle={2} dataKey="value">
                {filteredRiskDist.map((e, i) => <Cell key={`compliance-rd-${e.name}-${i}`} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {filteredRiskDist.map(({ name, value, color }) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /><span className="text-gray-600 dark:text-gray-300">{name}</span></div>
                <span className="font-bold text-gray-800 dark:text-gray-100">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Department compliance + Audit performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Department-wise Compliance</h3>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="text-xs border border-[#E8EAF0] dark:border-gray-700/50 rounded-lg px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none"
            >
              {["All", ...deptCompliance.map(d => d.dept)].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            {filteredDeptCompliance.map(({ dept, score, fill }) => (
              <div key={dept} className="flex items-center gap-4 transition-all duration-300">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 w-20">{dept}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700/60 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: fill }} />
                </div>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100 w-10 text-right">{score}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Audit Performance</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={auditPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.7} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
              <Legend />
              <Bar key="passed" dataKey="passed" fill={C.teal}  radius={[4, 4, 0, 0]} name="Passed" />
              <Bar key="failed" dataKey="failed" fill={C.coral} radius={[4, 4, 0, 0]} name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Missed obligations + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Missed & Delayed Obligations</h3>
          <div className="space-y-2">
            {filteredObligations.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No obligations match the current filter.</p>
            ) : filteredObligations.map(o => (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50" style={{ backgroundColor: o.status === "Overdue" ? "#fee2e222" : "#fef3c722" }}>
                <AlertCircle size={16} style={{ color: o.status === "Overdue" ? C.coral : C.sky }} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{o.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{o.person} · Due {o.due}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={o.status} />
                  <button className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ color: C.purple, backgroundColor: `${C.purple}12` }}>Resolve</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { icon: ShieldCheck,  label: "Review Compliance",       color: C.teal,   action: () => setPage("compliance")   },
              { icon: BarChart2,    label: "Generate Audit Report",   color: C.purple, action: () => setPage("reports")      },
              { icon: AlertTriangle,label: "View High Risk Contracts",color: C.coral,  action: () => setPage("contract-repository") },
              { icon: BookOpen,     label: "Audit Logs",              color: C.sky,    action: () => setPage("audit-logs")   },
            ].map(({ icon: Icon, label, color, action }) => (
              <button key={label} onClick={action} className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 hover:border-[#A05AFF]/40 hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 transition-all group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 group-hover:text-purple-700">{label}</span>
                <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-purple-400" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── CONTRACT MANAGEMENT PAGE ──────────────────────────────────────────────────
function ContractManagementPage({ setPage, role = "administrator", contracts: myContracts, setContracts: setMyContracts }: { setPage: (p: Page) => void; role?: UserRole; contracts: RepoContract[]; setContracts: React.Dispatch<React.SetStateAction<RepoContract[]>> }) {
  const isEmployee = role === "employee";
  const pipeline = [
    { stage: "Draft",           count: 4,   color: "#7B9FD4", icon: Edit2         },
    { stage: "Under Review",    count: 7,   color: C.sky,     icon: Eye           },
    { stage: "Pending Approval",count: 3,   color: C.violet,  icon: Clock         },
    { stage: "Active",          count: 128, color: C.teal,    icon: CheckCircle   },
    { stage: "Expiring",        count: 8,   color: C.coral,   icon: AlertTriangle },
  ];

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [cErrors, setCErrors] = useState<Record<string, string>>({});
  const [cForm, setCForm] = useState({ name: "", category: "Technology", owner: "", start: "", expiry: "", status: "Active", risk: "Low" });

  // ── filter state ──
  const [filterOpen, setFilterOpen] = useState(false);
  const [fStatus,   setFStatus]   = useState("All");
  const [fCategory, setFCategory] = useState("All");
  const [fRisk,     setFRisk]     = useState("All");
  const [fDateFrom, setFDateFrom] = useState("");
  const [fDateTo,   setFDateTo]   = useState("");

  const allStatuses   = ["All", "Active", "Expiring", "Pending", "Archived"];
  const allCategories = ["All", "Technology", "Procurement", "HR", "Legal", "Finance", "Facilities", "Marketing"];
  const allRisks      = ["All", "Low", "Medium", "High"];

  const activeFilterCount = [fStatus, fCategory, ...(!isEmployee ? [fRisk] : [])].filter(v => v !== "All").length
    + (fDateFrom ? 1 : 0) + (fDateTo ? 1 : 0);

  const clearFilters = () => { setFStatus("All"); setFCategory("All"); setFRisk("All"); setFDateFrom(""); setFDateTo(""); };

  const displayedContracts = myContracts.filter(c => {
    if (fStatus   !== "All" && c.status   !== fStatus)   return false;
    if (fCategory !== "All" && c.category !== fCategory) return false;
    if (!isEmployee && fRisk !== "All" && c.risk !== fRisk) return false;
    if (fDateFrom && c.expiry < fDateFrom) return false;
    if (fDateTo   && c.expiry > fDateTo)   return false;
    return true;
  });

  const validateContract = () => {
    const e: Record<string, string> = {};
    if (!cForm.name.trim())  e.name  = isEmployee ? "Contract type is required" : "Contract name is required";
    if (!cForm.owner.trim()) e.owner = isEmployee ? "Justification is required"  : "Contract owner is required";
    if (!cForm.start)        e.start = isEmployee ? "Required by date is required" : "Start date is required";
    if (!isEmployee && !cForm.expiry) e.expiry = "Expiry date is required";
    return e;
  };

  const handleCreateContract = async () => {
    const e = validateContract();
    if (Object.keys(e).length) { setCErrors(e); return; }
    setCErrors({});
    setCreating(true);
    try {
      const newContract = await contractsApi.create({
        name: cForm.name.trim(), category: cForm.category,
        owner: cForm.owner.trim(), start: cForm.start,
        expiry: cForm.expiry, value: "$0",
        status: cForm.status, risk: cForm.risk, notes: "",
      });
      setMyContracts(prev => [newContract as RepoContract, ...prev]);
      setHighlightId(newContract.id);
      setTimeout(() => setHighlightId(null), 2200);
      setCreateOpen(false);
      setCForm({ name: "", category: "Technology", owner: "", start: "", expiry: "", status: "Active", risk: "Low" });
      toast.success(`Contract "${newContract.name}" created successfully.`);
    } catch {
      toast.error("Failed to create contract. Is the backend running?");
    } finally {
      setCreating(false);
    }
  };

  const closeCreate = () => {
    if (creating) return;
    setCreateOpen(false);
    setCErrors({});
    setCForm({ name: "", category: "Technology", owner: "", start: "", expiry: "", status: "Active", risk: "Low" });
  };

  // ── Edit contract ──
  type CEditForm = { name: string; category: string; owner: string; start: string; expiry: string; status: string; risk: string };
  const [editTarget,  setEditTarget]  = useState<typeof contractsData[0] | null>(null);
  const [editForm,    setEditForm]    = useState<CEditForm>({ name: "", category: "", owner: "", start: "", expiry: "", status: "", risk: "" });
  const [editErrors,  setEditErrors]  = useState<Partial<CEditForm>>({});
  const [editSaving,  setEditSaving]  = useState(false);

  const openEdit = (c: typeof contractsData[0]) => {
    setEditTarget(c);
    setEditForm({ name: c.name, category: c.category, owner: c.owner, start: c.start, expiry: c.expiry, status: c.status, risk: c.risk });
    setEditErrors({});
  };
  const closeEdit = () => { if (editSaving) return; setEditTarget(null); };
  const handleSaveEdit = async () => {
    const errs: Partial<CEditForm> = {};
    if (!editForm.name.trim())  errs.name   = "Contract name is required.";
    if (!editForm.owner.trim()) errs.owner  = "Owner is required.";
    if (!editForm.start)        errs.start  = "Start date is required.";
    if (!editForm.expiry)       errs.expiry = "Expiry date is required.";
    setEditErrors(errs);
    if (Object.keys(errs).length) return;
    setEditSaving(true);
    try {
      const updated = await contractsApi.update(editTarget!.id, editForm);
      setMyContracts(prev => prev.map(c => c.id === editTarget!.id ? { ...c, ...updated } : c));
      setEditTarget(null);
      toast.success(`"${editForm.name}" updated successfully.`);
    } catch {
      toast.error("Failed to update contract. Is the backend running?");
    } finally {
      setEditSaving(false);
    }
  };
  const ef = (k: keyof CEditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm(p => ({ ...p, [k]: e.target.value }));
    setEditErrors(p => ({ ...p, [k]: undefined }));
  };

  const handleDownload = (c: typeof contractsData[0]) => {
    dlCSV(`${c.id}-${c.name.replace(/\s+/g, "-")}.csv`, [
      ["Field", "Value"],
      ["ID", c.id], ["Name", c.name], ["Category", c.category],
      ["Owner", c.owner], ["Start", c.start], ["Expiry", c.expiry],
      ["Value", c.value], ["Status", c.status], ["Risk", c.risk],
    ]);
    toast.success(`Downloaded ${c.id} – ${c.name}`);
  };

  // Import dialog state
  const [importOpen,    setImportOpen]    = useState(false);
  const [dragOver,      setDragOver]      = useState(false);
  const [importFile,    setImportFile]    = useState<File | null>(null);
  const [importStatus,  setImportStatus]  = useState<"idle" | "loading" | "success">("idle");

  const handleFilePick = (file: File) => {
    setImportFile(file);
    setImportStatus("loading");
    setTimeout(() => setImportStatus("success"), 1800);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFilePick(file);
  };

  const closeImport = () => {
    setImportOpen(false);
    setImportFile(null);
    setImportStatus("idle");
  };

  const handleImportDone = () => {
    toast.success("Contract imported successfully.");
    closeImport();
  };

  return (
    <>
    {/* ── Import Contract Modal ── */}
    {importOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={e => { if (e.target === e.currentTarget) closeImport(); }}
      >
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.purple}18` }}>
                <Upload size={15} style={{ color: C.purple }} />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Import Contract</h3>
            </div>
            <button onClick={closeImport} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          {/* Drop zone */}
          {importStatus === "idle" && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer"
              style={{ borderColor: dragOver ? C.purple : C.border, background: dragOver ? `${C.purple}08` : "transparent" }}
              onClick={() => document.getElementById("contract-file-input")?.click()}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${C.purple}12` }}>
                <Upload size={22} style={{ color: C.purple }} />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Drag &amp; drop your contract here</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">or click to browse files</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Supported formats: PDF, DOCX, DOC, TXT</p>
              <input
                id="contract-file-input"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFilePick(f); }}
              />
            </div>
          )}

          {/* Loading state */}
          {importStatus === "loading" && (
            <div className="rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 p-6 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-gray-100 dark:border-gray-700 flex items-center justify-center" style={{ borderTopColor: C.purple }}>
                <span className="w-full h-full rounded-full animate-spin absolute" style={{ border: `4px solid transparent`, borderTop: `4px solid ${C.purple}` }} />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Importing <span className="font-bold" style={{ color: C.purple }}>{importFile?.name}</span>…</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Validating and processing your contract</p>
              <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden mt-1">
                <div className="h-full rounded-full animate-pulse" style={{ background: G.primary, width: "65%" }} />
              </div>
            </div>
          )}

          {/* Success state */}
          {importStatus === "success" && (
            <div className="rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 p-6 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${C.teal}18` }}>
                <CheckCircle size={24} style={{ color: C.teal }} />
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Import complete</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold" style={{ color: C.teal }}>{importFile?.name}</span> has been imported successfully.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <SecondaryBtn onClick={closeImport}>Cancel</SecondaryBtn>
            {importStatus === "success" && (
              <PrimaryBtn icon={CheckCircle} onClick={handleImportDone}>Done</PrimaryBtn>
            )}
          </div>
        </div>
      </div>
    )}

    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{isEmployee ? "My Contracts" : "Contract Management"}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">{isEmployee ? "View and download your assigned contracts." : "Manage contract lifecycle, workflows, and approvals."}</p>
        </div>
        <div className="flex gap-2">
          {!isEmployee && <SecondaryBtn icon={Upload} onClick={() => setImportOpen(true)}>Import Contract</SecondaryBtn>}
          {!isEmployee && <PrimaryBtn icon={Plus} onClick={() => setCreateOpen(true)}>Create Contract</PrimaryBtn>}
          {isEmployee && <PrimaryBtn icon={Send} onClick={() => setCreateOpen(true)}>Request Contract</PrimaryBtn>}
        </div>
      </div>

      {/* Pipeline — hidden for employees */}
      {!isEmployee && <Card className="p-5">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Contract Pipeline</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {pipeline.map(({ stage, count, color, icon: Icon }) => (
            <div key={stage} className="flex flex-col items-center p-4 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: `${color}18` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-0.5">{stage}</p>
            </div>
          ))}
        </div>
        {/* Flow arrows */}
        <div className="hidden sm:flex items-center justify-between mt-3 px-8">
          {pipeline.slice(0, 4).map(({ stage }) => (
            <div key={stage} className="flex-1 flex items-center justify-end">
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          ))}
        </div>
      </Card>}

      {/* My contracts table */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8EAF0] dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">My Contracts</h3>
            {activeFilterCount > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: C.purple }}>{activeFilterCount}</span>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <button
                onClick={() => setFilterOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
                style={filterOpen || activeFilterCount > 0
                  ? { borderColor: C.purple, background: `${C.purple}10`, color: C.purple }
                  : { borderColor: C.border, background: "transparent", color: "#6b7280" }}
              >
                <Filter size={13} />Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </button>

              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-40 bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl border border-[#E8EAF0] dark:border-gray-700/50 p-4 w-72 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Filter Contracts</span>
                      {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: C.coral }}>
                          <X size={11} />Clear all
                        </button>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Status</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allStatuses.map(s => (
                          <button key={s} onClick={() => setFStatus(s)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                            style={fStatus === s ? { background: C.purple, color: "#fff", borderColor: C.purple } : { borderColor: C.border, color: "#6b7280" }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Category</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allCategories.map(c => (
                          <button key={c} onClick={() => setFCategory(c)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                            style={fCategory === c ? { background: C.teal, color: "#fff", borderColor: C.teal } : { borderColor: C.border, color: "#6b7280" }}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Risk (non-employee) */}
                    {!isEmployee && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Risk Level</p>
                        <div className="flex flex-wrap gap-1.5">
                          {allRisks.map(r => (
                            <button key={r} onClick={() => setFRisk(r)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                              style={fRisk === r ? { background: C.coral, color: "#fff", borderColor: C.coral } : { borderColor: C.border, color: "#6b7280" }}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expiry date range */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Expiry Date Range</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">From</label>
                          <input type="date" value={fDateFrom} onChange={e => setFDateFrom(e.target.value)}
                            className="w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-lg px-2.5 py-1.5 text-xs bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">To</label>
                          <input type="date" value={fDateTo} onChange={e => setFDateTo(e.target.value)}
                            className="w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-lg px-2.5 py-1.5 text-xs bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 focus:outline-none" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-[#E8EAF0] dark:border-gray-700/50 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{displayedContracts.length} result{displayedContracts.length !== 1 ? "s" : ""}</span>
                      <button onClick={() => setFilterOpen(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
                        style={{ background: G.primary }}>
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            {!isEmployee && <button className="text-xs font-semibold" style={{ color: C.purple }} onClick={() => setPage("contract-repository")}>View Repository →</button>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8EAF0] dark:border-gray-700/50">
                {(isEmployee ? ["Contract", "Category", "Expiry", "Status", "Actions"] : ["Contract", "Category", "Expiry", "Status", "Risk", "Actions"]).map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-500 px-5 py-3.5 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedContracts.length === 0 ? (
                <tr><td colSpan={isEmployee ? 5 : 6} className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  No contracts match the current filters.{" "}
                  <button onClick={clearFilters} className="font-semibold underline underline-offset-2" style={{ color: C.purple }}>Clear filters</button>
                </td></tr>
              ) : displayedContracts.map(c => (
                <tr key={c.id} className={`border-b border-[#E8EAF0] dark:border-gray-700/50 transition-all duration-700 ${c.id === highlightId ? "bg-[#A05AFF]/8" : "hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15/30"}`}>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setPage("contract-detail")} className="text-left">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 hover:text-purple-600 transition-colors">{c.name}</p>
                      <p className="text-xs font-mono text-gray-400 dark:text-gray-500">{c.id}</p>
                    </button>
                  </td>
                  <td className="px-5 py-3.5"><span className="text-xs bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg">{c.category}</span></td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{c.expiry}</td>
                  <td className="px-5 py-3.5"><Badge label={c.status} /></td>
                  {!isEmployee && <td className="px-5 py-3.5"><Badge label={c.risk} /></td>}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage("contract-detail")} className="w-7 h-7 rounded-lg hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 flex items-center justify-center transition-colors" title="View"><Eye size={14} style={{ color: C.purple }} /></button>
                      <button onClick={() => handleDownload(c)} className="w-7 h-7 rounded-lg hover:bg-[#1BCFB4]/12 flex items-center justify-center transition-colors" title="Download"><Download size={14} style={{ color: C.teal }} /></button>
                      {!isEmployee && <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-lg hover:bg-[#4BCBEB]/12 flex items-center justify-center transition-colors" title="Edit"><Edit2 size={14} style={{ color: C.sky }} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent activity */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Recent Contract Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((a, i) => {
            const colors: Record<string, string> = { success: C.teal, info: C.sky, warning: C.sky, error: C.coral };
            const col = colors[a.type];
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: col }} />
                <p className="flex-1 text-sm text-gray-700 dark:text-gray-200">{a.action}</p>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{a.time}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>

    {/* ── Create Contract Modal ── */}
    {createOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={e => { if (e.target === e.currentTarget) closeCreate(); }}>
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.purple}18` }}>
                <FileText size={15} style={{ color: C.purple }} />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{isEmployee ? "Request Contract" : "Create Contract"}</h3>
            </div>
            <button onClick={closeCreate} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={15} className="text-gray-500" /></button>
          </div>
          {isEmployee ? (
            <div className="space-y-3">
              <div>
                <Input label="Contract Type" placeholder="e.g. NDA, Employment Addendum" value={cForm.name} onChange={(e: any) => { setCForm(f => ({ ...f, name: e.target.value })); setCErrors(err => ({ ...err, name: "" })); }} required />
                {cErrors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{cErrors.name}</p>}
              </div>
              <Select label="Category" options={["HR", "Technology", "Facilities", "Legal", "Finance"]} value={cForm.category} onChange={(e: any) => setCForm(f => ({ ...f, category: e.target.value }))} />
              <div>
                <Input label="Justification / Notes" placeholder="Brief reason for the contract request" value={cForm.owner} onChange={(e: any) => { setCForm(f => ({ ...f, owner: e.target.value })); setCErrors(err => ({ ...err, owner: "" })); }} required />
                {cErrors.owner && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{cErrors.owner}</p>}
              </div>
              <div>
                <Input label="Required By Date" type="date" value={cForm.start} onChange={(e: any) => { setCForm(f => ({ ...f, start: e.target.value })); setCErrors(err => ({ ...err, start: "" })); }} required />
                {cErrors.start && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{cErrors.start}</p>}
              </div>
              <div className="rounded-xl p-3 text-xs text-gray-500 dark:text-gray-400 border border-dashed border-[#E8EAF0] dark:border-gray-700 flex gap-2 items-start">
                <Info size={13} className="flex-shrink-0 mt-0.5" style={{ color: C.sky }} />
                <span>Your request will be reviewed by the Legal team. You will be notified once approved or if more information is needed.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Input label="Contract Name" placeholder="e.g. Vendor NDA – Acme Corp" value={cForm.name} onChange={(e: any) => { setCForm(f => ({ ...f, name: e.target.value })); setCErrors(err => ({ ...err, name: "" })); }} required />
                {cErrors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{cErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Category" options={["Technology", "Procurement", "Legal", "HR", "Finance", "Facilities", "Marketing"]} value={cForm.category} onChange={(e: any) => setCForm(f => ({ ...f, category: e.target.value }))} />
                <div>
                  <Input label="Contract Owner" placeholder="e.g. Sarah Chen" value={cForm.owner} onChange={(e: any) => { setCForm(f => ({ ...f, owner: e.target.value })); setCErrors(err => ({ ...err, owner: "" })); }} required />
                  {cErrors.owner && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{cErrors.owner}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input label="Start Date" type="date" value={cForm.start} onChange={(e: any) => { setCForm(f => ({ ...f, start: e.target.value })); setCErrors(err => ({ ...err, start: "" })); }} required />
                  {cErrors.start && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{cErrors.start}</p>}
                </div>
                <div>
                  <Input label="Expiry Date" type="date" value={cForm.expiry} onChange={(e: any) => { setCForm(f => ({ ...f, expiry: e.target.value })); setCErrors(err => ({ ...err, expiry: "" })); }} required />
                  {cErrors.expiry && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{cErrors.expiry}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Status" options={["Active", "Draft", "Pending", "Expiring", "Archived"]} value={cForm.status} onChange={(e: any) => setCForm(f => ({ ...f, status: e.target.value }))} />
                <Select label="Risk Level" options={["Low", "Medium", "High"]} value={cForm.risk} onChange={(e: any) => setCForm(f => ({ ...f, risk: e.target.value }))} />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <SecondaryBtn onClick={closeCreate}>Cancel</SecondaryBtn>
            <PrimaryBtn icon={isEmployee ? Send : Plus} loading={creating} onClick={handleCreateContract}>{isEmployee ? "Submit Request" : "Create Contract"}</PrimaryBtn>
          </div>
        </div>
      </div>
    )}

    {/* ══ EDIT CONTRACT MODAL ══ */}
    {editTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={e => { if (e.target === e.currentTarget) closeEdit(); }}>
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.sky}18` }}>
                <Edit2 size={15} style={{ color: C.sky }} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Edit Contract</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{editTarget.id}</p>
              </div>
            </div>
            <button onClick={closeEdit} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Contract Name<Req /></label>
              <input value={editForm.name} onChange={ef("name")}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none" />
              {editErrors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editErrors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Category</label>
              <select value={editForm.category} onChange={ef("category")}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none appearance-none">
                {["Technology", "Procurement", "HR", "Legal", "Finance", "Marketing", "Facilities"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Contract Owner<Req /></label>
              <input value={editForm.owner} onChange={ef("owner")}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none" />
              {editErrors.owner && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editErrors.owner}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Start Date<Req /></label>
              <input type="date" value={editForm.start} onChange={ef("start")}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none" />
              {editErrors.start && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editErrors.start}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Expiry Date<Req /></label>
              <input type="date" value={editForm.expiry} onChange={ef("expiry")}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none" />
              {editErrors.expiry && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editErrors.expiry}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Status</label>
              <select value={editForm.status} onChange={ef("status")}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none appearance-none">
                {["Active", "Expiring", "Pending", "Archived"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Risk Level</label>
              <select value={editForm.risk} onChange={ef("risk")}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none appearance-none">
                {["Low", "Medium", "High"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 pt-2 border-t border-[#E8EAF0] dark:border-gray-700/50">
            <SecondaryBtn onClick={closeEdit} className="flex-1 justify-center">Cancel</SecondaryBtn>
            <button onClick={handleSaveEdit} disabled={editSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: G.primary }}>
              {editSaving ? <><Spinner />Saving…</> : <><CheckCircle size={14} />Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ─── CONTRACT REPOSITORY PAGE ──────────────────────────────────────────────────
type RepoContract = typeof contractsData[0] & { archived?: boolean };

function ContractRepositoryPage({ setPage, contracts, setContracts }: { setPage: (p: Page) => void; contracts: RepoContract[]; setContracts: React.Dispatch<React.SetStateAction<RepoContract[]>> }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // ── Edit modal ──
  type EditForm = { name: string; category: string; owner: string; start: string; expiry: string; status: string; risk: string };
  const [editTarget, setEditTarget] = useState<RepoContract | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", category: "", owner: "", start: "", expiry: "", status: "", risk: "" });
  const [editErrors, setEditErrors] = useState<Partial<EditForm>>({});
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = (c: RepoContract) => {
    setEditTarget(c);
    setEditForm({ name: c.name, category: c.category, owner: c.owner, start: c.start, expiry: c.expiry, status: c.status, risk: c.risk });
    setEditErrors({});
  };
  const closeEdit = () => { if (editSaving) return; setEditTarget(null); };
  const handleSaveEdit = async () => {
    const errs: Partial<EditForm> = {};
    if (!editForm.name.trim())    errs.name    = "Contract name is required.";
    if (!editForm.owner.trim())   errs.owner   = "Owner is required.";
    if (!editForm.start)          errs.start   = "Start date is required.";
    if (!editForm.expiry)         errs.expiry  = "Expiry date is required.";
    setEditErrors(errs);
    if (Object.keys(errs).length) return;
    setEditSaving(true);
    try {
      const updated = await contractsApi.update(editTarget!.id, editForm);
      setContracts(prev => prev.map(c => c.id === editTarget!.id ? { ...c, ...updated } : c));
      setEditTarget(null);
      toast.success(`"${editForm.name}" updated successfully.`);
    } catch {
      toast.error("Failed to update contract. Is the backend running?");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Archive confirm ──
  const [archiveTarget, setArchiveTarget] = useState<RepoContract | null>(null);
  const [archiving, setArchiving] = useState(false);
  const handleArchive = async () => {
    setArchiving(true);
    try {
      await contractsApi.update(archiveTarget!.id, { archived: true, status: "Archived" });
      setContracts(prev => prev.map(c => c.id === archiveTarget!.id ? { ...c, archived: true, status: "Archived" } : c));
      setArchiveTarget(null);
      toast.success(`"${archiveTarget!.name}" archived.`);
    } catch {
      toast.error("Failed to archive contract. Is the backend running?");
    } finally {
      setArchiving(false);
    }
  };

  const handleDownload = (c: RepoContract) => {
    dlCSV(`${c.id}-${c.name.replace(/\s+/g, "-")}.csv`, [
      ["Field", "Value"],
      ["ID", c.id], ["Name", c.name], ["Category", c.category],
      ["Owner", c.owner], ["Start", c.start], ["Expiry", c.expiry],
      ["Value", c.value], ["Status", c.status], ["Risk", c.risk],
    ]);
    toast.success(`Downloaded ${c.id} – ${c.name}`);
  };

  const filtered = contracts.filter(c =>
    !c.archived &&
    (statusFilter === "All" || c.status === statusFilter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated  = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const ef = (k: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm(p => ({ ...p, [k]: e.target.value }));
    setEditErrors(p => ({ ...p, [k]: undefined }));
  };

  return (
    <>
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Contract Repository</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Browse, search, and manage all stored contracts.</p>
        </div>
        <PrimaryBtn icon={Plus} onClick={() => setPage("contract-create")}>Upload Contract</PrimaryBtn>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Technology",  count: 32, color: C.purple },
          { label: "Procurement", count: 28, color: C.teal   },
          { label: "HR",          count: 19, color: C.sky    },
          { label: "Legal",       count: 14, color: C.violet },
        ].map(({ label, count, color }) => (
          <Card key={label} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{ background: `${color}18` }}>
              <FolderOpen size={16} style={{ color }} />
            </div>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input className="w-full pl-9 pr-4 py-2.5 bg-[#F8F9FC] dark:bg-gray-800/70 border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl text-sm placeholder-gray-400 focus:outline-none"
              placeholder="Search contracts…" value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["All", "Active", "Expiring", "Pending"].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                style={statusFilter === s ? { background: G.primary, color: "#fff", borderColor: C.purple } : { backgroundColor: "#fff", color: "#6b7280", borderColor: "#E8EAF0" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8EAF0] dark:border-gray-700/50">
                {["Contract ID", "Contract Name", "Category", "Owner", "Start Date", "Expiry Date", "Status", "Risk", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3.5 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">No contracts match the current filter.</td></tr>
              ) : paginated.map((c, i) => (
                <tr key={c.id} className="border-b border-[#E8EAF0] dark:border-gray-700/50 hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/10 transition-colors">
                  <td className="px-5 py-3.5"><span className="text-xs font-mono font-semibold" style={{ color: C.purple }}>{c.id}</span></td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setPage("contract-detail")} className="text-sm font-semibold text-gray-800 dark:text-gray-100 hover:text-purple-600 transition-colors text-left">{c.name}</button>
                  </td>
                  <td className="px-5 py-3.5"><span className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/60 px-2 py-1 rounded-lg">{c.category}</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Avatar initials={c.owner.split(" ").map(n => n[0]).join("")} size="sm" color={[C.purple, C.teal, C.sky, C.violet][i % 4]} />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{c.owner}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{c.start}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{c.expiry}</td>
                  <td className="px-5 py-3.5"><Badge label={c.status} /></td>
                  <td className="px-5 py-3.5"><Badge label={c.risk} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage("contract-detail")} className="w-7 h-7 rounded-lg hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 flex items-center justify-center transition-colors" title="View">
                        <Eye size={14} style={{ color: C.purple }} />
                      </button>
                      <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-lg hover:bg-[#4BCBEB]/12 flex items-center justify-center transition-colors" title="Edit">
                        <Edit2 size={14} style={{ color: C.sky }} />
                      </button>
                      <button onClick={() => handleDownload(c)} className="w-7 h-7 rounded-lg hover:bg-[#1BCFB4]/12 flex items-center justify-center transition-colors" title="Download">
                        <Download size={14} style={{ color: C.teal }} />
                      </button>
                      <button onClick={() => setArchiveTarget(c)} className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors" title="Archive">
                        <Archive size={14} style={{ color: C.coral }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E8EAF0] dark:border-gray-700/50">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} contracts
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-7 h-7 rounded-lg border border-[#E8EAF0] dark:border-gray-700/50 flex items-center justify-center disabled:opacity-40 hover:bg-[#A05AFF]/8"><ChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)} className="w-7 h-7 rounded-lg text-xs font-semibold border transition-colors"
                style={currentPage === p ? { background: G.primary, color: "#fff", borderColor: "transparent" } : { borderColor: "#E8EAF0", color: "#6b7280" }}>{p}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-7 h-7 rounded-lg border border-[#E8EAF0] dark:border-gray-700/50 flex items-center justify-center disabled:opacity-40 hover:bg-[#A05AFF]/8"><ChevronRight size={14} /></button>
          </div>
        </div>
      </Card>
    </div>

    {/* ══ EDIT MODAL ══ */}
    {editTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={e => { if (e.target === e.currentTarget) closeEdit(); }}>
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.sky}18` }}>
                <Edit2 size={15} style={{ color: C.sky }} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Edit Contract</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">{editTarget.id}</p>
              </div>
            </div>
            <button onClick={closeEdit} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Contract Name<Req /></label>
              <input value={editForm.name} onChange={ef("name")}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none" />
              {editErrors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editErrors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Category</label>
              <select value={editForm.category} onChange={ef("category")}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none appearance-none">
                {["Technology", "Procurement", "HR", "Legal", "Finance", "Marketing", "Facilities"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Owner<Req /></label>
              <input value={editForm.owner} onChange={ef("owner")}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none" />
              {editErrors.owner && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editErrors.owner}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Start Date<Req /></label>
              <input type="date" value={editForm.start} onChange={ef("start")}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none" />
              {editErrors.start && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editErrors.start}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Expiry Date<Req /></label>
              <input type="date" value={editForm.expiry} onChange={ef("expiry")}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none" />
              {editErrors.expiry && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editErrors.expiry}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Status</label>
              <select value={editForm.status} onChange={ef("status")}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none appearance-none">
                {["Active", "Expiring", "Pending", "Archived"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Risk Level</label>
              <select value={editForm.risk} onChange={ef("risk")}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none appearance-none">
                {["Low", "Medium", "High"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-[#E8EAF0] dark:border-gray-700/50">
            <SecondaryBtn onClick={closeEdit} className="flex-1 justify-center">Cancel</SecondaryBtn>
            <button onClick={handleSaveEdit} disabled={editSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
              style={{ background: G.primary }}>
              {editSaving ? <><Spinner />Saving…</> : <><CheckCircle size={14} />Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ══ ARCHIVE CONFIRM ══ */}
    {archiveTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={e => { if (e.target === e.currentTarget && !archiving) setArchiveTarget(null); }}>
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.coral}18` }}>
                <Archive size={15} style={{ color: C.coral }} />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Archive Contract</h3>
            </div>
            <button onClick={() => { if (!archiving) setArchiveTarget(null); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          <div className="rounded-xl p-3 border border-[#E8EAF0] dark:border-gray-700/50" style={{ background: C.bg }}>
            <p className="text-xs text-gray-500 dark:text-gray-400">{archiveTarget.id}</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{archiveTarget.name}</p>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
            <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">Archiving will remove this contract from active views. It can be restored from the archive.</p>
          </div>

          <div className="flex gap-2">
            <SecondaryBtn onClick={() => setArchiveTarget(null)} className="flex-1 justify-center" >Cancel</SecondaryBtn>
            <button onClick={handleArchive} disabled={archiving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
              style={{ backgroundColor: C.coral }}>
              {archiving ? <><Spinner />Archiving…</> : <><Archive size={14} />Confirm Archive</>}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ─── CONTRACT DETAIL PAGE ──────────────────────────────────────────────────────
function ContractDetailPage({ setPage }: { setPage: (p: Page) => void }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [comment, setComment] = useState("");
  const tabs = ["overview", "documents", "obligations", "history", "comments"];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => setPage("contract-repository")} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 hover:text-purple-600 mb-2 transition-colors"><ChevronLeft size={14} /> Back to Repository</button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Global Logistics Agreement</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-500">CTR-2402</span>
            <Badge label="Expiring" /><Badge label="High" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <SecondaryBtn icon={Download}>Download</SecondaryBtn>
          <SecondaryBtn icon={Archive}>Archive</SecondaryBtn>
          <SecondaryBtn icon={Edit2} onClick={() => setPage("contract-create")}>Edit</SecondaryBtn>
          <PrimaryBtn icon={CheckCircle}>Approve</PrimaryBtn>
        </div>
      </div>

      <div className="flex gap-1 bg-white dark:bg-[#1F2937] border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === t ? "text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-200"}`} style={activeTab === t ? { background: G.primary } : {}}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
        {/* ── Contract Health & Lifecycle ── */}
        <Card className="p-5 overflow-hidden relative">
          {/* subtle purple glow backdrop */}
          <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full opacity-[0.06] pointer-events-none" style={{ background: G.primary }} />

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Activity size={16} style={{ color: C.purple }} />
              Contract Health &amp; Lifecycle
            </h3>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${C.coral}18`, color: C.coral }}>Needs Attention</span>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">

            {/* Compliance Score — circular */}
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#F8F9FC] dark:bg-gray-800/60 border border-[#E8EAF0] dark:border-gray-700/40">
              <div className="relative w-12 h-12">
                <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                  <circle cx="22" cy="22" r="17" fill="none" stroke="#E8EAF0" strokeWidth="4" className="dark:stroke-gray-700" />
                  <circle cx="22" cy="22" r="17" fill="none" stroke={C.teal} strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 17}`}
                    strokeDashoffset={`${2 * Math.PI * 17 * (1 - 0.74)}`}
                    strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-gray-800 dark:text-gray-100">74%</span>
              </div>
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 text-center leading-tight">Compliance<br/>Score</p>
            </div>

            {/* Days Remaining */}
            <div className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-[#F8F9FC] dark:bg-gray-800/60 border border-[#E8EAF0] dark:border-gray-700/40">
              <div className="w-9 h-9 rounded-full flex items-center justify-center mb-0.5" style={{ background: `${C.coral}18` }}>
                <Clock size={16} style={{ color: C.coral }} />
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-none">28</p>
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 text-center leading-tight">Days to<br/>Expiry</p>
            </div>

            {/* Pending Obligations */}
            <div className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-[#F8F9FC] dark:bg-gray-800/60 border border-[#E8EAF0] dark:border-gray-700/40">
              <div className="w-9 h-9 rounded-full flex items-center justify-center mb-0.5" style={{ background: `${C.sky}18` }}>
                <ClipboardList size={16} style={{ color: C.sky }} />
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-none">4</p>
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 text-center leading-tight">Pending<br/>Obligations</p>
            </div>

            {/* Renewal Status */}
            <div className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-[#F8F9FC] dark:bg-gray-800/60 border border-[#E8EAF0] dark:border-gray-700/40">
              <div className="w-9 h-9 rounded-full flex items-center justify-center mb-0.5" style={{ background: `${C.purple}18` }}>
                <RefreshCw size={15} style={{ color: C.purple }} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.purple}20`, color: C.purple }}>In Progress</span>
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 text-center leading-tight">Renewal<br/>Status</p>
            </div>

            {/* Risk Level */}
            <div className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-[#F8F9FC] dark:bg-gray-800/60 border border-[#E8EAF0] dark:border-gray-700/40">
              <div className="w-9 h-9 rounded-full flex items-center justify-center mb-0.5" style={{ background: `${C.coral}18` }}>
                <AlertTriangle size={15} style={{ color: C.coral }} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.coral}20`, color: C.coral }}>High</span>
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 text-center leading-tight">Risk<br/>Level</p>
            </div>

            {/* Approval Status */}
            <div className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-[#F8F9FC] dark:bg-gray-800/60 border border-[#E8EAF0] dark:border-gray-700/40">
              <div className="w-9 h-9 rounded-full flex items-center justify-center mb-0.5" style={{ background: `${C.sky}18` }}>
                <BadgeCheck size={15} style={{ color: C.sky }} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.sky}20`, color: C.sky }}>Pending</span>
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 text-center leading-tight">Approval<br/>Status</p>
            </div>
          </div>

          {/* Lifecycle stepper */}
          <div className="border-t border-[#E8EAF0] dark:border-gray-700/40 pt-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Contract Lifecycle</p>
            {(() => {
              const steps: { label: string; icon: any; done: boolean; active: boolean }[] = [
                { label: "Draft",      icon: FileText,    done: true,  active: false },
                { label: "Review",     icon: Eye,         done: true,  active: false },
                { label: "Compliance", icon: ShieldCheck, done: true,  active: false },
                { label: "Approved",   icon: ThumbsUp,    done: true,  active: false },
                { label: "Active",     icon: Zap,         done: false, active: true  },
                { label: "Renewal",    icon: RefreshCw,   done: false, active: false },
              ];
              return (
                <div className="flex items-center gap-0">
                  {steps.map((step, i) => {
                    const Icon = step.icon;
                    const color = step.done ? C.teal : step.active ? C.purple : "#9ca3af";
                    const bg    = step.done ? `${C.teal}18` : step.active ? `${C.purple}18` : "transparent";
                    const borderColor = step.done ? C.teal : step.active ? C.purple : "#E8EAF0";
                    return (
                      <div key={step.label} className="flex items-center flex-1 min-w-0">
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
                            style={{ background: bg, borderColor }}
                          >
                            {step.done
                              ? <CheckCircle size={14} style={{ color: C.teal }} />
                              : <Icon size={13} style={{ color }} />
                            }
                          </div>
                          <span
                            className="text-[9px] font-bold uppercase tracking-wide whitespace-nowrap hidden sm:block"
                            style={{ color }}
                          >
                            {step.label}
                          </span>
                          {step.active && (
                            <span className="hidden sm:block text-[8px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${C.purple}20`, color: C.purple }}>Current</span>
                          )}
                        </div>
                        {i < steps.length - 1 && (
                          <div className="flex-1 mx-1 h-0.5 rounded-full" style={{ background: step.done ? C.teal : "#E8EAF0" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-2 space-y-5">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Contract Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {[["Contract ID", "CTR-2402"], ["Category", "Procurement"], ["Owner", "James Miller"], ["Department", "Supply Chain"], ["Start Date", "2023-06-01"], ["Expiry Date", "2024-07-31"], ["Contract Value", "$85,000"], ["Status", "Expiring"]].map(([k, v]) => (
                  <div key={k}><p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">{k}</p><p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{v}</p></div>
                ))}
              </div>
            </div>
            <div className="border-t border-[#E8EAF0] dark:border-gray-700/50 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Description</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">This Global Logistics Agreement governs the terms of service between ContractIQ Corp and FastTrack Logistics Inc. for international freight forwarding, warehousing, and last-mile delivery services across North America and Europe.</p>
            </div>
            <div className="border-t border-[#E8EAF0] dark:border-gray-700/50 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Approval Timeline</h4>
              <div className="space-y-3">
                {[
                  { label: "Submitted",       user: "James Miller", date: "June 1, 2023",   done: true  },
                  { label: "Legal Review",    user: "Sarah Chen",   date: "June 5, 2023",   done: true  },
                  { label: "Compliance Check",user: "Priya Nair",   date: "June 10, 2023",  done: true  },
                  { label: "Final Approval",  user: "Tom Reeves",   date: "Pending",         done: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: step.done ? C.teal : "#E8EAF0", color: step.done ? "white" : "#9ca3af" }}>{step.done ? "✓" : i + 1}</div>
                    <div className="flex-1"><p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{step.label}</p><p className="text-xs text-gray-400 dark:text-gray-500">{step.user} · {step.date}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <div className="space-y-4">
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Assigned Users</h4>
              <div className="space-y-2.5">
                {[{ name: "James Miller", role: "Contract Manager", initials: "JM" }, { name: "Sarah Chen", role: "Legal Reviewer", initials: "SC" }, { name: "Priya Nair", role: "Compliance Officer", initials: "PN" }].map(u => (
                  <div key={u.name} className="flex items-center gap-2.5">
                    <Avatar initials={u.initials} size="sm" color={C.teal} />
                    <div><p className="text-xs font-semibold text-gray-800 dark:text-gray-100">{u.name}</p><p className="text-xs text-gray-500 dark:text-gray-500">{u.role}</p></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Uploaded Documents</h4>
              <div className="space-y-2">
                {["Contract_v1.pdf", "Amendment_A.pdf", "Appendix_SLA.pdf"].map(doc => (
                  <div key={doc} className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F9FC] dark:bg-gray-800/70 border border-[#E8EAF0] dark:border-gray-700/50">
                    <FileText size={14} style={{ color: C.purple }} />
                    <span className="text-xs text-gray-700 dark:text-gray-200 flex-1 truncate">{doc}</span>
                    <Download size={12} className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-purple-500" />
                  </div>
                ))}
              </div>
              <button className="mt-2 w-full text-xs font-semibold py-2 rounded-lg border border-dashed border-[#E8EAF0] dark:border-gray-700/50 hover:border-purple-300 hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 transition-all" style={{ color: C.purple }}>+ Upload Document</button>
            </Card>
          </div>
        </div>
        </>
      )}

      {activeTab === "comments" && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Comments & Discussion</h3>
          <div className="space-y-4 mb-4">
            {[
              { user: "Sarah Chen", initials: "SC", time: "June 10, 2023 09:14", text: "Legal review complete. All clauses are in compliance with current regulations. Recommend approval." },
              { user: "Priya Nair", initials: "PN", time: "June 11, 2023 14:30", text: "Compliance check passed. Minor note on GDPR clause 7.3 — updated in Amendment A." },
            ].map(c => (
              <div key={c.user} className="flex gap-3">
                <Avatar initials={c.initials} size="sm" color={C.teal} />
                <div className="flex-1 bg-[#F8F9FC] dark:bg-gray-800/70 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{c.user}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{c.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Avatar initials="TR" size="sm" />
            <div className="flex-1 flex gap-2">
              <input className="flex-1 border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-3 py-2 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 focus:outline-none" placeholder="Add a comment…" value={comment} onChange={e => setComment(e.target.value)} />
              <button className="px-4 py-2 rounded-xl text-white text-sm" style={{ background: G.primary }}><Send size={14} /></button>
            </div>
          </div>
        </Card>
      )}

      {(activeTab === "documents" || activeTab === "obligations" || activeTab === "history") && (
        <Card className="p-5"><p className="text-sm text-gray-500 dark:text-gray-500 text-center py-8">Content for the <strong>{activeTab}</strong> tab would appear here.</p></Card>
      )}
    </div>
  );
}

// ─── CONTRACT CREATE ────────────────────────────────────────────────────────────
function ContractCreatePage({ setPage, onContractCreated }: { setPage: (p: Page) => void; onContractCreated: (c: RepoContract) => void }) {
  const [step, setStep] = useState(0);
  const steps = ["Basic Info", "Parties & Dates", "Documents", "Review & Submit"];

  const [ccForm, setCcForm] = useState({ title: "", counterparty: "", cpEmail: "", effectiveDate: "", expiryDate: "" });
  const [ccCategory, setCcCategory] = useState("Technology");
  const [ccOwner,    setCcOwner]    = useState("Sarah Chen – Legal Manager");
  const [ccStatus,   setCcStatus]   = useState("Draft");
  const [ccRisk,     setCcRisk]     = useState("Low");
  const [ccFile,     setCcFile]     = useState<File | null>(null);
  const [ccDragOver, setCcDragOver] = useState(false);
  const ccFileInputRef = useRef<HTMLInputElement>(null);
  const handleCcFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setCcDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setCcFile(file);
  };
  const [ccErrors, setCcErrors] = useState<Record<string, string>>({});
  const clr = (k: string) => setCcErrors(p => ({ ...p, [k]: "" }));

  const validateStep = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!ccForm.title.trim()) e.title = "Contract title is required";
    }
    if (step === 1) {
      if (!ccForm.counterparty.trim()) e.counterparty = "Counterparty name is required";
      if (!ccForm.cpEmail.trim()) e.cpEmail = "Counterparty email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ccForm.cpEmail)) e.cpEmail = "Enter a valid email address";
      if (!ccForm.effectiveDate) e.effectiveDate = "Effective date is required";
      if (!ccForm.expiryDate) e.expiryDate = "Expiry date is required";
    }
    setCcErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => setPage("contracts")} className="text-gray-400 hover:text-gray-600 dark:text-gray-300"><ChevronLeft size={20} /></button>
        <div><h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Create New Contract</h1><p className="text-sm text-gray-500 dark:text-gray-500">Fill in the details to create a new contract</p></div>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#E8EAF0] z-0" />
          {steps.map((s, i) => (
            <div key={s} className="relative z-10 flex flex-col items-center gap-1.5">
              <button onClick={() => setStep(i)} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${i <= step ? "text-white border-transparent" : "text-gray-400 dark:text-gray-500 border-[#E8EAF0] dark:border-gray-700/50 bg-white"}`} style={i <= step ? { background: G.primary } : {}}>
                {i < step ? "✓" : i + 1}
              </button>
              <span className={`text-xs font-semibold ${i <= step ? "text-purple-600" : "text-gray-400 dark:text-gray-500"}`}>{s}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2 space-y-4">
          {step === 0 && (<>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Basic Information</h3>
            <div>
              <Input label="Contract Title" placeholder="e.g. Microsoft Azure SLA Agreement" value={ccForm.title} onChange={(e: any) => { setCcForm(f => ({ ...f, title: e.target.value })); clr("title"); }} required />
              {ccErrors.title && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{ccErrors.title}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Description</label>
              <textarea rows={4} className="w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none resize-none" placeholder="Describe the purpose and scope of this contract…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Category" options={["Technology", "Procurement", "HR", "Legal", "Finance", "Marketing", "Facilities"]} value={ccCategory} onChange={(e: any) => setCcCategory(e.target.value)} />
              <Select label="Department" options={["Legal", "Procurement", "HR", "Finance", "Technology", "Operations", "Marketing"]} />
            </div>
            <Select label="Contract Owner" options={["Sarah Chen – Legal Manager", "James Miller – Contract Manager", "Priya Nair – Compliance Officer", "Daniel Park – Dept Head", "Tom Reeves – Administrator"]} value={ccOwner} onChange={(e: any) => setCcOwner(e.target.value)} />
          </>)}
          {step === 1 && (<>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Parties & Dates</h3>
            <div>
              <Input label="Counterparty Name" placeholder="e.g. FastTrack Logistics Inc." icon={Building2} value={ccForm.counterparty} onChange={(e: any) => { setCcForm(f => ({ ...f, counterparty: e.target.value })); clr("counterparty"); }} required />
              {ccErrors.counterparty && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{ccErrors.counterparty}</p>}
            </div>
            <div>
              <Input label="Counterparty Email" type="email" placeholder="contact@vendor.com" icon={Mail} value={ccForm.cpEmail} onChange={(e: any) => { setCcForm(f => ({ ...f, cpEmail: e.target.value })); clr("cpEmail"); }} required />
              {ccErrors.cpEmail && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{ccErrors.cpEmail}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input label="Effective Date" type="date" value={ccForm.effectiveDate} onChange={(e: any) => { setCcForm(f => ({ ...f, effectiveDate: e.target.value })); clr("effectiveDate"); }} required />
                {ccErrors.effectiveDate && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{ccErrors.effectiveDate}</p>}
              </div>
              <div>
                <Input label="Expiry Date" type="date" value={ccForm.expiryDate} onChange={(e: any) => { setCcForm(f => ({ ...f, expiryDate: e.target.value })); clr("expiryDate"); }} required />
                {ccErrors.expiryDate && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{ccErrors.expiryDate}</p>}
              </div>
            </div>
            <Input label="Contract Value ($)" placeholder="e.g. 85000" icon={Target} />
            <Select label="Status" options={["Draft", "Pending Review", "Active", "Archived"]} value={ccStatus} onChange={(e: any) => setCcStatus(e.target.value)} />
          </>)}
          {step === 2 && (<>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Upload Documents</h3>
            <input
              ref={ccFileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) setCcFile(f); }}
            />
            <div
              onClick={() => ccFileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setCcDragOver(true); }}
              onDragLeave={() => setCcDragOver(false)}
              onDrop={handleCcFileDrop}
              className="border-2 border-dashed border-[#E8EAF0] dark:border-gray-700/50 rounded-xl p-8 text-center hover:border-purple-300 hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 transition-all cursor-pointer"
              style={ccDragOver ? { borderColor: C.purple, background: `${C.purple}10` } : ccFile ? { borderColor: C.teal } : {}}
            >
              <Upload size={32} className="mx-auto mb-3" style={{ color: ccFile ? C.teal : C.purple }} />
              {ccFile ? (
                <>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 break-all">{ccFile.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{(ccFile.size / 1024).toFixed(1)} KB · Click to change</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Drag & drop files here</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF, DOCX, XLSX up to 50MB</p>
                </>
              )}
              <button
                onClick={e => { e.stopPropagation(); ccFileInputRef.current?.click(); }}
                className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold border border-[#E8EAF0] dark:border-gray-700/50 hover:bg-white transition-all"
                style={{ color: C.purple }}
              >
                {ccFile ? "Change File" : "Browse Files"}
              </button>
            </div>
          </>)}
          {step === 3 && (<>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Review & Submit</h3>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle size={18} style={{ color: C.teal }} className="flex-shrink-0 mt-0.5" />
              <div><p className="text-sm font-semibold text-green-800">All information looks good!</p><p className="text-xs text-green-600 mt-0.5">Review the summary and submit for approval workflow.</p></div>
            </div>
            <div className="space-y-2">
              {[["Title", ccForm.title || "—"], ["Category", ccCategory], ["Owner", ccOwner.split(" – ")[0]], ["Counterparty", ccForm.counterparty || "—"], ["Effective Date", ccForm.effectiveDate || "—"], ["Expiry Date", ccForm.expiryDate || "—"], ["Status", ccStatus]].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-[#E8EAF0] dark:border-gray-700/50 last:border-0">
                  <span className="text-xs text-gray-500 dark:text-gray-500">{k}</span><span className="text-xs font-semibold text-gray-800 dark:text-gray-100">{v}</span>
                </div>
              ))}
            </div>
          </>)}
          <div className="flex justify-between pt-2">
            <SecondaryBtn onClick={() => setStep(s => Math.max(0, s - 1))} icon={ChevronLeft} className={step === 0 ? "opacity-0 pointer-events-none" : ""}>Previous</SecondaryBtn>
            {step < steps.length - 1
              ? <PrimaryBtn onClick={handleNext} icon={ChevronRight}>Next Step</PrimaryBtn>
              : <PrimaryBtn icon={CheckCircle} onClick={() => {
                  const id = `CTR-${2400 + Math.floor(Math.random() * 900) + 100}`;
                  const newContract: RepoContract = {
                    id,
                    name: ccForm.title.trim() || "Untitled Contract",
                    category: ccCategory,
                    owner: ccOwner.split(" – ")[0],
                    start: ccForm.effectiveDate,
                    expiry: ccForm.expiryDate,
                    status: ccStatus === "Pending Review" ? "Pending" : ccStatus,
                    risk: ccRisk,
                  };
                  onContractCreated(newContract);
                  toast.success(`Contract "${newContract.name}" submitted for approval.`);
                  setPage("contracts");
                }}>Submit for Approval</PrimaryBtn>}
          </div>
        </Card>
        <Card className="p-4 h-fit">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Approval Workflow</h4>
          <div className="space-y-2">
            {[{ role: "Contract Manager", status: "Auto-assigned" }, { role: "Legal Reviewer", status: "Pending" }, { role: "Compliance Check", status: "Pending" }, { role: "Final Approval", status: "Pending" }].map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F9FC] dark:bg-gray-800/70">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: i === 0 ? C.teal : "#d1d5db" }}>{i + 1}</div>
                <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{a.role}</p><p className="text-xs text-gray-400 dark:text-gray-500">{a.status}</p></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── CONTRACT APPROVAL PAGE (Legal role) ──────────────────────────────────────
type ApprovalItem = {
  id: string; name: string; submitter: string; submitted: string; urgency: string;
  resolvedAt?: string; resolvedBy?: string; reason?: string; escalatedTo?: string;
};

function ContractApprovalPage({ setPage }: { setPage: (p: Page) => void }) {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");

  // live lists – seed from static data
  const [pending,  setPending]  = useState<ApprovalItem[]>(pendingApprovalsList.map(a => ({ ...a })));
  const [approved, setApproved] = useState<ApprovalItem[]>([
    { id: "CTR-2395", name: "Office Supplies Agreement",   submitter: "Emma Walsh",  submitted: "2024-06-20", urgency: "Low",    resolvedAt: "2024-06-22", resolvedBy: "Sarah Chen" },
    { id: "CTR-2397", name: "IT Support Contract",         submitter: "Tom Reeves",  submitted: "2024-06-24", urgency: "Medium", resolvedAt: "2024-06-25", resolvedBy: "Sarah Chen" },
  ]);
  const [rejected, setRejected] = useState<ApprovalItem[]>([
    { id: "CTR-2390", name: "Legacy Vendor Agreement",     submitter: "Daniel Park", submitted: "2024-06-10", urgency: "Low",    resolvedAt: "2024-06-12", resolvedBy: "Sarah Chen", reason: "Outdated terms, requires renegotiation." },
  ]);

  // ── Reject modal ──
  const [rejectTarget, setRejectTarget] = useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError,  setRejectError]  = useState("");
  const [rejecting,    setRejecting]    = useState(false);

  // ── Escalate modal ──
  const [escalateTarget,   setEscalateTarget]   = useState<ApprovalItem | null>(null);
  const [escalateTo,       setEscalateTo]       = useState("Tom Reeves – Administrator");
  const [escalateNote,     setEscalateNote]     = useState("");
  const [escalateError,    setEscalateError]    = useState("");
  const [escalating,       setEscalating]       = useState(false);
  const [escalateDone,     setEscalateDone]     = useState(false);

  // ── Approve ──
  const handleApprove = (item: ApprovalItem) => {
    const resolved = { ...item, resolvedAt: new Date().toISOString().slice(0, 10), resolvedBy: "Sarah Chen" };
    setPending(p => p.filter(x => x.id !== item.id));
    setApproved(p => [resolved, ...p]);
    toast.success(`"${item.name}" approved successfully.`);
  };

  // ── Reject helpers ──
  const openReject = (item: ApprovalItem) => { setRejectTarget(item); setRejectReason(""); setRejectError(""); };
  const closeReject = () => { if (rejecting) return; setRejectTarget(null); setRejectReason(""); setRejectError(""); };
  const handleReject = () => {
    if (!rejectReason.trim()) { setRejectError("Please provide a reason for rejection."); return; }
    setRejecting(true);
    setTimeout(() => {
      const resolved = { ...rejectTarget!, resolvedAt: new Date().toISOString().slice(0, 10), resolvedBy: "Sarah Chen", reason: rejectReason.trim() };
      setPending(p => p.filter(x => x.id !== rejectTarget!.id));
      setRejected(p => [resolved, ...p]);
      setRejecting(false);
      setRejectTarget(null);
      toast.error(`"${resolved.name}" has been rejected.`);
    }, 1200);
  };

  // ── Escalate helpers ──
  const openEscalate = (item: ApprovalItem) => { setEscalateTarget(item); setEscalateTo("Tom Reeves – Administrator"); setEscalateNote(""); setEscalateError(""); setEscalateDone(false); };
  const closeEscalate = () => { if (escalating) return; setEscalateTarget(null); setEscalateDone(false); };
  const handleEscalate = () => {
    if (!escalateTo) { setEscalateError("Please select an escalation recipient."); return; }
    setEscalating(true);
    setTimeout(() => {
      setPending(p => p.map(x => x.id === escalateTarget!.id ? { ...x, urgency: "High", escalatedTo: escalateTo.split(" – ")[0] } : x));
      setEscalating(false);
      setEscalateDone(true);
      toast.success(`"${escalateTarget!.name}" escalated to ${escalateTo.split(" – ")[0]}.`);
    }, 1200);
  };

  const handleDownload = (item: ApprovalItem) => {
    dlCSV(`${item.id}-${item.name.replace(/\s+/g, "-")}.csv`, [
      ["Field", "Value"],
      ["ID", item.id], ["Name", item.name], ["Submitter", item.submitter],
      ["Submitted", item.submitted], ["Urgency", item.urgency],
    ]);
    toast.success(`Downloaded ${item.id} – ${item.name}`);
  };

  const allTime = 89 + approved.length - 2 + rejected.length - 1; // base + dynamic delta

  const urgencyColor = (u: string) => u === "High" ? C.coral : u === "Medium" ? C.sky : C.teal;

  const tabCounts = { pending: pending.length, approved: approved.length, rejected: rejected.length };

  const renderCard = (a: ApprovalItem, tab: "pending" | "approved" | "rejected") => (
    <Card key={a.id} className="p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: tab === "approved" ? `${C.teal}15` : tab === "rejected" ? `${C.coral}15` : a.urgency === "High" ? `${C.coral}18` : `${C.purple}12` }}>
          <FileText size={20} style={{ color: tab === "approved" ? C.teal : tab === "rejected" ? C.coral : urgencyColor(a.urgency) }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{a.id}</span>
            <Badge label={a.urgency} />
            {tab === "approved" && <Badge label="Approved" />}
            {tab === "rejected" && <Badge label="Rejected" />}
            {a.escalatedTo && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${C.sky}18`, color: C.sky }}>↑ Escalated to {a.escalatedTo}</span>}
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{a.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Submitted by {a.submitter} · {a.submitted}
            {a.resolvedAt && <> · <span className="font-medium">{tab === "approved" ? "Approved" : "Rejected"} {a.resolvedAt} by {a.resolvedBy}</span></>}
          </p>
          {a.reason && <p className="text-xs mt-1 italic" style={{ color: C.coral }}>Reason: {a.reason}</p>}
          <div className="flex items-center gap-4 mt-3">
            <button onClick={() => setPage("contract-detail")} className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: C.purple }}>
              <Eye size={12} /> Review Contract
            </button>
            <button onClick={() => handleDownload(a)} className="text-xs font-semibold flex items-center gap-1 text-gray-500 dark:text-gray-400 transition-opacity hover:opacity-70">
              <Download size={12} /> Download
            </button>
          </div>
        </div>
        {tab === "pending" && (
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button onClick={() => handleApprove(a)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: C.teal }}>
              ✓ Approve
            </button>
            <button onClick={() => openReject(a)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95">
              ✕ Reject
            </button>
            <button onClick={() => openEscalate(a)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-[#E8EAF0] dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-all active:scale-95">
              ↑ Escalate
            </button>
          </div>
        )}
      </div>
    </Card>
  );

  const listForTab = activeTab === "pending" ? pending : activeTab === "approved" ? approved : rejected;

  return (
    <>
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Contract Approval</h1>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">Review and approve contracts submitted for legal sign-off.</p>
        </div>
      </div>

      {/* Dynamic stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pending",  value: pending.length,  color: C.sky    },
          { label: "Approved", value: approved.length, color: C.teal   },
          { label: "Rejected", value: rejected.length, color: C.coral  },
          { label: "All Time", value: allTime,         color: C.purple },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4 text-center">
            <p className="text-2xl font-bold transition-all duration-300" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* Tabs with live counts */}
      <div className="flex gap-1 bg-white dark:bg-[#1F2937] border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl p-1 w-fit">
        {(["pending", "approved", "rejected"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === t ? "text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-200"}`}
            style={activeTab === t ? { background: G.primary } : {}}>
            {t}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold transition-all ${activeTab === t ? "bg-white/25 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"}`}>
              {tabCounts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* Contract list */}
      <div className="space-y-3">
        {listForTab.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: activeTab === "approved" ? `${C.teal}15` : activeTab === "rejected" ? `${C.coral}15` : `${C.purple}12` }}>
              <CheckCircle size={22} style={{ color: activeTab === "approved" ? C.teal : activeTab === "rejected" ? C.coral : C.purple }} />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {activeTab === "pending" ? "No pending approvals" : activeTab === "approved" ? "No approved contracts yet" : "No rejected contracts"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {activeTab === "pending" ? "All contracts have been reviewed." : "Items will appear here once processed."}
            </p>
          </Card>
        ) : (
          listForTab.map(a => renderCard(a, activeTab))
        )}
      </div>
    </div>

    {/* ── Reject Modal ── */}
    {rejectTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={e => { if (e.target === e.currentTarget) closeReject(); }}>
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#fee2e2" }}>
                <XCircle size={15} className="text-red-500" />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Reject Contract</h3>
            </div>
            <button onClick={closeReject} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>
          <div className="rounded-xl p-3 border border-[#E8EAF0] dark:border-gray-700/50" style={{ background: C.bg }}>
            <p className="text-xs text-gray-500 dark:text-gray-400">{rejectTarget.id}</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{rejectTarget.name}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-0.5">
              Reason for Rejection<Req />
            </label>
            <textarea
              rows={3}
              className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none resize-none"
              placeholder="Explain why this contract is being rejected…"
              value={rejectReason}
              onChange={e => { setRejectReason(e.target.value); setRejectError(""); }}
            />
            {rejectError && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{rejectError}</p>}
          </div>
          <div className="flex gap-2 pt-1">
            <SecondaryBtn onClick={closeReject} className="flex-1 justify-center">Cancel</SecondaryBtn>
            <button onClick={handleReject} disabled={rejecting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold bg-red-500 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
              {rejecting ? <><Spinner />Rejecting…</> : <><XCircle size={14} />Confirm Reject</>}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Escalate Modal ── */}
    {escalateTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={e => { if (e.target === e.currentTarget) closeEscalate(); }}>
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.sky}18` }}>
                <ArrowUpRight size={15} style={{ color: C.sky }} />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Escalate Contract</h3>
            </div>
            <button onClick={closeEscalate} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>
          {!escalateDone ? (
            <>
              <div className="rounded-xl p-3 border border-[#E8EAF0] dark:border-gray-700/50" style={{ background: C.bg }}>
                <p className="text-xs text-gray-500 dark:text-gray-400">{escalateTarget.id}</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{escalateTarget.name}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Escalate To<Req /></label>
                <select value={escalateTo} onChange={e => { setEscalateTo(e.target.value); setEscalateError(""); }}
                  className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none appearance-none">
                  {["Tom Reeves – Administrator", "Priya Nair – Compliance Officer", "James Miller – Contract Manager", "Daniel Park – Department Head"].map(o => <option key={o}>{o}</option>)}
                </select>
                {escalateError && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{escalateError}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Notes <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea rows={2}
                  className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none resize-none"
                  placeholder="Add context for the reviewer…"
                  value={escalateNote}
                  onChange={e => setEscalateNote(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-1">
                <SecondaryBtn onClick={closeEscalate} className="flex-1 justify-center">Cancel</SecondaryBtn>
                <button onClick={handleEscalate} disabled={escalating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: G.sky }}>
                  {escalating ? <><Spinner />Escalating…</> : <><ArrowUpRight size={14} />Escalate</>}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-2 space-y-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${C.sky}18` }}>
                <CheckCircle size={26} style={{ color: C.sky }} />
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">Escalated successfully</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Sent to <span className="font-semibold" style={{ color: C.sky }}>{escalateTo.split(" – ")[0]}</span> for review.
                </p>
              </div>
              <button onClick={closeEscalate}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: G.primary }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}

// ─── OBLIGATIONS ───────────────────────────────────────────────────────────────
function ObligationsPage({ role = "administrator" }: { role?: UserRole }) {
  const isEmployee = role === "employee";
  const [obligations, setObligations] = useState(obligationsData.map((o) => ({ ...o })));
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressTarget, setProgressTarget] = useState<(typeof obligationsData)[0] | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [oErrors, setOErrors] = useState<Record<string, string>>({});
  const [oForm, setOForm] = useState({ name: "", person: "", due: "", status: "Pending" });
  const [nextId, setNextId] = useState(obligationsData.length + 1);

  // ── Edit obligation ──
  type OblForm = { name: string; person: string; due: string; status: string };
  const [editOblTarget, setEditOblTarget] = useState<typeof obligationsData[0] | null>(null);
  const [editOblForm,   setEditOblForm]   = useState<OblForm>({ name: "", person: "", due: "", status: "" });
  const [editOblErrors, setEditOblErrors] = useState<Partial<OblForm>>({});
  const [editOblSaving, setEditOblSaving] = useState(false);

  const openEditObl = (o: typeof obligationsData[0]) => {
    setEditOblTarget(o);
    setEditOblForm({ name: o.name, person: o.person, due: o.due, status: o.status });
    setEditOblErrors({});
  };
  const closeEditObl = () => { if (editOblSaving) return; setEditOblTarget(null); };
  const handleSaveObl = () => {
    const errs: Partial<OblForm> = {};
    if (!editOblForm.name.trim())   errs.name   = "Obligation name is required.";
    if (!editOblForm.person.trim()) errs.person = "Responsible person is required.";
    if (!editOblForm.due)           errs.due    = "Due date is required.";
    setEditOblErrors(errs);
    if (Object.keys(errs).length) return;
    setEditOblSaving(true);
    setTimeout(() => {
      setObligations(prev => prev.map(o => o.id === editOblTarget!.id ? { ...o, ...editOblForm } : o));
      setEditOblSaving(false);
      setEditOblTarget(null);
      toast.success(`"${editOblForm.name}" updated.`);
    }, 1000);
  };

  // ── Complete confirmation (non-employee, for in-progress items) ──
  const [completeTarget, setCompleteTarget] = useState<typeof obligationsData[0] | null>(null);
  const [completing, setCompleting] = useState(false);

  const handleCompleteClick = (o: typeof obligationsData[0]) => {
    if (o.status === "Completed") return;
    // If already has meaningful progress, show confirm; otherwise complete directly
    if (o.progress > 0 && o.progress < 100) {
      setCompleteTarget(o);
    } else {
      applyComplete(o.id, o.name);
    }
  };
  const applyComplete = (id: number, name: string) => {
    setObligations(prev => prev.map(o => o.id === id ? { ...o, progress: 100, status: "Completed" } : o));
    toast.success(`"${name}" marked as complete.`);
  };
  const handleConfirmComplete = () => {
    setCompleting(true);
    setTimeout(() => {
      applyComplete(completeTarget!.id, completeTarget!.name);
      setCompleting(false);
      setCompleteTarget(null);
    }, 800);
  };

  const columns = ["Pending", "In Progress", "Completed", "Overdue", "Delayed"];

  const validateObligation = () => {
    const e: Record<string, string> = {};
    if (!oForm.name.trim()) e.name = "Obligation name is required";
    if (!oForm.person.trim()) e.person = "Responsible person is required";
    if (!oForm.due) e.due = "Due date is required";
    return e;
  };

  const handleAddObligation = () => {
    const e = validateObligation();
    if (Object.keys(e).length) { setOErrors(e); return; }
    setOErrors({});
    setAdding(true);
    setTimeout(() => {
      const id = nextId;
      setNextId(n => n + 1);
      const newOb = { id, name: oForm.name.trim(), person: oForm.person.trim(), due: oForm.due, progress: 0, status: oForm.status };
      setObligations(prev => [newOb, ...prev]);
      setHighlightId(id);
      setTimeout(() => setHighlightId(null), 2200);
      setAdding(false);
      setAddOpen(false);
      setOForm({ name: "", person: "", due: "", status: "Pending" });
      toast.success(`Obligation "${newOb.name}" added successfully.`);
    }, 1400);
  };

  const closeAdd = () => {
    if (adding) return;
    setAddOpen(false);
    setOErrors({});
    setOForm({ name: "", person: "", due: "", status: "Pending" });
  };

  const openProgress = (o: typeof obligationsData[0]) => {
    setProgressTarget(o);
    setProgressValue(o.progress);
    setProgressOpen(true);
  };
  const handleSaveProgress = () => {
    if (!progressTarget) return;
    setObligations(prev => prev.map(o => o.id === progressTarget.id
      ? { ...o, progress: progressValue, status: progressValue === 100 ? "Completed" : o.status === "Completed" ? "In Progress" : o.status }
      : o));
    toast.success(`Progress updated to ${progressValue}%`);
    setProgressOpen(false);
    setProgressTarget(null);
  };
  const handleMarkComplete = (id: number) => {
    setObligations(prev => prev.map(o => o.id === id ? { ...o, progress: 100, status: "Completed" } : o));
    toast.success("Task marked as complete.");
  };

  const counts = {
    Total:       obligations.length,
    Pending:     obligations.filter(o => o.status === "Pending").length,
    "In Progress": obligations.filter(o => o.status === "In Progress").length,
    Completed:   obligations.filter(o => o.status === "Completed").length,
    Overdue:     obligations.filter(o => o.status === "Overdue").length,
  };

  return (
    <>
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{isEmployee ? "My Tasks" : "Obligation Tracker"}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{isEmployee ? "Track your assigned tasks and update progress" : "Monitor and manage all contract obligations"}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl p-1">
            {(["table", "kanban"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${view === v ? "text-white" : "text-gray-500 dark:text-gray-400"}`} style={view === v ? { background: G.primary } : {}}>{v}</button>
            ))}
          </div>
          {!isEmployee && role !== "department-head" && <PrimaryBtn icon={Plus} onClick={() => setAddOpen(true)}>Add Obligation</PrimaryBtn>}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[{ label: "Total", value: counts.Total, color: C.purple }, { label: "Pending", value: counts.Pending, color: C.sky }, { label: "In Progress", value: counts["In Progress"], color: C.violet }, { label: "Completed", value: counts.Completed, color: C.teal }, { label: "Overdue", value: counts.Overdue, color: C.coral }].map(({ label, value, color }) => (
          <Card key={label} className="p-3 text-center"><p className="text-2xl font-bold" style={{ color }}>{value}</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p></Card>
        ))}
      </div>

      {view === "table" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-[#E8EAF0] dark:border-gray-700/50">{(isEmployee ? ["Task", "Due Date", "Progress", "Status", "Actions"] : ["Obligation", "Responsible", "Due Date", "Progress", "Status", "Actions"]).map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3.5 uppercase tracking-wide">{h}</th>)}</tr></thead>
              <tbody>
                {obligations.map(o => (
                  <tr key={o.id} className={`border-b border-[#E8EAF0] dark:border-gray-700/50 transition-all duration-700 ${o.id === highlightId ? "bg-[#A05AFF]/8" : "hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15/30"}`}>
                    <td className="px-5 py-3.5"><p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{o.name}</p></td>
                    {!isEmployee && <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Avatar initials={o.person.split(" ").map(n => n[0]).join("")} size="sm" color={C.violet} />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{o.person}</span>
                      </div>
                    </td>}
                    <td className="px-5 py-3.5"><div className="flex items-center gap-1.5"><Calendar size={13} style={{ color: o.status === "Overdue" ? C.coral : C.sky }} /><span className="text-sm text-gray-600 dark:text-gray-300">{o.due}</span></div></td>
                    <td className="px-5 py-3.5 w-36">
                      <div className="flex items-center gap-2">
                        <div className="flex-1"><ProgressBar value={o.progress} color={o.status === "Completed" ? C.teal : o.status === "Overdue" ? C.coral : C.purple} /></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">{o.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><Badge label={o.status} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {isEmployee ? (
                          <>
                            <button onClick={() => openProgress(o)} className="w-7 h-7 rounded-lg hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 flex items-center justify-center transition-colors" title="Update Progress"><Activity size={13} style={{ color: C.purple }} /></button>
                            {o.status !== "Completed" && <button onClick={() => handleMarkComplete(o.id)} className="w-7 h-7 rounded-lg hover:bg-[#1BCFB4]/12 flex items-center justify-center transition-colors" title="Mark Complete"><CheckCircle size={13} style={{ color: C.teal }} /></button>}
                          </>
                        ) : (
                          <>
                            <button onClick={() => openEditObl(o)} className="w-7 h-7 rounded-lg hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 flex items-center justify-center transition-colors" title="Edit obligation">
                              <Edit2 size={13} style={{ color: C.purple }} />
                            </button>
                            {o.status !== "Completed" && (
                              <button onClick={() => handleCompleteClick(o)} className="w-7 h-7 rounded-lg hover:bg-[#1BCFB4]/12 flex items-center justify-center transition-colors" title="Mark complete">
                                <CheckCircle size={13} style={{ color: C.teal }} />
                              </button>
                            )}
                            {o.status === "Completed" && (
                              <span className="w-7 h-7 flex items-center justify-center" title="Already completed">
                                <CheckCircle size={13} style={{ color: C.teal }} />
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {columns.map(col => {
            const items = obligations.filter(o => o.status === col);
            return (
              <div key={col} className="bg-white dark:bg-[#1F2937] rounded-2xl border border-[#E8EAF0] dark:border-gray-700/50 p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{col}</span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map(o => (
                    <div key={o.id} className={`rounded-xl p-3 border transition-all duration-700 ${o.id === highlightId ? "border-[#A05AFF]/40 bg-[#A05AFF]/5" : "bg-[#F8F9FC] dark:bg-gray-800/70 border-[#E8EAF0] dark:border-gray-700/50"}`}>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mb-1">{o.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{o.person}</p>
                      <ProgressBar value={o.progress} color={o.status === "Completed" ? C.teal : o.status === "Overdue" ? C.coral : C.purple} />
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{o.due}</span>
                        <span className="text-xs font-bold" style={{ color: o.status === "Completed" ? C.teal : o.status === "Overdue" ? C.coral : C.purple }}>{o.progress}%</span>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">No items</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* ── Add Obligation Modal ── */}
    {addOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={e => { if (e.target === e.currentTarget) closeAdd(); }}>
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.teal}18` }}>
                <CheckSquare size={15} style={{ color: C.teal }} />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Add Obligation</h3>
            </div>
            <button onClick={closeAdd} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={15} className="text-gray-500" /></button>
          </div>
          <div className="space-y-3">
            <div>
              <Input label="Obligation Name" placeholder="e.g. Quarterly Compliance Report" value={oForm.name} onChange={(e: any) => { setOForm(f => ({ ...f, name: e.target.value })); setOErrors(err => ({ ...err, name: "" })); }} required />
              {oErrors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{oErrors.name}</p>}
            </div>
            <div>
              <Input label="Responsible Person" placeholder="e.g. Priya Nair" value={oForm.person} onChange={(e: any) => { setOForm(f => ({ ...f, person: e.target.value })); setOErrors(err => ({ ...err, person: "" })); }} icon={User} required />
              {oErrors.person && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{oErrors.person}</p>}
            </div>
            <div>
              <Input label="Due Date" type="date" value={oForm.due} onChange={(e: any) => { setOForm(f => ({ ...f, due: e.target.value })); setOErrors(err => ({ ...err, due: "" })); }} required />
              {oErrors.due && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{oErrors.due}</p>}
            </div>
            <Select label="Status" options={["Pending", "In Progress", "Overdue", "Delayed"]} value={oForm.status} onChange={(e: any) => setOForm(f => ({ ...f, status: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <SecondaryBtn onClick={closeAdd}>Cancel</SecondaryBtn>
            <PrimaryBtn icon={Plus} loading={adding} onClick={handleAddObligation}>Add Obligation</PrimaryBtn>
          </div>
        </div>
      </div>
    )}

    {/* ── Update Progress Modal (Employee) ── */}
    {progressOpen && progressTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={e => { if (e.target === e.currentTarget) setProgressOpen(false); }}>
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.purple}18` }}>
                <Activity size={15} style={{ color: C.purple }} />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Update Progress</h3>
            </div>
            <button onClick={() => setProgressOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={15} className="text-gray-500" /></button>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{progressTarget.name}</p>
            <p className="text-xs text-gray-400">Due {progressTarget.due}</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Completion</label>
              <span className="text-sm font-bold" style={{ color: C.purple }}>{progressValue}%</span>
            </div>
            <input type="range" min={0} max={100} step={5} value={progressValue} onChange={e => setProgressValue(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer" />
            <ProgressBar value={progressValue} color={progressValue === 100 ? C.teal : C.purple} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <SecondaryBtn onClick={() => setProgressOpen(false)}>Cancel</SecondaryBtn>
            <PrimaryBtn icon={CheckCircle} onClick={handleSaveProgress}>Save Progress</PrimaryBtn>
          </div>
        </div>
      </div>
    )}

    {/* ══ EDIT OBLIGATION MODAL ══ */}
    {editOblTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={e => { if (e.target === e.currentTarget) closeEditObl(); }}>
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.purple}18` }}>
                <Edit2 size={15} style={{ color: C.purple }} />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Edit Obligation</h3>
            </div>
            <button onClick={closeEditObl} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Obligation Name<Req /></label>
              <input value={editOblForm.name} onChange={e => { setEditOblForm(p => ({ ...p, name: e.target.value })); setEditOblErrors(p => ({ ...p, name: undefined })); }}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none" />
              {editOblErrors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editOblErrors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Responsible Person<Req /></label>
              <input value={editOblForm.person} onChange={e => { setEditOblForm(p => ({ ...p, person: e.target.value })); setEditOblErrors(p => ({ ...p, person: undefined })); }}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none" />
              {editOblErrors.person && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editOblErrors.person}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Due Date<Req /></label>
              <input type="date" value={editOblForm.due} onChange={e => { setEditOblForm(p => ({ ...p, due: e.target.value })); setEditOblErrors(p => ({ ...p, due: undefined })); }}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none" />
              {editOblErrors.due && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editOblErrors.due}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Status</label>
              <select value={editOblForm.status} onChange={e => setEditOblForm(p => ({ ...p, status: e.target.value }))}
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none appearance-none">
                {["Pending", "In Progress", "Completed", "Overdue", "Delayed"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1 border-t border-[#E8EAF0] dark:border-gray-700/50">
            <SecondaryBtn onClick={closeEditObl} className="flex-1 justify-center">Cancel</SecondaryBtn>
            <button onClick={handleSaveObl} disabled={editOblSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
              style={{ background: G.primary }}>
              {editOblSaving ? <><Spinner />Saving…</> : <><CheckCircle size={14} />Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ══ MARK COMPLETE CONFIRM ══ */}
    {completeTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={e => { if (e.target === e.currentTarget && !completing) setCompleteTarget(null); }}>
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.teal}18` }}>
                <CheckCircle size={15} style={{ color: C.teal }} />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Mark as Complete</h3>
            </div>
            <button onClick={() => { if (!completing) setCompleteTarget(null); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          <div className="rounded-xl p-3 border border-[#E8EAF0] dark:border-gray-700/50" style={{ background: C.bg }}>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{completeTarget.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Assigned to {completeTarget.person} · Due {completeTarget.due}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Current progress</span>
              <span className="font-bold" style={{ color: C.purple }}>{completeTarget.progress}%</span>
            </div>
            <ProgressBar value={completeTarget.progress} color={C.purple} />
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">This will set progress to 100% and update the status to <span className="font-semibold" style={{ color: C.teal }}>Completed</span>.</p>
          </div>

          <div className="flex gap-2">
            <SecondaryBtn onClick={() => setCompleteTarget(null)} className="flex-1 justify-center">Cancel</SecondaryBtn>
            <button onClick={handleConfirmComplete} disabled={completing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
              style={{ backgroundColor: C.teal }}>
              {completing ? <><Spinner />Completing…</> : <><CheckCircle size={14} />Mark Complete</>}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ─── RENEWALS ──────────────────────────────────────────────────────────────────
type RenewalItem = {
  id: number; name: string; owner: string; expiry: string; value: string;
  daysLeft: number; status: string; renewedOn?: string; extendedTo?: string; terminatedOn?: string;
};

function RenewalsPage() {
  const [items, setItems] = useState<RenewalItem[]>(renewalData.map(r => ({ ...r })));
  const [apiLoading, setApiLoading] = useState(false);

  // Load from API on mount
  useEffect(() => {
    setApiLoading(true);
    renewalsApi.list()
      .then(res => setItems(res.data as unknown as RenewalItem[]))
      .catch(() => {/* backend offline – keep mock data */})
      .finally(() => setApiLoading(false));
  }, []);

  // ── Renew modal ──
  const [renewTarget,  setRenewTarget]  = useState<RenewalItem | null>(null);
  const [renewTerm,    setRenewTerm]    = useState("12");
  const [renewNote,    setRenewNote]    = useState("");
  const [renewBusy,    setRenewBusy]    = useState(false);
  const [renewDone,    setRenewDone]    = useState(false);

  // ── Extend modal ──
  const [extTarget,    setExtTarget]    = useState<RenewalItem | null>(null);
  const [extMonths,    setExtMonths]    = useState("3");
  const [extNote,      setExtNote]      = useState("");
  const [extBusy,      setExtBusy]      = useState(false);
  const [extDone,      setExtDone]      = useState(false);

  // ── Terminate modal ──
  const [termTarget,   setTermTarget]   = useState<RenewalItem | null>(null);
  const [termReason,   setTermReason]   = useState("");
  const [termConfirm,  setTermConfirm]  = useState("");
  const [termErrors,   setTermErrors]   = useState<{ reason?: string; confirm?: string }>({});
  const [termBusy,     setTermBusy]     = useState(false);
  const [termDone,     setTermDone]     = useState(false);

  // ── Renew ──
  const openRenew = (r: RenewalItem) => { setRenewTarget(r); setRenewTerm("12"); setRenewNote(""); setRenewDone(false); };
  const closeRenew = () => { if (renewBusy) return; setRenewTarget(null); setRenewDone(false); };
  const handleRenew = async () => {
    setRenewBusy(true);
    try {
      const months = parseInt(renewTerm, 10);
      const res = await renewalsApi.renew(String(renewTarget!.id), months, renewNote);
      setItems(prev => prev.map(r => r.id === renewTarget!.id ? { ...r, ...res.renewal } as RenewalItem : r));
      setRenewDone(true);
      toast.success(`"${renewTarget!.name}" renewed for ${renewTerm} months.`);
    } catch {
      // fallback: update locally so the UI still responds
      const months = parseInt(renewTerm, 10);
      const d = new Date(renewTarget!.expiry); d.setMonth(d.getMonth() + months);
      const newExpiry = d.toISOString().slice(0, 10);
      setItems(prev => prev.map(r => r.id === renewTarget!.id
        ? { ...r, expiry: newExpiry, daysLeft: r.daysLeft + months * 30, status: "Renewed" } : r));
      setRenewDone(true);
      toast.success(`"${renewTarget!.name}" renewed for ${renewTerm} months.`);
    } finally {
      setRenewBusy(false);
    }
  };

  // ── Extend ──
  const openExt = (r: RenewalItem) => { setExtTarget(r); setExtMonths("3"); setExtNote(""); setExtDone(false); };
  const closeExt = () => { if (extBusy) return; setExtTarget(null); setExtDone(false); };
  const handleExt = async () => {
    setExtBusy(true);
    try {
      const months = parseInt(extMonths, 10);
      const res = await renewalsApi.extend(String(extTarget!.id), months, extNote);
      setItems(prev => prev.map(r => r.id === extTarget!.id ? { ...r, ...res.renewal } as RenewalItem : r));
      setExtDone(true);
      toast.success(`"${extTarget!.name}" extended by ${extMonths} months.`);
    } catch {
      const months = parseInt(extMonths, 10);
      const d = new Date(extTarget!.expiry); d.setMonth(d.getMonth() + months);
      const newExpiry = d.toISOString().slice(0, 10);
      setItems(prev => prev.map(r => r.id === extTarget!.id
        ? { ...r, expiry: newExpiry, daysLeft: r.daysLeft + months * 30, status: "Extended", extendedTo: newExpiry } : r));
      setExtDone(true);
      toast.success(`"${extTarget!.name}" extended by ${extMonths} months.`);
    } finally {
      setExtBusy(false);
    }
  };

  // ── Terminate ──
  const openTerm = (r: RenewalItem) => { setTermTarget(r); setTermReason(""); setTermConfirm(""); setTermErrors({}); setTermDone(false); };
  const closeTerm = () => { if (termBusy) return; setTermTarget(null); setTermDone(false); };
  const handleTerm = async () => {
    const errs: typeof termErrors = {};
    if (!termReason.trim()) errs.reason = "Please provide a termination reason.";
    if (termConfirm !== "TERMINATE") errs.confirm = 'Type TERMINATE to confirm.';
    if (Object.keys(errs).length) { setTermErrors(errs); return; }
    setTermBusy(true);
    try {
      const res = await renewalsApi.terminate(String(termTarget!.id), termReason);
      setItems(prev => prev.map(r => r.id === termTarget!.id ? { ...r, ...res.renewal } as RenewalItem : r));
      setTermDone(true);
      toast.error(`"${termTarget!.name}" has been terminated.`);
    } catch {
      const today = new Date().toISOString().slice(0, 10);
      setItems(prev => prev.map(r => r.id === termTarget!.id ? { ...r, status: "Terminated", terminatedOn: today } : r));
      setTermDone(true);
      toast.error(`"${termTarget!.name}" has been terminated.`);
    } finally {
      setTermBusy(false);
    }
  };

  // ── Derived stats ──
  const active = items.filter(r => r.status !== "Terminated");
  const critical  = active.filter(r => r.daysLeft < 30).length;
  const upcoming  = active.filter(r => r.daysLeft >= 30 && r.daysLeft <= 90).length;
  const scheduled = active.filter(r => r.daysLeft > 90).length;

  const iconColor = (r: RenewalItem) => {
    if (r.status === "Renewed")    return C.teal;
    if (r.status === "Extended")   return C.sky;
    if (r.status === "Terminated") return C.coral;
    if (r.status === "Critical")   return C.coral;
    if (r.status === "Action Required") return C.sky;
    return C.teal;
  };
  const cardBorder = (r: RenewalItem) => {
    if (r.status === "Critical")        return "border-red-200 bg-red-50/30 dark:border-red-900/40 dark:bg-red-900/10";
    if (r.status === "Action Required") return "border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-900/10";
    if (r.status === "Terminated")      return "border-gray-200 bg-gray-50/50 dark:border-gray-700/50 opacity-70";
    return "";
  };

  return (
    <>
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Renewal Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track and manage upcoming contract renewals</p>
        </div>
      </div>

      {/* Dynamic stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Critical (< 30 days)",  value: critical,  color: C.coral  },
          { label: "Upcoming (30–90 days)", value: upcoming,  color: C.sky    },
          { label: "Scheduled (> 90 days)", value: scheduled, color: C.teal   },
          { label: "Total Renewal Value",   value: "$562K",   color: C.purple },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4">
            <p className="text-2xl font-bold transition-all duration-300" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {items.map(r => (
          <Card key={r.id} className={`p-5 transition-all duration-300 ${cardBorder(r)}`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${iconColor(r)}22` }}>
                  {r.status === "Terminated"
                    ? <XCircle size={20} style={{ color: iconColor(r) }} />
                    : r.status === "Renewed" || r.status === "Extended"
                      ? <CheckCircle size={20} style={{ color: iconColor(r) }} />
                      : <RefreshCw size={20} style={{ color: iconColor(r) }} />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{r.name}</h3>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Owner: {r.owner}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Expires: {r.expiry}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Value: {r.value}</span>
                    {r.renewedOn   && <span className="text-xs font-semibold" style={{ color: C.teal }}>Renewed {r.renewedOn}</span>}
                    {r.extendedTo  && <span className="text-xs font-semibold" style={{ color: C.sky  }}>Extended → {r.extendedTo}</span>}
                    {r.terminatedOn && <span className="text-xs font-semibold text-red-400">Terminated {r.terminatedOn}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap justify-end">
                <div className="text-right">
                  <p className="text-2xl font-bold transition-all duration-300" style={{ color: r.daysLeft < 60 ? C.coral : C.teal }}>{r.daysLeft}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">days left</p>
                </div>
                <Badge label={r.status} />
                {r.status !== "Terminated" ? (
                  <div className="flex gap-1">
                    <PrimaryBtn onClick={() => openRenew(r)} className="!py-1.5 !px-3 !text-xs">Renew</PrimaryBtn>
                    <SecondaryBtn onClick={() => openExt(r)} className="!py-1.5 !px-3 !text-xs">Extend</SecondaryBtn>
                    <button onClick={() => openTerm(r)}
                      className="px-3 py-1.5 rounded-xl border text-xs font-semibold text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:scale-95">
                      Terminate
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500 italic">No further actions</span>
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#E8EAF0] dark:border-gray-700/50 flex items-center gap-2">
              <Bell size={12} className="text-gray-400 dark:text-gray-500" />
              <span className="text-xs text-gray-400 dark:text-gray-500">Reminder sent 7 days ago · Next reminder in 14 days</span>
            </div>
          </Card>
        ))}
      </div>
    </div>

    {/* ══ RENEW MODAL ══ */}
    {renewTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={e => { if (e.target === e.currentTarget) closeRenew(); }}>
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.teal}18` }}>
                <RefreshCw size={15} style={{ color: C.teal }} />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Renew Contract</h3>
            </div>
            <button onClick={closeRenew} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          {!renewDone ? (
            <>
              <div className="rounded-xl p-3 border border-[#E8EAF0] dark:border-gray-700/50" style={{ background: C.bg }}>
                <p className="text-xs text-gray-500 dark:text-gray-400">Renewing</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{renewTarget.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Current expiry: {renewTarget.expiry} · Value: {renewTarget.value}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Renewal Term<Req /></label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {["6", "12", "24"].map(m => (
                    <button key={m} onClick={() => setRenewTerm(m)}
                      className="py-2.5 rounded-xl text-sm font-semibold border transition-all"
                      style={renewTerm === m
                        ? { background: G.primary, color: "#fff", borderColor: "transparent" }
                        : { background: C.bg, color: "#6b7280", borderColor: C.border }}>
                      {m} months
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  New Expiry Date
                </label>
                <div className="mt-1.5 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 px-4 py-2.5 text-sm font-semibold"
                  style={{ background: `${C.teal}10`, color: C.teal }}>
                  {addMonths(renewTarget.expiry, parseInt(renewTerm, 10))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Notes <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea rows={2}
                  className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none resize-none"
                  placeholder="Add any renewal notes…"
                  value={renewNote} onChange={e => setRenewNote(e.target.value)} />
              </div>

              <div className="flex gap-2 pt-1">
                <SecondaryBtn onClick={closeRenew} className="flex-1 justify-center">Cancel</SecondaryBtn>
                <button onClick={handleRenew} disabled={renewBusy}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
                  style={{ background: G.primary }}>
                  {renewBusy ? <><Spinner />Processing…</> : <><RefreshCw size={14} />Confirm Renewal</>}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-2 space-y-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${C.teal}18` }}>
                <CheckCircle size={26} style={{ color: C.teal }} />
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">Renewal confirmed</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  New expiry: <span className="font-semibold" style={{ color: C.teal }}>{addMonths(renewTarget.expiry, parseInt(renewTerm, 10))}</span>
                </p>
              </div>
              <button onClick={closeRenew}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: G.primary }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {/* ══ EXTEND MODAL ══ */}
    {extTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={e => { if (e.target === e.currentTarget) closeExt(); }}>
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.sky}18` }}>
                <Calendar size={15} style={{ color: C.sky }} />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Extend Contract</h3>
            </div>
            <button onClick={closeExt} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          {!extDone ? (
            <>
              <div className="rounded-xl p-3 border border-[#E8EAF0] dark:border-gray-700/50" style={{ background: C.bg }}>
                <p className="text-xs text-gray-500 dark:text-gray-400">Extending</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{extTarget.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Current expiry: {extTarget.expiry}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Extension Period<Req /></label>
                <div className="grid grid-cols-4 gap-2 mt-1.5">
                  {["1", "3", "6", "12"].map(m => (
                    <button key={m} onClick={() => setExtMonths(m)}
                      className="py-2.5 rounded-xl text-sm font-semibold border transition-all"
                      style={extMonths === m
                        ? { background: G.sky, color: "#fff", borderColor: "transparent" }
                        : { background: C.bg, color: "#6b7280", borderColor: C.border }}>
                      {m}mo
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Extended To</label>
                <div className="mt-1.5 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 px-4 py-2.5 text-sm font-semibold"
                  style={{ background: `${C.sky}10`, color: C.sky }}>
                  {addMonths(extTarget.expiry, parseInt(extMonths, 10))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Notes <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea rows={2}
                  className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none resize-none"
                  placeholder="Reason for extension…"
                  value={extNote} onChange={e => setExtNote(e.target.value)} />
              </div>

              <div className="flex gap-2 pt-1">
                <SecondaryBtn onClick={closeExt} className="flex-1 justify-center">Cancel</SecondaryBtn>
                <button onClick={handleExt} disabled={extBusy}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
                  style={{ background: G.sky }}>
                  {extBusy ? <><Spinner />Processing…</> : <><Calendar size={14} />Confirm Extension</>}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-2 space-y-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${C.sky}18` }}>
                <CheckCircle size={26} style={{ color: C.sky }} />
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">Extension confirmed</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Extended to <span className="font-semibold" style={{ color: C.sky }}>{addMonths(extTarget.expiry, parseInt(extMonths, 10))}</span>
                </p>
              </div>
              <button onClick={closeExt}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: G.sky }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {/* ══ TERMINATE MODAL ══ */}
    {termTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={e => { if (e.target === e.currentTarget) closeTerm(); }}>
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                <XCircle size={15} className="text-red-500" />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Terminate Contract</h3>
            </div>
            <button onClick={closeTerm} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          {!termDone ? (
            <>
              {/* Warning banner */}
              <div className="rounded-xl p-3 border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">This action is irreversible</p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">Terminating this contract will cancel all future obligations and cannot be undone.</p>
                </div>
              </div>

              <div className="rounded-xl p-3 border border-[#E8EAF0] dark:border-gray-700/50" style={{ background: C.bg }}>
                <p className="text-xs text-gray-500 dark:text-gray-400">Contract</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{termTarget.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Owner: {termTarget.owner} · Expiry: {termTarget.expiry} · Value: {termTarget.value}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Reason for Termination<Req /></label>
                <textarea rows={3}
                  className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none resize-none"
                  placeholder="Explain why this contract is being terminated…"
                  value={termReason} onChange={e => { setTermReason(e.target.value); setTermErrors(p => ({ ...p, reason: undefined })); }} />
                {termErrors.reason && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{termErrors.reason}</p>}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Type <span className="font-mono font-bold text-red-500">TERMINATE</span> to confirm<Req />
                </label>
                <input
                  className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none font-mono"
                  placeholder="TERMINATE"
                  value={termConfirm} onChange={e => { setTermConfirm(e.target.value); setTermErrors(p => ({ ...p, confirm: undefined })); }} />
                {termErrors.confirm && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{termErrors.confirm}</p>}
              </div>

              <div className="flex gap-2 pt-1">
                <SecondaryBtn onClick={closeTerm} className="flex-1 justify-center">Cancel</SecondaryBtn>
                <button onClick={handleTerm} disabled={termBusy || termConfirm !== "TERMINATE"}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold bg-red-500 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  {termBusy ? <><Spinner />Processing…</> : <><XCircle size={14} />Terminate Contract</>}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-2 space-y-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                <XCircle size={26} className="text-red-500" />
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">Contract terminated</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{termTarget.name} has been terminated as of {today}.</p>
              </div>
              <button onClick={closeTerm}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold bg-red-500 hover:bg-red-600 transition-all hover:opacity-90 active:scale-95">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}

// ─── COMPLIANCE PAGE ───────────────────────────────────────────────────────────
function CompliancePage() {
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"PDF" | "Excel" | "CSV">("PDF");
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const openExport = () => { setExportFormat("PDF"); setExported(false); setExportOpen(true); };
  const closeExport = () => { if (exporting) return; setExportOpen(false); };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      const rows: (string | number)[][] = [
        ["Department", "Compliance Score (%)"],
        ...deptCompliance.map(d => [d.dept, d.score]),
      ];
      dlFile(exportFormat, "compliance-report", "Compliance Report", rows);
      setExporting(false);
      setExported(true);
      toast.success(`Compliance report exported as ${exportFormat}.`);
    }, 800);
  };

  const formats: { id: "PDF" | "Excel" | "CSV"; icon: any; desc: string; color: string }[] = [
    { id: "PDF",   icon: FileText,        desc: "Printable, formatted report",   color: C.coral  },
    { id: "Excel", icon: FileSpreadsheet, desc: "Editable spreadsheet (.xlsx)",   color: C.teal   },
    { id: "CSV",   icon: Download,        desc: "Raw data for any tool (.csv)",   color: C.sky    },
  ];

  return (
    <>
    {exportOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={e => { if (e.target === e.currentTarget) closeExport(); }}
      >
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.purple}18` }}>
                <Download size={15} style={{ color: C.purple }} />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Export Report</h3>
            </div>
            <button onClick={closeExport} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          {!exported ? (
            <>
              {/* Format picker */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Select format</p>
                {formats.map(({ id, icon: Icon, desc, color }) => {
                  const active = exportFormat === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setExportFormat(id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-150 text-left"
                      style={active
                        ? { borderColor: color, background: `${color}10`, boxShadow: `0 0 0 3px ${color}18` }
                        : { borderColor: C.border, background: "transparent" }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                        <Icon size={15} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: active ? color : "#374151" }}>{id}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
                      </div>
                      {active && (
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: color }}>
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Scope note */}
              <div className="flex gap-2 items-start rounded-xl p-3 border border-dashed border-[#E8EAF0] dark:border-gray-700">
                <Info size={13} className="flex-shrink-0 mt-0.5" style={{ color: C.sky }} />
                <p className="text-xs text-gray-500 dark:text-gray-400">Includes compliance score, open findings, risk matrix, and obligation statuses as of today.</p>
              </div>

              <div className="flex gap-2 pt-1">
                <SecondaryBtn onClick={closeExport} className="flex-1 justify-center">Cancel</SecondaryBtn>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: G.primary }}
                >
                  {exporting ? <><Spinner /> Exporting…</> : <><Download size={14} /> Export {exportFormat}</>}
                </button>
              </div>
            </>
          ) : (
            /* Success state */
            <div className="flex flex-col items-center text-center py-2 space-y-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${C.teal}18` }}>
                <CheckCircle size={26} style={{ color: C.teal }} />
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">Export complete</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your <span className="font-semibold" style={{ color: C.teal }}>{exportFormat}</span> report is ready.</p>
              </div>
              <button
                onClick={closeExport}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: G.primary }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Compliance Management</h1><p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">Organization-wide compliance monitoring and risk management</p></div>
        <PrimaryBtn icon={Download} onClick={openExport}>Export Report</PrimaryBtn>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 flex flex-col items-center text-center" style={{ background: `linear-gradient(135deg, ${C.purple}08, ${C.teal}08)` }}>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Overall Compliance Score</p>
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E8EAF0" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.teal} strokeWidth="2.5" strokeDasharray="93 7" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">93%</span><span className="text-xs text-gray-500 dark:text-gray-500">Score</span>
            </div>
          </div>
          <Badge label="Completed" /><p className="text-xs text-gray-500 dark:text-gray-500 mt-2">+5% from last quarter</p>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Risk Indicators</h3>
          <div className="space-y-3">
            {[{ label: "High Risk", count: 3, color: C.coral }, { label: "Medium Risk", count: 9, color: C.sky     }, { label: "Low Risk", count: 42, color: C.teal }].map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} /><span className="text-sm text-gray-600 dark:text-gray-300">{label}</span></div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-100 dark:bg-gray-700/60 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${(count / 54) * 100}%`, backgroundColor: color }} /></div>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100 w-4 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Missed Obligations</h3>
          <div className="space-y-2">
            {obligationsData.filter(o => o.status === "Overdue" || o.status === "Delayed").map(o => (
              <div key={o.id} className="flex items-start gap-2 p-2.5 rounded-xl" style={{ backgroundColor: o.status === "Overdue" ? "#fee2e222" : "#fef3c722" }}>
                <AlertCircle size={14} style={{ color: o.status === "Overdue" ? C.coral : C.sky }} className="flex-shrink-0 mt-0.5" />
                <div><p className="text-xs font-semibold text-gray-800 dark:text-gray-100">{o.name}</p><p className="text-xs text-gray-500 dark:text-gray-500">{o.person} · {o.due}</p></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Department-wise Compliance</h3>
        <div className="space-y-3">
          {deptCompliance.map(({ dept, score, fill }) => (
            <div key={dept} className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 w-20">{dept}</span>
              <div className="flex-1 bg-gray-100 dark:bg-gray-700/60 rounded-full h-2.5"><div className="h-2.5 rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: fill }} /></div>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-100 w-10 text-right">{score}%</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Compliance Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={complianceTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.7} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
            <Area key="compliance" type="monotone" dataKey="score" stroke={C.teal} strokeWidth={2.5} fill={C.teal} fillOpacity={0.12} name="Compliance %" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
    </>
  );
}

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────────
type NotifItem = { id: number; type: string; title: string; desc: string; time: string; read: boolean };

function NotificationsPage({ items, setItems, dismissed, setDismissed }: {
  items: NotifItem[];
  setItems: React.Dispatch<React.SetStateAction<NotifItem[]>>;
  dismissed: Set<number>;
  setDismissed: React.Dispatch<React.SetStateAction<Set<number>>>;
}) {
  const iconMap:  Record<string, any>    = { renewal: RefreshCw, compliance: ShieldCheck, approval: CheckCircle, system: Zap };
  const colorMap: Record<string, string> = { renewal: C.teal, compliance: C.coral, approval: C.purple, system: C.sky };

  const [viewTarget, setViewTarget] = useState<NotifItem | null>(null);

  type Category = "All" | "Unread" | "Renewals" | "Approvals" | "Compliance" | "System";
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  // Derive displayed list: exclude dismissed, apply category filter
  const live = items.filter(n => !dismissed.has(n.id));
  const unreadCount = live.filter(n => !n.read).length;

  const categoryFilter: Record<Category, (n: NotifItem) => boolean> = {
    All:        () => true,
    Unread:     n => !n.read,
    Renewals:   n => n.type === "renewal",
    Approvals:  n => n.type === "approval",
    Compliance: n => n.type === "compliance",
    System:     n => n.type === "system",
  };

  const counts: Record<Category, number> = {
    All:        live.length,
    Unread:     live.filter(n => !n.read).length,
    Renewals:   live.filter(n => n.type === "renewal").length,
    Approvals:  live.filter(n => n.type === "approval").length,
    Compliance: live.filter(n => n.type === "compliance").length,
    System:     live.filter(n => n.type === "system").length,
  };

  const visible = live.filter(categoryFilter[activeCategory]);
  const categories: Category[] = ["All", "Unread", "Renewals", "Approvals", "Compliance", "System"];

  // ── Actions ──
  const markRead = (id: number) =>
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const markAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read.");
  };

  const dismiss = (id: number) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const openView = (n: NotifItem) => {
    markRead(n.id);
    // Use the latest read state when opening the modal
    setViewTarget({ ...n, read: true });
  };

  const closeView = () => setViewTarget(null);

  return (
    <>
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 transition-all duration-300">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "All caught up — no unread notifications"}
          </p>
        </div>
        <SecondaryBtn onClick={markAllRead} className={unreadCount === 0 ? "opacity-40 pointer-events-none" : ""}>
          Mark all as read
        </SecondaryBtn>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {categories.map(cat => {
          const active = activeCategory === cat;
          const count  = counts[cat];
          const isUnread = cat === "Unread";
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap"
              style={active
                ? { background: G.primary, color: "#fff" }
                : { background: "transparent", color: "#6b7280", border: "1px solid #E8EAF0" }}
            >
              {cat}
              <span
                className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none transition-all duration-300"
                style={active
                  ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
                  : { background: count > 0 && isUnread ? `${C.purple}18` : "#F3F4F6", color: count > 0 && isUnread ? C.purple : "#9ca3af" }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {visible.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: activeCategory === "Unread" ? `${C.purple}12` : "#F3F4F6" }}>
              {activeCategory === "Unread"
                ? <CheckCircle size={22} style={{ color: C.purple }} />
                : <Bell size={22} className="text-gray-300 dark:text-gray-600" />}
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {activeCategory === "Unread" ? "No unread notifications" : `No ${activeCategory.toLowerCase()} notifications`}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {activeCategory === "Unread" ? "You're all caught up!" : "Nothing here yet."}
            </p>
          </Card>
        ) : visible.map(n => {
          const Icon  = iconMap[n.type];
          const color = colorMap[n.type];
          return (
            <Card key={n.id} className={`p-4 transition-all duration-200 ${!n.read ? "border-purple-200 dark:border-purple-800/40" : ""}`}
              style={!n.read ? { background: `${C.purple}04` } : {}}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}18` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{n.title}</p>
                        {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: C.purple }} />}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{n.desc}</p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{n.time}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => openView(n)}
                      className="text-xs font-semibold px-3 py-1 rounded-lg transition-opacity hover:opacity-75"
                      style={{ color: C.purple, backgroundColor: `${C.purple}12` }}>
                      View
                    </button>
                    <button
                      onClick={() => dismiss(n.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-300 transition-colors">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>

    {/* ── Notification Detail Modal ── */}
    {viewTarget && (() => {
      const Icon  = iconMap[viewTarget.type];
      const color = colorMap[viewTarget.type];
      const typeLabel = viewTarget.type.charAt(0).toUpperCase() + viewTarget.type.slice(1);

      // Extended detail copy per type
      const details: Record<string, { label: string; value: string }[]> = {
        renewal:    [{ label: "Contract",   value: "Global Logistics Agreement" }, { label: "Expires",     value: "Aug 31, 2024" }, { label: "Owner",       value: "Sarah Chen" }, { label: "Action",      value: "Review and initiate renewal workflow" }],
        compliance: [{ label: "Obligation", value: "ISO 27001 Annual Review" },    { label: "Due Date",    value: "Jul 01, 2024" }, { label: "Assigned To", value: "Priya Nair" }, { label: "Action",      value: "Complete overdue obligation immediately" }],
        approval:   [{ label: "Contract",   value: "CTR-2407 – SaaS License" },    { label: "Requested By",value: "Sarah Chen" },   { label: "Submitted",   value: "Jul 02, 2024" }, { label: "Action",    value: "Review contract and approve or reject" }],
        system:     [{ label: "Version",    value: "ContractIQ v2.4" },            { label: "Released",    value: "Jul 05, 2024" }, { label: "Status",      value: "Deployed successfully" }, { label: "Notes", value: "New features: bulk export, RBAC improvements" }],
      };
      const rows = details[viewTarget.type] ?? [];

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={e => { if (e.target === e.currentTarget) closeView(); }}>
          <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header strip */}
            <div className="rounded-t-2xl p-5 flex items-center justify-between" style={{ background: `${color}12`, borderBottom: `1px solid ${color}25` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
                  <Icon size={19} style={{ color }} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{typeLabel}</span>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-0.5">{viewTarget.title}</p>
                </div>
              </div>
              <button onClick={closeView} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <X size={15} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{viewTarget.desc}</p>

              {/* Detail rows */}
              <div className="rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 overflow-hidden">
                {rows.map(({ label, value }, idx) => (
                  <div key={label} className={`flex items-start gap-3 px-4 py-3 text-sm ${idx !== rows.length - 1 ? "border-b border-[#E8EAF0] dark:border-gray-700/50" : ""}`}>
                    <span className="text-gray-400 dark:text-gray-500 font-medium w-28 flex-shrink-0">{label}</span>
                    <span className="text-gray-800 dark:text-gray-100 font-semibold">{value}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 px-4 py-3 text-sm border-t border-[#E8EAF0] dark:border-gray-700/50">
                  <span className="text-gray-400 dark:text-gray-500 font-medium w-28 flex-shrink-0">Received</span>
                  <span className="text-gray-800 dark:text-gray-100 font-semibold">{viewTarget.time}</span>
                </div>
              </div>

              {/* Read status pill */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: C.teal }} />
                <span className="text-xs text-gray-500 dark:text-gray-400">Marked as read</span>
              </div>

              <button onClick={closeView}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: G.primary }}>
                Close
              </button>
            </div>
          </div>
        </div>
      );
    })()}
    </>
  );
}

// ─── REPORTS ───────────────────────────────────────────────────────────────────
function ReportsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [dateRange,    setDateRange]    = useState("Last 7 Days");
  const [preview,      setPreview]      = useState<string | null>(null);
  const [visible,      setVisible]      = useState(true);

  const printBtnState  = useLoadingBtn(800);
  const excelBtnState  = useLoadingBtn(1600);
  const pdfBtnState    = useLoadingBtn(2000);

  // smooth filter switch: fade out → swap → fade in
  const switchFilter = (next: string) => {
    if (next === activeFilter) return;
    setVisible(false);
    setTimeout(() => { setActiveFilter(next); setPreview(null); setVisible(true); }, 220);
  };

  const handlePrint = () => printBtnState.fire(() => window.print(), "Print request sent.");

  const reportRows = (): (string | number)[][] => [
    ["Month", "Contracts", "Approved", "Expired"],
    ...monthlyGrowth.map(r => [r.month, r.contracts, Math.round(r.contracts * 0.85), Math.round(r.contracts * 0.08)]),
  ];

  const handleExcelDownload = () => excelBtnState.fire(() => {
    dlExcel("contractiq-report.xlsx", reportRows());
  }, "Excel downloaded successfully.");

  const handlePdfDownload = () => pdfBtnState.fire(() => {
    dlPDF("contractiq-report.pdf", "ContractIQ — Monthly Activity Report", reportRows());
  }, "PDF downloaded successfully.");

  type ReportCard = { title: string; desc: string; icon: any; color: string; category: string };
  const allCards: ReportCard[] = [
    { title: "Contract Report",   desc: "Full contract lifecycle analysis",    icon: FileText,   color: C.purple, category: "Contracts"  },
    { title: "Compliance Report", desc: "Organization-wide compliance status", icon: ShieldCheck,color: C.teal,   category: "Compliance" },
    { title: "Renewal Report",    desc: "Upcoming renewals and deadlines",     icon: RefreshCw,  color: C.sky,    category: "Renewals"   },
    { title: "Audit Report",      desc: "System activity and changes",         icon: BookOpen,   color: C.coral,  category: "Audit"      },
  ];

  const visibleCards = activeFilter === "All" ? allCards : allCards.filter(c => c.category === activeFilter);

  // per-report preview content
  const PreviewPanel = ({ title, color }: { title: string; color: string }) => {
    if (title === "Contract Report") return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[["Total Contracts","142"],["Active","68"],["Expiring Soon","15"],["Expired","24"]].map(([l,v]) => (
            <div key={l} className="rounded-xl p-4 text-center border border-[#E8EAF0] dark:border-gray-700/50">
              <p className="text-2xl font-bold" style={{ color }}>{v}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{l}</p>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyGrowth} margin={{ left: -10, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.7} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${color}` }} />
            <Legend />
            <Bar key="contracts"  dataKey="contracts"  fill={color}  radius={[4,4,0,0]} name="Contracts"  />
            <Bar key="obligations" dataKey="obligations" fill={C.teal} radius={[4,4,0,0]} name="Obligations" />
          </BarChart>
        </ResponsiveContainer>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead><tr className="border-b border-[#E8EAF0] dark:border-gray-700/50">
              {["Month","Created","Approved","Expired"].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody>{monthlyGrowth.map(r => (
              <tr key={r.month} className="border-b border-[#E8EAF0] dark:border-gray-700/50 last:border-0 hover:bg-[#A05AFF]/8 transition-colors">
                <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-100">{r.month}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{r.contracts}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{Math.round(r.contracts * 0.85)}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{Math.round(r.contracts * 0.08)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );

    if (title === "Compliance Report") return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[["Overall Score","93%"],["Audits Passed","26"],["Issues Open","4"]].map(([l,v]) => (
            <div key={l} className="rounded-xl p-4 text-center border border-[#E8EAF0] dark:border-gray-700/50">
              <p className="text-2xl font-bold" style={{ color }}>{v}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{l}</p>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={complianceTrend} margin={{ left: -10, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.7} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis domain={[70,100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${color}` }} />
            <Area key="score" type="monotone" dataKey="score" stroke={color} strokeWidth={2.5} fill={color} fillOpacity={0.12} name="Score %" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="space-y-2">
          {deptCompliance.map(d => (
            <div key={d.dept} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300 w-16 shrink-0">{d.dept}</span>
              <div className="flex-1"><ProgressBar value={d.score} color={d.fill} /></div>
              <span className="text-xs font-bold w-10 text-right" style={{ color: d.fill }}>{d.score}%</span>
            </div>
          ))}
        </div>
      </div>
    );

    if (title === "Renewal Report") return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[["Critical (<30d)","1"],["Upcoming (30–90d)","2"],["Scheduled (>90d)","2"],["Total Value","$562K"]].map(([l,v]) => (
            <div key={l} className="rounded-xl p-4 text-center border border-[#E8EAF0] dark:border-gray-700/50">
              <p className="text-2xl font-bold" style={{ color }}>{v}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{l}</p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead><tr className="border-b border-[#E8EAF0] dark:border-gray-700/50">
              {["Contract","Owner","Renewal Date","Value","Status"].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody>
              {[
                ["AWS Cloud Services","Daniel Park","2024-08-15","$120K","Critical"],
                ["Office 365 License","Sarah Chen","2024-09-01","$48K","Upcoming"],
                ["Legal SaaS Platform","Emma Walsh","2024-10-12","$36K","Scheduled"],
                ["Facility Management","Tom Reeves","2024-11-30","$90K","Scheduled"],
              ].map(([name,owner,date,val,status]) => (
                <tr key={name} className="border-b border-[#E8EAF0] dark:border-gray-700/50 last:border-0 hover:bg-[#A05AFF]/8 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-100">{name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{owner}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{date}</td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color }}>{val}</td>
                  <td className="px-4 py-3"><Badge label={status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

    if (title === "Audit Report") return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[["Total Events","248"],["This Week","34"],["Failed Attempts","3"]].map(([l,v]) => (
            <div key={l} className="rounded-xl p-4 text-center border border-[#E8EAF0] dark:border-gray-700/50">
              <p className="text-2xl font-bold" style={{ color }}>{v}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{l}</p>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={auditPerf} margin={{ left: -10, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.7} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${color}` }} />
            <Legend />
            <Bar key="passed" dataKey="passed" fill={C.teal} radius={[4,4,0,0]} name="Passed" />
            <Bar key="failed" dataKey="failed" fill={color}  radius={[4,4,0,0]} name="Failed" />
          </BarChart>
        </ResponsiveContainer>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead><tr className="border-b border-[#E8EAF0] dark:border-gray-700/50">
              {["User","Action","Date & Time","Module","Status"].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody>{auditLogs.slice(0,6).map((l,i) => (
              <tr key={i} className="border-b border-[#E8EAF0] dark:border-gray-700/50 last:border-0 hover:bg-[#A05AFF]/8 transition-colors">
                <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-100">{l.user}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{l.action}</td>
                <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-300">{l.date}</td>
                <td className="px-4 py-3"><span className="text-xs bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg">{l.module}</span></td>
                <td className="px-4 py-3"><Badge label={l.status} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );

    return null;
  };

  const filterTabs = ["All", "Contracts", "Compliance", "Renewals", "Audit"];
  const dateRanges  = ["Last 7 Days", "Last 30 Days", "Last Quarter", "This Year"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Generate and export comprehensive reports</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SecondaryBtn icon={Printer}        onClick={handlePrint}          loading={printBtnState.busy}>Print</SecondaryBtn>
          <SecondaryBtn icon={FileSpreadsheet} onClick={handleExcelDownload} loading={excelBtnState.busy}>Export Excel</SecondaryBtn>
          <PrimaryBtn   icon={Download}        onClick={handlePdfDownload}   loading={pdfBtnState.busy}>Export PDF</PrimaryBtn>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Report Type</label>
            <div className="flex flex-wrap gap-1.5">
              {filterTabs.map(t => (
                <button key={t} onClick={() => switchFilter(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200"
                  style={activeFilter === t
                    ? { background: G.primary, color: "#fff", borderColor: "transparent" }
                    : { borderColor: C.border, color: "#6b7280" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date Range</label>
            <select value={dateRange} onChange={e => setDateRange(e.target.value)}
              className="border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-3 py-1.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 focus:outline-none">
              {dateRanges.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Report cards — animated filter transition */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all duration-200"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)" }}
      >
        {visibleCards.map(({ title, desc, icon: Icon, color }) => {
          const isActive = preview === title;
          return (
            <Card
              key={title}
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${isActive ? "ring-2" : ""}`}
              style={isActive ? { ringColor: color, boxShadow: `0 0 0 2px ${color}` } : {}}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">{desc}</p>
              <button
                onClick={() => setPreview(isActive ? null : title)}
                className="text-xs font-semibold flex items-center gap-1 transition-colors hover:opacity-80"
                style={{ color }}
              >
                {isActive ? "Close ↑" : "Generate →"}
              </button>
            </Card>
          );
        })}
      </div>

      {/* Inline report preview — slides in when a card is active */}
      {preview && (() => {
        const card = allCards.find(c => c.title === preview)!;
        return (
          <Card
            className="p-5 transition-all duration-300"
            style={{ borderTop: `3px solid ${card.color}` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${card.color}18` }}>
                  <card.icon size={16} style={{ color: card.color }} />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{card.title}</h3>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{dateRange}</span>
              </div>
              <div className="flex gap-2">
                <SecondaryBtn icon={FileSpreadsheet} onClick={handleExcelDownload} loading={excelBtnState.busy}>Excel</SecondaryBtn>
                <PrimaryBtn   icon={Download}         onClick={handlePdfDownload}   loading={pdfBtnState.busy}>PDF</PrimaryBtn>
              </div>
            </div>
            <PreviewPanel title={preview} color={card.color} />
          </Card>
        );
      })()}

      {/* Charts overview — always visible */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 min-w-0">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Monthly Contract Activity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyGrowth} margin={{ left: -10, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.7} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
              <Legend />
              <Bar key="contracts"   dataKey="contracts"   fill={C.violet} radius={[4,4,0,0]} name="Contracts"   />
              <Bar key="obligations" dataKey="obligations" fill={C.teal}   radius={[4,4,0,0]} name="Obligations" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5 min-w-0">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Contract Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={contractStatusDist} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                {contractStatusDist.map((entry, i) => <Cell key={`reports-cs-${entry.name}-${i}`} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5 lg:col-span-2 min-w-0">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Compliance Score Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={complianceTrend} margin={{ left: -10, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.7} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
              <Line key="score" type="monotone" dataKey="score" stroke={C.violet} strokeWidth={2.5} dot={{ fill: C.violet, r: 4 }} name="Score %" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Monthly summary table */}
      <Card>
        <div className="px-5 py-4 border-b border-[#E8EAF0] dark:border-gray-700/50 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Monthly Summary</h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">{dateRange}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-[#E8EAF0] dark:border-gray-700/50">
                {["Month","Contracts Created","Contracts Approved","Contracts Expired","Compliance Score"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3.5 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyGrowth.map((row, i) => (
                <tr key={row.month} className="border-b border-[#E8EAF0] dark:border-gray-700/50 last:border-0 hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 transition-colors">
                  <td className="px-5 py-3 text-sm font-semibold text-gray-800 dark:text-gray-100">{row.month}</td>
                  <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-200">{row.contracts}</td>
                  <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-200">{Math.round(row.contracts * 0.85)}</td>
                  <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-200">{Math.round(row.contracts * 0.08)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={complianceTrend[i]?.score ?? 80} color={C.teal} />
                      <span className="text-xs font-semibold whitespace-nowrap" style={{ color: C.teal }}>{complianceTrend[i]?.score ?? 80}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── AUDIT LOGS ────────────────────────────────────────────────────────────────
function AuditLogsPage({ items }: { items: Array<{ id?: number; user: string; action: string; date: string; ip: string; module: string; status: string }> }) {
  const [search,      setSearch]      = useState("");
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [fModule,     setFModule]     = useState("All");
  const [fStatus,     setFStatus]     = useState("All");
  const [fDateFrom,   setFDateFrom]   = useState("");
  const [fDateTo,     setFDateTo]     = useState("");

  // ── Export state ──
  const [exportOpen,   setExportOpen]   = useState(false);
  const [exportFormat, setExportFormat] = useState<"PDF" | "Excel" | "CSV">("PDF");
  const [exporting,    setExporting]    = useState(false);
  const [exported,     setExported]     = useState(false);

  const openExport  = () => { setExportFormat("PDF"); setExported(false); setExportOpen(true); };
  const closeExport = () => { if (exporting) return; setExportOpen(false); };
  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      const rows: (string | number)[][] = [
        ["User", "Action", "Date", "IP Address", "Module", "Status"],
        ...filtered.map(l => [l.user, l.action, l.date, l.ip, l.module, l.status]),
      ];
      dlFile(exportFormat, "audit-log", "Audit Log", rows);
      setExporting(false);
      setExported(true);
      toast.success(`Audit log exported as ${exportFormat}.`);
    }, 800);
  };

  const allModules = ["All", "Auth", "Contracts", "Repository", "Obligations", "Reports", "Users", "Settings", "System"];
  const allStatuses = ["All", "Success", "Failed"];

  const activeFilterCount = [fModule, fStatus].filter(v => v !== "All").length
    + (fDateFrom ? 1 : 0) + (fDateTo ? 1 : 0);
  const clearFilters = () => { setFModule("All"); setFStatus("All"); setFDateFrom(""); setFDateTo(""); };

  const activeItems = items.length ? items : auditLogs;
  const filtered = activeItems.filter(l => {
    const q = search.toLowerCase();
    if (q && !l.user.toLowerCase().includes(q) && !l.action.toLowerCase().includes(q) && !l.module.toLowerCase().includes(q)) return false;
    if (fModule !== "All" && l.module !== fModule) return false;
    if (fStatus !== "All" && l.status !== fStatus) return false;
    if (fDateFrom && l.date.slice(0, 10) < fDateFrom) return false;
    if (fDateTo   && l.date.slice(0, 10) > fDateTo)   return false;
    return true;
  });

  return (
    <>
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Audit Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">Complete trail of all system activities</p>
        </div>
        <div className="flex gap-2">
          {/* Filter button + panel */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
              style={filterOpen || activeFilterCount > 0
                ? { borderColor: C.purple, background: `${C.purple}10`, color: C.purple }
                : { borderColor: C.border, background: "transparent", color: "#6b7280" }}
            >
              <Filter size={13} />Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>

            {filterOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-40 bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl border border-[#E8EAF0] dark:border-gray-700/50 p-4 w-72 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Filter Logs</span>
                    {activeFilterCount > 0 && (
                      <button onClick={clearFilters} className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: C.coral }}>
                        <X size={11} />Clear all
                      </button>
                    )}
                  </div>

                  {/* Module */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Module</p>
                    <div className="flex flex-wrap gap-1.5">
                      {allModules.map(m => (
                        <button key={m} onClick={() => setFModule(m)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                          style={fModule === m ? { background: C.purple, color: "#fff", borderColor: C.purple } : { borderColor: C.border, color: "#6b7280" }}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Status</p>
                    <div className="flex gap-1.5">
                      {allStatuses.map(s => (
                        <button key={s} onClick={() => setFStatus(s)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                          style={fStatus === s
                            ? { background: s === "Failed" ? C.coral : C.teal, color: "#fff", borderColor: s === "Failed" ? C.coral : C.teal }
                            : { borderColor: C.border, color: "#6b7280" }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date range */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Date Range</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">From</label>
                        <input type="date" value={fDateFrom} onChange={e => setFDateFrom(e.target.value)}
                          className="w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-lg px-2.5 py-1.5 text-xs bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">To</label>
                        <input type="date" value={fDateTo} onChange={e => setFDateTo(e.target.value)}
                          className="w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-lg px-2.5 py-1.5 text-xs bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-[#E8EAF0] dark:border-gray-700/50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
                    <button onClick={() => setFilterOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
                      style={{ background: G.primary }}>
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <PrimaryBtn icon={Download} onClick={openExport}>Export</PrimaryBtn>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input className="w-full pl-9 pr-4 py-2.5 bg-[#F8F9FC] dark:bg-gray-800/70 border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl text-sm placeholder-gray-400 focus:outline-none" placeholder="Search by user, action, or module…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">Active filters:</span>
            {fModule !== "All" && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${C.purple}14`, color: C.purple }}>
                Module: {fModule}<button onClick={() => setFModule("All")} className="ml-0.5 hover:opacity-70"><X size={10} /></button>
              </span>
            )}
            {fStatus !== "All" && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${C.teal}14`, color: C.teal }}>
                Status: {fStatus}<button onClick={() => setFStatus("All")} className="ml-0.5 hover:opacity-70"><X size={10} /></button>
              </span>
            )}
            {fDateFrom && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${C.sky}14`, color: C.sky }}>
                From: {fDateFrom}<button onClick={() => setFDateFrom("")} className="ml-0.5 hover:opacity-70"><X size={10} /></button>
              </span>
            )}
            {fDateTo && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${C.sky}14`, color: C.sky }}>
                To: {fDateTo}<button onClick={() => setFDateTo("")} className="ml-0.5 hover:opacity-70"><X size={10} /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: C.coral }}>Clear all</button>
          </div>
        )}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-[#E8EAF0] dark:border-gray-700/50">{["User", "Action", "Date & Time", "IP Address", "Module", "Status"].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-500 px-5 py-3.5 uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  No logs match the current filters.{" "}
                  <button onClick={() => { clearFilters(); setSearch(""); }} className="font-semibold underline underline-offset-2" style={{ color: C.purple }}>Clear all</button>
                </td></tr>
              ) : filtered.map((l, i) => (
                <tr key={i} className="border-b border-[#E8EAF0] dark:border-gray-700/50 hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Avatar initials={l.user.split(" ").map(n => n[0]).join("").slice(0, 2)} size="sm" color={[C.purple, C.teal, C.sky, C.violet, C.coral][i % 5]} />
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{l.user}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-200">{l.action}</td>
                  <td className="px-5 py-3.5 text-xs font-mono text-gray-600 dark:text-gray-300">{l.date}</td>
                  <td className="px-5 py-3.5 text-xs font-mono text-gray-600 dark:text-gray-300">{l.ip}</td>
                  <td className="px-5 py-3.5"><span className="text-xs bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg">{l.module}</span></td>
                  <td className="px-5 py-3.5"><Badge label={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>

    {/* ── Export Modal ── */}
    {exportOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={e => { if (e.target === e.currentTarget) closeExport(); }}>
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.purple}18` }}>
                <Download size={15} style={{ color: C.purple }} />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Export Audit Log</h3>
            </div>
            <button onClick={closeExport} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          {!exported ? (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Exporting <span className="font-semibold text-gray-700 dark:text-gray-200">{filtered.length} log entr{filtered.length === 1 ? "y" : "ies"}</span>
                {activeFilterCount > 0 && " (filtered view)"}.
              </p>

              <div className="space-y-2">
                {([
                  { id: "PDF"   as const, icon: FileText,        desc: "Printable, formatted report",  color: C.coral  },
                  { id: "Excel" as const, icon: FileSpreadsheet, desc: "Editable spreadsheet (.xlsx)", color: C.teal   },
                  { id: "CSV"   as const, icon: Download,        desc: "Raw data for any tool (.csv)", color: C.sky    },
                ] as { id: "PDF" | "Excel" | "CSV"; icon: any; desc: string; color: string }[]).map(({ id, icon: Icon, desc, color }) => {
                  const active = exportFormat === id;
                  return (
                    <button key={id} onClick={() => setExportFormat(id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                      style={active
                        ? { borderColor: color, background: `${color}10` }
                        : { borderColor: C.border, background: "transparent" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                        <Icon size={15} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{id}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: active ? color : C.border, background: active ? color : "transparent" }}>
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-1">
                <SecondaryBtn onClick={closeExport} className="flex-1 justify-center">Cancel</SecondaryBtn>
                <button onClick={handleExport} disabled={exporting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: G.primary }}>
                  {exporting ? <><Spinner />Exporting…</> : <><Download size={14} />Export {exportFormat}</>}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-2 space-y-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${C.teal}18` }}>
                <CheckCircle size={26} style={{ color: C.teal }} />
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">Export complete</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Audit log exported as <span className="font-semibold" style={{ color: C.teal }}>{exportFormat}</span> — {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}.
                </p>
              </div>
              <button onClick={closeExport}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: G.primary }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}

// ─── USER MANAGEMENT ───────────────────────────────────────────────────────────
function UsersPage() {
  const [users, setUsers] = useState(usersData.map((u, i) => ({ ...u, uid: i })));
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [highlightUid, setHighlightUid] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "Employee", department: "Legal" });
  const [nextUid, setNextUid] = useState(usersData.length);
  const [openMenuUid, setOpenMenuUid] = useState<number | null>(null);
  const [editUser, setEditUser] = useState<typeof users[0] | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", role: "Employee", department: "Legal", status: "Active" });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  const roleColors: Record<string, string> = { Administrator: C.purple, "Legal Manager": C.teal, "Compliance Officer": C.sky, "Contract Manager": C.violet, "Department Head": C.coral, Employee: C.sky };

  const openEditModal = (u: typeof users[0]) => {
    const [firstName, ...rest] = u.name.split(" ");
    setEditUser(u);
    setEditForm({ firstName, lastName: rest.join(" "), email: u.email, role: u.role, department: u.dept, status: u.status });
    setEditErrors({});
    setOpenMenuUid(null);
  };

  const closeEditModal = () => {
    if (editSubmitting) return;
    setEditUser(null);
    setEditErrors({});
  };

  const validateEdit = () => {
    const e: Record<string, string> = {};
    if (!editForm.firstName.trim()) e.firstName = "First name is required";
    if (!editForm.lastName.trim())  e.lastName  = "Last name is required";
    if (!editForm.email.trim())     e.email     = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) e.email = "Enter a valid email address";
    return e;
  };

  const handleEditSave = () => {
    const e = validateEdit();
    if (Object.keys(e).length) { setEditErrors(e); return; }
    setEditErrors({});
    setEditSubmitting(true);
    setTimeout(() => {
      const fullName = `${editForm.firstName.trim()} ${editForm.lastName.trim()}`;
      const initials = `${editForm.firstName.trim()[0].toUpperCase()}${editForm.lastName.trim()[0].toUpperCase()}`;
      setUsers(prev => prev.map(u => u.uid === editUser!.uid
        ? { ...u, name: fullName, avatar: initials, email: editForm.email, role: editForm.role, dept: editForm.department, status: editForm.status }
        : u
      ));
      setHighlightUid(editUser!.uid);
      setTimeout(() => setHighlightUid(null), 2200);
      setEditSubmitting(false);
      setEditUser(null);
      toast.success(`User "${fullName}" updated successfully.`);
    }, 900);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSubmitting(true);
    setTimeout(() => {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
      const initials = `${form.firstName.trim()[0].toUpperCase()}${form.lastName.trim()[0].toUpperCase()}`;
      const uid = nextUid;
      setNextUid(n => n + 1);
      const newUser = { uid, name: fullName, role: form.role, dept: form.department, status: "Active", email: form.email, avatar: initials };
      setUsers(prev => [newUser, ...prev]);
      setHighlightUid(uid);
      setTimeout(() => setHighlightUid(null), 2200);
      setSubmitting(false);
      setShowModal(false);
      setForm({ firstName: "", lastName: "", email: "", role: "Employee", department: "Legal" });
      toast.success(`User "${fullName}" added successfully.`);
    }, 1400);
  };

  const close = () => {
    if (submitting) return;
    setShowModal(false);
    setErrors({});
    setForm({ firstName: "", lastName: "", email: "", role: "Employee", department: "Legal" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">User Management</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage team members, roles, and permissions</p></div>
        <PrimaryBtn icon={Plus} onClick={() => setShowModal(true)}>Add User</PrimaryBtn>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {users.map(u => (
          <Card key={u.uid} className={`p-4 text-center hover:shadow-md transition-all duration-700 ${u.uid === highlightUid ? "ring-2 ring-[#A05AFF]/50 bg-[#A05AFF]/5 shadow-md" : ""}`}>
            <div className="flex justify-center mb-2"><Avatar initials={u.avatar} size="md" color={roleColors[u.role] || C.purple} /></div>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{u.name.split(" ")[0]}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.role}</p>
            <div className="mt-1 flex justify-center"><Badge label={u.status} /></div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-[#E8EAF0] dark:border-gray-700/50">{["Name", "Role", "Department", "Email", "Status", "Actions"].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3.5 uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.uid} className={`border-b border-[#E8EAF0] dark:border-gray-700/50 transition-all duration-700 ${u.uid === highlightUid ? "bg-[#A05AFF]/8" : "hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15/30"}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar initials={u.avatar} size="sm" color={roleColors[u.role] || C.purple} />
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: `${roleColors[u.role] || C.purple}18`, color: roleColors[u.role] || C.purple }}>{u.role}</span></td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{u.dept}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{u.email}</td>
                  <td className="px-5 py-3.5"><Badge label={u.status} /></td>
                  <td className="px-5 py-3.5">
                    {/* Desktop: labelled buttons — hidden on mobile */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-[#A05AFF]/10 dark:hover:bg-[#A05AFF]/20"
                        style={{ color: C.purple }}
                        title="Edit"
                        onClick={() => openEditModal(u)}
                      >
                        <Edit2 size={12} />
                        <span className="hidden md:inline">Edit</span>
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                        style={{ color: C.coral }}
                        title="Remove"
                        onClick={() => { setUsers(prev => prev.filter(x => x.uid !== u.uid)); toast.success("User removed."); }}
                      >
                        <XCircle size={12} />
                        <span className="hidden md:inline">Remove</span>
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-[#4BCBEB]/10 dark:hover:bg-[#4BCBEB]/20"
                        style={{ color: C.sky }}
                        title="Reset Password"
                      >
                        <RotateCcw size={12} />
                        <span className="hidden md:inline">Reset</span>
                      </button>
                    </div>

                    {/* Mobile: three-dot dropdown */}
                    <div className="sm:hidden relative">
                      <button
                        onClick={() => setOpenMenuUid(openMenuUid === u.uid ? null : u.uid)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Row actions"
                      >
                        <span className="flex flex-col gap-[3px] items-center">
                          <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
                          <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
                          <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
                        </span>
                      </button>
                      {openMenuUid === u.uid && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setOpenMenuUid(null)} />
                          <div
                            className="absolute right-0 top-9 z-40 w-40 bg-white dark:bg-[#1F2937] rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 overflow-hidden"
                            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                          >
                            <button
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 transition-colors"
                              style={{ color: C.purple }}
                              onClick={() => openEditModal(u)}
                            >
                              <Edit2 size={13} /> Edit User
                            </button>
                            <button
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold hover:bg-[#4BCBEB]/10 dark:hover:bg-[#4BCBEB]/20 transition-colors"
                              style={{ color: C.sky }}
                              onClick={() => setOpenMenuUid(null)}
                            >
                              <RotateCcw size={13} /> Reset Password
                            </button>
                            <div className="border-t border-[#E8EAF0] dark:border-gray-700/50" />
                            <button
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              onClick={() => { setUsers(prev => prev.filter(x => x.uid !== u.uid)); setOpenMenuUid(null); toast.success("User removed."); }}
                            >
                              <XCircle size={13} /> Remove User
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) close(); }}>
          <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.purple}18` }}>
                  <UserPlus size={15} style={{ color: C.purple }} />
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Add New User</h2>
              </div>
              <button onClick={close} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input label="First Name" placeholder="John" value={form.firstName} onChange={(e: any) => { setForm(f => ({ ...f, firstName: e.target.value })); setErrors(err => ({ ...err, firstName: "" })); }} required />
                  {errors.firstName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.firstName}</p>}
                </div>
                <div>
                  <Input label="Last Name" placeholder="Doe" value={form.lastName} onChange={(e: any) => { setForm(f => ({ ...f, lastName: e.target.value })); setErrors(err => ({ ...err, lastName: "" })); }} required />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.lastName}</p>}
                </div>
              </div>
              <div>
                <Input label="Email" type="email" placeholder="john.doe@company.com" icon={Mail} value={form.email} onChange={(e: any) => { setForm(f => ({ ...f, email: e.target.value })); setErrors(err => ({ ...err, email: "" })); }} required />
                {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.email}</p>}
              </div>
              <Select label="Role" options={["Administrator", "Legal Manager", "Compliance Officer", "Contract Manager", "Department Head", "Employee"]} value={form.role} onChange={(e: any) => setForm(f => ({ ...f, role: e.target.value }))} required />
              <Select label="Department" options={["Legal", "Procurement", "HR", "Finance", "Technology", "Operations"]} value={form.department} onChange={(e: any) => setForm(f => ({ ...f, department: e.target.value }))} required />
            </div>
            <div className="flex gap-3 mt-5">
              <SecondaryBtn className="flex-1 justify-center" onClick={close}>Cancel</SecondaryBtn>
              <PrimaryBtn className="flex-1 justify-center" loading={submitting} onClick={handleSubmit}>Add User</PrimaryBtn>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {editUser && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) closeEditModal(); }}
        >
          <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-md p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.purple}18` }}>
                  <Edit2 size={15} style={{ color: C.purple }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">Edit User</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{editUser.name}</p>
                </div>
              </div>
              <button onClick={closeEditModal} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors">
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Avatar preview */}
            <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-[#F8F9FC] dark:bg-gray-800/60 border border-[#E8EAF0] dark:border-gray-700/40">
              <Avatar initials={editUser.avatar} size="md" color={roleColors[editUser.role] || C.purple} />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{editUser.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{editUser.email}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    label="First Name"
                    placeholder="John"
                    value={editForm.firstName}
                    onChange={(e: any) => { setEditForm(f => ({ ...f, firstName: e.target.value })); setEditErrors(err => ({ ...err, firstName: "" })); }}
                    required
                  />
                  {editErrors.firstName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editErrors.firstName}</p>}
                </div>
                <div>
                  <Input
                    label="Last Name"
                    placeholder="Doe"
                    value={editForm.lastName}
                    onChange={(e: any) => { setEditForm(f => ({ ...f, lastName: e.target.value })); setEditErrors(err => ({ ...err, lastName: "" })); }}
                    required
                  />
                  {editErrors.lastName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editErrors.lastName}</p>}
                </div>
              </div>
              <div>
                <Input
                  label="Email"
                  type="email"
                  placeholder="john.doe@company.com"
                  icon={Mail}
                  value={editForm.email}
                  onChange={(e: any) => { setEditForm(f => ({ ...f, email: e.target.value })); setEditErrors(err => ({ ...err, email: "" })); }}
                  required
                />
                {editErrors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editErrors.email}</p>}
              </div>
              <Select
                label="Role"
                options={["Administrator", "Legal Manager", "Compliance Officer", "Contract Manager", "Department Head", "Employee"]}
                value={editForm.role}
                onChange={(e: any) => setEditForm(f => ({ ...f, role: e.target.value }))}
                required
              />
              <Select
                label="Department"
                options={["Legal", "Procurement", "HR", "Finance", "Technology", "Operations"]}
                value={editForm.department}
                onChange={(e: any) => setEditForm(f => ({ ...f, department: e.target.value }))}
                required
              />
              <Select
                label="Status"
                options={["Active", "Inactive", "Pending"]}
                value={editForm.status}
                onChange={(e: any) => setEditForm(f => ({ ...f, status: e.target.value }))}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-5">
              <SecondaryBtn className="flex-1 justify-center" onClick={closeEditModal}>Cancel</SecondaryBtn>
              <PrimaryBtn className="flex-1 justify-center" loading={editSubmitting} onClick={handleEditSave}>Save Changes</PrimaryBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROFILE ───────────────────────────────────────────────────────────────────
function ProfilePage({ role, displayUser, onSaveProfile }: {
  role: UserRole;
  displayUser: { name: string; initials: string; title: string; email: string };
  onSaveProfile: (name: string, email: string) => void;
}) {
  const [activeTab, setActiveTab] = useState("personal");
  const user = roleUsers[role];

  const deptByRole: Record<UserRole, string> = {
    administrator: "Operations", legal: "Legal", compliance: "Compliance",
    "contract-manager": "Procurement", "department-head": "Technology", employee: "General",
  };
  const empIdByRole: Record<UserRole, string> = {
    administrator: "EMP-0041", legal: "EMP-0027", compliance: "EMP-0033",
    "contract-manager": "EMP-0019", "department-head": "EMP-0012", employee: "EMP-0055",
  };
  const dept  = deptByRole[role];
  const empId = empIdByRole[role];
  const defaultEmail = displayUser.email;

  const tabs: { key: string; label: string; icon: any }[] = [
    { key: "personal",      label: "Personal Info",  icon: User       },
    { key: "account",       label: "Account",        icon: BadgeCheck },
    { key: "security",      label: "Security",       icon: Lock       },
    { key: "notifications", label: "Notifications",  icon: BellRing   },
    { key: "activity",      label: "Activity",       icon: Activity   },
  ];

  // ── Personal Info state ──────────────────────────────────────────────────────
  type PersonalForm = { name: string; phone: string; email: string; location: string };
  const defaultPersonal: PersonalForm = {
    name:     displayUser.name,
    phone:    "+1 (555) 234-5678",
    email:    defaultEmail,
    location: "New York, US",
  };
  const [personal,     setPersonal]     = useState<PersonalForm>({ ...defaultPersonal });
  const [savedPersonal,setSavedPersonal]= useState<PersonalForm>({ ...defaultPersonal });
  const [editing,      setEditing]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [pErrors,      setPErrors]      = useState<Partial<PersonalForm>>({});

  const personalDirty = JSON.stringify(personal) !== JSON.stringify(savedPersonal);

  const handleEditToggle = () => {
    if (!editing) { setEditing(true); setPErrors({}); return; }
  };
  const handleCancelEdit = () => {
    setPersonal({ ...savedPersonal });
    setEditing(false);
    setPErrors({});
  };
  const handleSavePersonal = () => {
    const errs: Partial<PersonalForm> = {};
    if (!personal.name.trim())     errs.name  = "Full name is required.";
    if (!personal.email.trim())    errs.email = "Email is required.";
    if (!personal.phone.trim())    errs.phone = "Phone number is required.";
    if (!personal.location.trim()) errs.location = "Location is required.";
    setPErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setTimeout(() => {
      setSavedPersonal({ ...personal });
      onSaveProfile(personal.name, personal.email);
      setSaving(false);
      setEditing(false);
      toast.success("Profile updated successfully.");
    }, 1200);
  };

  // ── Password state ────────────────────────────────────────────────────────────
  const [pwForm,   setPwForm]   = useState({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwBusy,   setPwBusy]   = useState(false);
  const clrPw = (k: string) => setPwErrors(p => ({ ...p, [k]: "" }));
  const handleUpdatePassword = () => {
    const e: Record<string, string> = {};
    if (!pwForm.current) e.current = "Current password is required.";
    if (!pwForm.next)    e.next    = "New password is required.";
    else if (pwForm.next.length < 8) e.next = "Password must be at least 8 characters.";
    if (!pwForm.confirm) e.confirm = "Please confirm your new password.";
    else if (pwForm.next && pwForm.next !== pwForm.confirm) e.confirm = "Passwords do not match.";
    setPwErrors(e);
    if (Object.keys(e).length) return;
    setPwBusy(true);
    setTimeout(() => {
      setPwBusy(false);
      setPwForm({ current: "", next: "", confirm: "" });
      toast.success("Password updated successfully.");
    }, 1200);
  };

  // ── Sessions state ────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState([
    { id: 1, device: "Chrome · macOS",    location: "New York, US",  time: "Today 09:14 AM",     current: true  },
    { id: 2, device: "Safari · iPhone",   location: "New York, US",  time: "Yesterday 08:03 PM", current: false },
    { id: 3, device: "Firefox · Windows", location: "Chicago, US",   time: "Jul 25, 2:41 PM",    current: false },
    { id: 4, device: "Chrome · Android",  location: "San Jose, US",  time: "Jul 22, 11:20 AM",   current: false },
  ]);
  const revokeSession = (id: number) => {
    setSessions(s => s.filter(x => x.id !== id));
    toast.success("Session revoked.");
  };
  const revokeAll = () => {
    setSessions(s => s.filter(x => x.current));
    toast.success("All other sessions signed out.");
  };

  // ── Notification toggles ──────────────────────────────────────────────────────
  const [notifToggles,      setNotifToggles]      = useState({ email: true, sms: false, inApp: true, renewals: true, compliance: true, approvals: true, digest: false });
  const [savedNotifToggles, setSavedNotifToggles] = useState({ ...notifToggles });
  const [savingNotif,       setSavingNotif]        = useState(false);
  const toggle = (k: keyof typeof notifToggles) => setNotifToggles(p => ({ ...p, [k]: !p[k] }));
  const notifDirty = JSON.stringify(notifToggles) !== JSON.stringify(savedNotifToggles);
  const handleSaveNotif = () => {
    setSavingNotif(true);
    setTimeout(() => {
      setSavedNotifToggles({ ...notifToggles });
      setSavingNotif(false);
      toast.success("Notification preferences saved.");
    }, 1000);
  };
  const handleCancelNotif = () => { setNotifToggles({ ...savedNotifToggles }); };

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button onClick={onClick}
      className="w-11 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0"
      style={{ backgroundColor: on ? C.purple : "#D1D5DB" }}>
      <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
        style={{ left: on ? "calc(100% - 22px)" : "2px" }} />
    </button>
  );

  // read-only field helper
  const ReadField = ({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</label>
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F8F9FC] dark:bg-gray-800/70 border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl">
        {Icon && <Icon size={14} className="text-gray-400 flex-shrink-0" />}
        <span className="text-sm text-gray-700 dark:text-gray-200">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your personal information and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* ── Left: Profile card ── */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="h-20 w-full" style={{ background: `linear-gradient(135deg, ${C.purple}, ${C.violet}, ${C.teal})` }} />
            <div className="px-5 pb-5">
              <div className="relative -mt-9 mb-3 flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white ring-4 ring-white dark:ring-[#1F2937]"
                    style={{ background: G.primary }}>
                    {displayUser.initials}
                  </div>
                  <button onClick={() => { setActiveTab("personal"); setEditing(true); }}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-[#E8EAF0] dark:border-gray-700/50 rounded-full flex items-center justify-center shadow hover:bg-[#A05AFF]/8 transition-colors">
                    <Edit2 size={10} style={{ color: C.purple }} />
                  </button>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{savedPersonal.name}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.title}</p>
                <div className="mt-2 flex justify-center"><Badge label="Active" /></div>
              </div>
              <div className="mt-4 space-y-2.5">
                {([
                  [Building2, "Department",   dept],
                  [Hash,      "Employee ID",  empId],
                  [Mail,      "Email",        savedPersonal.email],
                  [MapPin,    "Location",     savedPersonal.location],
                  [Calendar,  "Member since", "Jan 15, 2022"],
                ] as [any, string, string][]).map(([Icon, label, value]) => (
                  <div key={label} className="flex items-center gap-2.5 text-xs">
                    <Icon size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">{label}</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200 truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Stats</p>
            <div className="space-y-2.5">
              {[
                { label: "Contracts Managed", value: "89",    color: C.purple },
                { label: "Obligations Done",  value: "42",    color: C.teal   },
                { label: "Last Login",        value: "Today", color: C.sky    },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                  <span className="text-xs font-bold" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Right: Tabs ── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex gap-1 bg-white dark:bg-[#1F2937] border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl p-1 overflow-x-auto">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => { setActiveTab(key); setEditing(false); setPErrors({}); }}
                className={`flex items-center gap-1.5 flex-shrink-0 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${activeTab === key ? "text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-200"}`}
                style={activeTab === key ? { background: G.primary } : {}}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>

          {/* ── Personal Info ── */}
          {activeTab === "personal" && (
            <Card className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Personal Information</h3>
                {!editing && (
                  <SecondaryBtn onClick={handleEditToggle} icon={Edit2}>Edit Profile</SecondaryBtn>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Editable fields */}
                <div>
                  <Input label="Full Name" value={personal.name} icon={User} required
                    onChange={(e: any) => { setPersonal(p => ({ ...p, name: e.target.value })); setPErrors(v => ({ ...v, name: undefined })); }}
                    readOnly={!editing}
                    className={!editing ? "opacity-70 cursor-default" : ""} />
                  {pErrors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{pErrors.name}</p>}
                </div>
                <ReadField label="Employee ID" value={empId} icon={Hash} />
                <ReadField label="Department"  value={dept}  icon={Building2} />
                <ReadField label="Designation / Role" value={user.title} icon={Briefcase} />
                <div>
                  <Input label="Email Address" type="email" value={personal.email} icon={Mail} required
                    onChange={(e: any) => { setPersonal(p => ({ ...p, email: e.target.value })); setPErrors(v => ({ ...v, email: undefined })); }}
                    readOnly={!editing}
                    className={!editing ? "opacity-70 cursor-default" : ""} />
                  {pErrors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{pErrors.email}</p>}
                </div>
                <div>
                  <Input label="Phone Number" value={personal.phone} icon={Phone} required
                    onChange={(e: any) => { setPersonal(p => ({ ...p, phone: e.target.value })); setPErrors(v => ({ ...v, phone: undefined })); }}
                    readOnly={!editing}
                    className={!editing ? "opacity-70 cursor-default" : ""} />
                  {pErrors.phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{pErrors.phone}</p>}
                </div>
                <div>
                  <Input label="Location" value={personal.location} icon={MapPin} required
                    onChange={(e: any) => { setPersonal(p => ({ ...p, location: e.target.value })); setPErrors(v => ({ ...v, location: undefined })); }}
                    readOnly={!editing}
                    className={!editing ? "opacity-70 cursor-default" : ""} />
                  {pErrors.location && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{pErrors.location}</p>}
                </div>
                <ReadField label="Date Joined" value="January 15, 2022" icon={Calendar} />
              </div>

              {editing && (
                <div className="flex justify-end gap-3 pt-2 border-t border-[#E8EAF0] dark:border-gray-700/50">
                  <SecondaryBtn onClick={handleCancelEdit} className={saving ? "opacity-40 pointer-events-none" : ""}>Cancel</SecondaryBtn>
                  <button onClick={handleSavePersonal} disabled={saving || !personalDirty}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: G.primary }}>
                    {saving ? <><Spinner />Saving…</> : <><CheckCircle size={14} />Save Changes</>}
                  </button>
                </div>
              )}
            </Card>
          )}

          {/* ── Account ── */}
          {activeTab === "account" && (
            <div className="space-y-4">
              <Card className="p-5 space-y-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Account Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {([
                    ["Username",        user.initials.toLowerCase() + ".contractiq"],
                    ["Account Status",  "Active"],
                    ["Last Login",      "Today at 09:14 AM"],
                    ["Account Type",    user.title],
                    ["2FA Status",      "Enabled"],
                    ["Account Created", "January 15, 2022"],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-0.5 p-3 bg-[#F8F9FC] dark:bg-gray-800/70 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{k}</span>
                      <span className="text-sm font-semibold"
                        style={v === "Active" || v === "Enabled" ? { color: C.teal } : { color: undefined }}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Login History</h3>
                  <span className="text-xs text-gray-400 dark:text-gray-500">Last {sessions.length} session{sessions.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-3">
                  {sessions.map(s => (
                    <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${s.current ? "border-purple-200" : "border-[#E8EAF0] dark:border-gray-700/50"}`}
                      style={s.current ? { backgroundColor: `${C.purple}06` } : {}}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: s.current ? `${C.purple}18` : "#F3F4F6" }}>
                        <Monitor size={15} style={{ color: s.current ? C.purple : "#9CA3AF" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{s.device}</p>
                          {s.current && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: C.teal }}>Current</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <MapPin size={11} className="text-gray-400 dark:text-gray-500" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">{s.location}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{s.time}</span>
                        </div>
                      </div>
                      {!s.current && (
                        <button onClick={() => revokeSession(s.id)}
                          className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors flex-shrink-0 active:scale-95">
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                  {sessions.filter(s => !s.current).length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
                      {sessions.length - 1} other session{sessions.length - 1 !== 1 ? "s" : ""} ·{" "}
                      <button onClick={revokeAll} className="font-semibold transition-opacity hover:opacity-70" style={{ color: C.coral }}>
                        Sign out all other sessions
                      </button>
                    </p>
                  )}
                  {sessions.filter(s => !s.current).length === 0 && (
                    <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-1">No other active sessions.</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ── Security ── */}
          {activeTab === "security" && (
            <div className="space-y-4">
              <Card className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.purple}18` }}>
                    <Key size={15} style={{ color: C.purple }} />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Change Password</h3>
                </div>
                <div>
                  <Input label="Current Password" type="password" placeholder="••••••••" icon={Lock} value={pwForm.current} required
                    onChange={(e: any) => { setPwForm(p => ({ ...p, current: e.target.value })); clrPw("current"); }} />
                  {pwErrors.current && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{pwErrors.current}</p>}
                </div>
                <div>
                  <Input label="New Password" type="password" placeholder="Min 8 characters" icon={Lock} value={pwForm.next} required
                    onChange={(e: any) => { setPwForm(p => ({ ...p, next: e.target.value })); clrPw("next"); }} />
                  {pwErrors.next && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{pwErrors.next}</p>}
                </div>
                <div>
                  <Input label="Confirm New Password" type="password" placeholder="Re-enter new password" icon={Lock} value={pwForm.confirm} required
                    onChange={(e: any) => { setPwForm(p => ({ ...p, confirm: e.target.value })); clrPw("confirm"); }} />
                  {pwErrors.confirm && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{pwErrors.confirm}</p>}
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-3 flex items-start gap-2">
                  <Info size={14} style={{ color: C.sky }} className="flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.</p>
                </div>
                <div className="flex justify-end pt-1 border-t border-[#E8EAF0] dark:border-gray-700/50">
                  <button onClick={handleUpdatePassword} disabled={pwBusy}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
                    style={{ background: G.primary }}>
                    {pwBusy ? <><Spinner />Updating…</> : <><Key size={14} />Update Password</>}
                  </button>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.teal}18` }}>
                    <Monitor size={15} style={{ color: C.teal }} />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Active Sessions</h3>
                </div>
                <div className="space-y-3">
                  {sessions.filter(s => s.current).map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-teal-200 dark:border-teal-800/40" style={{ backgroundColor: `${C.teal}06` }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.teal}18` }}>
                        <Monitor size={14} style={{ color: C.teal }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{s.device}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.location} · {s.time}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: C.teal }}>Active</span>
                    </div>
                  ))}
                  {sessions.filter(s => !s.current).length > 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
                      {sessions.filter(s => !s.current).length} other session{sessions.filter(s => !s.current).length !== 1 ? "s" : ""} ·{" "}
                      <button onClick={revokeAll} className="font-semibold transition-opacity hover:opacity-70" style={{ color: C.coral }}>Sign out all other sessions</button>
                    </p>
                  ) : (
                    <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-1">No other active sessions.</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ── Notifications ── */}
          {activeTab === "notifications" && (
            <Card className="p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-5">Notification Preferences</h3>
              <div className="space-y-1">
                {([
                  { icon: Mail,        key: "email",      label: "Email Notifications",     desc: "Receive updates via email"            },
                  { icon: Smartphone,  key: "sms",        label: "SMS Notifications",       desc: "Receive alerts via text message"      },
                  { icon: Bell,        key: "inApp",      label: "In-App Notifications",    desc: "Show alerts inside the application"   },
                  { icon: RefreshCw,   key: "renewals",   label: "Contract Renewal Alerts", desc: "Notified when contracts are expiring" },
                  { icon: ShieldCheck, key: "compliance", label: "Compliance Alerts",       desc: "Alerts for compliance issues"         },
                  { icon: CheckCircle, key: "approvals",  label: "Approval Requests",       desc: "Notified when approval is needed"     },
                  { icon: FileText,    key: "digest",     label: "Weekly Summary Digest",   desc: "Weekly email with activity summary"   },
                ] as { icon: any; key: keyof typeof notifToggles; label: string; desc: string }[]).map(({ icon: Icon, key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-[#E8EAF0] dark:border-gray-700/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.purple}12` }}>
                        <Icon size={14} style={{ color: C.purple }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                      </div>
                    </div>
                    <Toggle on={notifToggles[key]} onClick={() => toggle(key)} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E8EAF0] dark:border-gray-700/50 mt-2">
                <SecondaryBtn onClick={handleCancelNotif} className={!notifDirty || savingNotif ? "opacity-40 pointer-events-none" : ""}>
                  Cancel
                </SecondaryBtn>
                <button onClick={handleSaveNotif} disabled={savingNotif || !notifDirty}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: G.primary }}>
                  {savingNotif ? <><Spinner />Saving…</> : <><CheckCircle size={14} />Save Preferences</>}
                </button>
              </div>
            </Card>
          )}

          {/* ── Activity ── */}
          {activeTab === "activity" && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Recent Activity</h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">Last 5 actions</span>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-0 bottom-0 w-px bg-[#E8EAF0] dark:bg-gray-700/50" />
                <div className="space-y-5">
                  {auditLogs.slice(0, 5).map((l, i) => {
                    const dotColor = l.status === "Success" ? C.teal : C.coral;
                    return (
                      <div key={i} className="flex items-start gap-4 relative">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ring-2 ring-white dark:ring-[#1F2937]"
                          style={{ backgroundColor: `${dotColor}22` }}>
                          <Activity size={13} style={{ color: dotColor }} />
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{l.action}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-400 dark:text-gray-500">{l.date}</span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-md">{l.module}</span>
                            <Badge label={l.status} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS ──────────────────────────────────────────────────────────────────
// ─── Settings helpers ─────────────────────────────────────────────────────────
type SettingsTab = "General" | "Security" | "Integrations" | "Email Templates" | "Workflow" | "Billing";

const TABS: { id: SettingsTab; icon: any }[] = [
  { id: "General",         icon: Settings    },
  { id: "Security",        icon: Shield      },
  { id: "Integrations",    icon: Cpu         },
  { id: "Email Templates", icon: Mail        },
  { id: "Workflow",        icon: GitMerge    },
  { id: "Billing",         icon: Award       },
];

// default state shapes per tab
const DEFAULT_GENERAL = { orgName: "ContractIQ Corporation", orgEmail: "admin@contractiq.com", timezone: "UTC-5 (Eastern Time)", dateFormat: "MM/DD/YYYY", language: "English (US)" };
const DEFAULT_SECURITY = { mfa: true, sessionTimeout: "30 minutes", passwordPolicy: "Strong", auditLogs: true, ipWhitelist: "" };
const DEFAULT_INTEGRATIONS = { slack: true, teams: false, salesforce: false, jira: true, googleDrive: true, apiKey: "iq-live-xk9p2m4r7n..." };
const DEFAULT_EMAIL = { fromName: "ContractIQ", fromEmail: "noreply@contractiq.com", reminderSubject: "Contract Renewal Reminder – {{contract_name}}", reminderBody: "Dear {{recipient_name}},\n\nThis is a reminder that the contract \"{{contract_name}}\" is due for renewal on {{renewal_date}}.\n\nPlease review and take appropriate action.\n\nBest regards,\nContractIQ Team", signatureEnabled: true };
const DEFAULT_WORKFLOW = { autoAssign: true, approvalStages: "3", escalationDays: "5", notifyOnExpiry: true, requireDualApproval: false };
const DEFAULT_BILLING = { plan: "Enterprise", seats: "50", billingEmail: "billing@contractiq.com", billingCycle: "Annual" };

function SettingsPage() {
  const [activeTab, setActiveTab]           = useState<SettingsTab>("General");

  // general
  const [general, setGeneral]               = useState({ ...DEFAULT_GENERAL });
  const [generalSaved, setGeneralSaved]     = useState({ ...DEFAULT_GENERAL });
  const [generalErrors, setGeneralErrors]   = useState<Record<string, string>>({});

  // security
  const [security, setSecurity]             = useState({ ...DEFAULT_SECURITY });
  const [securitySaved, setSecuritySaved]   = useState({ ...DEFAULT_SECURITY });

  // integrations
  const [integrations, setIntegrations]     = useState({ ...DEFAULT_INTEGRATIONS });
  const [integrationsSaved, setIntegrationsSaved] = useState({ ...DEFAULT_INTEGRATIONS });

  // email templates
  const [email, setEmail]                   = useState({ ...DEFAULT_EMAIL });
  const [emailSaved, setEmailSaved]         = useState({ ...DEFAULT_EMAIL });
  const [emailErrors, setEmailErrors]       = useState<Record<string, string>>({});

  // workflow
  const [workflow, setWorkflow]             = useState({ ...DEFAULT_WORKFLOW });
  const [workflowSaved, setWorkflowSaved]   = useState({ ...DEFAULT_WORKFLOW });

  // billing
  const [billing, setBilling]               = useState({ ...DEFAULT_BILLING });
  const [billingSaved, setBillingSaved]     = useState({ ...DEFAULT_BILLING });
  const [billingErrors, setBillingErrors]   = useState<Record<string, string>>({});

  const isDirty = () => {
    if (activeTab === "General")         return JSON.stringify(general)      !== JSON.stringify(generalSaved);
    if (activeTab === "Security")        return JSON.stringify(security)     !== JSON.stringify(securitySaved);
    if (activeTab === "Integrations")    return JSON.stringify(integrations) !== JSON.stringify(integrationsSaved);
    if (activeTab === "Email Templates") return JSON.stringify(email)        !== JSON.stringify(emailSaved);
    if (activeTab === "Workflow")        return JSON.stringify(workflow)     !== JSON.stringify(workflowSaved);
    if (activeTab === "Billing")         return JSON.stringify(billing)      !== JSON.stringify(billingSaved);
    return false;
  };

  const handleDiscard = () => {
    if (isDirty() && !window.confirm("You have unsaved changes. Discard them?")) return;
    if (activeTab === "General")         setGeneral({ ...generalSaved });
    if (activeTab === "Security")        setSecurity({ ...securitySaved });
    if (activeTab === "Integrations")    setIntegrations({ ...integrationsSaved });
    if (activeTab === "Email Templates") setEmail({ ...emailSaved });
    if (activeTab === "Workflow")        setWorkflow({ ...workflowSaved });
    if (activeTab === "Billing")         setBilling({ ...billingSaved });
    setGeneralErrors({}); setEmailErrors({}); setBillingErrors({});
    toast.info("Changes discarded.");
  };

  const handleSave = () => {
    // validation
    if (activeTab === "General") {
      const errs: Record<string, string> = {};
      if (!general.orgName.trim())  errs.orgName  = "Organization name is required.";
      if (!general.orgEmail.trim()) errs.orgEmail = "Email is required.";
      else if (!/\S+@\S+\.\S+/.test(general.orgEmail)) errs.orgEmail = "Enter a valid email address.";
      setGeneralErrors(errs);
      if (Object.keys(errs).length) { toast.error("Please fix the errors before saving."); return; }
      setGeneralSaved({ ...general });
    }
    if (activeTab === "Email Templates") {
      const errs: Record<string, string> = {};
      if (!email.fromName.trim())    errs.fromName    = "From name is required.";
      if (!email.fromEmail.trim()) errs.fromEmail = "From email is required.";
      else if (!/\S+@\S+\.\S+/.test(email.fromEmail)) errs.fromEmail = "Enter a valid email address.";
      if (!email.reminderSubject.trim()) errs.reminderSubject = "Subject is required.";
      if (!email.reminderBody.trim())    errs.reminderBody    = "Body is required.";
      setEmailErrors(errs);
      if (Object.keys(errs).length) { toast.error("Please fix the errors before saving."); return; }
      setEmailSaved({ ...email });
    }
    if (activeTab === "Billing") {
      const errs: Record<string, string> = {};
      if (!billing.billingEmail.trim()) errs.billingEmail = "Billing email is required.";
      else if (!/\S+@\S+\.\S+/.test(billing.billingEmail)) errs.billingEmail = "Enter a valid email address.";
      if (!billing.seats || isNaN(Number(billing.seats)) || Number(billing.seats) < 1) errs.seats = "Enter a valid number of seats.";
      setBillingErrors(errs);
      if (Object.keys(errs).length) { toast.error("Please fix the errors before saving."); return; }
      setBillingSaved({ ...billing });
    }
    if (activeTab === "Security")     setSecuritySaved({ ...security });
    if (activeTab === "Integrations") setIntegrationsSaved({ ...integrations });
    if (activeTab === "Workflow")     setWorkflowSaved({ ...workflow });
    toast.success("Settings saved successfully.");
  };

  // small helper to render an inline field error
  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs mt-1" style={{ color: C.coral }}>{msg}</p> : null;

  // toggle row
  const ToggleRow = ({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[#E8EAF0] dark:border-gray-700/50 last:border-0">
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
        {desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5.5 rounded-full transition-colors duration-200 flex-shrink-0"
        style={{ background: checked ? G.primary : C.border, minWidth: 40, height: 22 }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: checked ? "calc(100% - 18px)" : 2 }}
        />
      </button>
    </div>
  );

  // integration card
  const IntCard = ({ name, desc, icon: Icon, color, enabled, onToggle }: { name: string; desc: string; icon: any; color: string; enabled: boolean; onToggle: () => void }) => (
    <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className="relative rounded-full transition-colors duration-200 flex-shrink-0"
        style={{ background: enabled ? G.primary : C.border, minWidth: 40, height: 22 }}
      >
        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200" style={{ left: enabled ? "calc(100% - 18px)" : 2 }} />
      </button>
    </div>
  );

  const tabContent: Record<SettingsTab, React.ReactNode> = {
    "General": (
      <Card className="p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">General Settings</h3>
        <div>
          <Input label="Organization Name" value={general.orgName} onChange={(e: any) => { setGeneral(g => ({ ...g, orgName: e.target.value })); setGeneralErrors(p => ({ ...p, orgName: "" })); }} icon={Building2} required />
          <FieldError msg={generalErrors.orgName} />
        </div>
        <div>
          <Input label="Organization Email" type="email" value={general.orgEmail} onChange={(e: any) => { setGeneral(g => ({ ...g, orgEmail: e.target.value })); setGeneralErrors(p => ({ ...p, orgEmail: "" })); }} icon={Mail} required />
          <FieldError msg={generalErrors.orgEmail} />
        </div>
        <Select label="Timezone" options={["UTC-5 (Eastern Time)", "UTC-8 (Pacific Time)", "UTC+0 (GMT)", "UTC+1 (CET)", "UTC+5:30 (IST)"]} value={general.timezone} onChange={(e: any) => setGeneral(g => ({ ...g, timezone: e.target.value }))} />
        <Select label="Date Format" options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]} value={general.dateFormat} onChange={(e: any) => setGeneral(g => ({ ...g, dateFormat: e.target.value }))} />
        <Select label="Default Language" options={["English (US)", "English (UK)", "French", "German", "Spanish"]} value={general.language} onChange={(e: any) => setGeneral(g => ({ ...g, language: e.target.value }))} />
      </Card>
    ),

    "Security": (
      <Card className="p-5 space-y-1">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Security Settings</h3>
        <ToggleRow label="Two-Factor Authentication" desc="Require MFA for all users at login" checked={security.mfa} onChange={v => setSecurity(s => ({ ...s, mfa: v }))} />
        <ToggleRow label="Audit Log Retention" desc="Keep detailed logs of all user actions" checked={security.auditLogs} onChange={v => setSecurity(s => ({ ...s, auditLogs: v }))} />
        <div className="pt-3 space-y-4">
          <Select label="Session Timeout" options={["15 minutes", "30 minutes", "1 hour", "4 hours", "Never"]} value={security.sessionTimeout} onChange={(e: any) => setSecurity(s => ({ ...s, sessionTimeout: e.target.value }))} />
          <Select label="Password Policy" options={["Basic (8+ chars)", "Strong (12+ chars, mixed)", "Very Strong (16+, symbols required)"]} value={security.passwordPolicy} onChange={(e: any) => setSecurity(s => ({ ...s, passwordPolicy: e.target.value }))} />
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">IP Whitelist</label>
            <textarea
              className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none resize-none"
              rows={3}
              placeholder="e.g. 192.168.1.0/24, 10.0.0.1"
              value={security.ipWhitelist}
              onChange={e => setSecurity(s => ({ ...s, ipWhitelist: e.target.value }))}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Leave blank to allow all IPs. Separate multiple ranges with commas.</p>
          </div>
        </div>
      </Card>
    ),

    "Integrations": (
      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Connected Integrations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <IntCard name="Slack" desc="Team notifications & alerts" icon={MessageSquare} color={C.purple} enabled={integrations.slack} onToggle={() => setIntegrations(i => ({ ...i, slack: !i.slack }))} />
            <IntCard name="Microsoft Teams" desc="Meeting and approval workflows" icon={Users} color={C.sky} enabled={integrations.teams} onToggle={() => setIntegrations(i => ({ ...i, teams: !i.teams }))} />
            <IntCard name="Salesforce" desc="CRM contract sync" icon={Database} color={C.teal} enabled={integrations.salesforce} onToggle={() => setIntegrations(i => ({ ...i, salesforce: !i.salesforce }))} />
            <IntCard name="Jira" desc="Issue and task tracking" icon={Target} color={C.violet} enabled={integrations.jira} onToggle={() => setIntegrations(i => ({ ...i, jira: !i.jira }))} />
            <IntCard name="Google Drive" desc="Document storage & sharing" icon={FolderOpen} color={C.coral} enabled={integrations.googleDrive} onToggle={() => setIntegrations(i => ({ ...i, googleDrive: !i.googleDrive }))} />
          </div>
        </Card>
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">API Access</h3>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">API Key</label>
            <div className="flex gap-2 mt-1.5">
              <input readOnly value={integrations.apiKey} className="flex-1 border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 font-mono" />
              <SecondaryBtn icon={RotateCcw} onClick={() => { setIntegrations(i => ({ ...i, apiKey: "iq-live-" + Math.random().toString(36).slice(2, 12) })); toast.success("API key regenerated."); }}>Rotate</SecondaryBtn>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Keep this key secret. Rotating it will invalidate the current key immediately.</p>
          </div>
        </Card>
      </div>
    ),

    "Email Templates": (
      <Card className="p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Email Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input label="From Name" value={email.fromName} onChange={(e: any) => { setEmail(m => ({ ...m, fromName: e.target.value })); setEmailErrors(p => ({ ...p, fromName: "" })); }} icon={User} required />
            <FieldError msg={emailErrors.fromName} />
          </div>
          <div>
            <Input label="From Email" type="email" value={email.fromEmail} onChange={(e: any) => { setEmail(m => ({ ...m, fromEmail: e.target.value })); setEmailErrors(p => ({ ...p, fromEmail: "" })); }} icon={Mail} required />
            <FieldError msg={emailErrors.fromEmail} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Renewal Reminder — Subject<Req /></label>
          <input
            className="w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none"
            value={email.reminderSubject}
            onChange={e => { setEmail(m => ({ ...m, reminderSubject: e.target.value })); setEmailErrors(p => ({ ...p, reminderSubject: "" })); }}
          />
          <FieldError msg={emailErrors.reminderSubject} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Renewal Reminder — Body<Req /></label>
          <textarea
            rows={6}
            className="w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none resize-none"
            value={email.reminderBody}
            onChange={e => { setEmail(m => ({ ...m, reminderBody: e.target.value })); setEmailErrors(p => ({ ...p, reminderBody: "" })); }}
          />
          <FieldError msg={emailErrors.reminderBody} />
          <p className="text-xs text-gray-400 dark:text-gray-500">Available variables: {'{{contract_name}}'}, {'{{recipient_name}}'}, {'{{renewal_date}}'}</p>
        </div>
        <ToggleRow label="Email Signature" desc="Append organization signature to outgoing emails" checked={email.signatureEnabled} onChange={v => setEmail(m => ({ ...m, signatureEnabled: v }))} />
      </Card>
    ),

    "Workflow": (
      <Card className="p-5 space-y-1">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Workflow Settings</h3>
        <ToggleRow label="Auto-assign Contracts" desc="Automatically assign new contracts to available reviewers" checked={workflow.autoAssign} onChange={v => setWorkflow(w => ({ ...w, autoAssign: v }))} />
        <ToggleRow label="Expiry Notifications" desc="Notify stakeholders when contracts approach expiry" checked={workflow.notifyOnExpiry} onChange={v => setWorkflow(w => ({ ...w, notifyOnExpiry: v }))} />
        <ToggleRow label="Dual Approval Required" desc="Require two approvers before a contract is executed" checked={workflow.requireDualApproval} onChange={v => setWorkflow(w => ({ ...w, requireDualApproval: v }))} />
        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Approval Stages</label>
            <select
              className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-3 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 focus:outline-none"
              value={workflow.approvalStages}
              onChange={e => setWorkflow(w => ({ ...w, approvalStages: e.target.value }))}
            >
              {["1","2","3","4","5"].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Escalation After (days)</label>
            <input
              type="number" min="1" max="30"
              className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none"
              value={workflow.escalationDays}
              onChange={e => setWorkflow(w => ({ ...w, escalationDays: e.target.value }))}
            />
          </div>
        </div>
      </Card>
    ),

    "Billing": (
      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Current Plan</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage your subscription and usage</p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ background: G.primary }}>{billing.plan}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {[["Seats", billing.seats], ["Contracts", "Unlimited"], ["Storage", "500 GB"]].map(([l, v]) => (
              <div key={l} className="rounded-xl p-3 border border-[#E8EAF0] dark:border-gray-700/50 text-center">
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{v}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Number of Seats<Req /></label>
              <input
                type="number" min="1"
                className="mt-1.5 w-full border border-[#E8EAF0] dark:border-gray-700/50 rounded-xl px-4 py-2.5 text-sm bg-[#F8F9FC] dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none"
                value={billing.seats}
                onChange={e => { setBilling(b => ({ ...b, seats: e.target.value })); setBillingErrors(p => ({ ...p, seats: "" })); }}
              />
              <FieldError msg={billingErrors.seats} />
            </div>
            <div>
              <Input label="Billing Email" type="email" value={billing.billingEmail} onChange={(e: any) => { setBilling(b => ({ ...b, billingEmail: e.target.value })); setBillingErrors(p => ({ ...p, billingEmail: "" })); }} icon={Mail} required />
              <FieldError msg={billingErrors.billingEmail} />
            </div>
            <Select label="Billing Cycle" options={["Monthly", "Annual"]} value={billing.billingCycle} onChange={(e: any) => setBilling(b => ({ ...b, billingCycle: e.target.value }))} />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Payment Method</h3>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50">
            <div className="w-10 h-7 rounded bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">VISA</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">•••• •••• •••• 4242</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Expires 09/2027</p>
            </div>
            <SecondaryBtn>Update</SecondaryBtn>
          </div>
        </Card>
      </div>
    ),
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Tab nav */}
        <div className="lg:col-span-1 space-y-1">
          {TABS.map(({ id, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                style={active
                  ? { background: G.primary, color: "#fff" }
                  : { color: "#6b7280" }}
              >
                <Icon size={15} className="flex-shrink-0" style={{ opacity: active ? 1 : 0.6 }} />
                {id}
                {isDirty() && active && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-white/70 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="lg:col-span-2 space-y-4">
          {tabContent[activeTab]}
          <div className="flex justify-end gap-3">
            <SecondaryBtn onClick={handleDiscard}>Discard</SecondaryBtn>
            <PrimaryBtn onClick={handleSave}>Save Settings</PrimaryBtn>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Employee Dashboard ────────────────────────────────────────────────────────
function EmployeeDashboard({ setPage }: { setPage: (p: Page) => void }) {
  const myContracts = [
    { id: "CTR-2403", name: "Employment Contract – Legal",   expiry: "2026-02-28", status: "Active",   daysLeft: 607 },
    { id: "CTR-2410", name: "Non-Disclosure Agreement",      expiry: "2025-06-30", status: "Active",   daysLeft: 180 },
    { id: "CTR-2411", name: "Benefits Enrollment Agreement", expiry: "2024-12-31", status: "Expiring", daysLeft: 32  },
  ];
  const myTasks = [
    { id: 1, name: "Sign Updated NDA",                due: "2024-07-20", priority: "High",   status: "Pending"     },
    { id: 2, name: "Complete Annual Policy Review",   due: "2024-07-31", priority: "Medium", status: "In Progress" },
    { id: 3, name: "Acknowledge Code of Conduct",     due: "2024-08-05", priority: "Low",    status: "Pending"     },
    { id: 4, name: "Benefits Re-enrollment",          due: "2024-12-01", priority: "Medium", status: "Pending"     },
  ];
  const taskActivity = [
    { month: "Feb", done: 2, pending: 1 },
    { month: "Mar", done: 3, pending: 2 },
    { month: "Apr", done: 1, pending: 3 },
    { month: "May", done: 4, pending: 1 },
    { month: "Jun", done: 2, pending: 2 },
    { month: "Jul", done: 1, pending: 4 },
  ];

  const statusBadge = (s: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      Active:       { bg: "#1BCFB414", color: "#0fb89f" },
      Expiring:     { bg: "#FE949614", color: "#fc6572" },
      Pending:      { bg: "#4BCBEB14", color: "#1fa8d4" },
      "In Progress":{ bg: "#A05AFF14", color: "#9E58FF" },
      Completed:    { bg: "#1BCFB414", color: "#0fb89f" },
    };
    const s2 = map[s] ?? { bg: "#6b728014", color: "#6b7280" };
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: s2.bg, color: s2.color }}>{s}</span>
    );
  };

  const priorityDot = (p: string) => {
    const col = p === "High" ? C.coral : p === "Medium" ? C.sky : "#a3a3a3";
    return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col }} />;
  };

  return (
    <div className="space-y-6">
      {/* Header greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Hello, Alex 👋</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Here&apos;s your contract & task summary</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPage("contracts")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: G.primary }}>
            <FileText size={14} /> My Contracts
          </button>
          <button onClick={() => setPage("obligations")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border" style={{ borderColor: C.border, color: C.purple }}>
            <CheckSquare size={14} /> My Tasks
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Contracts", value: "2",  icon: FileText,    color: C.purple },
          { label: "Pending Tasks",    value: "3",  icon: Clock,       color: C.coral  },
          { label: "Expiring Soon",    value: "1",  icon: AlertTriangle,color: C.sky   },
          { label: "Completed Tasks",  value: "7",  icon: CheckCircle, color: C.teal   },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-[#E8EAF0] dark:border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* My Contracts */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E8EAF0] dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">My Contracts</h3>
            <button onClick={() => setPage("contracts")} className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: C.purple }}>View all</button>
          </div>
          <div className="space-y-3">
            {myContracts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: C.bg }}>
                <div className="flex-1 min-w-0 mr-3">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{c.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{c.id} · Expires {c.expiry}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {statusBadge(c.status)}
                  <span className="text-xs text-gray-400">{c.daysLeft}d left</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E8EAF0] dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Pending Tasks</h3>
            <button onClick={() => setPage("obligations")} className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: C.purple }}>View all</button>
          </div>
          <div className="space-y-3">
            {myTasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: C.bg }}>
                {priorityDot(t.priority)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{t.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Due {t.due}</div>
                </div>
                {statusBadge(t.status)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Activity Chart + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E8EAF0] dark:border-gray-700 p-5">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Task Activity</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={taskActivity} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "none", fontSize: 12 }} />
              <Bar key="done"    dataKey="done"    fill={C.teal}   radius={[4, 4, 0, 0]} name="Completed" />
              <Bar key="pending" dataKey="pending" fill={C.purple} radius={[4, 4, 0, 0]} name="Pending"   />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E8EAF0] dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Recent Alerts</h3>
            <button onClick={() => setPage("notifications")} className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: C.purple }}>View all</button>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 4).map((n, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: n.read ? "#F8F9FC" : `${C.purple}14` }}>
                  <Bell size={12} style={{ color: n.read ? "#9ca3af" : C.purple }} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{n.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CONTRACT MANAGER DASHBOARD ───────────────────────────────────────────────
function ContractManagerDashboard({ setPage }: { setPage: (p: Page) => void }) {
  const myContracts = [
    { id: "CTR-2401", name: "Microsoft Azure SLA",        expiry: "2025-01-14", status: "Active",   value: "$95,000"  },
    { id: "CTR-2402", name: "Global Logistics Agreement", expiry: "2024-07-31", status: "Expiring", value: "$85,000"  },
    { id: "CTR-2404", name: "Oracle ERP License",         expiry: "2024-10-31", status: "Active",   value: "$120,000" },
    { id: "CTR-2408", name: "Insurance Policy – D&O",     expiry: "2024-12-31", status: "Pending",  value: "$45,000"  },
  ];

  const renewalAlerts = [
    { name: "Global Logistics Agreement", daysLeft: 31,  status: "Critical"        },
    { name: "Oracle ERP License",         daysLeft: 123, status: "Upcoming"        },
    { name: "Office Lease – HQ",          daysLeft: 184, status: "Action Required" },
  ];

  const contractVolumeData = [
    { month: "Feb", created: 3, renewed: 1 },
    { month: "Mar", created: 5, renewed: 2 },
    { month: "Apr", created: 4, renewed: 3 },
    { month: "May", created: 7, renewed: 2 },
    { month: "Jun", created: 6, renewed: 4 },
    { month: "Jul", created: 5, renewed: 3 },
  ];

  const categoryBreakdown = [
    { name: "Technology",  value: 32, color: C.purple },
    { name: "Procurement", value: 28, color: C.teal   },
    { name: "Legal",       value: 14, color: C.sky    },
    { name: "HR",          value: 19, color: C.violet },
    { name: "Facilities",  value: 9,  color: C.coral  },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Contract Manager Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage contracts, track renewals, and monitor obligations.</p>
        </div>
        <div className="flex gap-2">
          <SecondaryBtn icon={FolderOpen} onClick={() => setPage("contract-repository")}>Repository</SecondaryBtn>
          <PrimaryBtn icon={Plus} onClick={() => setPage("contract-create")}>New Contract</PrimaryBtn>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Contracts"   value="38"  sub="currently managed"  trend="+4 this month"  icon={FileText}     color={C.purple} />
        <StatCard label="Expiring in 90d"    value="7"   sub="need renewal action" trend="3 critical"     icon={Clock}        color={C.coral}  />
        <StatCard label="Pending Renewals"   value="5"   sub="awaiting action"     trend="1 overdue"      icon={RefreshCw}    color={C.sky}    />
        <StatCard label="Total Value"        value="$2.1M" sub="under management"  trend="+12% vs Q2"     icon={Briefcase}    color={C.teal}   />
      </div>

      {/* Main content: contracts list + renewal alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">My Contracts</h3>
            <button onClick={() => setPage("contracts")} className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: C.purple }}>View all →</button>
          </div>
          <div className="space-y-2">
            {myContracts.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 hover:border-purple-200 dark:hover:border-purple-700 transition-all">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${C.purple}14` }}>
                  <FileText size={15} style={{ color: C.purple }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.id} · Expires {c.expiry}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge label={c.status} />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{c.value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Renewal Alerts</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Upcoming expirations</p>
          <div className="space-y-3">
            {renewalAlerts.map(r => (
              <div key={r.name} className="p-3 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{r.name}</span>
                  <Badge label={r.status} />
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={11} />
                  <span>{r.daysLeft} days remaining</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setPage("renewals")} className="mt-3 w-full text-xs font-semibold py-2 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            View All Renewals →
          </button>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Contract Volume</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={contractVolumeData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
              <Legend />
              <Bar key="cm-created" dataKey="created" fill={C.purple} radius={[4,4,0,0]} name="Created" />
              <Bar key="cm-renewed" dataKey="renewed" fill={C.teal}   radius={[4,4,0,0]} name="Renewed" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">By Category</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={160}>
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" outerRadius={65} paddingAngle={2} dataKey="value">
                  {categoryBreakdown.map((e, i) => <Cell key={`cm-cat-${e.name}-${i}`} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryBreakdown.map(({ name, value, color }) => (
                <div key={name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /><span className="text-gray-600 dark:text-gray-300">{name}</span></div>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{value}</span>
                  </div>
                  <ProgressBar value={(value / 32) * 100} color={color} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Plus,        label: "Create Contract",    color: C.purple, action: () => setPage("contract-create")     },
            { icon: FolderOpen,  label: "Browse Repository",  color: C.teal,   action: () => setPage("contract-repository") },
            { icon: RefreshCw,   label: "Manage Renewals",    color: C.sky,    action: () => setPage("renewals")            },
            { icon: CheckSquare, label: "View Obligations",   color: C.violet, action: () => setPage("obligations")         },
          ].map(({ icon: Icon, label, color, action }) => (
            <button key={label} onClick={action} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 hover:border-[#A05AFF]/40 hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 group-hover:text-purple-700 text-center">{label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── DEPARTMENT HEAD DASHBOARD ─────────────────────────────────────────────────
function DepartmentHeadDashboard({ setPage }: { setPage: (p: Page) => void }) {
  const deptContracts = [
    { id: "CTR-2404", name: "Oracle ERP License",         expiry: "2024-10-31", status: "Active",   category: "Technology"  },
    { id: "CTR-2401", name: "Microsoft Azure SLA",        expiry: "2025-01-14", status: "Active",   category: "Technology"  },
    { id: "CTR-2409", name: "AWS Cloud Services",         expiry: "2025-06-30", status: "Pending",  category: "Technology"  },
  ];

  const teamObligations = [
    { id: 1, name: "Annual Vendor Audit",               due: "2024-08-15", progress: 30,  status: "Pending"     },
    { id: 2, name: "ISO 27001 Renewal",                 due: "2024-07-10", progress: 10,  status: "Overdue"     },
    { id: 3, name: "Software License Audit",            due: "2024-08-30", progress: 55,  status: "In Progress" },
    { id: 4, name: "Quarterly IT Review",               due: "2024-09-01", progress: 0,   status: "Pending"     },
  ];

  const deptComplianceData = [
    { month: "Feb", score: 80 }, { month: "Mar", score: 83 }, { month: "Apr", score: 87 },
    { month: "May", score: 90 }, { month: "Jun", score: 88 }, { month: "Jul", score: 92 },
  ];

  const spendBreakdown = [
    { name: "Technology", value: 251000, color: C.purple },
    { name: "Services",   value: 157000, color: C.teal   },
    { name: "Facilities", value:  72000, color: C.sky    },
    { name: "Other",      value:  44000, color: C.coral  },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Department Head Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Department contracts, team obligations, and compliance overview.</p>
        </div>
        <div className="flex gap-2">
          <SecondaryBtn icon={BarChart2} onClick={() => setPage("reports")}>Reports</SecondaryBtn>
          <PrimaryBtn icon={Eye} onClick={() => setPage("contracts")}>View Contracts</PrimaryBtn>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Dept Contracts"      value="12"  sub="active in dept"     trend="+2 this quarter" icon={FileText}     color={C.purple} />
        <StatCard label="Open Obligations"    value="4"   sub="assigned to team"   trend="1 overdue"       icon={CheckSquare}  color={C.coral}  />
        <StatCard label="Compliance Score"    value="92%" sub="department average"  trend="+4% vs last mo." icon={ShieldCheck}  color={C.teal}   />
        <StatCard label="Budget Committed"    value="$524K" sub="contract value"   trend="within budget"   icon={Briefcase}    color={C.sky}    />
      </div>

      {/* Dept contracts + obligations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Department Contracts</h3>
            <button onClick={() => setPage("contracts")} className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: C.purple }}>View all →</button>
          </div>
          <div className="space-y-2">
            {deptContracts.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 hover:border-purple-200 dark:hover:border-purple-700 transition-all">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${C.teal}14` }}>
                  <FileText size={15} style={{ color: C.teal }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.id} · {c.category} · Expires {c.expiry}</p>
                </div>
                <Badge label={c.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Team Obligations</h3>
            <button onClick={() => setPage("obligations")} className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: C.purple }}>View all →</button>
          </div>
          <div className="space-y-3">
            {teamObligations.map(o => (
              <div key={o.id} className="p-3 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate flex-1">{o.name}</span>
                  <Badge label={o.status} />
                </div>
                <div className="mb-1.5"><ProgressBar value={o.progress} color={o.status === "Overdue" ? C.coral : C.purple} /></div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Due {o.due}</span>
                  <span>{o.progress}% complete</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Compliance Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={deptComplianceData}>
              <defs>
                <linearGradient id="dh-compliance-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.teal} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.teal} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.teal}` }} />
              <Area type="monotone" dataKey="score" stroke={C.teal} strokeWidth={2.5} fill="url(#dh-compliance-grad)" name="Score %" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Spend by Category</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={160}>
              <PieChart>
                <Pie data={spendBreakdown} cx="50%" cy="50%" outerRadius={65} paddingAngle={2} dataKey="value">
                  {spendBreakdown.map((e, i) => <Cell key={`dh-spend-${e.name}-${i}`} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(160,90,255,0.15)", borderTop: `3px solid ${C.purple}` }} formatter={(v: any) => `$${(v/1000).toFixed(0)}K`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {spendBreakdown.map(({ name, value, color }) => (
                <div key={name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /><span className="text-gray-600 dark:text-gray-300">{name}</span></div>
                    <span className="font-bold text-gray-800 dark:text-gray-100">${(value/1000).toFixed(0)}K</span>
                  </div>
                  <ProgressBar value={(value / 251000) * 100} color={color} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Eye,         label: "View Contracts",   color: C.purple, action: () => setPage("contracts")           },
            { icon: CheckSquare, label: "Team Obligations", color: C.teal,   action: () => setPage("obligations")         },
            { icon: RefreshCw,   label: "Renewals",         color: C.sky,    action: () => setPage("renewals")            },
            { icon: BarChart2,   label: "View Reports",     color: C.violet, action: () => setPage("reports")             },
          ].map(({ icon: Icon, label, color, action }) => (
            <button key={label} onClick={action} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#E8EAF0] dark:border-gray-700/50 hover:border-[#A05AFF]/40 hover:bg-[#A05AFF]/8 dark:hover:bg-[#A05AFF]/15 transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 group-hover:text-purple-700 text-center">{label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [role, setRole] = useState<UserRole>("administrator");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dark, setDark] = useState(false);

  // Lifted profile display state — initialised from roleUsers, updated on profile save
  const [displayName,  setDisplayName]  = useState(roleUsers["administrator"].name);
  const [displayEmail, setDisplayEmail] = useState(`tr@contractiq.com`);

  // Lifted contracts state — loaded from API, shared across pages
  const [sharedContracts, setSharedContracts] = useState<RepoContract[]>([...contractsData]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const fetchContracts = useCallback(async () => {
    try {
      setContractsLoading(true);
      const res = await contractsApi.list();
      setSharedContracts(res.data as RepoContract[]);
    } catch {
      // backend offline – fall back to local mock data silently
    } finally {
      setContractsLoading(false);
    }
  }, []);
  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  // Lifted notification state so Topbar badge stays in sync
  const [notifItems,     setNotifItems]     = useState<NotifItem[]>(notifications.map((n, i) => ({ ...n, id: i })));
  const [notifDismissed, setNotifDismissed] = useState<Set<number>>(new Set());
  const hasUnread = notifItems.filter(n => !notifDismissed.has(n.id) && !n.read).length > 0;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.list();
      setNotifItems(res.data.map((n) => ({ ...n, id: Number(n.id) })));
    } catch {
      setNotifItems(notifications.map((n, i) => ({ ...n, id: i })));
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await auditLogsApi.list();
      setAuditItems(res.data.map((l) => ({ ...l, id: Number(l.id) })));
    } catch {
      setAuditItems(auditLogs.map((l, i) => ({ ...l, id: i + 1 })));
    }
  }, []);

  const [auditItems, setAuditItems] = useState<typeof auditLogs>(() => auditLogs.map((l, i) => ({ ...l, id: i + 1 })));

  useEffect(() => {
    fetchNotifications();
    fetchAuditLogs();
  }, [fetchNotifications, fetchAuditLogs]);

  // Reset notifications to demo defaults on logout so each session starts fresh
  useEffect(() => {
    if (page === "login") {
      setNotifItems(notifications.map((n, i) => ({ ...n, id: i })));
      setNotifDismissed(new Set());
    }
  }, [page]);

  // When role changes (new login), reset display info to match the new role
  const handleSetRole = (r: UserRole) => {
    setRole(r);
    const u = roleUsers[r];
    setDisplayName(u.name);
    setDisplayEmail(`${u.initials.toLowerCase()}@contractiq.com`);
  };

  const initials = displayName.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const isAuth = page !== "login" && page !== "register";

  if (!isAuth) {
    return (
      <div className={dark ? "dark" : ""} style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>
        {page === "login"    && <LoginPage    setPage={setPage} setRole={handleSetRole} />}
        {page === "register" && <RegisterPage setPage={setPage} />}
      </div>
    );
  }

  const displayUser = { name: displayName, initials, title: roleUsers[role].title, email: displayEmail };

  return (
    <div className={dark ? "dark" : ""} style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>
    <Toaster position="top-right" richColors closeButton />
    <div className="flex h-screen overflow-hidden bg-[#F8F9FC] dark:bg-[#111827] transition-colors duration-200">
      <Sidebar page={page} setPage={setPage} role={role} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} displayUser={displayUser} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar page={page} setPage={setPage} role={role} dark={dark} setDark={setDark} displayUser={displayUser} hasUnread={hasUnread} />
        <main className="flex-1 overflow-y-auto p-5 bg-[#F8F9FC] dark:bg-[#111827] transition-colors duration-200">
          {page === "dashboard" && role === "administrator"      && <AdminDashboard      setPage={setPage} />}
          {page === "dashboard" && role === "legal"              && <LegalDashboard      setPage={setPage} />}
          {page === "dashboard" && role === "compliance"         && <ComplianceDashboard setPage={setPage} />}
          {page === "dashboard" && role === "contract-manager"   && <ContractManagerDashboard  setPage={setPage} />}
          {page === "dashboard" && role === "department-head"   && <DepartmentHeadDashboard   setPage={setPage} />}
          {page === "dashboard" && role === "employee"           && <EmployeeDashboard   setPage={setPage} />}
          {page === "contracts"             && <ContractManagementPage  setPage={setPage} role={role} contracts={sharedContracts} setContracts={setSharedContracts} />}
          {page === "contract-repository"   && <ContractRepositoryPage  setPage={setPage} contracts={sharedContracts} setContracts={setSharedContracts} />}
          {page === "contract-detail"       && <ContractDetailPage      setPage={setPage} />}
          {page === "contract-create"       && <ContractCreatePage      setPage={setPage} onContractCreated={(c) => setSharedContracts(prev => [c, ...prev])} />}
          {page === "contract-approval"     && <ContractApprovalPage    setPage={setPage} />}
          {page === "obligations"           && <ObligationsPage role={role} />}
          {page === "renewals"              && <RenewalsPage />}
          {page === "compliance"            && <CompliancePage />}
          {page === "notifications"         && <NotificationsPage items={notifItems} setItems={setNotifItems} dismissed={notifDismissed} setDismissed={setNotifDismissed} />}
          {page === "reports"               && <ReportsPage />}
          {page === "audit-logs"            && <AuditLogsPage items={auditItems} />}
          {page === "users"                 && <UsersPage />}
          {page === "profile"               && <ProfilePage role={role} displayUser={displayUser} onSaveProfile={(name, email) => { setDisplayName(name); setDisplayEmail(email); }} />}
          {page === "settings"              && <SettingsPage />}
        </main>
      </div>
    </div>
    </div>
  );
}

