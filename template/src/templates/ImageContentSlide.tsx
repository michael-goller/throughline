import { motion } from 'framer-motion'
import type { ImageContentSlideConfig } from '../types'
import { ClassificationMark } from '../components'
import { containerVariants, itemFadeUpVariants, accentBarAnimation, EASE_OUT } from '../utils/animations'

const imageVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: EASE_OUT,
    },
  },
}

interface Props {
  slide: ImageContentSlideConfig
}

export default function ImageContentSlide({ slide }: Props) {
  const imagePosition = slide.imagePosition || 'right'
  const imageSource = slide.imageUrl || slide.imageSrc

  const ContentSection = (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 flex flex-col justify-center px-12"
    >
      {/* Title */}
      <motion.h2
        variants={itemFadeUpVariants}
        className="font-display text-brand-red text-h2 md:text-h1 font-bold mb-4"
      >
        {slide.title}
      </motion.h2>

      {/* Body */}
      {slide.body && (
        <motion.p
          variants={itemFadeUpVariants}
          className="text-text-primary text-body-lg leading-relaxed mb-6"
        >
          {slide.body}
        </motion.p>
      )}

      {/* Bullets */}
      {slide.bullets && slide.bullets.length > 0 && (
        <motion.ul variants={itemFadeUpVariants} className="space-y-3">
          {slide.bullets.map((bullet, index) => (
            <motion.li
              key={index}
              variants={itemFadeUpVariants}
              className="flex items-start gap-3 text-text-secondary text-body-lg"
            >
              <span className="text-brand-red mt-1">•</span>
              <span>{bullet}</span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </motion.div>
  )

  const ImageSection = (
    <motion.div
      variants={imageVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 flex items-center justify-center p-8"
    >
      {slide.imagePlaceholder ? (
        // Placeholder box
        <div className="w-full h-[400px] rounded-xl bg-background-elevated border border-border flex items-center justify-center">
          <span className="text-text-muted text-body-lg">Image Placeholder</span>
        </div>
      ) : imageSource ? (
        // Actual image
        <img
          src={imageSource}
          alt=""
          className="max-w-full max-h-[500px] rounded-xl object-contain shadow-lg"
        />
      ) : (
        // Default placeholder if no image source
        <div className="w-full h-[400px] rounded-xl bg-background-elevated border border-border flex items-center justify-center">
          <span className="text-text-muted text-body-lg">No Image</span>
        </div>
      )}
    </motion.div>
  )

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-background overflow-hidden">
      {/* Red accent bar at top */}
      <motion.div
        {...accentBarAnimation}
        className="absolute top-0 left-0 right-0 h-1 bg-brand-red origin-left"
      />

      {/* Content - 50/50 split */}
      <div className="relative z-10 w-full h-full flex items-center max-w-[1400px] mx-auto">
        {imagePosition === 'left' ? (
          <>
            {ImageSection}
            {ContentSection}
          </>
        ) : (
          <>
            {ContentSection}
            {ImageSection}
          </>
        )}
      </div>

      {/* Classification mark */}
      <ClassificationMark />
    </div>
  )
}
