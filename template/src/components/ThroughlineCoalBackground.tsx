/**
 * Throughline "coal" background — 1:1 port of the marketing landing site.
 * Five-layer coal stack (vignette, grain, specular highlights, Voronoi
 * facets, compression mottle) + 11-diamond field sited on a viewport-
 * spanning red Voronoi seam that draws in over 2.8s.
 *
 * Class names are prefixed `tlcb-` to avoid collisions with template CSS.
 * Drop this at the top of a wrapper; keep card content at `z-index: 1`.
 */

const ACCENT = '#B91C1C';

const CSS = `
.tlcb-root {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background-color: #16141A;
  background-image:
    radial-gradient(ellipse 150% 110% at center, transparent 48%, rgba(8, 6, 12, 0.32) 100%),
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch' seed='7'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.09 0.09 0.09 0 0'/></filter><rect width='100%25' height='100%25' filter='url(%23g)'/></svg>"),
    url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1400' width='1920' height='1400' preserveAspectRatio='none'%3E%3Cg stroke='rgba(236,232,228,0.11)' stroke-width='0.9' fill='none' stroke-linecap='round'%3E%3Cline x1='682.4' y1='36.9' x2='649.2' y2='87.4'/%3E%3Cline x1='1310.7' y1='152.2' x2='1302.6' y2='177.9'/%3E%3Cline x1='1533.8' y1='647.6' x2='1522.2' y2='621.2'/%3E%3Cline x1='325.6' y1='69.6' x2='326.5' y2='141.6'/%3E%3Cline x1='599.7' y1='1340.0' x2='577.7' y2='1381.0'/%3E%3Cline x1='128.3' y1='1253.5' x2='151.6' y2='1204.9'/%3E%3Cline x1='1920.0' y1='1046.5' x2='1920.0' y2='1145.9'/%3E%3Cline x1='1497.4' y1='12.5' x2='1496.9' y2='29.2'/%3E%3Cline x1='1595.4' y1='1125.3' x2='1605.9' y2='1179.6'/%3E%3Cline x1='729.5' y1='1226.4' x2='721.5' y2='1221.6'/%3E%3Cline x1='331.9' y1='286.1' x2='329.1' y2='294.8'/%3E%3Cline x1='87.9' y1='103.6' x2='145.1' y2='160.0'/%3E%3Cline x1='588.0' y1='1361.7' x2='604.2' y2='1331.5'/%3E%3C/g%3E%3C/svg%3E"),
    url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1400' width='1920' height='1400' preserveAspectRatio='none'%3E%3Cg stroke='rgba(236,232,228,0.048)' stroke-width='1' fill='none' stroke-linejoin='miter'%3E%3Cpath d='M706.6,0.0L627.1,121.1L324.9,16.1L311.6,0.0L706.6,0.0Z'/%3E%3Cpath d='M912.8,536.3L641.9,727.3L587.7,531.5L764.5,427.2L770.3,427.9L888.8,506.7L912.8,536.3Z'/%3E%3Cpath d='M1154.4,634.6L1342.2,393.6L1346.9,394.2L1358.4,479.0L1202.7,644.1L1154.4,634.6Z'/%3E%3Cpath d='M900.1,827.6L853.6,770.0L985.9,583.6L1058.6,584.8L1115.5,636.6L1107.0,743.5L900.1,827.6Z'/%3E%3Cpath d='M1920.0,1400.0L1702.9,1400.0L1682.1,1300.7L1777.1,1209.1L1920.0,1231.9L1920.0,1400.0Z'/%3E%3Cpath d='M337.9,931.0L243.3,1033.7L181.4,1052.9L0.0,1032.7L0.0,709.6L226.2,732.6L337.9,931.0Z'/%3E%3Cpath d='M976.6,1113.1L1089.1,1304.8L1115.3,1400.0L826.9,1400.0L735.0,1229.7L880.7,1136.2L976.6,1113.1Z'/%3E%3Cpath d='M1289.9,218.1L1174.2,271.0L1080.7,155.6L1321.8,117.0L1289.9,218.1Z'/%3E%3Cpath d='M1308.1,921.2L1339.8,736.5L1535.1,731.8L1590.0,833.5L1569.0,951.6L1364.4,962.9L1308.1,921.2Z'/%3E%3Cpath d='M1306.5,681.3L1485.6,595.5L1512.9,600.0L1541.2,664.5L1535.1,731.8L1339.8,736.5L1306.5,681.3Z'/%3E%3Cpath d='M939.1,250.1L770.3,427.9L764.5,427.2L691.2,208.1L939.1,250.1Z'/%3E%3Cpath d='M696.9,1075.3L673.7,1154.7L590.3,1165.1L496.6,1037.8L474.8,914.7L558.8,862.6L585.4,853.3L693.4,974.2L696.9,1075.3Z'/%3E%3Cpath d='M1512.9,600.0L1537.1,533.4L1715.6,473.8L1720.1,513.7L1713.8,544.2L1596.2,644.4L1541.2,664.5L1512.9,600.0Z'/%3E%3Cpath d='M853.6,770.0L643.5,756.0L641.9,727.3L912.8,536.3L985.9,583.6L853.6,770.0Z'/%3E%3Cpath d='M520.5,267.3L334.9,277.2L328.0,265.5L324.9,16.1L627.1,121.1L626.8,133.1L520.5,267.3Z'/%3E%3Cpath d='M1107.0,743.5L1115.5,636.6L1154.4,634.6L1202.7,644.1L1302.3,677.4L1306.5,681.3L1339.8,736.5L1308.1,921.2L1219.2,921.0L1141.8,895.1L1107.0,743.5Z'/%3E%3Cpath d='M0.0,0.0L311.6,0.0L324.9,16.1L328.0,265.5L223.4,237.3L0.0,16.9L0.0,0.0Z'/%3E%3Cpath d='M620.6,1300.8L567.5,1400.0L447.8,1400.0L419.3,1274.6L564.2,1191.4L620.6,1300.8Z'/%3E%3Cpath d='M1920.0,0.0L1920.0,173.9L1667.5,249.6L1564.6,200.2L1496.7,37.2L1497.7,0.0L1920.0,0.0Z'/%3E%3Cpath d='M1261.2,1400.0L1352.9,1243.0L1524.9,1159.1L1580.6,1309.1L1477.9,1400.0L1261.2,1400.0Z'/%3E%3Cpath d='M673.7,1154.7L713.2,1216.7L620.6,1300.8L564.2,1191.4L590.3,1165.1L673.7,1154.7Z'/%3E%3Cpath d='M1738.2,672.5L1713.8,544.2L1720.1,513.7L1920.0,662.0L1920.0,759.0L1774.8,738.4L1738.2,672.5Z'/%3E%3Cpath d='M221.0,1282.9L199.9,1313.6L111.6,1288.5L183.6,1137.9L221.0,1282.9Z'/%3E%3Cpath d='M321.2,601.4L226.2,732.6L0.0,709.6L0.0,430.7L111.1,439.0L328.5,576.2L321.2,601.4Z'/%3E%3Cpath d='M558.8,862.6L474.8,914.7L337.9,931.0L226.2,732.6L321.2,601.4L558.8,862.6Z'/%3E%3Cpath d='M1167.9,1149.5L1355.0,1008.8L1352.9,1243.0L1261.2,1400.0L1115.3,1400.0L1089.1,1304.8L1167.9,1149.5Z'/%3E%3Cpath d='M1590.0,833.5L1774.8,738.4L1920.0,759.0L1920.0,926.5L1618.2,1013.8L1569.0,951.6L1590.0,833.5Z'/%3E%3Cpath d='M1358.4,479.0L1346.9,394.2L1447.6,345.9L1537.1,533.4L1512.9,600.0L1485.6,595.5L1375.6,531.7L1358.4,479.0Z'/%3E%3Cpath d='M1302.3,677.4L1375.6,531.7L1485.6,595.5L1306.5,681.3L1302.3,677.4Z'/%3E%3Cpath d='M0.0,1400.0L0.0,1199.2L75.6,1296.5L52.7,1400.0L0.0,1400.0Z'/%3E%3Cpath d='M1920.0,465.1L1729.7,438.3L1667.5,249.6L1920.0,173.9L1920.0,465.1Z'/%3E%3Cpath d='M496.6,1037.8L590.3,1165.1L564.2,1191.4L419.3,1274.6L417.6,1272.4L496.6,1037.8Z'/%3E%3Cpath d='M1596.2,644.4L1713.8,544.2L1738.2,672.5L1596.2,644.4Z'/%3E%3Cpath d='M1342.2,393.6L1293.8,374.4L1289.9,218.1L1321.8,117.0L1496.7,37.2L1564.6,200.2L1447.6,345.9L1346.9,394.2L1342.2,393.6Z'/%3E%3Cpath d='M967.6,1004.1L1141.8,895.1L1219.2,921.0L1167.9,1149.5L1089.1,1304.8L976.6,1113.1L967.6,1004.1Z'/%3E%3Cpath d='M1541.2,664.5L1596.2,644.4L1738.2,672.5L1774.8,738.4L1590.0,833.5L1535.1,731.8L1541.2,664.5Z'/%3E%3Cpath d='M1920.0,1231.9L1777.1,1209.1L1618.6,1017.7L1618.2,1013.8L1920.0,926.5L1920.0,1231.9Z'/%3E%3Cpath d='M419.3,1274.6L447.8,1400.0L205.4,1400.0L199.9,1313.6L221.0,1282.9L415.2,1270.8L417.6,1272.4L419.3,1274.6Z'/%3E%3Cpath d='M900.1,827.6L949.6,989.2L693.4,974.2L585.4,853.3L643.5,756.0L853.6,770.0L900.1,827.6Z'/%3E%3Cpath d='M496.6,1037.8L417.6,1272.4L415.2,1270.8L243.3,1033.7L337.9,931.0L474.8,914.7L496.6,1037.8Z'/%3E%3Cpath d='M1447.6,345.9L1564.6,200.2L1667.5,249.6L1729.7,438.3L1715.6,473.8L1537.1,533.4L1447.6,345.9Z'/%3E%3Cpath d='M1231.4,363.1L1174.2,271.0L1289.9,218.1L1293.8,374.4L1231.4,363.1Z'/%3E%3Cpath d='M1477.9,1400.0L1580.6,1309.1L1629.1,1299.5L1682.1,1300.7L1702.9,1400.0L1477.9,1400.0Z'/%3E%3Cpath d='M1039.5,139.8L990.4,0.0L1497.7,0.0L1496.7,37.2L1321.8,117.0L1080.7,155.6L1039.5,139.8Z'/%3E%3Cpath d='M1629.1,1299.5L1585.9,1076.1L1618.6,1017.7L1777.1,1209.1L1682.1,1300.7L1629.1,1299.5Z'/%3E%3Cpath d='M1167.9,1149.5L1219.2,921.0L1308.1,921.2L1364.4,962.9L1355.0,1008.8L1167.9,1149.5Z'/%3E%3Cpath d='M939.1,250.1L691.2,208.1L626.8,133.1L627.1,121.1L706.6,0.0L990.4,0.0L1039.5,139.8L986.1,231.3L939.1,250.1Z'/%3E%3Cpath d='M1202.7,644.1L1358.4,479.0L1375.6,531.7L1302.3,677.4L1202.7,644.1Z'/%3E%3Cpath d='M52.7,1400.0L75.6,1296.5L111.6,1288.5L199.9,1313.6L205.4,1400.0L52.7,1400.0Z'/%3E%3Cpath d='M183.6,1137.9L111.6,1288.5L75.6,1296.5L0.0,1199.2L0.0,1032.7L181.4,1052.9L183.6,1137.9Z'/%3E%3Cpath d='M998.4,294.8L986.1,231.3L1039.5,139.8L1080.7,155.6L1174.2,271.0L1231.4,363.1L1096.2,463.7L998.4,294.8Z'/%3E%3Cpath d='M912.8,536.3L888.8,506.7L998.4,294.8L1096.2,463.7L1058.6,584.8L985.9,583.6L912.8,536.3Z'/%3E%3Cpath d='M1524.9,1159.1L1585.9,1076.1L1629.1,1299.5L1580.6,1309.1L1524.9,1159.1Z'/%3E%3Cpath d='M1715.6,473.8L1729.7,438.3L1920.0,465.1L1920.0,662.0L1720.1,513.7L1715.6,473.8Z'/%3E%3Cpath d='M587.7,531.5L560.0,515.4L520.5,267.3L626.8,133.1L691.2,208.1L764.5,427.2L587.7,531.5Z'/%3E%3Cpath d='M398.7,524.8L328.5,576.2L111.1,439.0L321.3,318.5L398.7,524.8Z'/%3E%3Cpath d='M696.9,1075.3L880.7,1136.2L735.0,1229.7L713.2,1216.7L673.7,1154.7L696.9,1075.3Z'/%3E%3Cpath d='M321.3,318.5L111.1,439.0L0.0,430.7L0.0,417.7L223.4,237.3L328.0,265.5L334.9,277.2L321.3,318.5Z'/%3E%3Cpath d='M1058.6,584.8L1096.2,463.7L1231.4,363.1L1293.8,374.4L1342.2,393.6L1154.4,634.6L1115.5,636.6L1058.6,584.8Z'/%3E%3Cpath d='M949.6,989.2L967.6,1004.1L976.6,1113.1L880.7,1136.2L696.9,1075.3L693.4,974.2L949.6,989.2Z'/%3E%3Cpath d='M888.8,506.7L770.3,427.9L939.1,250.1L986.1,231.3L998.4,294.8L888.8,506.7Z'/%3E%3Cpath d='M520.5,267.3L560.0,515.4L398.7,524.8L321.3,318.5L334.9,277.2L520.5,267.3Z'/%3E%3Cpath d='M0.0,16.9L223.4,237.3L0.0,417.7L0.0,16.9Z'/%3E%3Cpath d='M1364.4,962.9L1569.0,951.6L1618.2,1013.8L1618.6,1017.7L1585.9,1076.1L1524.9,1159.1L1352.9,1243.0L1355.0,1008.8L1364.4,962.9Z'/%3E%3Cpath d='M643.5,756.0L585.4,853.3L558.8,862.6L321.2,601.4L328.5,576.2L398.7,524.8L560.0,515.4L587.7,531.5L641.9,727.3L643.5,756.0Z'/%3E%3Cpath d='M735.0,1229.7L826.9,1400.0L567.5,1400.0L620.6,1300.8L713.2,1216.7L735.0,1229.7Z'/%3E%3Cpath d='M900.1,827.6L1107.0,743.5L1141.8,895.1L967.6,1004.1L949.6,989.2L900.1,827.6Z'/%3E%3Cpath d='M243.3,1033.7L415.2,1270.8L221.0,1282.9L183.6,1137.9L181.4,1052.9L243.3,1033.7Z'/%3E%3C/g%3E%3C/svg%3E"),
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='900' height='900'><filter id='m'><feTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='3' stitchTiles='stitch' seed='3'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.22 0.22 0.22 0 0'/></filter><rect width='100%25' height='100%25' filter='url(%23m)'/></svg>");
  background-repeat: no-repeat, repeat, no-repeat, no-repeat, repeat;
  background-size: 100% 100%, 180px 180px, 100% 100%, 100% 100%, 900px 900px;
  background-position: center, 0 0, center, center, 0 0;
  background-attachment: fixed, fixed, fixed, fixed, fixed;
}

.tlcb-seam {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}
.tlcb-seam .seam {
  fill: none;
  stroke: url(#tlcb-seam-fade);
  stroke-width: 1.25;
  vector-effect: non-scaling-stroke;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: tlcb-seam-mine 2.8s cubic-bezier(0.65, 0.05, 0.35, 1) 0.2s forwards;
  filter: drop-shadow(0 0 2.5px rgba(185, 28, 28, 0.32));
}
@keyframes tlcb-seam-mine { to { stroke-dashoffset: 0; } }

.tlcb-diamonds {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.tlcb-diamonds svg {
  position: absolute;
  display: block;
  opacity: 0;
  animation: tlcb-diamond-mined 0.5s cubic-bezier(0.25, 0.8, 0.4, 1) forwards;
}
@keyframes tlcb-diamond-mined {
  from { opacity: 0; transform: translate(-50%, -50%) rotate(var(--rot)) scale(0.6); }
  to   { opacity: 1; transform: translate(-50%, -50%) rotate(var(--rot)) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .tlcb-seam .seam { animation: none; stroke-dashoffset: 0; }
  .tlcb-diamonds svg { animation: none; opacity: 1; transform: translate(-50%, -50%) rotate(var(--rot)); }
}
`;

type Diamond = {
  top: string;
  left: string;
  rot: number;
  size: number;
  delay: number;
  bright: boolean;
};

const DIAMONDS: Diamond[] = [
  { top: '93.83%', left: '10.41%', rot: -16, size: 13, delay: 0.20, bright: true },
  { top: '91.64%', left: '11.51%', rot: -8, size: 9, delay: 0.36, bright: false },
  { top: '91.04%', left: '21.84%', rot: 0, size: 11, delay: 0.82, bright: true },
  { top: '69.58%', left: '36.11%', rot: 8, size: 9, delay: 1.60, bright: false },
  { top: '70.66%', left: '49.46%', rot: 16, size: 11, delay: 1.76, bright: true },
  { top: '59.11%', left: '46.88%', rot: -9, size: 9, delay: 1.91, bright: false },
  { top: '53.11%', left: '57.65%', rot: -1, size: 11, delay: 2.07, bright: true },
  { top: '45.47%', left: '58.10%', rot: 7, size: 9, delay: 2.22, bright: false },
  { top: '45.33%', left: '60.13%', rot: 15, size: 11, delay: 2.38, bright: true },
  { top: '28.12%', left: '69.91%', rot: -10, size: 9, delay: 2.53, bright: false },
  { top: '14.30%', left: '81.49%', rot: -2, size: 13, delay: 3.00, bright: true },
];

const SEAM_POINTS =
  '10.41,93.83 11.51,91.64 21.62,90.77 21.75,90.89 21.84,91.04 29.39,85.10 30.75,83.22 35.09,82.48 36.30,76.81 36.11,69.58 49.46,70.66 46.88,59.11 57.65,53.11 58.10,45.47 60.13,45.33 69.91,28.12 70.15,28.16 75.39,24.71 81.49,14.30';

export default function ThroughlineCoalBackground() {
  return (
    <>
      <style>{CSS}</style>
      <div className="tlcb-root" aria-hidden="true">
        <svg
          className="tlcb-seam"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="tlcb-seam-fade"
              gradientUnits="userSpaceOnUse"
              x1="10.41"
              y1="93.83"
              x2="81.49"
              y2="14.30"
            >
              <stop offset="0%" stopColor={ACCENT} stopOpacity="0" />
              <stop offset="11%" stopColor={ACCENT} stopOpacity="1" />
              <stop offset="89%" stopColor={ACCENT} stopOpacity="1" />
              <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline className="seam" points={SEAM_POINTS} pathLength={1000} />
        </svg>

        <div className="tlcb-diamonds" aria-hidden="true">
          {DIAMONDS.map((d, i) => (
            <svg
              key={i}
              viewBox="0 0 14 14"
              width={d.size}
              height={d.size}
              fill="none"
              aria-hidden="true"
              style={
                {
                  top: d.top,
                  left: d.left,
                  animationDelay: `${d.delay}s`,
                  ['--rot' as string]: `${d.rot}deg`,
                } as React.CSSProperties
              }
            >
              <path
                d="M7 1.2 L12.8 7 L7 12.8 L1.2 7 Z"
                stroke={
                  d.bright ? 'rgba(236,232,228,0.14)' : 'rgba(236,232,228,0.08)'
                }
                strokeWidth="0.7"
              />
              <path
                d="M7 1.2 L12.8 7 L7 12.8 L1.2 7 Z"
                fill={
                  d.bright ? 'rgba(236,232,228,0.045)' : 'rgba(236,232,228,0.02)'
                }
              />
              <circle
                cx="7"
                cy="7"
                r={d.bright ? 1.15 : 0.95}
                fill={
                  d.bright ? 'rgba(236,232,228,0.28)' : 'rgba(236,232,228,0.17)'
                }
              />
            </svg>
          ))}
        </div>
      </div>
    </>
  );
}
