import { max, min } from 'lodash';
import { DateTime } from 'luxon';

interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Abc {
  A: number;
  B: number;
  C: number;
}

export function getTimetableSegmentIntersection(
  segmentA1: DateTime,
  segmentA2: DateTime,
  segmentB1: DateTime,
  segmentB2: DateTime,
  isSameDirection: boolean
): DateTime | null {
  const a1 = segmentA1.toSeconds();
  const a2 = segmentA2.toSeconds();
  const b1 = segmentB1.toSeconds();
  const b2 = segmentB2.toSeconds();
  const minY = min([a1, a2, b1, b2]) as number;
  const maxY = max([a1, a2, b1, b2]) as number;
  const segment1: LineSegment = {
    x1: a1,
    x2: a2,
    y1: minY,
    y2: maxY,
  };
  const segment2: LineSegment = {
    x1: b1,
    x2: b2,
    y1: isSameDirection ? minY : maxY,
    y2: isSameDirection ? maxY : minY,
  };

  const abc1 = calculateAbc(segment1);
  const abc2 = calculateAbc(segment2);

  const det = abc1.A * abc2.B - abc2.A * abc1.B;
  if (det === 0) {
    return null;
  } else {
    const x = Math.round((abc2.B * abc1.C - abc1.B * abc2.C) / det);
    if (Math.max(segment1.x1, segment2.x1) <= x && Math.min(segment1.x2, segment2.x2) >= x) {
      return DateTime.fromSeconds(x);
    } else {
      return null;
    }
  }
}

function calculateAbc(line: LineSegment): Abc {
  const a = line.y2 - line.y1;
  const b = line.x1 - line.x2;
  return {
    A: a,
    B: b,
    C: a * line.x1 + b * line.y1,
  };
}
