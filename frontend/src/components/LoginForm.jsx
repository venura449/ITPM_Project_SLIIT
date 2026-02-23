import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

const LoginComponent = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.warning('Please fill in all fields');
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      // Redirect after delay to show success toast
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2500);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <div className="space-y-4">
        <div className="group">
          <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.15em' }}
            className="block text-cyan-400/70 uppercase mb-1.5 ml-1">Email Address</label>
          <div className="relative flex items-center transition-all duration-300">
            <div className="absolute inset-0 rounded-xl transition-all duration-300 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]" />
            <span className="absolute left-3.5 text-cyan-400/50 text-sm z-10" style={{ fontSize: '0.85rem' }}>⬡</span>
            <input
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@company.io"
              disabled={loading}
              className="w-full bg-slate-900/60 text-cyan-50 rounded-xl pl-9 pr-4 py-3 text-sm outline-none placeholder-slate-600 backdrop-blur-sm disabled:opacity-50"
              style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.82rem' }}
              required
            />
          </div>
        </div>

        <div className="group">
          <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.15em' }}
            className="block text-cyan-400/70 uppercase mb-1.5 ml-1">Password</label>
          <div className="relative flex items-center transition-all duration-300">
            <div className="absolute inset-0 rounded-xl transition-all duration-300 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]" />
            <span className="absolute left-3.5 text-cyan-400/50 text-sm z-10" style={{ fontSize: '0.85rem' }}>◈</span>
            <input
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••••"
              disabled={loading}
              className="w-full bg-slate-900/60 text-cyan-50 rounded-xl pl-9 pr-4 py-3 text-sm outline-none placeholder-slate-600 backdrop-blur-sm disabled:opacity-50"
              style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.82rem' }}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="w-4 h-4 rounded border border-cyan-400/40 group-hover:border-cyan-400 flex items-center justify-center transition-colors">
            <div className="w-2 h-2 rounded-sm bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xs text-slate-500" style={{ fontFamily: "'Space Mono', monospace" }}>persist session</span>
        </label>
        <button type="button" className="text-xs text-cyan-400/70 hover:text-cyan-300 transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>
          recover access →
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`relative w-full py-3.5 rounded-xl font-semibold text-sm tracking-widest uppercase overflow-hidden group transition-all duration-200 mt-6 ${
          loading ? 'scale-[0.98]' : 'hover:scale-[1.01]'
        }`}
        style={{ fontFamily: "'Space Mono', monospace" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 opacity-90 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <div className="absolute inset-0 shadow-[0_0_30px_rgba(34,211,238,0.5)] opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
        <span className="relative z-10 text-slate-950 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              authenticating...
            </>
          ) : (
            <>Authenticate</>
          )}
        </span>
      </button>

      <p className="text-center text-xs text-slate-600 mt-4" style={{ fontFamily: "'Space Mono', monospace" }}>
        no account?{' '}
        <button type="button" onClick={onSwitch} className="text-cyan-400 hover:text-cyan-300 transition-colors underline-offset-2 hover:underline">
          initialize one
        </button>
      </p>
    </form>
  );
};

export default LoginComponent;
