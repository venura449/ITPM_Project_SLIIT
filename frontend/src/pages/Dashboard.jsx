import { useAuth } from '../hooks/useAuth';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import EmployeeManagement from '../components/EmployeeManagement';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    let raf;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1 + 0.2,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, `rgba(34,211,238,${p.alpha})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully', {
      position: 'top-right',
      autoClose: 1500,
    });
  };

  return (
    <div className="min-h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40" />

      {/* Nebula blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[60vmax] h-[60vmax] bg-radial opacity-20 blur-3xl"
        style={{background: 'radial-gradient(ellipse, rgba(34,211,238,0.15) 0%, transparent 60%)'}} />
      <div className="absolute bottom-[-15%] right-[-5%] w-[70vmin] h-[70vmin] bg-radial opacity-20 blur-3xl"
        style={{background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 60%)'}} />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center">
                <span className="text-slate-950 font-bold text-sm">i</span>
              </div>
              <span className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                iris<span className="text-cyan-400">HR</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => setActiveTab('home')}
                className={`text-xs uppercase tracking-[0.2em] transition-colors ${
                  activeTab === 'home'
                    ? 'text-cyan-300'
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                dashboard
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`text-xs uppercase tracking-[0.2em] transition-colors ${
                  activeTab === 'employees'
                    ? 'text-cyan-300'
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                employees
              </button>
              <a href="#" className="text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-cyan-300 transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>analytics</a>
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg border border-slate-700/50 bg-slate-800/30">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs text-slate-400" style={{ fontFamily: "'Space Mono', monospace" }}>online</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 rounded-lg transition-all duration-200"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                exit
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {activeTab === 'home' ? (
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
              {/* Welcome Section */}
              <div className="mb-12">
                <p className="text-cyan-400/60 text-xs tracking-[0.3em] uppercase mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  &gt; welcome back
                </p>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {user?.name || 'User'}
                </h1>
                <p className="text-slate-400 text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
                  last access: {new Date().toLocaleTimeString()}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Status', value: 'Active', icon: '⬡' },
                  { label: 'Department', value: 'People Ops', icon: '◉' },
                  { label: 'Role Level', value: 'Member', icon: '◈' },
                  { label: 'Joined', value: new Date(user?.created_at).toLocaleDateString(), icon: '◳' },
                ].map((stat) => (
                  <div key={stat.label} className="p-4 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm hover:border-cyan-400/40 hover:bg-slate-800/40 transition-all duration-200 cursor-default">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-cyan-400 text-lg">{stat.icon}</span>
                      <span className="text-xs uppercase tracking-widest text-slate-500" style={{ fontFamily: "'Space Mono', monospace" }}>{stat.label}</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Profile Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 p-6 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
                  <p className="text-cyan-400/60 text-xs tracking-[0.3em] uppercase mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>
                    &gt; profile information
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-600 uppercase tracking-wider mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Email</label>
                        <p className="text-cyan-300">{user?.email}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 uppercase tracking-wider mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Phone</label>
                        <p className="text-slate-400">{user?.phone || '— not set'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 uppercase tracking-wider mb-1 block" style={{ fontFamily: "'Space Mono', monospace" }}>Address</label>
                      <p className="text-slate-400">{user?.address || '— not set'}</p>
                    </div>
                  </div>
                  <button className="mt-6 px-4 py-2 text-xs uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-slate-950 font-semibold rounded-lg transition-all duration-200" style={{ fontFamily: "'Space Mono', monospace" }}>
                    edit profile
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <div className="p-6 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
                    <p className="text-cyan-400/60 text-xs tracking-[0.3em] uppercase mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>
                      &gt; quick actions
                    </p>
                    <div className="space-y-3">
                      <button className="w-full py-2 px-3 text-xs uppercase tracking-widest text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-400/50 rounded-lg transition-all duration-200 bg-slate-900/50 hover:bg-slate-800" style={{ fontFamily: "'Space Mono', monospace" }}>
                        change password
                      </button>
                      <button className="w-full py-2 px-3 text-xs uppercase tracking-widest text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-400/50 rounded-lg transition-all duration-200 bg-slate-900/50 hover:bg-slate-800" style={{ fontFamily: "'Space Mono', monospace" }}>
                        settings
                      </button>
                      <button
                        onClick={() => setActiveTab('employees')}
                        className="w-full py-2 px-3 text-xs uppercase tracking-widest text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-400/50 rounded-lg transition-all duration-200 bg-slate-900/50 hover:bg-slate-800"
                        style={{ fontFamily: "'Space Mono', monospace" }}
                      >
                        manage employees
                      </button>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="p-6 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
                    <p className="text-cyan-400/60 text-xs tracking-[0.3em] uppercase mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>
                      &gt; system status
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">API</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-xs text-green-400">online</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Database</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-xs text-green-400">online</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="p-4 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm text-center">
                <p className="text-xs text-slate-600" style={{ fontFamily: "'Space Mono', monospace" }}>
                  iris<span className="text-cyan-400">HR</span> v2.4.1 · running on distributed infrastructure · ISO 27001 certified
                </p>
              </div>
            </div>
          ) : activeTab === 'employees' ? (
            <EmployeeManagement />
          ) : null}
        </main>
      </div>
    </div>
  );
};
