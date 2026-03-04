import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";

const RegisterComponent = ({ onSwitch }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register, loading } = useAuth();

  const getStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 4) return 1;
    if (password.length < 7) return 2;
    if (password.length < 10) return 3;
    return 4;
  };

  const strengthMeta = [
    null,
    { color: "bg-red-400", label: "Weak" },
    { color: "bg-orange-400", label: "Fair" },
    { color: "bg-yellow-400", label: "Good" },
    { color: "bg-green-500", label: "Strong" },
  ];

  const strength = getStrength();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.warning("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const result = await register(name, email, password);

    if (result.success) {
      setTimeout(() => {
        window.location.href = "/";
      }, 2500);
    }
  };

  const inputClass =
    "flex items-center gap-3 border border-gray-200 rounded-xl px-4 transition-all duration-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 hover:border-gray-300";

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Full name
        </label>
        <div className={inputClass}>
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            disabled={loading}
            className="w-full py-3 text-sm text-gray-700 bg-transparent outline-none placeholder-gray-400 disabled:opacity-50"
            required
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Work email
        </label>
        <div className={inputClass}>
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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@company.com"
            disabled={loading}
            className="w-full py-3 text-sm text-gray-700 bg-transparent outline-none placeholder-gray-400 disabled:opacity-50"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Password
        </label>
        <div className={inputClass}>
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            disabled={loading}
            className="w-full py-3 text-sm text-gray-700 bg-transparent outline-none placeholder-gray-400 disabled:opacity-50"
            required
          />
        </div>

        {/* Strength meter */}
        <div className="mt-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= strength ? strengthMeta[strength].color : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          {password.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Password strength:{" "}
              <span className="font-medium text-gray-600">
                {strengthMeta[strength].label}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-400 leading-relaxed">
        By creating an account, you agree to our{" "}
        <a href="#" className="text-blue-600 hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>
        .
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-blue-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            Creating account...
          </>
        ) : (
          <>
            Create Account
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

      <p className="text-center text-sm text-gray-500 pt-1">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
        >
          Sign in
        </button>
      </p>
    </form>
  );
};

export default RegisterComponent;
