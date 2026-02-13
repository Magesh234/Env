"use client"

import { useState, useEffect } from "react"
// Removed Card and CardContent imports as they are no longer used
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Rocket, 
  Sparkles, 
  Clock, 
  ArrowLeft,
  Hammer,
  Code,
  Zap
} from "lucide-react"

export default function ComingSoonPage() {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".")
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: <Code className="h-5 w-5" />,
      title: "Advanced Features",
      description: "Powerful tools to enhance your workflow"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Lightning Fast",
      description: "Optimized for speed and performance"
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "Modern Design",
      description: "Clean and intuitive interface"
    }
  ]

  return (
    // Outer fixed container (Full screen, gradient background, dark mode supported)
    <div className="fixed inset-0 min-h-screen min-w-full flex items-center justify-center p-4 sm:p-8 
                   bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 
                   overflow-auto transition-colors duration-500">
      
      {/* Content Wrapper: Removed Card/CardContent, applied padding directly */}
      <div className="w-full max-w-4xl my-auto py-8 p-6 md:p-12">
        
        {/* Header */}
        <div className="text-center mb-8">
          {/* Rocket icon background is bright in both modes */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6 shadow-xl animate-pulse">
            <Rocket className="h-10 w-10 text-white" />
          </div>
          
          {/* Badge colors adjusted for dark mode visibility */}
          <Badge 
            variant="secondary" 
            className="mb-4 text-sm px-3 py-1 
                       bg-yellow-100 text-yellow-800 border-yellow-300
                       dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700"
          >
            <Hammer className="mr-1 h-3 w-3" />
            Under Development
          </Badge>
          
          {/* Text gradient remains consistent */}
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Get Ready, We're Launching Soon!
          </h1>
          
          {/* Text color adapted for better contrast against the background gradient */}
          <p className="text-base md:text-lg text-gray-700 max-w-3xl mx-auto dark:text-gray-300">
            We're putting the final touches on something truly amazing. This feature is currently under development and will be available to you shortly.
          </p>
        </div>

        {/* Loading Animation */}
        <div className="flex items-center justify-center gap-2 mb-8 mt-6">
          <Clock className="h-5 w-5 text-indigo-500 dark:text-indigo-400 animate-spin" />
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Building something great{dots}
          </span>
        </div>

        {/* Features Grid - Each feature item now uses a subtle card-like styling for definition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              // Card styles applied here to keep the definition without relying on the outer Card component
              className="p-6 text-center rounded-xl border-2 border-indigo-200 shadow-xl 
                         bg-white/80 dark:bg-gray-800/80 transition-all 
                         hover:shadow-2xl hover:border-indigo-400 dark:hover:border-indigo-600 backdrop-blur-sm"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full 
                              bg-indigo-100 text-indigo-600 dark:bg-indigo-800 dark:text-indigo-300 mb-4 shadow-md">
                {feature.icon}
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Progress Bar - Needs a solid background for readability, so wrapped it in a div */}
        <div className="space-y-2 max-w-xl mx-auto p-4 rounded-lg bg-white/70 dark:bg-gray-900/70 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium dark:text-gray-400">Development Progress</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">65%</span>
          </div>
          {/* Progress bar background adapted */}
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: '65%' }}
            />
          </div>
        </div>

        {/* Footer Message - Colors adapted for contrast */}
        <div className="mt-10 p-5 max-w-xl mx-auto 
                       bg-indigo-50 dark:bg-indigo-900/40 
                       rounded-xl border border-indigo-200 dark:border-indigo-700 shadow-xl">
          <p className="text-sm text-center text-indigo-700 dark:text-indigo-300 font-medium">
            <Sparkles className="inline h-4 w-4 mr-1 animate-pulse" />
            Want an update? Check back soon or subscribe for launch notifications!
          </p>
        </div>
      </div>
    </div>
  )
}
