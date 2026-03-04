import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const STATUS_CFG = {
  Draft: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
    border: "border-gray-200",
  },
  Processed: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  Paid: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
    border: "border-green-200",
  },
};

const API = "http://localhost:5000/api/payroll";
const token = () => localStorage.getItem("token");
const headers = () => ({
  Authorization: `Bearer ${token()}`,
  "Content-Type": "application/json",
});
const fmt = (n) =>
  parseFloat(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 });
const now = new Date();

// ── Generic field input ──────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1">
      {label}
    </label>
    {children}
  </div>
);

const Input = ({ value, onChange, type = "number", ...rest }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    {...rest}
    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
  />
);

// ── Salary Slip PDF ──────────────────────────────────────────────────────────
function generateSlipPDF(rec) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.width;

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 42, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SALARY SLIP", pageW / 2, 17, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${MONTHS[rec.pay_period_month - 1]} ${rec.pay_period_year}`,
    pageW / 2,
    27,
    { align: "center" },
  );
  doc.setFontSize(8);
  doc.text(`Status: ${rec.status}`, pageW / 2, 35, { align: "center" });

  // Employee card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 50, pageW - 28, 30, 3, 3, "FD");
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(rec.employee_name || "", 20, 62);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const detail = [rec.emp_code, rec.designation, rec.department]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(detail, 20, 71);
  doc.setFontSize(8);
  if (rec.email) doc.text(rec.email, 20, 78);

  // Earnings
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Earnings", 14, 94);

  autoTable(doc, {
    head: [["Component", "Amount (LKR)"]],
    body: [
      ["Basic Salary", fmt(rec.basic_salary)],
      ["Housing Allowance", fmt(rec.housing_allowance)],
      ["Transport Allowance", fmt(rec.transport_allowance)],
      ["Medical Allowance", fmt(rec.medical_allowance)],
      ["Other Allowances", fmt(rec.other_allowances)],
      ["GROSS SALARY", fmt(rec.gross_salary)],
    ],
    startY: 97,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" } },
    didParseCell(d) {
      if (d.section === "body" && d.row.index === 5) {
        d.cell.styles.fontStyle = "bold";
        d.cell.styles.fillColor = [239, 246, 255];
      }
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 14, right: 14 },
  });

  // Deductions
  const afterEarnings = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Deductions", 14, afterEarnings);

  autoTable(doc, {
    head: [["Component", "Amount (LKR)"]],
    body: [
      ["EPF (Employee 8%)", fmt(rec.epf_employee)],
      ["Income Tax", fmt(rec.income_tax)],
      ["Other Deductions", fmt(rec.other_deductions)],
      ["TOTAL DEDUCTIONS", fmt(rec.total_deductions)],
    ],
    startY: afterEarnings + 3,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" } },
    didParseCell(d) {
      if (d.section === "body" && d.row.index === 3) {
        d.cell.styles.fontStyle = "bold";
        d.cell.styles.fillColor = [254, 242, 242];
      }
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 14, right: 14 },
  });

  // Net salary box
  const afterDed = doc.lastAutoTable.finalY + 10;
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(14, afterDed, pageW - 28, 22, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("NET SALARY", 20, afterDed + 10);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`LKR ${fmt(rec.net_salary)}`, pageW - 20, afterDed + 13, {
    align: "right",
  });

  // EPF / ETF employer contributions note
  const noteY = afterDed + 38;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    `Employer Contributions — EPF (12%): LKR ${fmt(rec.epf_employer)}   ETF (3%): LKR ${fmt(rec.etf)}`,
    pageW / 2,
    noteY,
    { align: "center" },
  );

  // Attendance
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Working Days: ${rec.working_days || 0}   Present Days: ${rec.present_days || 0}`,
    pageW / 2,
    noteY + 8,
    { align: "center" },
  );

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated: ${new Date().toLocaleString("en-US")}   ·   Page ${i} of ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.height - 8,
      { align: "center" },
    );
  }

  doc.save(
    `Salary_Slip_${rec.emp_code}_${MONTHS_SHORT[rec.pay_period_month - 1]}${rec.pay_period_year}.pdf`,
  );
}

// ── Edit Payroll Modal ────────────────────────────────────────────────────────
function EditPayrollModal({ record, onClose, onSaved }) {
  const [form, setForm] = useState({
    basic_salary: record.basic_salary || 0,
    housing_allowance: record.housing_allowance || 0,
    transport_allowance: record.transport_allowance || 0,
    medical_allowance: record.medical_allowance || 0,
    other_allowances: record.other_allowances || 0,
    epf_employee_pct:
      record.epf_employee > 0 && record.basic_salary > 0
        ? ((record.epf_employee / record.basic_salary) * 100).toFixed(2)
        : 8,
    epf_employer_pct:
      record.epf_employer > 0 && record.basic_salary > 0
        ? ((record.epf_employer / record.basic_salary) * 100).toFixed(2)
        : 12,
    etf_pct:
      record.etf > 0 && record.basic_salary > 0
        ? ((record.etf / record.basic_salary) * 100).toFixed(2)
        : 3,
    income_tax: record.income_tax || 0,
    other_deductions: record.other_deductions || 0,
    working_days: record.working_days || 0,
    present_days: record.present_days || 0,
    status: record.status || "Draft",
    payment_date: record.payment_date ? record.payment_date.split("T")[0] : "",
    notes: record.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const n = (v) => parseFloat(v) || 0;
  const gross =
    n(form.basic_salary) +
    n(form.housing_allowance) +
    n(form.transport_allowance) +
    n(form.medical_allowance) +
    n(form.other_allowances);
  const epf_emp = (n(form.basic_salary) * n(form.epf_employee_pct)) / 100;
  const total_ded = epf_emp + n(form.income_tax) + n(form.other_deductions);
  const net = gross - total_ded;

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/${record.id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payroll record updated");
        onSaved();
        onClose();
      } else toast.error(data.message);
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              Edit Payroll Record
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {record.employee_name} · {MONTHS[record.pay_period_month - 1]}{" "}
              {record.pay_period_year}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Earnings */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Earnings
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Basic Salary (LKR)">
                <Input
                  value={form.basic_salary}
                  onChange={set("basic_salary")}
                />
              </Field>
              <Field label="Housing Allowance (LKR)">
                <Input
                  value={form.housing_allowance}
                  onChange={set("housing_allowance")}
                />
              </Field>
              <Field label="Transport Allowance (LKR)">
                <Input
                  value={form.transport_allowance}
                  onChange={set("transport_allowance")}
                />
              </Field>
              <Field label="Medical Allowance (LKR)">
                <Input
                  value={form.medical_allowance}
                  onChange={set("medical_allowance")}
                />
              </Field>
              <Field label="Other Allowances (LKR)">
                <Input
                  value={form.other_allowances}
                  onChange={set("other_allowances")}
                />
              </Field>
            </div>
          </div>

          {/* EPF / ETF */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              EPF / ETF Rates
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Field label="EPF Employee %">
                <Input
                  value={form.epf_employee_pct}
                  onChange={set("epf_employee_pct")}
                />
              </Field>
              <Field label="EPF Employer %">
                <Input
                  value={form.epf_employer_pct}
                  onChange={set("epf_employer_pct")}
                />
              </Field>
              <Field label="ETF %">
                <Input value={form.etf_pct} onChange={set("etf_pct")} />
              </Field>
            </div>
          </div>

          {/* Other deductions */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Other Deductions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Income Tax (LKR)">
                <Input value={form.income_tax} onChange={set("income_tax")} />
              </Field>
              <Field label="Other Deductions (LKR)">
                <Input
                  value={form.other_deductions}
                  onChange={set("other_deductions")}
                />
              </Field>
            </div>
          </div>

          {/* Attendance & Status */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Attendance & Status
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Working Days">
                <Input
                  value={form.working_days}
                  onChange={set("working_days")}
                />
              </Field>
              <Field label="Present Days">
                <Input
                  value={form.present_days}
                  onChange={set("present_days")}
                />
              </Field>
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={set("status")}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option>Draft</option>
                  <option>Processed</option>
                  <option>Paid</option>
                </select>
              </Field>
              <Field label="Payment Date">
                <Input
                  type="date"
                  value={form.payment_date}
                  onChange={set("payment_date")}
                />
              </Field>
            </div>
          </div>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            />
          </Field>

          {/* Live summary */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500">Gross</p>
              <p className="text-sm font-bold text-blue-700">
                LKR {fmt(gross)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Deductions</p>
              <p className="text-sm font-bold text-red-600">
                LKR {fmt(total_ded)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Net</p>
              <p className="text-sm font-bold text-green-700">LKR {fmt(net)}</p>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-all flex items-center gap-2"
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Salary Structure Modal ──────────────────────────────────────────────
function EditStructureModal({ structure, employees, onClose, onSaved }) {
  const [form, setForm] = useState(
    structure
      ? {
          employee_id: structure.employee_id,
          basic_salary: structure.basic_salary || 0,
          housing_allowance: structure.housing_allowance || 0,
          transport_allowance: structure.transport_allowance || 0,
          medical_allowance: structure.medical_allowance || 0,
          other_allowances: structure.other_allowances || 0,
          epf_employee_pct: structure.epf_employee_pct || 8,
          epf_employer_pct: structure.epf_employer_pct || 12,
          etf_pct: structure.etf_pct || 3,
          income_tax: structure.income_tax || 0,
          other_deductions: structure.other_deductions || 0,
          effective_from: structure.effective_from
            ? structure.effective_from.split("T")[0]
            : now.toISOString().split("T")[0],
        }
      : {
          employee_id: "",
          basic_salary: 0,
          housing_allowance: 0,
          transport_allowance: 0,
          medical_allowance: 0,
          other_allowances: 0,
          epf_employee_pct: 8,
          epf_employer_pct: 12,
          etf_pct: 3,
          income_tax: 0,
          other_deductions: 0,
          effective_from: now.toISOString().split("T")[0],
        },
  );
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const n = (v) => parseFloat(v) || 0;
  const gross =
    n(form.basic_salary) +
    n(form.housing_allowance) +
    n(form.transport_allowance) +
    n(form.medical_allowance) +
    n(form.other_allowances);

  const handleSave = async () => {
    if (!form.employee_id) {
      toast.error("Please select an employee");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/salary-structure`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Salary structure saved");
        onSaved();
        onClose();
      } else toast.error(data.message);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">
            {structure ? "Edit Salary Structure" : "New Salary Structure"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Employee select */}
          <Field label="Employee">
            {structure ? (
              <div className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-50 rounded-xl border border-gray-200">
                {structure.employee_name} ({structure.emp_code})
              </div>
            ) : (
              <select
                value={form.employee_id}
                onChange={set("employee_id")}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="">Select employee…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.employee_id})
                  </option>
                ))}
              </select>
            )}
          </Field>

          {/* Earnings */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Salary Components
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Basic Salary (LKR)">
                <Input
                  value={form.basic_salary}
                  onChange={set("basic_salary")}
                />
              </Field>
              <Field label="Housing Allowance (LKR)">
                <Input
                  value={form.housing_allowance}
                  onChange={set("housing_allowance")}
                />
              </Field>
              <Field label="Transport Allowance (LKR)">
                <Input
                  value={form.transport_allowance}
                  onChange={set("transport_allowance")}
                />
              </Field>
              <Field label="Medical Allowance (LKR)">
                <Input
                  value={form.medical_allowance}
                  onChange={set("medical_allowance")}
                />
              </Field>
              <Field label="Other Allowances (LKR)">
                <Input
                  value={form.other_allowances}
                  onChange={set("other_allowances")}
                />
              </Field>
              <Field label="Effective From">
                <Input
                  type="date"
                  value={form.effective_from}
                  onChange={set("effective_from")}
                />
              </Field>
            </div>
          </div>

          {/* Statutory */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              EPF / ETF / Tax
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <Field label="EPF Employee %">
                <Input
                  value={form.epf_employee_pct}
                  onChange={set("epf_employee_pct")}
                />
              </Field>
              <Field label="EPF Employer %">
                <Input
                  value={form.epf_employer_pct}
                  onChange={set("epf_employer_pct")}
                />
              </Field>
              <Field label="ETF %">
                <Input value={form.etf_pct} onChange={set("etf_pct")} />
              </Field>
              <Field label="Income Tax (LKR)">
                <Input value={form.income_tax} onChange={set("income_tax")} />
              </Field>
              <Field label="Other Deductions (LKR)">
                <Input
                  value={form.other_deductions}
                  onChange={set("other_deductions")}
                />
              </Field>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-0.5">
              Expected Gross Salary
            </p>
            <p className="text-xl font-bold text-blue-700">LKR {fmt(gross)}</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-all flex items-center gap-2"
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Save Structure
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Generate Payroll Modal ────────────────────────────────────────────────────
function GenerateModal({ month, year, onClose, onGenerated }) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API}/generate`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ month, year }),
      });
      const data = await res.json();
      if (data.success) {
        const { generated, skipped, errors } = data.data;
        toast.success(
          `Generated ${generated} records${skipped ? `, ${skipped} skipped (already exist)` : ""}`,
        );
        if (errors?.length)
          toast.warn(`${errors.length} employee(s) had errors`);
        onGenerated();
        onClose();
      } else toast.error(data.message);
    } catch {
      toast.error("Failed to generate payroll");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-base font-bold text-gray-800 text-center mb-1">
          Generate Payroll
        </h2>
        <p className="text-sm text-gray-500 text-center mb-5">
          This will create Draft payroll records for all employees with a salary
          structure for
          <br />
          <span className="font-semibold text-gray-700">
            {MONTHS[month - 1]} {year}
          </span>
          .<br />
          Existing records will be skipped.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            {generating && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ record, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API}/${record.id}`, {
        method: "DELETE",
        headers: headers(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Record deleted");
        onDeleted();
        onClose();
      } else toast.error(data.message);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-base font-bold text-gray-800 text-center mb-1">
          Delete Payroll Record
        </h2>
        <p className="text-sm text-gray-500 text-center mb-5">
          Delete payroll record for{" "}
          <span className="font-semibold text-gray-700">
            {record.employee_name}
          </span>
          ?<br />
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            {deleting && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PayrollManagement() {
  const [tab, setTab] = useState("runs");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Payroll runs state
  const [payrollList, setPayrollList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingRuns, setLoadingRuns] = useState(false);

  // Salary structures state
  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingStructures, setLoadingStructures] = useState(false);

  // Modals
  const [generateModal, setGenerateModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [editStructure, setEditStructure] = useState(null); // null = closed; {} = new; obj = edit
  const [structureModalOpen, setStructureModalOpen] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadRuns = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const res = await fetch(`${API}?month=${month}&year=${year}`, {
        headers: headers(),
      });
      const data = await res.json();
      if (data.success) {
        setPayrollList(data.data || []);
        setSummary(data.summary || null);
      }
    } catch {
      toast.error("Failed to load payroll records");
    } finally {
      setLoadingRuns(false);
    }
  }, [month, year]);

  const loadStructures = useCallback(async () => {
    setLoadingStructures(true);
    try {
      const [sRes, eRes] = await Promise.all([
        fetch(`${API}/salary-structures`, { headers: headers() }),
        fetch("http://localhost:5000/api/employees", { headers: headers() }),
      ]);
      const [sData, eData] = await Promise.all([sRes.json(), eRes.json()]);
      if (sData.success) setStructures(sData.data || []);
      if (eData.success || Array.isArray(eData.data))
        setEmployees(eData.data || []);
    } catch {
      toast.error("Failed to load salary structures");
    } finally {
      setLoadingStructures(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);
  useEffect(() => {
    if (tab === "structures") loadStructures();
  }, [tab, loadStructures]);

  // ── Status badge ───────────────────────────────────────────────────────────
  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CFG[status] || STATUS_CFG.Draft;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {status}
      </span>
    );
  };

  // ── Payroll Runs Tab ───────────────────────────────────────────────────────
  const RunsTab = () => (
    <div className="flex flex-col gap-5 h-full">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={loadRuns}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 shadow-sm transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Generate Payroll
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
          {[
            {
              label: "Total Records",
              value: summary.total_records,
              color: "text-gray-800",
              bg: "bg-white",
              border: "border-gray-200",
            },
            {
              label: "Gross Payroll",
              value: `LKR ${fmt(summary.total_gross)}`,
              color: "text-blue-700",
              bg: "bg-blue-50",
              border: "border-blue-100",
            },
            {
              label: "Net Payroll",
              value: `LKR ${fmt(summary.total_net)}`,
              color: "text-green-700",
              bg: "bg-green-50",
              border: "border-green-100",
            },
            {
              label: "Total EPF",
              value: `LKR ${fmt(parseFloat(summary.total_epf_employee || 0) + parseFloat(summary.total_epf_employer || 0))}`,
              color: "text-purple-700",
              bg: "bg-purple-50",
              border: "border-purple-100",
            },
            {
              label: "Total ETF",
              value: `LKR ${fmt(summary.total_etf)}`,
              color: "text-amber-700",
              bg: "bg-amber-50",
              border: "border-amber-100",
            },
            {
              label: "Status",
              value: `${summary.draft_count}D / ${summary.processed_count}P / ${summary.paid_count}✓`,
              color: "text-gray-700",
              bg: "bg-gray-50",
              border: "border-gray-200",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.bg} border ${s.border} rounded-xl p-3 shadow-sm`}
            >
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-sm font-bold ${s.color} leading-tight`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="h-full overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-200">
                {[
                  "#",
                  "Employee",
                  "Department",
                  "Basic",
                  "Gross",
                  "Deductions",
                  "Net",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingRuns ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-400">
                        Loading payroll records…
                      </p>
                    </div>
                  </td>
                </tr>
              ) : payrollList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-10 h-10 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-500">
                        No payroll records for this period
                      </p>
                      <p className="text-xs text-gray-400">
                        Click "Generate Payroll" to create records
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                payrollList.map((rec, idx) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {rec.employee_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 leading-tight">
                            {rec.employee_name}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {rec.emp_code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {rec.department || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-mono whitespace-nowrap">
                      {fmt(rec.basic_salary)}
                    </td>
                    <td className="px-4 py-3 text-sm text-blue-700 font-semibold font-mono whitespace-nowrap">
                      {fmt(rec.gross_salary)}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 font-mono whitespace-nowrap">
                      {fmt(rec.total_deductions)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-700 font-bold font-mono whitespace-nowrap">
                      {fmt(rec.net_salary)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Salary Slip */}
                        <button
                          onClick={() => generateSlipPDF(rec)}
                          title="Download Salary Slip"
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => setEditRecord(rec)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-all"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        {/* Delete — only for Draft */}
                        {rec.status === "Draft" && (
                          <button
                            onClick={() => setDeleteRecord(rec)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── Salary Structures Tab ─────────────────────────────────────────────────
  const StructuresTab = () => (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between shrink-0">
        <p className="text-sm text-gray-500">
          {structures.length} salary structure
          {structures.length !== 1 ? "s" : ""} defined
        </p>
        <button
          onClick={() => {
            setEditStructure(null);
            setStructureModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Structure
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="h-full overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-200">
                {[
                  "Employee",
                  "Department",
                  "Basic Salary",
                  "Housing",
                  "Transport",
                  "Medical",
                  "Other",
                  "EPF Ee%",
                  "EPF Er%",
                  "ETF%",
                  "Effective From",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingStructures ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-400">
                        Loading structures…
                      </p>
                    </div>
                  </td>
                </tr>
              ) : structures.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center">
                    <p className="text-sm text-gray-400">
                      No salary structures defined yet
                    </p>
                  </td>
                </tr>
              ) : (
                structures.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {s.employee_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 leading-tight">
                            {s.employee_name}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {s.emp_code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {s.department || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 font-mono whitespace-nowrap">
                      {fmt(s.basic_salary)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono whitespace-nowrap">
                      {fmt(s.housing_allowance)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono whitespace-nowrap">
                      {fmt(s.transport_allowance)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono whitespace-nowrap">
                      {fmt(s.medical_allowance)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono whitespace-nowrap">
                      {fmt(s.other_allowances)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {s.epf_employee_pct}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {s.epf_employer_pct}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {s.etf_pct}%
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {s.effective_from
                        ? new Date(s.effective_from).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setEditStructure(s);
                          setStructureModalOpen(true);
                        }}
                        title="Edit Structure"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-all"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="h-full flex flex-col px-6 py-6"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Payroll & Benefits
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage salary administration and pay periods
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit shrink-0">
        {[
          { key: "runs", label: "Payroll Runs" },
          { key: "structures", label: "Salary Structures" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {tab === "runs" && <RunsTab />}
        {tab === "structures" && <StructuresTab />}
      </div>

      {/* Modals */}
      {generateModal && (
        <GenerateModal
          month={month}
          year={year}
          onClose={() => setGenerateModal(false)}
          onGenerated={loadRuns}
        />
      )}
      {editRecord && (
        <EditPayrollModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSaved={loadRuns}
        />
      )}
      {deleteRecord && (
        <DeleteModal
          record={deleteRecord}
          onClose={() => setDeleteRecord(null)}
          onDeleted={loadRuns}
        />
      )}
      {structureModalOpen && (
        <EditStructureModal
          structure={editStructure}
          employees={employees}
          onClose={() => {
            setStructureModalOpen(false);
            setEditStructure(null);
          }}
          onSaved={loadStructures}
        />
      )}
    </div>
  );
}
