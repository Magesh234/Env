"use client"

import { LoginForm } from "@/components/login-form"
import { Building2, BarChart3, Package, TrendingUp, Shield, ChevronRight, Zap, Users, Globe } from "lucide-react"
import { PackagesModal } from "@/components/packages-modal"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

export default function LoginPage() {
  const [showPackages, setShowPackages] = useState(false)

  return (
    <div className="min-h-screen bg-[#030712] selection:bg-primary/20 overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* Google Fonts Import via style tag */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,900;1,9..40,300&family=Instrument+Serif:ital@0;1&display=swap');

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(1deg); }
          66% { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes draw-line {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes count-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes grid-fade {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.07; }
        }
        @keyframes orb-drift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(30px, -20px); }
          50% { transform: translate(-20px, 30px); }
          75% { transform: translate(20px, 20px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-shimmer { 
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
        .animate-slide-up { animation: slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up-delay-1 { animation: slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .animate-slide-up-delay-2 { animation: slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .animate-slide-up-delay-3 { animation: slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
        .animate-slide-up-delay-4 { animation: slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both; }
        .animate-slide-in-right { animation: slide-in-right 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .animate-orb-drift { animation: orb-drift 15s ease-in-out infinite; }
        .instrument-serif { font-family: 'Instrument Serif', serif; }
        .grid-bg {
          background-image: 
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: grid-fade 8s ease-in-out infinite;
        }
        .stat-card:hover .stat-arrow { transform: translateX(4px) translateY(-4px); }
        .stat-arrow { transition: transform 0.2s ease; }
        .feature-pill:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.07); }
        .cta-btn:hover { box-shadow: 0 0 40px rgba(99, 102, 241, 0.4); transform: translateY(-2px); }
        .cta-btn:active { transform: translateY(0); }
      `}</style>

      {/* LAYERED BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Base dark */}
        <div className="absolute inset-0 bg-[#030712]" />
        
        {/* Grid */}
        <div className="absolute inset-0 grid-bg" />

        {/* Ambient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full animate-orb-drift" 
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full animate-orb-drift" 
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', animationDelay: '-7s' }} />
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full animate-orb-drift"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', animationDelay: '-3s' }} />
          
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px'
        }} />
      </div>

      <div className="relative min-h-screen flex flex-col lg:flex-row">
        
        {/* ─── LEFT PANEL ─── */}
        <div className="flex flex-col justify-between flex-1 px-8 py-10 lg:px-16 lg:py-14 xl:px-24 xl:py-20 max-w-none lg:max-w-[58%]">
          
          {/* Top: Logo */}
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-indigo-500/30 blur-lg rounded-xl animate-pulse-glow" />
                <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <span className="text-white font-black text-xl tracking-tight">IMS</span>
                <span className="ml-2 text-[10px] font-bold uppercase tracking-[3px] text-white/30">Platform</span>
              </div>
            </div>
          </div>

          {/* Center: Main content */}
          <div className="flex-1 flex flex-col justify-center py-16 space-y-12">
            
            {/* Badge */}
            <div className="animate-slide-up-delay-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-indigo-300 tracking-wider uppercase">Version 1.0 — Now Live</span>
              </div>
            </div>

            {/* Headline */}
            <div className="animate-slide-up-delay-2 space-y-4">
              <h2 className="text-5xl md:text-6xl xl:text-7xl font-black text-white leading-[1.0] tracking-tight">
                Master your
                <br />
                <span className="instrument-serif italic font-normal" style={{
                  background: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 40%, #6366f1 70%, #4f46e5 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  inventory,
                </span>
                <br />
                <span>finally.</span>
              </h2>
              <p className="text-base text-white/45 max-w-md leading-relaxed font-light" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                The modern operating layer for multi-store businesses. Real-time tracking, intelligent analytics, and enterprise controls — without the complexity.
              </p>
            </div>

            {/* CTA */}
            <div className="animate-slide-up-delay-3">
              <button
                onClick={() => setShowPackages(true)}
                className="cta-btn group inline-flex items-center gap-3 px-6 py-3.5 rounded-full font-bold text-sm text-white transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 0 1px rgba(99,102,241,0.3), 0 4px 20px rgba(99,102,241,0.2)' }}
              >
                <Package className="h-4 w-4" />
                Explore Enterprise Plans
                <ChevronRight className="h-4 w-4 opacity-60 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>

            {/* Stats Row */}
            <div className="animate-slide-up-delay-4 grid grid-cols-3 gap-4 max-w-lg">
              {[
                { value: "99.9%", label: "Uptime SLA", color: "text-emerald-400" },
                { value: "50ms", label: "Avg Response", color: "text-blue-400" },
              ].map((stat, i) => (
                <div key={i} className="stat-card group p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 cursor-default">
                  <div className={`text-2xl font-black tracking-tight ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-white/35 font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: Feature pills */}
          <div className="animate-slide-up-delay-4">
            <div className="flex flex-wrap gap-3">
              {[
                { icon: BarChart3, label: "Live Analytics", color: "text-blue-400" },
                { icon: Shield, label: "Encrypted", color: "text-emerald-400" },
                { icon: Globe, label: "Multi-Store", color: "text-purple-400" },
                { icon: Zap, label: "Real-time Sync", color: "text-amber-400" },
              ].map((f, i) => (
                <div key={i} className="feature-pill flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] transition-all duration-300 cursor-default">
                  <f.icon className={`h-3.5 w-3.5 ${f.color}`} />
                  <span className="text-xs font-bold text-white/50">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── VERTICAL DIVIDER ─── */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/10 to-transparent self-stretch mx-0" />

        {/* ─── RIGHT PANEL ─── */}
        <div className="flex flex-col justify-center px-8 py-12 lg:px-14 xl:px-20 lg:w-[42%] animate-slide-in-right">
          <div className="w-full max-w-[420px] mx-auto">

            {/* Form header */}
            <div className="mb-10">
              <p className="text-[11px] font-black uppercase tracking-[3px] text-indigo-400 mb-3">Secure Access</p>
              <h3 className="text-3xl font-black text-white leading-tight">
                Welcome<br />
                <span className="instrument-serif italic font-normal text-white/60">back.</span>
              </h3>
              <p className="text-sm text-white/35 mt-3 font-light">
                Sign in to manage your operations.
              </p>
            </div>

            {/* THE LOGIN FORM */}
            <LoginForm />

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] text-white/25 font-medium">© 2026 IMS Inc.</span>
              <a href="#" className="text-[11px] font-bold text-indigo-400/70 hover:text-indigo-400 transition-colors">
                Support Center
              </a>
            </div>
          </div>
        </div>

      </div>

      <PackagesModal isOpen={showPackages} onClose={() => setShowPackages(false)} />
    </div>
  )
}