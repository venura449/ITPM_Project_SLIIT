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
      const res = await fetch("http://localhost:5000/api/settings", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) {
        const map = {};
        for (const s of data.data) map[s.setting_key] = s.setting_value;
        setValues(map);
        setOriginal(map);
      }
    } catch (err) {
      toast.error("Failed to load settings: " + err.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settings = Object.entries(values).map(([key, value]) => ({
        key,
        value,
      }));
      const res = await fetch("http://localhost:5000/api/settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
        const map = {};
        for (const s of data.data) map[s.setting_key] = s.setting_value;
        setOriginal(map);
        toast.success("Settings saved successfully ✓", {
          position: "top-right",
          autoClose: 2500,
        });
      } else {
        toast.error(data.message || "Failed to save", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      toast.error("Error saving settings: " + err.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(values) !== JSON.stringify(original);

  const SettingRow = ({ setting }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-700/30 last:border-0">
      <div>
        <p className="text-white font-medium text-sm">{setting.label}</p>
        <p className="text-slate-500 text-xs">{setting.desc}</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          value={values[setting.key] ?? ""}
          onChange={(e) => handleChange(setting.key, e.target.value)}
          className="w-24 text-center bg-slate-900/70 text-white rounded-lg px-3 py-2 border border-slate-700/40 focus:border-cyan-500/60 outline-none transition-all text-sm font-mono"
        />
        <span className="text-slate-500 text-xs w-10">
          {setting.desc.split("/")[0].trim()}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center text-slate-400">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2
            className="text-3xl font-bold text-white mb-1"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            System Settings
          </h2>
          <p className="text-slate-400 text-sm">
            Configure leave entitlements and attendance policies
          </p>
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <button
              onClick={() => setValues({ ...original })}
              className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-slate-300 border border-slate-600/40 hover:border-slate-500 rounded-lg transition-all"
            >
              Discard
            </button>
          )}
          <button
            onClick={saveSettings}
            disabled={saving || !hasChanges}
            className="px-6 py-2 text-xs uppercase tracking-wider font-semibold text-white rounded-lg transition-all bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 shadow-lg"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Entitlements */}
        <div className="p-6 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">📋</span>
            <div>
              <h3
                className="text-white font-bold"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Leave Entitlements
              </h3>
              <p className="text-slate-500 text-xs">
                Applied to new employees on initialization
              </p>
            </div>
          </div>
          {LEAVE_KEYS.map((s) => (
            <SettingRow key={s.key} setting={s} />
          ))}
        </div>

        {/* Attendance Policy */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">🏢</span>
              <div>
                <h3
                  className="text-white font-bold"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Attendance Policy
                </h3>
                <p className="text-slate-500 text-xs">
                  Working hours and holiday configuration
                </p>
              </div>
            </div>
            {ATTENDANCE_KEYS.map((s) => (
              <SettingRow key={s.key} setting={s} />
            ))}
          </div>

          {/* Info Card */}
          <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <p className="text-amber-300 text-xs font-semibold mb-2">
              ⚠ Important Note
            </p>
            <p className="text-amber-200/70 text-xs leading-relaxed">
              Leave entitlement changes apply to <strong>new employees</strong>{" "}
              when their leave is initialized. Existing leave balances are not
              retroactively modified. To apply changes to existing employees,
              reinitialize their leave balance from the employee profile.
            </p>
          </div>
        </div>
      </div>

      {/* Save Banner */}
      {hasChanges && (
        <div className="mt-6 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-between">
          <p className="text-cyan-300 text-sm">You have unsaved changes</p>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 text-xs uppercase tracking-wider font-semibold text-white rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Now"}
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
