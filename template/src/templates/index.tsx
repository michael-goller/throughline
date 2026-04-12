import type { SlideConfig } from '../types'
import TitleSlide from './TitleSlide'
import TitleSlideDigital from './TitleSlideDigital'
import StepsSlide from './StepsSlide'
import TwoColumnSlide from './TwoColumnSlide'
import ContentSlide from './ContentSlide'
import DividerSlide from './DividerSlide'
import QuoteSlide from './QuoteSlide'
import ThreeColumnSlide from './ThreeColumnSlide'
import StatsSlide from './StatsSlide'
import ImageContentSlide from './ImageContentSlide'
import TimelineSlide from './TimelineSlide'
import ComparisonSlide from './ComparisonSlide'
import QASlide from './QASlide'
import ClosingSlide from './ClosingSlide'
import GanttSlide from './GanttSlide'
import MatrixSlide from './MatrixSlide'
import OrgChartSlide from './OrgChartSlide'
import FeatureGridSlide from './FeatureGridSlide'
import FishboneSlide from './FishboneSlide'
import ForceFieldSlide from './ForceFieldSlide'
import PricingSlide from './PricingSlide'
import IconGridSlide from './IconGridSlide'
import ImageSlide from './ImageSlide'
import NameRevealSlide from './NameRevealSlide'
import TeamObjectivesSlide from './TeamObjectivesSlide'
import OperatingLoopSlide from './OperatingLoopSlide'
import OKRScoreSlide from './OKRScoreSlide'
import SparklineGridSlide from './SparklineGridSlide'
import BarometerGridSlide from './BarometerGridSlide'
import ScorecardSlide from './ScorecardSlide'
import StatusTableSlide from './StatusTableSlide'
import RiskCardSlide from './RiskCardSlide'

interface SlideRendererProps {
  slide: SlideConfig
}

export default function SlideRenderer({ slide }: SlideRendererProps) {
  switch (slide.type) {
    case 'title':
      return <TitleSlide slide={slide} />
    case 'title-digital':
      return <TitleSlideDigital slide={slide} />
    case 'steps':
      return <StepsSlide slide={slide} />
    case 'two-column':
      return <TwoColumnSlide slide={slide} />
    case 'content':
      return <ContentSlide slide={slide} />
    case 'divider':
      return <DividerSlide slide={slide} />
    case 'quote':
      return <QuoteSlide slide={slide} />
    case 'three-column':
      return <ThreeColumnSlide slide={slide} />
    case 'stats':
      return <StatsSlide slide={slide} />
    case 'image-content':
      return <ImageContentSlide slide={slide} />
    case 'timeline':
      return <TimelineSlide slide={slide} />
    case 'comparison':
      return <ComparisonSlide slide={slide} />
    case 'qa':
      return <QASlide slide={slide} />
    case 'closing':
      return <ClosingSlide slide={slide} />
    case 'gantt':
      return <GanttSlide slide={slide} />
    case 'matrix':
      return <MatrixSlide slide={slide} />
    case 'org-chart':
      return <OrgChartSlide slide={slide} />
    case 'feature-grid':
      return <FeatureGridSlide slide={slide} />
    case 'fishbone':
      return <FishboneSlide slide={slide} />
    case 'force-field':
      return <ForceFieldSlide slide={slide} />
    case 'pricing':
      return <PricingSlide slide={slide} />
    case 'icon-grid':
      return <IconGridSlide slide={slide} />
    case 'image':
      return <ImageSlide slide={slide} />
    case 'name-reveal':
      return <NameRevealSlide slide={slide} />
    case 'team-objectives':
      return <TeamObjectivesSlide slide={slide} />
    case 'operating-loop':
      return <OperatingLoopSlide slide={slide} />
    case 'okr-score':
      return <OKRScoreSlide slide={slide} />
    case 'sparkline-grid':
      return <SparklineGridSlide slide={slide} />
    case 'barometer-grid':
      return <BarometerGridSlide slide={slide} />
    case 'scorecard':
      return <ScorecardSlide slide={slide} />
    case 'status-table':
      return <StatusTableSlide slide={slide} />
    case 'risk-card':
      return <RiskCardSlide slide={slide} />
    default:
      return (
        <div className="flex items-center justify-center h-full text-text-muted">
          Unknown slide type: {(slide as unknown as { type: string }).type}
        </div>
      )
  }
}

export {
  TitleSlide,
  TitleSlideDigital,
  StepsSlide,
  TwoColumnSlide,
  ContentSlide,
  DividerSlide,
  QuoteSlide,
  ThreeColumnSlide,
  StatsSlide,
  ImageContentSlide,
  TimelineSlide,
  ComparisonSlide,
  QASlide,
  ClosingSlide,
  GanttSlide,
  MatrixSlide,
  OrgChartSlide,
  FeatureGridSlide,
  FishboneSlide,
  ForceFieldSlide,
  PricingSlide,
  IconGridSlide,
  ImageSlide,
  NameRevealSlide,
  TeamObjectivesSlide,
  OperatingLoopSlide,
  OKRScoreSlide,
  SparklineGridSlide,
  BarometerGridSlide,
  ScorecardSlide,
  StatusTableSlide,
  RiskCardSlide,
}
