export interface StationSegmentLocation {
  distance: number;
  location: number;
}

export interface LatLon {
  lat: number;
  lon: number;
}

interface Cartesian {
  x: number;
  y: number;
  z: number;
}

const EARTH_RADIUS = 6371;

export function distanceBetweenCoordsInKm(
  point1: LatLon,
  point2: LatLon
): number {
  const R = EARTH_RADIUS;
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lon - point1.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

export function nearestPointSegment(
  from: LatLon,
  to: LatLon,
  point: LatLon
): StationSegmentLocation {
  const POINT_EXISTS_ON_LINE_TOLERANCE_KM = 0.1;
  const a = from;
  const b = to;
  const c = point;
  const t = nearestPointGreatCircle(a, b, c);

  const atDistance = distanceBetweenCoordsInKm(a, t);
  const abDistance = distanceBetweenCoordsInKm(a, b);
  const btDistance = distanceBetweenCoordsInKm(b, t);

  if (
    Math.abs(abDistance - atDistance - btDistance) <
    POINT_EXISTS_ON_LINE_TOLERANCE_KM
  ) {
    // Point t is between a and b within 100 m accuracy
    return {
      location: atDistance / abDistance,
      distance: distanceBetweenCoordsInKm(c, t),
    };
  } else {
    const acDistance = distanceBetweenCoordsInKm(a, c);
    const bcDistance = distanceBetweenCoordsInKm(b, c);
    if (acDistance < bcDistance) {
      return {
        location: 0,
        distance: acDistance,
      };
    } else {
      return {
        location: 1,
        distance: bcDistance,
      };
    }
  }
}

function nearestPointGreatCircle(a: LatLon, b: LatLon, c: LatLon): LatLon {
  const aCartesian = toCartesian(a);
  const bCartesian = toCartesian(b);
  const cCartesian = toCartesian(c);

  const G = vectorProduct(aCartesian, bCartesian);
  const F = vectorProduct(cCartesian, G);
  const t = vectorProduct(G, F);
  normalize(t);
  multiplyByScalar(t, EARTH_RADIUS);
  return fromCartesian(t);
}

function toCartesian(point: LatLon): Cartesian {
  const lat = toRad(point.lat);
  const lon = toRad(point.lon);
  const R = EARTH_RADIUS;

  return {
    x: R * Math.cos(lat) * Math.cos(lon),
    y: R * Math.cos(lat) * Math.sin(lon),
    z: R * Math.sin(lat),
  };
}

function fromCartesian(vector: Cartesian): LatLon {
  return {
    lat: toDeg(Math.asin(vector.z / EARTH_RADIUS)),
    lon: toDeg(Math.atan2(vector.y, vector.x)),
  };
}

function vectorProduct(a: Cartesian, b: Cartesian): Cartesian {
  return {
    x: a.y * b.z - b.y * a.z,
    y: a.z * b.x - b.z * a.x,
    z: a.x * b.y - b.x * a.y,
  };
}

function normalize(vector: Cartesian): void {
  const length = Math.sqrt(
    vector.x * vector.x + vector.y * vector.y + vector.z * vector.z
  );

  vector.x = vector.x / length;
  vector.y = vector.y / length;
  vector.z = vector.z / length;
}

function multiplyByScalar(vector: Cartesian, scalar: number): void {
  vector.x = vector.x * scalar;
  vector.y = vector.y * scalar;
  vector.z = vector.z * scalar;
}
