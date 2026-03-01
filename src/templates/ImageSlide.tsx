import { motion } from 'framer-motion'
import type { ImageSlideConfig } from '../types'

interface Props {
  slide: ImageSlideConfig
}

export default function ImageSlide({ slide }: Props) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-background overflow-hidden">
      <motion.img
        src={slide.src}
        alt={slide.alt || ''}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  )
}
