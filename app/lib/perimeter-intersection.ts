export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Compute the intersection of a line from `lineStart` toward `lineEnd`
 * with the boundary of a rectangle.
 * Returns the first intersection point in the direction of travel.
 */
export function intersectRectangle(
  lineStart: Point,
  lineEnd: Point,
  rect: Rect
): Point {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const hw = rect.width / 2;
  const hh = rect.height / 2;

  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  let tMin = Infinity;

  if (Math.abs(dx) > 1e-9) {
    const tLeft = (cx - hw - lineStart.x) / dx;
    if (tLeft > 1e-9) {
      const y = lineStart.y + tLeft * dy;
      if (y >= cy - hh - 1e-9 && y <= cy + hh + 1e-9) {
        tMin = Math.min(tMin, tLeft);
      }
    }
    const tRight = (cx + hw - lineStart.x) / dx;
    if (tRight > 1e-9) {
      const y = lineStart.y + tRight * dy;
      if (y >= cy - hh - 1e-9 && y <= cy + hh + 1e-9) {
        tMin = Math.min(tMin, tRight);
      }
    }
  }

  if (Math.abs(dy) > 1e-9) {
    const tTop = (cy - hh - lineStart.y) / dy;
    if (tTop > 1e-9) {
      const x = lineStart.x + tTop * dx;
      if (x >= cx - hw - 1e-9 && x <= cx + hw + 1e-9) {
        tMin = Math.min(tMin, tTop);
      }
    }
    const tBottom = (cy + hh - lineStart.y) / dy;
    if (tBottom > 1e-9) {
      const x = lineStart.x + tBottom * dx;
      if (x >= cx - hw - 1e-9 && x <= cx + hw + 1e-9) {
        tMin = Math.min(tMin, tBottom);
      }
    }
  }

  if (tMin === Infinity) {
    return lineStart;
  }

  return {
    x: lineStart.x + tMin * dx,
    y: lineStart.y + tMin * dy,
  };
}

/**
 * Compute the intersection of a line from `lineStart` toward `lineEnd`
 * with the boundary of an ellipse centered at `center`.
 */
export function intersectOval(
  lineStart: Point,
  lineEnd: Point,
  center: Point,
  radiusX: number,
  radiusY: number
): Point {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  const sx = (lineStart.x - center.x) / radiusX;
  const sy = (lineStart.y - center.y) / radiusY;
  const dx_ = dx / radiusX;
  const dy_ = dy / radiusY;

  const a = dx_ * dx_ + dy_ * dy_;
  const b = 2 * (sx * dx_ + sy * dy_);
  const c = sx * sx + sy * sy - 1;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0 || a < 1e-9) {
    return lineStart;
  }

  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);

  let t = Infinity;
  if (t1 > 1e-9) t = t1;
  if (t2 > 1e-9 && t2 < t) t = t2;

  if (t === Infinity) {
    return lineStart;
  }

  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };
}

/**
 * Compute the intersection of a line from `lineStart` toward `lineEnd`
 * with the boundary of a diamond (axis-aligned rhombus) centered at `center`.
 */
export function intersectDiamond(
  lineStart: Point,
  lineEnd: Point,
  center: Point,
  halfWidth: number,
  halfHeight: number
): Point {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  const edges = [
    {
      a: 1 / halfWidth,
      b: -1 / halfHeight,
      c: 1,
      check: (u: number, v: number) => u >= -1e-9 && v <= 1e-9,
    },
    {
      a: 1 / halfWidth,
      b: 1 / halfHeight,
      c: 1,
      check: (u: number, v: number) => u >= -1e-9 && v >= -1e-9,
    },
    {
      a: -1 / halfWidth,
      b: 1 / halfHeight,
      c: 1,
      check: (u: number, v: number) => u <= 1e-9 && v >= -1e-9,
    },
    {
      a: -1 / halfWidth,
      b: -1 / halfHeight,
      c: 1,
      check: (u: number, v: number) => u <= 1e-9 && v <= 1e-9,
    },
  ] as const;

  let tMin = Infinity;

  for (const edge of edges) {
    const denom = edge.a * dx + edge.b * dy;
    if (Math.abs(denom) < 1e-9) continue;

    const t =
      (edge.c -
        edge.a * (lineStart.x - center.x) -
        edge.b * (lineStart.y - center.y)) /
      denom;
    if (t <= 1e-9) continue;

    const u = lineStart.x + t * dx - center.x;
    const v = lineStart.y + t * dy - center.y;

    if (edge.check(u, v) && t < tMin) {
      tMin = t;
    }
  }

  if (tMin === Infinity) {
    return lineStart;
  }

  return {
    x: lineStart.x + tMin * dx,
    y: lineStart.y + tMin * dy,
  };
}
