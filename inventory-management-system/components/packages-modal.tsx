"use client"

import { useState, useEffect } from 'react'
import { X, Check, Sparkles, Zap, Crown, Rocket, Star, TrendingUp, Shield, Package } from "lucide-react"
import { subscription_base_url } from '@/lib/api-config'

const API_BASE_URL = subscription_base_url

interface Feature {
  id: string
  name: string
  code: string
  description: string
  app_id: string
  created_at: string
  updated_at: string
}

interface Package {
  id: string
  name: string
  description: string
  app_id: string
  features?: Feature[]
  created_at: string
  updated_at: string
}

interface PackagesModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PackageDetailsModalProps {
  package: Package | null
  isOpen: boolean
  onClose: () => void
}

function PackageDetailsModal({ package: pkg, isOpen, onClose }: PackageDetailsModalProps) {
  if (!isOpen || !pkg) return null

  return (
    <>
      <style>{`
        @keyframes modal-slide-up {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes backdrop-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes feature-slide {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .modal-container { animation: modal-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .modal-backdrop { animation: backdrop-fade 0.3s ease forwards; }
      `}</style>

      <div className="modal-backdrop fixed inset-0 bg-black/70 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
        <div className="modal-container bg-[#030712] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden border border-white/10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          
          {/* Premium Header */}
          <div className="relative px-10 py-10 overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent" />
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%)',
            }} />
            
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 mb-4">
                  <Star className="h-3 w-3 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-300 tracking-wider uppercase">Premium Plan</span>
                </div>
                <h2 className="text-4xl font-black text-white mb-3 tracking-tight">{pkg.name}</h2>
                <p className="text-white/50 text-base leading-relaxed max-w-2xl font-light">
                  {pkg.description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-11 w-11 rounded-xl hover:bg-white/10 flex items-center justify-center transition-all duration-200 border border-white/10 backdrop-blur-sm flex-shrink-0 ml-6"
              >
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="overflow-y-auto max-h-[calc(92vh-280px)] px-10 pb-10">
            {pkg.features && pkg.features.length > 0 ? (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-xl font-black text-white">Everything Included</h3>
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="px-3 py-1 bg-white/5 text-white/40 text-xs font-bold rounded-full border border-white/10">
                    {pkg.features.length} Features
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pkg.features.map((feature, index) => (
                    <div
                      key={feature.id}
                      className="group p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 hover:border-indigo-500/30"
                      style={{ 
                        animation: `feature-slide 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s both`
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <Check className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold mb-1.5 text-white text-sm">{feature.name}</h4>
                          <p className="text-xs text-white/40 leading-relaxed font-light">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4">
                  <Package className="h-8 w-8 text-white/30" />
                </div>
                <p className="text-white/30 font-medium">No features available</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#030712]/95 backdrop-blur-xl border-t border-white/10 px-10 py-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white/25">
              <Shield className="h-3.5 w-3.5" />
              <span className="font-medium">Enterprise-grade security included</span>
            </div>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 font-bold text-sm hover:-translate-y-0.5"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export function PackagesModal({ isOpen, onClose }: PackagesModalProps) {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchPackages()
    }
  }, [isOpen])

  const fetchPackages = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/packages`)
      const data = await response.json()
      if (data.success) {
        setPackages(data.data)
      } else {
        setError('Failed to load packages')
      }
    } catch (err) {
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const getPackageIcon = (index: number) => {
    const icons = [Sparkles, Zap, Crown, Rocket, Star, TrendingUp]
    return icons[index % icons.length]
  }

  const getPackageGradient = (index: number) => {
    const gradients = [
      { from: 'from-blue-500', to: 'to-cyan-500', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
      { from: 'from-purple-500', to: 'to-pink-500', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' },
      { from: 'from-orange-500', to: 'to-red-500', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' },
      { from: 'from-emerald-500', to: 'to-teal-500', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
      { from: 'from-violet-500', to: 'to-purple-500', border: 'border-violet-500/30', glow: 'shadow-violet-500/20' },
      { from: 'from-amber-500', to: 'to-yellow-500', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' }
    ]
    return gradients[index % gradients.length]
  }

  if (!isOpen) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,900;1,9..40,300&family=Instrument+Serif:ital@0;1&display=swap');
        
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-scale-in {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes card-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .modal-backdrop { animation: modal-fade-in 0.3s ease forwards; }
        .modal-content { animation: modal-scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .package-card:hover .shimmer { animation: shimmer-slide 2s ease-in-out; }
        .instrument-serif { font-family: 'Instrument Serif', serif; }
        
        /* Custom scrollbar styles */
        .packages-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .packages-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .packages-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }
        .packages-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        /* Firefox scrollbar */
        .packages-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.15) rgba(0, 0, 0, 0.2);
        }
      `}</style>

      <div className="modal-backdrop fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex items-center justify-center p-4">
        <div className="modal-content bg-[#030712] rounded-3xl shadow-2xl w-full max-w-[95vw] max-h-[98vh] overflow-hidden border border-white/10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          
          {/* Premium Header */}
          <div className="relative px-10 py-10 overflow-hidden border-b border-white/10">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            
            <div className="relative flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-indigo-300 tracking-wider uppercase">Choose Your Plan</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                  Enterprise
                  <span className="instrument-serif italic font-normal text-white/50 ml-3">Subscriptions</span>
                </h2>
                <p className="text-white/40 text-base max-w-2xl font-light leading-relaxed">
                  Select the perfect package for your business needs. All plans include premium support and enterprise-grade security.
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-11 w-11 rounded-xl hover:bg-white/10 flex items-center justify-center transition-all duration-200 border border-white/10 backdrop-blur-sm flex-shrink-0"
              >
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="overflow-y-auto max-h-[calc(98vh-200px)] p-10 bg-gradient-to-b from-transparent to-black/20">
            
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl border-4 border-white/10 border-t-indigo-500 animate-spin" />
                  <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-indigo-500/20 blur-xl animate-pulse" />
                </div>
                <p className="text-white/40 mt-6 font-medium">Loading packages...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
                  <X className="h-8 w-8 text-red-400" />
                </div>
                <p className="text-red-400 mb-6 font-medium">{error}</p>
                <button
                  onClick={fetchPackages}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 font-bold text-sm"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Packages Grid */}
            {!loading && !error && packages.length > 0 && (
              <div className="packages-scroll overflow-x-auto pb-4">
                <div className="inline-flex gap-6 min-w-full">
                  {packages.map((pkg, index) => {
                    const Icon = getPackageIcon(index)
                    const gradient = getPackageGradient(index)
                    const isPopular = index === 1 // Middle package is popular
                    
                    return (
                      <div
                        key={pkg.id}
                        className="package-card group relative w-[380px] flex-shrink-0"
                        style={{ 
                          animation: `card-fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both`
                        }}
                      >
                        {/* Popular badge */}
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                            <div className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg shadow-indigo-500/50">
                              <span className="text-xs font-black text-white uppercase tracking-wider">Most Popular</span>
                            </div>
                          </div>
                        )}

                        <div className={`relative bg-white/[0.02] rounded-2xl border ${isPopular ? 'border-indigo-500/50' : 'border-white/[0.08]'} overflow-hidden hover:border-white/20 transition-all duration-500 hover:shadow-2xl ${gradient.glow} hover:-translate-y-1 h-full flex flex-col min-h-[750px]`}>
                          
                          {/* Card shimmer effect */}
                          <div className="shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                          
                          {/* Icon header */}
                          <div className="relative p-12 pb-10">
                            <div className="relative inline-flex">
                              <div className={`absolute inset-0 bg-gradient-to-br ${gradient.from} ${gradient.to} rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />
                              <div className={`relative h-24 w-24 rounded-2xl bg-gradient-to-br ${gradient.from} ${gradient.to} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-2xl`}>
                                <Icon className="h-12 w-12 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="px-12 pb-12 flex-1 flex flex-col">
                            <h3 className="text-3xl font-black text-white mb-4 tracking-tight group-hover:text-indigo-300 transition-colors duration-300">
                              {pkg.name}
                            </h3>
                            <p className="text-base text-white/40 mb-10 leading-relaxed font-light line-clamp-3 flex-shrink-0">
                              {pkg.description}
                            </p>

                            {/* Features preview */}
                            {pkg.features && pkg.features.length > 0 && (
                              <div className="space-y-5 mb-12 flex-1">
                                <div className="flex items-center gap-2 mb-8">
                                  <div className="h-px flex-1 bg-white/10" />
                                  <span className="text-[11px] font-black uppercase tracking-widest text-white/30">
                                    {pkg.features.length} Features
                                  </span>
                                  <div className="h-px flex-1 bg-white/10" />
                                </div>
                                
                                {pkg.features.slice(0, 6).map((feature, i) => (
                                  <div key={feature.id} className="flex items-start gap-4 group/item">
                                    <div className="mt-1">
                                      <div className="relative">
                                        <Check className="h-5 w-5 text-indigo-400 relative z-10" />
                                        <div className="absolute inset-0 bg-indigo-400/20 blur-sm opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                                      </div>
                                    </div>
                                    <span className="text-sm text-white/60 leading-relaxed font-medium">
                                      {feature.name}
                                    </span>
                                  </div>
                                ))}
                                
                                {pkg.features.length > 6 && (
                                  <div className="flex items-center gap-2 pl-9 pt-4">
                                    <div className="h-px flex-1 bg-white/5" />
                                    <span className="text-xs text-white/30 font-bold">
                                      +{pkg.features.length - 6} more features
                                    </span>
                                    <div className="h-px flex-1 bg-white/5" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* CTA Button */}
                            <button 
                              onClick={() => setSelectedPackage(pkg)}
                              className={`w-full py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r ${gradient.from} ${gradient.to} hover:shadow-2xl ${gradient.glow} transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 border ${gradient.border} flex items-center justify-center gap-2 group/btn`}
                            >
                              <span>View Full Details</span>
                              <Sparkles className="h-5 w-5 opacity-60 group-hover/btn:opacity-100 group-hover/btn:rotate-12 transition-all duration-300" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && packages.length === 0 && (
              <div className="text-center py-32">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-white/10 mb-6">
                  <Package className="h-10 w-10 text-white/30" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No packages available</h3>
                <p className="text-white/40 font-light">Check back later for subscription options</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#030712]/95 backdrop-blur-xl border-t border-white/10 px-10 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/25">
                <Shield className="h-3.5 w-3.5" />
                <span className="font-medium">All plans include 24/7 support & 99.9% uptime SLA</span>
              </div>
              <span className="text-[11px] text-white/20 font-medium">© 2026 IMS Inc.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Package Details Modal */}
      <PackageDetailsModal
        package={selectedPackage}
        isOpen={!!selectedPackage}
        onClose={() => setSelectedPackage(null)}
      />
    </>
  )
}