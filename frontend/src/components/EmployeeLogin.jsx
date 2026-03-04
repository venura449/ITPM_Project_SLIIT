import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const EmployeeLogin = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(true);
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        .emp-login * { font-family: 'Inter', system-ui, sans-serif; }
        .emp-login {
          background: linear-gradient(135deg, #eff6ff 0%, #f8faff 50%, #eef2ff 100%);
          min-height: 100vh;
        }
        .emp-card {
          box-shadow:
            0 4px 6px rgba(37,99,235,0.04),
            0 20px 60px rgba(37,99,235,0.10),
            0 1px 3px rgba(0,0,0,0.06);
        }
        .emp-brand {
          background: linear-gradient(160deg, #1e40af 0%, #2563eb 45%, #3b82f6 100%);
          position: relative;
          overflow: hidden;
        }
        .emp-brand::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 110% -10%, rgba(255,255,255,0.12) 0%, transparent 50%),
            radial-gradient(ellipse at -10% 110%, rgba(255,255,255,0.08) 0%, transparent 50%);
          pointer-events: none;
        }
        .emp-dot {
          background: rgba(255,255,255,0.15);
          border-radius: 50%;
          position: absolute;
        }
        .emp-pill {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 999px;
          backdrop-filter: blur(4px);
        }
        .emp-stat {
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 14px;
        }
        .emp-fade {
          animation: empFade 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes empFade {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="emp-login flex items-center justify-center p-4 md:p-8">
        <div
          className="emp-card emp-fade w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col md:flex-row"
          style={{ minHeight: "580px" }}
        >
          {/* ── BRAND PANEL ── */}
          <div className="emp-brand w-full md:w-[42%] p-8 lg:p-10 flex flex-col justify-between text-white">
            <div className="emp-dot w-64 h-64 top-[-80px] right-[-60px]" />
            <div className="emp-dot w-40 h-40 bottom-[-40px] left-[-30px]" />

            {/* Logo */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
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
              <div>
                <span className="text-xl font-bold tracking-tight">
                  iris<span className="text-blue-200">HR</span>
                </span>
                <div className="text-xs text-blue-200/70 font-light leading-none mt-0.5">
                  Employee Portal
                </div>
              </div>
            </div>

            {/* Headline */}
            <div className="relative z-10 my-8">
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-3">
                Employee Self-Service
              </p>
              <h1 className="text-3xl lg:text-[2.1rem] font-extrabold leading-snug">
                Your workspace,
                <br />
                <span className="text-blue-100">at your fingertips</span>
              </h1>
              <p className="mt-4 text-blue-100/75 text-sm leading-relaxed max-w-[260px]">
                View your attendance, apply for leave, track training, and
                manage your profile.
              </p>
            </div>

            {/* Feature pills */}
            <div className="relative z-10 flex flex-col gap-2">
              {[
                { icon: "📋", text: "View Attendance Records" },
                { icon: "🏖️", text: "Apply for Leave" },
                { icon: "🎓", text: "Track Training Progress" },
              ].map((f, i) => (
                <div
                  key={i}
                  className="emp-pill flex items-center gap-3 px-4 py-2.5"
                >
                  <span className="text-base leading-none">{f.icon}</span>
                  <span className="text-sm text-white/90 font-medium">
                    {f.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Trust footer */}
            <div className="relative z-10 flex items-center gap-2 mt-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-blue-200/60 font-medium">
                Secure connection · Data encrypted
              </span>
            </div>
          </div>

          {/* ── FORM PANEL ── */}
          <div className="flex-1 bg-white flex flex-col">
            {/* Panel header */}
            <div className="px-8 lg:px-10 pt-8 pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800">Welcome back</h2>
              <p className="text-gray-500 text-sm mt-1.5">
                Sign in with your Employee ID and password
              </p>
            </div>

            {/* Form */}
            <div className="flex-1 px-8 lg:px-10 py-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Employee ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Employee ID
                  </label>
                  <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 transition-all duration-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 hover:border-gray-300">
                    <svg
                      className="w-4 h-4 text-gray-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                      />
                    </svg>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="e.g., EMP001"
                      disabled={loading}
                      className="w-full py-3 text-sm text-gray-700 bg-transparent outline-none placeholder-gray-400 disabled:opacity-50 uppercase"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 transition-all duration-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 hover:border-gray-300">
                    <svg
                      className="w-4 h-4 text-gray-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full py-3 text-sm text-gray-700 bg-transparent outline-none placeholder-gray-400 disabled:opacity-50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs font-medium text-gray-400 hover:text-blue-600 transition-colors shrink-0 focus:outline-none"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-blue-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-xs text-gray-400">
                    or
                  </span>
                </div>
              </div>

              {/* Admin login link */}
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 text-sm font-medium text-blue-600 border border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all duration-200"
              >
                Admin Login
              </button>

              {/* Info box */}
              <div className="mt-6 flex items-start gap-3 px-4 py-3.5 rounded-xl bg-blue-50 border border-blue-100">
                <svg
                  className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs text-blue-600 leading-relaxed">
                  <span className="font-semibold">First time?</span> Your
                  Employee ID and password have been issued by your
                  administrator. Contact HR if you haven&apos;t received them.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 lg:px-10 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                © 2026 irisHR. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeLogin;
