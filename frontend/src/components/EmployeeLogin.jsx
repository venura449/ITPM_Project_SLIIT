import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const EmployeeLogin = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employeeId.trim() || !password.trim()) {
      toast.error("Please enter both Employee ID and Password", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/employee-auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_id: employeeId.toUpperCase(),
            password,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // Save token and user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("userType", "employee");
        localStorage.setItem("user", JSON.stringify(data.user));

        toast.success("Login successful! ✓", {
          position: "top-right",
          autoClose: 2000,
        });

        // Redirect to employee dashboard
        setTimeout(() => {
          navigate("/employee-dashboard");
        }, 1000);
      } else {
        toast.error(data.message || "Login failed", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error during login: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="p-8 rounded-lg border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1
              className="text-3xl font-bold text-white mb-2"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Employee Portal
            </h1>
            <p className="text-slate-400 text-sm">
              Sign in with your Employee ID and Password
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee ID Input */}
            <div>
              <label
                className="text-xs text-slate-600 uppercase tracking-wider mb-2 block"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                Employee ID
              </label>
              <input
                type="text"
                placeholder="e.g., EMP001"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-900/60 text-cyan-50 placeholder-slate-500 rounded-lg px-4 py-2.5 border border-slate-700/40 focus:border-cyan-400/60 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                className="text-xs text-slate-600 uppercase tracking-wider mb-2 block"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-900/60 text-cyan-50 placeholder-slate-500 rounded-lg px-4 py-2.5 border border-slate-700/40 focus:border-cyan-400/60 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 text-sm uppercase tracking-[0.2em] text-slate-950 font-semibold rounded-lg transition-all bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/40"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-slate-800/20 text-slate-500">or</span>
            </div>
          </div>

          {/* Admin Login Link */}
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-3">
              Are you an administrator?
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full px-4 py-2 text-sm uppercase tracking-[0.1em] text-cyan-400 border border-cyan-500/30 rounded-lg hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all"
            >
              Admin Login
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
            <p className="text-xs text-indigo-200">
              <span className="font-semibold">First time login?</span> Your
              Employee ID and password have been issued by your administrator.
              If you haven't received them, please contact HR.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            © 2026 ITPM System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;
