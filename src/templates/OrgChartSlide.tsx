import { motion } from 'framer-motion'
import type { OrgChartSlideConfig, OrgNode } from '../types'

const nodeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  },
}

interface OrgNodeProps {
  node: OrgNode
  level: number
  delay: number
}

function OrgNodeCard({ node, level, delay }: OrgNodeProps) {
  const isRoot = level === 0

  return (
    <div className="flex flex-col items-center">
      <motion.div
        variants={nodeVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay }}
        className={`
          flex flex-col items-center justify-center rounded-xl border
          ${isRoot
            ? 'bg-brand-red/20 border-brand-red/40 px-8 py-4'
            : 'bg-nav-bg border-text-muted/20 px-6 py-3'
          }
        `}
      >
        <span className={`font-semibold text-text ${isRoot ? 'text-lg' : 'text-base'}`}>
          {node.name}
        </span>
        <span className="text-text-muted text-sm">{node.role}</span>
      </motion.div>

      {node.children && node.children.length > 0 && (
        <>
          {/* Vertical connector from parent */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: delay + 0.2, duration: 0.3 }}
            className="w-0.5 h-6 bg-text-muted/30 origin-top"
          />

          {/* Horizontal connector bar */}
          {node.children.length > 1 && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: delay + 0.3, duration: 0.3 }}
              className="h-0.5 bg-text-muted/30"
              style={{ width: `${(node.children.length - 1) * 180}px` }}
            />
          )}

          {/* Children */}
          <div className="flex gap-8 mt-0">
            {node.children.map((child, i) => (
              <div key={i} className="flex flex-col items-center">
                {/* Vertical connector to child */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: delay + 0.4, duration: 0.3 }}
                  className="w-0.5 h-6 bg-text-muted/30 origin-top"
                />
                <OrgNodeCard
                  node={child}
                  level={level + 1}
                  delay={delay + 0.5 + i * 0.1}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

interface Props {
  slide: OrgChartSlideConfig
}

export default function OrgChartSlide({ slide }: Props) {
  const { title, root } = slide

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-16 py-12">
      {title && (
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-text mb-12"
        >
          {title}
        </motion.h1>
      )}

      <div className="overflow-auto max-w-full">
        <OrgNodeCard node={root} level={0} delay={0.3} />
      </div>
    </div>
  )
}
