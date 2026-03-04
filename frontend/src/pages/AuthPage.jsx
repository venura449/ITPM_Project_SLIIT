import { useState, useEffect } from "react";
import LoginComponent from "../components/LoginForm";
import RegisterComponent from "../components/RegisterForm";

// ─── Main AuthPage ─────────────────────────────────────────────────────────────
export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .auth-page * { font-family: 'Inter', system-ui, sans-serif; }

        .auth-page {
          background: linear-gradient(135deg, #eff6ff 0%, #f8faff 50%, #eef2ff 100%);
          min-height: 100vh;
        }

        .auth-card {
          box-shadow:
            0 4px 6px rgba(37,99,235,0.04),
            0 20px 60px rgba(37,99,235,0.10),
            0 1px 3px rgba(0,0,0,0.06);
        }

        .brand-panel {
          background: linear-gradient(160deg, #1e40af 0%, #2563eb 45%, #3b82f6 100%);
          position: relative;
          overflow: hidden;
        }

        .brand-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 110% -10%, rgba(255,255,255,0.12) 0%, transparent 50%),
            radial-gradient(ellipse at -10% 110%, rgba(255,255,255,0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        .brand-dot {
          background: rgba(255,255,255,0.15);
          border-radius: 50%;
          position: absolute;
        }

        .form-panel {
          background: #ffffff;
        }

        .tab-active {
          color: #2563eb;
          border-bottom: 2px solid #2563eb;
          font-weight: 600;
          background: #f0f7ff;
        }

        .tab-inactive {
          color: #94a3b8;
          border-bottom: 2px solid transparent;
        }

        .tab-inactive:hover {
          color: #64748b;
          background: #f8fafc;
        }

        .fade-up {
          animation: fadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .feature-pill {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 999px;
          backdrop-filter: blur(4px);
          transition: all 0.2s;
        }

        .feature-pill:hover {
          background: rgba(255,255,255,0.22);
        }

        .stat-card {
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 14px;
          transition: all 0.2s;
        }

        .stat-card:hover {
          background: rgba(255,255,255,0.18);
        }
      `}</style>

      <div
        className={`auth-page flex items-center justify-center p-4 md:p-8 transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}
      >
        <div
          className="auth-card fade-up w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col md:flex-row"
          style={{ animationDelay: "0.1s", minHeight: "580px" }}
        >
          {/* ── BRAND PANEL ── */}
          <div className="brand-panel w-full md:w-[42%] p-8 lg:p-10 flex flex-col justify-between text-white">
            {/* Decorative circles */}
            <div className="brand-dot w-64 h-64 top-[-80px] right-[-60px]" />
            <div className="brand-dot w-40 h-40 bottom-[-40px] left-[-30px]" />

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
                  People & HR Platform
                </div>
              </div>
            </div>

            {/* Headline */}
            <div className="relative z-10 my-8">
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-3">
                HR Management
              </p>
              <h1 className="text-3xl lg:text-[2.1rem] font-extrabold leading-snug">
                Manage your team
                <br />
                <span className="text-blue-100">with confidence</span>
              </h1>
              <p className="mt-4 text-blue-100/75 text-sm leading-relaxed max-w-[260px]">
                Attendance, leave, training, and employee records — all in one
                simple place.
              </p>
            </div>

            {/* Feature pills */}
            <div className="relative z-10 flex flex-col gap-2">
              {[
                { icon: "📅", text: "Attendance & Leave Tracking" },
                { icon: "🎓", text: "Training Management" },
                { icon: "👥", text: "Employee Records" },
              ].map((f, i) => (
                <div
                  key={i}
                  className="feature-pill flex items-center gap-3 px-4 py-2.5"
                >
                  <span className="text-base leading-none">{f.icon}</span>
                  <span className="text-sm text-white/90 font-medium">
                    {f.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="relative z-10 grid grid-cols-3 gap-2 mt-6">
              {[
                { val: "12k+", label: "Users" },
                { val: "99.9%", label: "Uptime" },
                { val: "Secure", label: "Encrypted" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="stat-card py-3 text-center cursor-default"
                >
                  <div className="text-sm font-bold text-white">{s.val}</div>
                  <div className="text-[10px] text-blue-200/60 font-medium mt-0.5">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Trust footer */}
            <div className="relative z-10 flex items-center gap-2 mt-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-blue-200/60 font-medium">
                All systems running · Data encrypted
              </span>
            </div>
          </div>

          {/* ── FORM PANEL ── */}
          <div className="form-panel flex-1 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {[
                {
                  label: "Sign In",
                  active: isLogin,
                  fn: () => setIsLogin(true),
                },
                {
                  label: "Create Account",
                  active: !isLogin,
                  fn: () => setIsLogin(false),
                },
              ].map((tab) => (
                <button
                  key={tab.label}
                  onClick={tab.fn}
                  className={`flex-1 py-4 text-sm transition-all duration-200 ${tab.active ? "tab-active" : "tab-inactive"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Form content */}
            <div className="flex-1 p-8 lg:p-10 overflow-auto">
              {isLogin ? (
                <div>
                  <div className="mb-7">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Welcome back
                    </h2>
                    <p className="text-gray-500 text-sm mt-1.5">
                      Sign in to your account to continue
                    </p>
                  </div>
                  <LoginComponent onSwitch={() => setIsLogin(false)} />
                </div>
              ) : (
                <div>
                  <div className="mb-7">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Create an account
                    </h2>
                    <p className="text-gray-500 text-sm mt-1.5">
                      Fill in the details below to get started
                    </p>
                  </div>
                  <RegisterComponent onSwitch={() => setIsLogin(true)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;
