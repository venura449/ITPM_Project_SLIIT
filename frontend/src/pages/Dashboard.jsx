import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import EmployeeManagement from "../components/EmployeeManagement";
import TrainingManagement from "../components/TrainingManagement";
import ProfileEditModal from "../components/ProfileEditModal";
import DailyAttendance from "../components/DailyAttendance";
import LeaveAndAttendance from "../components/LeaveAndAttendance";
import SettingsPanel from "../components/SettingsPanel";
import EmployeeReport from "../components/EmployeeReport";
import PayrollManagement from "../components/PayrollManagement";

// ── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ICONS = {
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  employees:
    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  training:
    "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  attendance:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  leave:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  reports:
    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  settings:
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  payroll:
    "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z",
  logout:
    "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  chevronLeft: "M15 19l-7-7 7-7",
  chevronRight: "M9 5l7 7-7 7",
  bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  menu: "M4 6h16M4 12h16M4 18h16",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
};

const NAV_ITEMS = [
  { key: "home", label: "Dashboard", icon: ICONS.home },
  { key: "employees", label: "Employees", icon: ICONS.employees },
  { key: "training", label: "Training", icon: ICONS.training },
  { key: "attendance", label: "Attendance", icon: ICONS.attendance },
  { key: "leave", label: "Leave", icon: ICONS.leave },
  { key: "reports", label: "Reports", icon: ICONS.reports },
  { key: "payroll", label: "Payroll", icon: ICONS.payroll },
  { key: "settings", label: "Settings", icon: ICONS.settings },
];

// ── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  user,
  onLogout,
}) => {
  return (
    <aside
      className="relative flex flex-col h-full text-white transition-all duration-300 ease-in-out shrink-0"
      style={{
        width: collapsed ? "72px" : "240px",
        background:
          "linear-gradient(160deg, #1e40af 0%, #2563eb 45%, #3b82f6 100%)",
        borderRadius: "0 2rem 2rem 0",
        boxShadow: "4px 0 24px rgba(37,99,235,0.18)",
      }}
    >
      {/* Decorative circles */}
      <div className="pointer-events-none absolute top-[-60px] right-[-40px] w-48 h-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute bottom-[-30px] left-[-20px] w-32 h-32 rounded-full bg-white/8" />

      {/* Logo */}
      <div
        className={`relative z-10 flex items-center gap-3 px-5 py-6 ${collapsed ? "justify-center px-0" : ""}`}
      >
        <div className="w-9 h-9 shrink-0 bg-white/20 rounded-xl flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path
              d="M12 2L2 7l10 5 10-5-10-5z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17l10 5 10-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12l10 5 10-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight whitespace-nowrap">
            iris<span className="text-blue-200">HR</span>
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/15 mb-3" />

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-3 relative z-10 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-xl transition-all duration-200 text-sm font-medium
                ${collapsed ? "justify-center px-0 py-3 mx-0" : "px-3 py-3"}
                ${
                  active
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-blue-100/80 hover:bg-white/12 hover:text-white"
                }`}
            >
              <Icon d={item.icon} className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
              {!collapsed && active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/15 mt-3" />

      {/* Profile mini + logout */}
      <div className={`relative z-10 p-3 flex flex-col gap-2`}>
        {/* User avatar row */}
        <div
          className={`flex items-center gap-3 px-2 py-2 rounded-xl bg-white/10 ${collapsed ? "justify-center" : ""}`}
        >
          <div className="w-8 h-8 shrink-0 rounded-full bg-white/30 flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-blue-200/70 truncate">
                {user?.email || ""}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          title={collapsed ? "Sign Out" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-blue-100/70 hover:bg-white/12 hover:text-white transition-all duration-200 ${collapsed ? "justify-center px-0" : ""}`}
        >
          <Icon d={ICONS.logout} className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle — floats on the right edge */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[5.5rem] z-20 w-6 h-6 rounded-full bg-white border border-blue-200 shadow-md flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all duration-200"
      >
        <Icon
          d={collapsed ? ICONS.chevronRight : ICONS.chevronLeft}
          className="w-3 h-3"
        />
      </button>
    </aside>
  );
};

// ── Top Bar ──────────────────────────────────────────────────────────────────
const TopBar = ({ activeTab, user, onProfileEdit, onToggleSidebar }) => {
  const pageTitle =
    NAV_ITEMS.find((n) => n.key === activeTab)?.label || "Dashboard";
  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-all duration-200 lg:hidden"
        >
          <Icon d={ICONS.menu} className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-800">{pageTitle}</h1>
          <p className="text-xs text-gray-400 hidden sm:block">
            {greeting}, {user?.name?.split(" ")[0] || "there"} 👋
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Online badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Online
        </div>

        {/* Notification bell */}
        <button className="relative p-2 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200">
          <Icon d={ICONS.bell} className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
        </button>

        {/* Profile chip */}
        <button
          onClick={onProfileEdit}
          className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-gray-800 leading-tight">
              {user?.name || "User"}
            </p>
            <p className="text-[10px] text-gray-400 leading-tight">
              {user?.email || ""}
            </p>
          </div>
          <Icon
            d={ICONS.edit}
            className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 hidden sm:block"
          />
        </button>
      </div>
    </header>
  );
};

// ── Home Content ─────────────────────────────────────────────────────────────
const STAT_COLOR = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-600",
    val: "text-blue-700",
    bar: "bg-blue-500",
  },
  green: {
    bg: "bg-green-50",
    icon: "bg-green-100 text-green-600",
    val: "text-green-700",
    bar: "bg-green-500",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-100 text-amber-600",
    val: "text-amber-700",
    bar: "bg-amber-500",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-100 text-purple-600",
    val: "text-purple-700",
    bar: "bg-purple-500",
  },
  teal: {
    bg: "bg-teal-50",
    icon: "bg-teal-100 text-teal-600",
    val: "text-teal-700",
    bar: "bg-teal-500",
  },
  rose: {
    bg: "bg-rose-50",
    icon: "bg-rose-100 text-rose-600",
    val: "text-rose-700",
    bar: "bg-rose-500",
  },
};

const StatCard = ({ label, value, sub, color, iconD, onClick, loading }) => {
  const c = STAT_COLOR[color] || STAT_COLOR.blue;
  return (
    <button
      onClick={onClick}
      className={`group text-left w-full rounded-2xl p-5 ${c.bg} border border-white/60 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}
        >
          <Icon d={iconD} className="w-5 h-5" />
        </div>
        {loading ? (
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
              {label}
            </p>
            <p className={`text-2xl font-extrabold mt-0.5 ${c.val}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{sub}</p>
          </div>
        )}
      </div>
      <div
        className={`mt-3 h-1 rounded-full ${c.bar} opacity-30 group-hover:opacity-60 transition-opacity`}
      />
    </button>
  );
};

const QuickAction = ({ label, iconD, color, onClick }) => {
  const c = STAT_COLOR[color] || STAT_COLOR.blue;
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${c.bg} border border-white/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon} group-hover:scale-110 transition-transform`}
      >
        <Icon d={iconD} className="w-5 h-5" />
      </div>
      <span className="text-xs font-semibold text-gray-700">{label}</span>
    </button>
  );
};

const API = "http://localhost:5000";

const HomeContent = ({ user, setActiveTab }) => {
  const [stats, setStats] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const m = now.getMonth() + 1;
    const y = now.getFullYear();

    Promise.allSettled([
      fetch(`${API}/api/employees`, { headers }).then((r) => r.json()),
      fetch(`${API}/api/attendance/sheet?date=${today}`, { headers }).then(
        (r) => r.json(),
      ),
      fetch(`${API}/api/leave/pending`, { headers }).then((r) => r.json()),
      fetch(`${API}/api/training/programs`, { headers }).then((r) => r.json()),
      fetch(`${API}/api/payroll?month=${m}&year=${y}`, { headers }).then((r) =>
        r.json(),
      ),
    ]).then(([empR, attR, leaveR, trainR, payR]) => {
      const emp = empR.status === "fulfilled" ? empR.value?.data || [] : [];
      const att = attR.status === "fulfilled" ? attR.value?.data || [] : [];
      const leave =
        leaveR.status === "fulfilled" ? leaveR.value?.data || [] : [];
      const train =
        trainR.status === "fulfilled"
          ? trainR.value?.data || trainR.value?.programs || []
          : [];
      const pay = payR.status === "fulfilled" ? payR.value : null;

      setStats({
        totalEmployees: emp.length,
        activeEmployees: emp.filter((e) => e.status !== "Resigned").length,
        presentToday: att.filter((a) => a.attendance_status === "Present")
          .length,
        absentToday: att.filter((a) => a.attendance_status === "Absent").length,
        onLeave: att.filter((a) => a.attendance_status === "Leave").length,
        notMarked: att.filter((a) => a.attendance_status === "Not Marked")
          .length,
        pendingLeaves: leave.length,
        activeTraining: train.filter((t) => t.status === "Active").length,
        totalTraining: train.length,
        payrollNetTotal: pay?.summary?.total_net_salary || 0,
        payrollProcessed: pay?.summary?.processed_count || 0,
        payrollPaid: pay?.summary?.paid_count || 0,
        payrollCount: pay?.data?.length || 0,
      });
      setPendingLeaves(leave.slice(0, 6));
      setLoading(false);
    });
  }, []);

  const fmtCurrency = (n) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(n || 0);

  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" });

  const statCards = [
    {
      label: "Total Employees",
      value: loading ? "—" : stats?.totalEmployees,
      sub: loading ? "" : `${stats?.activeEmployees} active`,
      color: "blue",
      iconD: ICONS.employees,
      tab: "employees",
    },
    {
      label: "Present Today",
      value: loading ? "—" : stats?.presentToday,
      sub: loading
        ? ""
        : `${stats?.absentToday} absent · ${stats?.onLeave} on leave`,
      color: "green",
      iconD: ICONS.attendance,
      tab: "attendance",
    },
    {
      label: "Pending Leaves",
      value: loading ? "—" : stats?.pendingLeaves,
      sub: "awaiting approval",
      color: !loading && stats?.pendingLeaves > 0 ? "amber" : "green",
      iconD: ICONS.leave,
      tab: "leave",
    },
    {
      label: "Training Programs",
      value: loading ? "—" : stats?.activeTraining,
      sub: loading ? "" : `${stats?.totalTraining} total programs`,
      color: "purple",
      iconD: ICONS.training,
      tab: "training",
    },
    {
      label: `${monthName} Payroll`,
      value: loading ? "—" : fmtCurrency(stats?.payrollNetTotal),
      sub: loading
        ? ""
        : `${stats?.payrollProcessed} processed · ${stats?.payrollPaid} paid`,
      color: "teal",
      iconD: ICONS.payroll,
      tab: "payroll",
    },
    {
      label: "Not Marked Today",
      value: loading ? "—" : stats?.notMarked,
      sub: "attendance not recorded",
      color: !loading && stats?.notMarked > 0 ? "rose" : "green",
      iconD: ICONS.attendance,
      tab: "attendance",
    },
  ];

  const quickActions = [
    {
      label: "Employees",
      iconD: ICONS.employees,
      color: "blue",
      tab: "employees",
    },
    {
      label: "Attendance",
      iconD: ICONS.attendance,
      color: "green",
      tab: "attendance",
    },
    { label: "Leave", iconD: ICONS.leave, color: "amber", tab: "leave" },
    {
      label: "Training",
      iconD: ICONS.training,
      color: "purple",
      tab: "training",
    },
    { label: "Payroll", iconD: ICONS.payroll, color: "teal", tab: "payroll" },
    { label: "Reports", iconD: ICONS.reports, color: "rose", tab: "reports" },
    {
      label: "Settings",
      iconD: ICONS.settings,
      color: "blue",
      tab: "settings",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 w-full max-w-7xl mx-auto">
      {/* Welcome banner */}
      <div
        className="relative rounded-2xl p-6 lg:p-8 overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)",
        }}
      >
        <div className="pointer-events-none absolute top-[-40px] right-[-30px] w-56 h-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute bottom-[-20px] left-[20%] w-36 h-36 rounded-full bg-white/8" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
              Welcome back
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-1">
              {user?.name || "User"}
            </h2>
            <p className="text-blue-200/80 text-sm">
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Employees", tab: "employees" },
              { label: "Attendance", tab: "attendance" },
              { label: "Payroll", tab: "payroll" },
            ].map((b) => (
              <button
                key={b.tab}
                onClick={() => setActiveTab(b.tab)}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all duration-200 border border-white/20"
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
          Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              sub={card.sub}
              color={card.color}
              iconD={card.iconD}
              loading={loading}
              onClick={() => setActiveTab(card.tab)}
            />
          ))}
        </div>
      </div>

      {/* Bottom section: pending leaves + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending leave requests */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                <Icon d={ICONS.leave} className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">
                Pending Leave Requests
              </h3>
              {!loading && stats?.pendingLeaves > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  {stats.pendingLeaves}
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveTab("leave")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all &rarr;
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : pendingLeaves.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Icon d="M5 13l4 4L19 7" className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  No pending leave requests
                </p>
                <p className="text-xs text-gray-400 mt-1">All caught up!</p>
              </div>
            ) : (
              pendingLeaves.map((req, i) => (
                <div
                  key={req.id || i}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(req.employee_name || req.name || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {req.employee_name ||
                        req.name ||
                        `Employee ${req.employee_id}`}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {req.leave_type} &bull;{" "}
                      {req.start_date
                        ? new Date(req.start_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                      {req.end_date && req.end_date !== req.start_date
                        ? ` – ${new Date(req.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                    Pending
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((a) => (
              <QuickAction
                key={a.tab}
                label={a.label}
                iconD={a.iconD}
                color={a.color}
                onClick={() => setActiveTab(a.tab)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Dashboard ────────────────────────────────────────────────────────────────
export const Dashboard = () => {
  const { user, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully", {
      position: "top-right",
      autoClose: 1500,
    });
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background:
          "linear-gradient(135deg, #eff6ff 0%, #f8faff 50%, #eef2ff 100%)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <ProfileEditModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onUpdate={updateProfile}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <TopBar
          activeTab={activeTab}
          user={user}
          onProfileEdit={() => setShowProfileModal(true)}
          onToggleSidebar={() => setCollapsed(!collapsed)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === "home" && (
            <HomeContent user={user} setActiveTab={setActiveTab} />
          )}
          {activeTab === "employees" && <EmployeeManagement />}
          {activeTab === "training" && <TrainingManagement />}
          {activeTab === "attendance" && <DailyAttendance />}
          {activeTab === "leave" && <LeaveAndAttendance />}
          {activeTab === "settings" && <SettingsPanel />}
          {activeTab === "reports" && <EmployeeReport />}
          {activeTab === "payroll" && <PayrollManagement />}
        </main>
      </div>
    </div>
  );
};
