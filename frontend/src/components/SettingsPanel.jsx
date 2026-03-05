import { useState, useEffect } from "react";
import { toast } from "react-toastify";

const LEAVE_KEYS = [
  { key: "leave_annual_days", label: "Annual Leave", desc: "Days / year" },
  { key: "leave_sick_days", label: "Sick Leave", desc: "Days / year" },
  { key: "leave_casual_days", label: "Casual Leave", desc: "Days / year" },
  {
    key: "leave_maternity_days",
    label: "Maternity Leave",
    desc: "Days / year",
  },
  {
    key: "leave_paternity_days",
    label: "Paternity Leave",
    desc: "Days / year",
  },
  { key: "leave_unpaid_days", label: "Unpaid Leave", desc: "Max days / year" },
];

const ATTENDANCE_KEYS = [
  {
    key: "max_public_holidays",
    label: "Public Holidays",
    desc: "Max days / year",
  },
  { key: "working_hours_per_day", label: "Working Hours / Day", desc: "Hours" },
  { key: "working_days_per_week", label: "Working Days / Week", desc: "Days" },
];

// ── Icons ─────────────────────────────────────────────────────────────────────
const CalendarIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const InfoIcon = () => (
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
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// ── Setting Row (defined outside to avoid remount on every keystroke) ────────
const SettingRow = ({ setting, values, original, handleChange }) => {
  const changed = values[setting.key] !== original[setting.key];
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-gray-700">{setting.label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{setting.desc}</p>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min="0"
          value={values[setting.key] ?? ""}
          onChange={(e) => handleChange(setting.key, e.target.value)}
          className={`w-24 text-center rounded-xl px-3 py-2 text-sm font-semibold border outline-none transition-all
            ${
              changed
                ? "bg-blue-50 border-blue-300 text-blue-700 focus:ring-2 focus:ring-blue-100"
                : "bg-white border-gray-200 text-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            }`}
        />
        {changed && (
          <span
            className="w-2 h-2 rounded-full bg-blue-500 shrink-0"
            title="Unsaved change"
          />
        )}
      </div>
    </div>
  );
};

const SettingsPanel = () => {
  const [values, setValues] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/settings`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        const map = {};
        for (const s of data.data) map[s.setting_key] = s.setting_value;
        setValues(map);
        setOriginal(map);
      }
    } catch (err) {
      toast.error("Failed to load settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, val) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settings = Object.entries(values).map(([key, value]) => ({
        key,
        value,
      }));
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/settings`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ settings }),
        },
      );
      const data = await res.json();
      if (data.success) {
        const map = {};
        for (const s of data.data) map[s.setting_key] = s.setting_value;
        setOriginal(map);
        toast.success("Settings saved successfully");
      } else {
        toast.error(data.message || "Failed to save");
      }
    } catch (err) {
      toast.error("Error saving settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(values) !== JSON.stringify(original);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading settings…</p>
      </div>
    );
  }

  return (
    <div
      className="px-6 py-6 max-w-4xl mx-auto"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Configure leave entitlements and attendance policies
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={() => setValues({ ...original })}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
            >
              Discard
            </button>
          )}
          <button
            onClick={saveSettings}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm disabled:opacity-40"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Unsaved Changes Banner ───────────────────────────────────────────── */}
      {hasChanges && (
        <div className="flex items-center justify-between px-4 py-3 mb-5 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-2 text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-sm font-medium">You have unsaved changes</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Now"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Leave Entitlements ─────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <CalendarIcon />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">
                Leave Entitlements
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Applied to new employees on initialization
              </p>
            </div>
          </div>
          <div className="px-5">
            {LEAVE_KEYS.map((s) => (
              <SettingRow
                key={s.key}
                setting={s}
                values={values}
                original={original}
                handleChange={handleChange}
              />
            ))}
          </div>
        </div>

        {/* ── Right Column ──────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Attendance Policy */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
                <ClockIcon />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  Attendance Policy
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Working hours and holiday configuration
                </p>
              </div>
            </div>
            <div className="px-5">
              {ATTENDANCE_KEYS.map((s) => (
                <SettingRow
                  key={s.key}
                  setting={s}
                  values={values}
                  original={original}
                  handleChange={handleChange}
                />
              ))}
            </div>
          </div>

          {/* Info notice */}
          <div className="flex gap-3 px-4 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="w-5 h-5 shrink-0 text-amber-500 mt-0.5">
              <InfoIcon />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1">
                Important Note
              </p>
              <p className="text-xs text-amber-600 leading-relaxed">
                Leave entitlement changes apply to{" "}
                <strong>new employees</strong> when their leave is initialized.
                Existing leave balances are not retroactively modified. To apply
                changes to existing employees, reinitialize their leave balance
                from the employee profile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
