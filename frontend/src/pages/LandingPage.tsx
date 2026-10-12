import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  BarChart3,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Target,
  Flame,
  Calendar,
  Layers,
  HelpCircle,
  Play
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();

  const handleStart = () => {
    navigate('/auth');
  };

  const handleDemo = async () => {
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (e) {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              L
            </div>
            <span className="font-bold text-lg tracking-tight text-white">LIFEOS</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDemo}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition rounded-lg hover:bg-slate-900"
            >
              Instant Demo Mode
            </button>
            <button
              onClick={handleStart}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              Sign In / Register
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
          <Sparkles size={14} />
          <span>Personal Life Intelligence & Continuous Improvement System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Understand Your Time.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
            Improve Your Life.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          LIFEOS connects your plans, daily actions, and long-term goals to help you understand your patterns and make better decisions about how you live.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg transition"
          >
            <span>Start My Life Dashboard</span>
            <ArrowRight size={16} />
          </button>
          <button
            onClick={handleDemo}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-semibold transition"
          >
            <Play size={14} />
            <span>Explore How It Works (Demo)</span>
          </button>
        </div>
      </section>

      {/* Philosophy Loop: Plan -> Act -> Record -> Analyze -> Understand -> Improve -> Repeat */}
      <section className="py-12 px-6 border-y border-slate-900 bg-slate-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
            The Continuous Life Intelligence Loop
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-slate-300">
            {['Plan', 'Act', 'Record', 'Analyze', 'Understand', 'Improve', 'Repeat'].map((step, idx) => (
              <React.Fragment key={step}>
                <span className="px-3.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-indigo-300">
                  {step}
                </span>
                {idx < 6 && <span className="text-slate-600">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* The Core Differentiator: 4 Interconnected Questions */}
      <section className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Ordinary task managers ask: "What should I do?"</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            LIFEOS answers four interconnected questions to bridge the gap between intention and reality.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              num: '1',
              title: 'What did I intend to do?',
              desc: 'Schedule commitments, estimate task durations, and set goal milestones with realism.',
              color: 'border-indigo-500/30 bg-indigo-500/5',
            },
            {
              num: '2',
              title: 'What did I actually do?',
              desc: 'Track a continuous 24-hour timeline of actual activities, focus sessions, and rest.',
              color: 'border-sky-500/30 bg-sky-500/5',
            },
            {
              num: '3',
              title: 'What patterns explain difference?',
              desc: 'Discover time sinks, estimation optimism bias, and recurring distractions with real data.',
              color: 'border-amber-500/30 bg-amber-500/5',
            },
            {
              num: '4',
              title: 'What should I change next?',
              desc: 'Actionable experiments and evidence-backed adjustments suggested for tomorrow.',
              color: 'border-emerald-500/30 bg-emerald-500/5',
            },
          ].map((q) => (
            <div key={q.num} className={`p-6 rounded-2xl border ${q.color} space-y-3`}>
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-white">
                {q.num}
              </div>
              <h3 className="font-bold text-base text-white">{q.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{q.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Key Modules Showcase */}
      <section className="py-20 px-6 bg-slate-900/50 border-t border-slate-900">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Engineered for Deep Personal Intelligence</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">
              Twelve integrated modules that respect rest and recreation as legitimate parts of life.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: 'Interactive 24-Hour Timeline',
                desc: 'View your entire day from 00:00 to 23:59. Visually compare planned intentions against recorded activities with overlap and gap detection.',
              },
              {
                icon: BarChart3,
                title: 'Plan vs Reality Analytics',
                desc: 'Deterministic math on your real database records. Inspect time allocation, duration variance, and estimation accuracy without fake charts.',
              },
              {
                icon: Sparkles,
                title: 'AI Life Analyst',
                desc: 'Ask questions about your own life data. Receive structured observations, mathematical evidence, possible explanations, and concrete experiments.',
              },
              {
                icon: Layers,
                title: 'Reload-Resilient Focus Timer',
                desc: 'Focus sessions survive page reloads and track interruptions. Convert completed sprints directly into actual recorded timeline blocks.',
              },
              {
                icon: Flame,
                title: 'Non-Shaming Habit Tracker',
                desc: 'Build consistency with grace. Missing a day is treated as normal life variance rather than a failure of discipline.',
              },
              {
                icon: ShieldCheck,
                title: 'Privacy-First Architecture',
                desc: 'Your data is strictly yours. No cross-user leakage, no invasive keystroke tracking, and full JSON data export and account deletion on demand.',
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 hover:border-slate-700 transition">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-bold text-base text-white">{feature.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 px-6 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'How does LIFEOS differ from to-do apps like Todoist or Notion?',
              a: 'To-do apps only tell you what you intended to do. LIFEOS tracks what actually happened, computes the mathematical variance between plans and reality, and discovers patterns explaining why days unfold the way they do.',
            },
            {
              q: 'What if I forget to log part of my day?',
              a: 'LIFEOS gracefully highlights unlogged periods and offers non-judgmental prompts to log them. Unlogged time is never automatically assumed to be wasted time.',
            },
            {
              q: 'How is AI used in LIFEOS?',
              a: 'AI is used strictly for qualitative explanations and structured experiments. All arithmetic, time totals, and task rates are computed deterministically by the backend to guarantee accuracy.',
            },
            {
              q: 'Can I export my data?',
              a: 'Yes. You can download a complete JSON export of all your activities, tasks, focus sessions, habits, goals, and daily reviews at any time from Settings.',
            },
          ].map((faq, i) => (
            <div key={i} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="font-semibold text-sm text-white">{faq.q}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 px-6 text-center border-t border-slate-900 bg-gradient-to-b from-slate-950 to-indigo-950/30 space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to understand your time?</h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Start building personal clarity today with sustainable daily iterations.
        </p>
        <button
          onClick={handleStart}
          className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl transition"
        >
          Start My Life Dashboard
        </button>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <div>LIFEOS — Your Personal Life Intelligence System</div>
        <div className="mt-1">Plan → Act → Record → Analyze → Understand → Improve → Repeat.</div>
      </footer>
    </div>
  );
};
