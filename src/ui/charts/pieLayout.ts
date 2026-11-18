/**
 * Geometry of a pie chart with its labels, computed without any chart library so that the
 * labels never overlap and never go past the edges of the chart, whatever the data:
 * - labels are put in two columns, left and right of the pie, linked to their slice by a line;
 * - labels of the same side are pushed apart when their slices are too close;
 * - long names are wrapped on several lines.
 */

export interface PieLayoutOptions {
  width: number;
  height: number;
  radius: number;
  fontSize: number;
  lineHeight: number;
  /** Approximate width of a character, as a ratio of the font size. */
  charWidthRatio: number;
}

export const DEFAULT_PIE_LAYOUT: PieLayoutOptions = {
  width: 600,
  height: 360,
  radius: 90,
  fontSize: 16,
  lineHeight: 18,
  charWidthRatio: 0.58,
};

export interface PieSliceInput {
  name: string;
  value: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface PieSliceLayout {
  /** SVG path of the slice. */
  path: string;
  label: {
    /** The name, wrapped on several lines. */
    nameLines: string[];
    /** Where the text starts (right side) or ends (left side). */
    anchor: Point;
    textAnchor: 'start' | 'end';
    /** Center of the label block, and its height. */
    centerY: number;
    height: number;
    /** Line from the slice edge to the label. */
    leader: Point[];
  };
}

/** Space between the pie and the leader line elbow, and between the elbow and the text. */
const ELBOW_OFFSET = 12;
const TEXT_OFFSET = 30;
const LABEL_GAP = 6;
/** Room kept at the edges of the chart. */
const MARGIN = 4;

export function layoutPie(
  slices: PieSliceInput[],
  options: PieLayoutOptions = DEFAULT_PIE_LAYOUT,
): PieSliceLayout[] {
  const { width, height, radius, fontSize, lineHeight, charWidthRatio } = options;
  const center = { x: width / 2, y: height / 2 };
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const textWidth = width / 2 - radius - TEXT_OFFSET - MARGIN;
  const maxChars = Math.max(8, Math.floor(textWidth / (fontSize * charWidthRatio)));

  // Angles go clockwise from 12 o'clock.
  let start = 0;
  const geometry = slices.map((slice) => {
    const angle = (slice.value / total) * 2 * Math.PI;
    const middle = start + angle / 2;
    const result = { start, end: start + angle, middle };
    start += angle;
    return result;
  });

  const labels = slices.map((slice, index) => {
    const { middle } = geometry[index];
    const side: 'left' | 'right' = Math.sin(middle) >= 0 ? 'right' : 'left';
    const nameLines = wrap(slice.name, maxChars);
    // The name lines, then the percentage line.
    const labelHeight = (nameLines.length + 1) * lineHeight;
    const elbow = pointAt(center, radius + ELBOW_OFFSET, middle);
    return { index, side, nameLines, height: labelHeight, wantedY: elbow.y, y: elbow.y };
  });

  for (const side of ['left', 'right'] as const) {
    spreadVertically(
      labels.filter((label) => label.side === side),
      height,
    );
  }

  return slices.map((_, index) => {
    const { start: sliceStart, end, middle } = geometry[index];
    const label = labels[index];
    const direction = label.side === 'right' ? 1 : -1;
    const textX = center.x + direction * (radius + TEXT_OFFSET);
    const edge = pointAt(center, radius, middle);
    const elbow = pointAt(center, radius + ELBOW_OFFSET, middle);

    return {
      path: slicePath(center, radius, sliceStart, end),
      label: {
        nameLines: label.nameLines,
        anchor: { x: textX, y: label.y - label.height / 2 + lineHeight * 0.8 },
        textAnchor: label.side === 'right' ? 'start' : 'end',
        centerY: label.y,
        height: label.height,
        leader: [edge, elbow, { x: textX - direction * 4, y: label.y }],
      },
    };
  });
}

/**
 * Moves the labels of one side so that they do not overlap, staying as close as possible to
 * their slice and inside the chart.
 */
function spreadVertically(
  labels: { wantedY: number; y: number; height: number }[],
  chartHeight: number,
): void {
  labels.sort((a, b) => a.wantedY - b.wantedY);

  // Top to bottom: push each label below the previous one.
  let previousBottom = MARGIN;
  for (const label of labels) {
    label.y = Math.max(label.wantedY, previousBottom + label.height / 2);
    previousBottom = label.y + label.height / 2 + LABEL_GAP;
  }

  // Bottom to top: bring back the labels pushed past the bottom of the chart.
  let nextTop = chartHeight - MARGIN;
  for (const label of [...labels].reverse()) {
    label.y = Math.min(label.y, nextTop - label.height / 2);
    nextTop = label.y - label.height / 2 - LABEL_GAP;
  }
}

/** Splits a name in lines of at most `maxChars` characters, cutting between words. */
export function wrap(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [''];
}

function pointAt(center: Point, distance: number, angle: number): Point {
  return { x: center.x + distance * Math.sin(angle), y: center.y - distance * Math.cos(angle) };
}

function slicePath(center: Point, radius: number, start: number, end: number): string {
  // A single slice is a full circle, which an arc cannot draw.
  if (end - start >= 2 * Math.PI - 1e-9) {
    const top = pointAt(center, radius, 0);
    const bottom = pointAt(center, radius, Math.PI);
    return `M ${top.x} ${top.y} A ${radius} ${radius} 0 1 1 ${bottom.x} ${bottom.y} A ${radius} ${radius} 0 1 1 ${top.x} ${top.y} Z`;
  }
  const from = pointAt(center, radius, start);
  const to = pointAt(center, radius, end);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return `M ${center.x} ${center.y} L ${from.x} ${from.y} A ${radius} ${radius} 0 ${largeArc} 1 ${to.x} ${to.y} Z`;
}
