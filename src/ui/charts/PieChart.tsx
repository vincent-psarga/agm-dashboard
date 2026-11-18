import { DEFAULT_PIE_LAYOUT, layoutPie } from './pieLayout';
import type { ChartPalette } from './palette';

export interface PieChartSlice {
  name: string;
  value: number;
  color: string;
  /** e.g. "12,5 %" */
  percentLabel: string;
}

interface Props {
  slices: PieChartSlice[];
  palette: ChartPalette;
}

/**
 * Pie chart with the name and percentage of each slice written next to it. Drawn as plain
 * SVG (see `layoutPie`) so that the labels never overlap nor get cut. The viewBox lets it
 * scale to its column, labels included, on screen and on paper.
 */
export function PieChart({ slices, palette }: Props) {
  const { width, height, fontSize, lineHeight } = DEFAULT_PIE_LAYOUT;
  const layout = layoutPie(slices);

  return (
    <svg
      className="pie-chart"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-hidden="true"
    >
      {layout.map(({ path }, index) => (
        <path
          key={`slice-${index}`}
          d={path}
          fill={slices[index].color}
          stroke={palette.surface}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      ))}
      {layout.map(({ label }, index) => (
        <g key={`label-${index}`}>
          <polyline
            points={label.leader.map(({ x, y }) => `${x},${y}`).join(' ')}
            fill="none"
            stroke={palette.axis}
            strokeWidth={1}
          />
          <text
            x={label.anchor.x}
            y={label.anchor.y}
            textAnchor={label.textAnchor}
            fill={palette.text}
            fontSize={fontSize}
          >
            {label.nameLines.map((line, lineIndex) => (
              <tspan key={lineIndex} x={label.anchor.x} dy={lineIndex === 0 ? 0 : lineHeight}>
                {line}
              </tspan>
            ))}
            <tspan x={label.anchor.x} dy={lineHeight} fontWeight={600}>
              {slices[index].percentLabel}
            </tspan>
          </text>
        </g>
      ))}
    </svg>
  );
}
