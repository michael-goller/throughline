import { motion } from 'framer-motion'
import { Mail, Linkedin, Twitter, Github } from 'lucide-react'
import type { ClosingSlideConfig, SocialLink } from '../types'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  ClassificationMark,
  RoundedTriangle,
  NeuralNetwork,
} from '../components'
import { containerSlowVariants, itemFadeUpHeroVariants } from '../utils/animations'
import { resolveIcon } from '../utils/iconResolver'

// Default icon mapping for common platforms
const platformIcons: Record<string, LucideIcon> = {
  linkedin: Linkedin,
  twitter: Twitter,
  github: Github,
  email: Mail,
  mail: Mail,
}

function getSocialIcon(link: SocialLink): ReactNode {
  // If custom icon is provided, try to resolve it
  if (link.icon) {
    if (typeof link.icon === 'string') {
      const Resolved = resolveIcon(link.icon)
      if (Resolved) return <Resolved className="w-6 h-6" />
    } else if (typeof link.icon === 'function') {
      const Icon = link.icon as LucideIcon
      return <Icon className="w-6 h-6" />
    } else {
      return link.icon as ReactNode
    }
  }

  // Otherwise, try to match platform name to default icons
  const platform = link.platform.toLowerCase()
  const Icon = platformIcons[platform]
  if (Icon) {
    return <Icon className="w-6 h-6" />
  }

  // Fallback: just show platform name
  return <span className="text-body font-semibold">{link.platform}</span>
}

interface Props {
  slide: ClosingSlideConfig
}

export default function ClosingSlide({ slide }: Props) {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Red gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #E31937 0%, #B31329 50%, #731C3F 100%)',
        }}
      />

      {/* Neural network animation layer - right half only */}
      <div className="absolute top-0 right-0 w-1/2 h-full">
        <NeuralNetwork
          nodeCount={80}
          baseColor="rgba(255, 255, 255, 0.15)"
          glowColor="rgba(255, 200, 200, 0.8)"
          fireRate={100}
          connectionDistance={200}
        />
      </div>

      {/* Decorative rounded triangle - Avery Dennison brand element */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[70%] aspect-video translate-x-[3%]">
          <RoundedTriangle
            rotation={120}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={4}
          />
        </div>
      </div>

      {/* Content */}
      <motion.div
        variants={containerSlowVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-16 max-w-[900px]"
      >
        {/* Logo */}
        {slide.logoSrc && (
          <motion.div variants={itemFadeUpHeroVariants} className="mb-12">
            <img
              src={slide.logoSrc}
              alt=""
              className="h-16 mx-auto"
            />
          </motion.div>
        )}

        {/* Tagline */}
        {slide.tagline && (
          <motion.h1
            variants={itemFadeUpHeroVariants}
            className="font-display text-h1 md:text-hero font-bold text-white leading-tight mb-12"
          >
            {slide.tagline}
          </motion.h1>
        )}

        {/* Contact Email(s) */}
        {slide.contactEmail && (
          <motion.div variants={itemFadeUpHeroVariants} className="mb-8 flex flex-col items-center gap-3">
            {slide.contactEmail.split('\n').map((email, i) => (
              <a
                key={i}
                href={`mailto:${email.trim()}`}
                className="font-display inline-flex items-center gap-3 text-white/90 hover:text-white text-h3 transition-colors"
              >
                <Mail className="w-6 h-6" />
                <span>{email.trim()}</span>
              </a>
            ))}
          </motion.div>
        )}

        {/* Social Links */}
        {slide.socialLinks && slide.socialLinks.length > 0 && (
          <motion.div
            variants={itemFadeUpHeroVariants}
            className="flex justify-center gap-6"
          >
            {slide.socialLinks.map((link, index) => (
              <motion.a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                title={link.platform}
              >
                {getSocialIcon(link)}
              </motion.a>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Classification mark */}
      <ClassificationMark className="text-white/50" />
    </div>
  )
}
