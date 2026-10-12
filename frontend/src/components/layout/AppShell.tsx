import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  Clock,
  CalendarCheck,
  CheckSquare,
  Timer,
  Flame,
  Target,
  Sparkles,
  BarChart3,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  Sun,
  Moon,
  Plus,
  Play,
  RotateCcw,
  Menu,
  X,
  Compass
} from 'lucide-react';
import { api } from '../../services/api';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My 24 Hours', path: '/timeline', icon: Clock },
    { label: 'Smart Planner', path: '/planner', icon: CalendarCheck },
    { label: 'My Life Journal', path: '/journal', icon: BookOpen },
    { label: 'Daily Life Summary', path: '/daily-summary', icon: Sparkles },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Focus Tracker', path: '/focus', icon: Timer },
    { label: 'Habits', path: '/habits', icon: Flame },
    { label: 'Goals', path: '/goals', icon: Target },
    { label: 'Life Insights', path: '/insights', icon: BarChart3 },
    { label: 'Daily Review', path: '/review', icon: Compass },
    { label: 'AI Life Analyst', path: '/ai-analyst', icon: Sparkles },
    { label: 'Reports', path: '/reports', icon: FileText },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleSeedDemo = async () => {
    try {
      setDemoLoading(true);
      await api.seedDemoData();
      await refreshUser();
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 antialiased overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E131F] flex-shrink-0 z-20">
        {/* App Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              L
            </div>
            <div>
              <span className="font-bold tracking-tight text-lg text-slate-900 dark:text-white">LIFEOS</span>
              <span className="text-[10px] block text-slate-500 dark:text-slate-400 font-medium tracking-wider -mt-1">INTELLIGENCE</span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>

        {/* Live Clock / Today summary banner */}
        <div className="px-5 py-3 mx-3 my-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{currentDate}</div>
            <div className="text-base font-semibold tracking-tight text-indigo-600 dark:text-indigo-400">{currentTime}</div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Live
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/15 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Demo Seed Shortcut */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80">
          <button
            onClick={handleSeedDemo}
            disabled={demoLoading}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RotateCcw size={13} className={demoLoading ? 'animate-spin' : ''} />
            <span>{demoLoading ? 'Loading Sample Data...' : 'Load Sample Day Data'}</span>
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">{user?.name || 'User'}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded transition"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E131F] flex items-center justify-between px-4 z-30">
          <div className="flex items-center gap-2.5" onClick={() => navigate('/dashboard')}>
            <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              L
            </div>
            <span className="font-bold text-base text-slate-900 dark:text-white">LIFEOS</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-1.5 text-slate-500 dark:text-slate-400">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </header>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-14 bg-white dark:bg-[#0E131F] z-40 p-4 flex flex-col justify-between overflow-y-auto">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/15 dark:text-indigo-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{user?.name}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 text-xs text-red-500 px-3 py-1.5 rounded border border-red-200 dark:border-red-900"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
