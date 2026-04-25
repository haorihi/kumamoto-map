import type { LatLng, RoadFeature } from '../data/kumamoto'

export type RouteFeatureHit = {
  type: 'road' | 'bridge'
  label: string
  source: 'osrm-step' | 'known-feature'
  order: number
  featureId?: string
}

export type DynamicRouteCandidate = {
  id: string
  routeGeometry: LatLng[]
  minutes: number
  distanceMeters: number
  roadNames: string[]
  bridgeFeatureIds: string[]
  quizFeatureSequence: RouteFeatureHit[]
  summaryLabel: string
}

export type RouteSession = {
  origin: LatLng
  destination: LatLng
  candidates: DynamicRouteCandidate[]
  selectedRouteId: string
  recallPrompt: string
}

type OsrmStep = {
  name?: string
  geometry?: {
    coordinates?: [number, number][]
  }
}

type RouteBounds = {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

type OsrmRoute = {
  distance: number
  duration: number
  geometry?: {
    coordinates?: [number, number][]
  }
  legs?: Array<{
    steps?: OsrmStep[]
  }>
}

type OsrmPayload = {
  code: string
  routes?: OsrmRoute[]
  message?: string
}

const KUMAMOTO_BOUNDS = {
  minLat: 32.65,
  maxLat: 32.95,
  minLng: 130.55,
  maxLng: 130.95,
}

const BRIDGE_MATCH_THRESHOLD_METERS = 45
const MAX_QUIZ_ROAD_NAMES = 18

export function isWithinKumamotoTrainingArea(point: LatLng) {
  return (
    point.lat >= KUMAMOTO_BOUNDS.minLat &&
    point.lat <= KUMAMOTO_BOUNDS.maxLat &&
    point.lng >= KUMAMOTO_BOUNDS.minLng &&
    point.lng <= KUMAMOTO_BOUNDS.maxLng
  )
}

export function formatPoint(point: LatLng) {
  return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
}

export async function fetchRouteSession(
  origin: LatLng,
  destination: LatLng,
  features: RoadFeature[],
  signal?: AbortSignal,
): Promise<RouteSession> {
  if (!isWithinKumamotoTrainingArea(origin) || !isWithinKumamotoTrainingArea(destination)) {
    throw new Error('熊本都市圏・近郊の範囲内で出発地と到着地を指定してください。')
  }

  const coordinateString = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
  const params = new URLSearchParams({
    alternatives: '3',
    steps: 'true',
    geometries: 'geojson',
    overview: 'full',
  })
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinateString}?${params}`, { signal })

  if (!response.ok) {
    throw new Error(`OSRMへの接続に失敗しました。HTTP ${response.status}`)
  }

  const payload = (await response.json()) as OsrmPayload
  if (payload.code !== 'Ok' || !payload.routes?.length) {
    throw new Error(payload.message || '指定地点間のルートが見つかりませんでした。')
  }

  const candidates = payload.routes.slice(0, 3).map((route, index) =>
    normalizeRouteCandidate(route, index, features),
  )

  if (!candidates.length) {
    throw new Error('学習に使えるルート候補がありませんでした。')
  }

  return {
    origin,
    destination,
    candidates,
    selectedRouteId: candidates[0].id,
    recallPrompt: '選んだルートで通る道路名・橋名を順番に選んでください。',
  }
}

function normalizeRouteCandidate(route: OsrmRoute, index: number, features: RoadFeature[]): DynamicRouteCandidate {
  const routeGeometry = coordinatesToLatLng(route.geometry?.coordinates ?? [])
  const steps = route.legs?.flatMap((leg) => leg.steps ?? []) ?? []
  const roadHits = normalizeRoadHits(steps, routeGeometry)
  const roadNames = roadHits.map((hit) => hit.label)
  const bridgeHits = findBridgeHits(routeGeometry, features)
  const quizFeatureSequence = buildQuizSequence(roadHits, bridgeHits)
  const minutes = Math.max(1, Math.round(route.duration / 60))
  const distanceKm = route.distance / 1000

  return {
    id: `dynamic-route-${index + 1}`,
    routeGeometry,
    minutes,
    distanceMeters: Math.round(route.distance),
    roadNames,
    bridgeFeatureIds: bridgeHits.map((hit) => hit.featureId).filter((id): id is string => Boolean(id)),
    quizFeatureSequence,
    summaryLabel: `${Math.round(distanceKm * 10) / 10}km / 約${minutes}分`,
  }
}

function normalizeRoadHits(steps: OsrmStep[], routeGeometry: LatLng[]) {
  const allHits: RouteFeatureHit[] = []

  steps.forEach((step, stepIndex) => {
    const labels = (step.name ?? '')
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length >= 2 && !/^unnamed/i.test(part))

    const order = resolveStepOrder(step, stepIndex, steps.length, routeGeometry)
    for (const label of labels) {
      if (allHits[allHits.length - 1]?.label !== label) {
        allHits.push({
          type: 'road',
          label,
          source: 'osrm-step',
          order,
        })
      }
    }
  })

  return pickRepresentativeRouteHits(allHits, MAX_QUIZ_ROAD_NAMES)
}

function buildQuizSequence(roadHits: RouteFeatureHit[], bridgeHits: RouteFeatureHit[]) {
  const merged = [...roadHits, ...bridgeHits]
    .sort((a, b) => a.order - b.order)
    .filter((hit, index, hits) => index === 0 || hits[index - 1].label !== hit.label)

  return merged.length ? merged : roadHits
}

function findBridgeHits(routeGeometry: LatLng[], features: RoadFeature[]): RouteFeatureHit[] {
  const routeBounds = expandBounds(toBounds(routeGeometry), metersToCoordinateDegrees(BRIDGE_MATCH_THRESHOLD_METERS))

  return features
    .filter((feature) => feature.category === 'bridge')
    .filter((feature) => boundsOverlap(routeBounds, toBounds(feature.path)))
    .map((feature) => {
      const match = nearestRouteMatch(routeGeometry, feature.path)
      return {
        feature,
        distance: match.distance,
        order: match.index * 10 + 5,
      }
    })
    .filter((match) => match.distance <= BRIDGE_MATCH_THRESHOLD_METERS)
    .sort((a, b) => a.order - b.order)
    .map((match) => ({
      type: 'bridge',
      label: match.feature.name,
      source: 'known-feature',
      order: match.order,
      featureId: match.feature.id,
    }))
}

function nearestRouteMatch(routeGeometry: LatLng[], featurePath: LatLng[]) {
  let bestDistance = Number.POSITIVE_INFINITY
  let bestIndex = 0
  const featureBounds = expandBounds(toBounds(featurePath), metersToCoordinateDegrees(BRIDGE_MATCH_THRESHOLD_METERS))
  const candidateRoutePoints = routeGeometry
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => isInsideBounds(point, featureBounds))
  const routePoints = candidateRoutePoints.length
    ? candidateRoutePoints
    : routeGeometry.map((point, index) => ({ point, index }))

  routePoints.forEach(({ point: routePoint, index }) => {
    for (const featurePoint of featurePath) {
      const distance = distanceMeters(routePoint, featurePoint)
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    }
  })

  return { distance: bestDistance, index: bestIndex }
}

function resolveStepOrder(step: OsrmStep, stepIndex: number, stepCount: number, routeGeometry: LatLng[]) {
  const stepGeometry = coordinatesToLatLng(step.geometry?.coordinates ?? [])
  const firstStepPoint = stepGeometry[0]
  if (firstStepPoint && routeGeometry.length) {
    return nearestRouteMatch(routeGeometry, [firstStepPoint]).index * 10
  }

  const fallbackIndex = stepCount <= 1
    ? 0
    : Math.round((stepIndex / (stepCount - 1)) * Math.max(0, routeGeometry.length - 1))
  return fallbackIndex * 10
}

function pickRepresentativeRouteHits(hits: RouteFeatureHit[], maxCount: number) {
  if (hits.length <= maxCount) {
    return hits
  }

  const selectedIndexes = new Set<number>()
  for (let slot = 0; slot < maxCount; slot += 1) {
    selectedIndexes.add(Math.round((slot * (hits.length - 1)) / (maxCount - 1)))
  }

  return hits.filter((_, index) => selectedIndexes.has(index))
}

function toBounds(points: LatLng[]): RouteBounds {
  return points.reduce<RouteBounds>((bounds, point) => ({
    minLat: Math.min(bounds.minLat, point.lat),
    maxLat: Math.max(bounds.maxLat, point.lat),
    minLng: Math.min(bounds.minLng, point.lng),
    maxLng: Math.max(bounds.maxLng, point.lng),
  }), {
    minLat: Number.POSITIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY,
    minLng: Number.POSITIVE_INFINITY,
    maxLng: Number.NEGATIVE_INFINITY,
  })
}

function expandBounds(bounds: RouteBounds, coordinateDegrees: number): RouteBounds {
  return {
    minLat: bounds.minLat - coordinateDegrees,
    maxLat: bounds.maxLat + coordinateDegrees,
    minLng: bounds.minLng - coordinateDegrees,
    maxLng: bounds.maxLng + coordinateDegrees,
  }
}

function boundsOverlap(a: RouteBounds, b: RouteBounds) {
  return a.minLat <= b.maxLat && a.maxLat >= b.minLat && a.minLng <= b.maxLng && a.maxLng >= b.minLng
}

function isInsideBounds(point: LatLng, bounds: RouteBounds) {
  return point.lat >= bounds.minLat && point.lat <= bounds.maxLat && point.lng >= bounds.minLng && point.lng <= bounds.maxLng
}

function metersToCoordinateDegrees(meters: number) {
  return meters / 90_000
}

function coordinatesToLatLng(coordinates: [number, number][]): LatLng[] {
  return coordinates.map(([lng, lat]) => ({
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  }))
}

function distanceMeters(a: LatLng, b: LatLng) {
  const earthRadius = 6371000
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const deltaLat = toRadians(b.lat - a.lat)
  const deltaLng = toRadians(b.lng - a.lng)
  const sinLat = Math.sin(deltaLat / 2)
  const sinLng = Math.sin(deltaLng / 2)
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function toRadians(value: number) {
  return value * Math.PI / 180
}
