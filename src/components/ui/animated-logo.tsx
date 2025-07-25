'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animate?: boolean
  onClick?: () => void
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
}

export function AnimatedLogo({ 
  size = 'md', 
  className, 
  animate = true,
  onClick 
}: AnimatedLogoProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className={cn(
        "relative cursor-pointer transition-all duration-300",
        sizeClasses[size],
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Animated background glow */}
      <div 
        className={cn(
          "absolute inset-0 rounded-lg transition-all duration-500",
          animate && isHovered 
            ? "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 blur-sm scale-110" 
            : "bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-sm"
        )}
      />
      
      {/* SVG Logo */}
      <svg
        className={cn(
          "relative w-full h-full transition-all duration-300",
          animate && isHovered && "scale-105 rotate-1"
        )}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Simplified interlocking logo design */}
        <g>
          {/* Main circular background */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="url(#backgroundGradient)"
            className={cn(
              "transition-all duration-700",
              animate && isHovered && "drop-shadow-lg"
            )}
          />

          {/* Left interlocking ring */}
          <circle
            cx="35"
            cy="50"
            r="20"
            fill="none"
            stroke="url(#leftGradient)"
            strokeWidth="6"
            className={cn(
              "transition-all duration-500 delay-100",
              animate && isHovered && "drop-shadow-md"
            )}
          />

          {/* Right interlocking ring */}
          <circle
            cx="65"
            cy="50"
            r="20"
            fill="none"
            stroke="url(#rightGradient)"
            strokeWidth="6"
            className={cn(
              "transition-all duration-500 delay-200",
              animate && isHovered && "drop-shadow-md"
            )}
          />

          {/* Center connecting element */}
          <circle
            cx="50"
            cy="50"
            r="8"
            fill="url(#centerGradient)"
            className={cn(
              "transition-all duration-300 delay-300",
              animate && isHovered && "drop-shadow-sm scale-110"
            )}
          />

          {/* AI indicator dots */}
          <circle cx="50" cy="35" r="2" fill="url(#accentGradient)" className="animate-pulse" />
          <circle cx="50" cy="65" r="2" fill="url(#accentGradient)" className="animate-pulse" style={{animationDelay: '0.5s'}} />
          <circle cx="35" cy="50" r="2" fill="url(#accentGradient)" className="animate-pulse" style={{animationDelay: '1s'}} />
          <circle cx="65" cy="50" r="2" fill="url(#accentGradient)" className="animate-pulse" style={{animationDelay: '1.5s'}} />
        </g>
        
        {/* Gradient definitions */}
        <defs>
          <radialGradient id="backgroundGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.2" />
          </radialGradient>
          <linearGradient id="leftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="rightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </radialGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
