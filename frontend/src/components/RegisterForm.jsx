import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

const RegisterComponent = ({ onSwitch }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, loading } = useAuth();

  const passwordStrength = password.length;

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.warning('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const result = await register(name, email, password);
    
    if (result.success) {
      // Redirect after delay to show success toast and let user sign in
      setTimeout(() => {
        window.location.href = '/';
      }, 2500);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <div className="space-y-4">
        <div className="group">
          <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.15em' }}
            className="block text-cyan-400/70 uppercase mb-1.5 ml-1">Full Name</label>
          <div className="relative flex items-center transition-all duration-300">
            <div className="absolute inset-0 rounded-xl transition-all duration-300 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]" />
            <span className="absolute left-3.5 text-cyan-400/50 text-sm z-10" style={{ fontSize: '0.85rem' }}>◉</span>
            <input
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Jane Nexus"
              disabled={loading}
              className="w-full bg-slate-900/60 text-cyan-50 rounded-xl pl-9 pr-4 py-3 text-sm outline-none placeholder-slate-600 backdrop-blur-sm disabled:opacity-50"
              style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.82rem' }}
              required
            />
          </div>
        </div>

        <div className="group">
          <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.15em' }}
            className="block text-cyan-400/70 uppercase mb-1.5 ml-1">Work Email</label>
          <div className="relative flex items-center transition-all duration-300">
            <div className="absolute inset-0 rounded-xl transition-all duration-300 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]" />
            <span className="absolute left-3.5 text-cyan-400/50 text-sm z-10" style={{ fontSize: '0.85rem' }}>⬡</span>
            <input
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="jane@company.io"
              disabled={loading}
              className="w-full bg-slate-900/60 text-cyan-50 rounded-xl pl-9 pr-4 py-3 text-sm outline-none placeholder-slate-600 backdrop-blur-sm disabled:opacity-50"
              style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.82rem' }}
              required
            />
          </div>
        </div>

        <div className="group">
          <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.15em' }}
            className="block text-cyan-400/70 uppercase mb-1.5 ml-1">Passphrase</label>
          <div className="relative flex items-center transition-all duration-300">
            <div className="absolute inset-0 rounded-xl transition-all duration-300 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]" />
            <span className="absolute left-3.5 text-cyan-400/50 text-sm z-10" style={{ fontSize: '0.85rem' }}>◈</span>
            <input
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="min. 6 characters"
              disabled={loading}
              className="w-full bg-slate-900/60 text-cyan-50 rounded-xl pl-9 pr-4 py-3 text-sm outline-none placeholder-slate-600 backdrop-blur-sm disabled:opacity-50"
              style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.82rem' }}
              required
            />
          </div>
        </div>
      </div>

      {/* Strength meter */}
      <div className="mt-4">
        <p className="text-xs text-slate-600 mb-1.5" style={{ fontFamily: "'Space Mono', monospace" }}>
          signal strength
        </p>
        <div className="flex gap-1">
          {[0,1,2,3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              passwordStrength > i * 2
                ? i < 2 ? 'bg-cyan-400' : 'bg-indigo-400'
                : 'bg-slate-800'
            }`} />
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed mt-4" style={{ fontFamily: "'Space Mono', monospace" }}>
        by proceeding, you accept the{' '}
        <a href="#" className="text-cyan-400/70 hover:text-cyan-300 transition-colors">terms of service</a>
        {' '}and{' '}
        <a href="#" className="text-cyan-400/70 hover:text-cyan-300 transition-colors">privacy protocol</a>.
      </p>

      <button
        type="submit"
        disabled={loading}
        className={`relative w-full py-3.5 rounded-xl font-semibold text-sm tracking-widest uppercase overflow-hidden group transition-all duration-200 mt-5 ${
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
              initializing...
            </>
          ) : (
            <>Initialize Account</>
          )}
        </span>
      </button>

      <p className="text-center text-xs text-slate-600 mt-4" style={{ fontFamily: "'Space Mono', monospace" }}>
        already have access?{' '}
        <button type="button" onClick={onSwitch} className="text-cyan-400 hover:text-cyan-300 transition-colors underline-offset-2 hover:underline">
          sign in
        </button>
      </p>
    </form>
  );
};

export default RegisterComponent;
