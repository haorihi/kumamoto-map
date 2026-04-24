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
  const roadNames = normalizeRoadNames(steps.map((step) => step.name))
  const bridgeHits = findBridgeHits(routeGeometry, features)
  const quizFeatureSequence = buildQuizSequence(roadNames, bridgeHits)
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

function normalizeRoadNames(names: Array<string | undefined>) {
  const normalized: string[] = []
  for (const name of names) {
    const candidates = (name ?? '')
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length >= 2 && !/^unnamed/i.test(part))

    for (const candidate of candidates) {
      if (normalized[normalized.length - 1] !== candidate) {
        normalized.push(candidate)
      }
    }
  }

  return normalized.slice(0, 18)
}

function buildQuizSequence(roadNames: string[], bridgeHits: RouteFeatureHit[]) {
  const roadHits: RouteFeatureHit[] = roadNames.map((label, index) => ({
    type: 'road',
    label,
    source: 'osrm-step',
    order: index * 10,
  }))

  const merged = [...roadHits, ...bridgeHits]
    .sort((a, b) => a.order - b.order)
    .filter((hit, index, hits) => index === 0 || hits[index - 1].label !== hit.label)

  return merged.length ? merged : roadHits
}

function findBridgeHits(routeGeometry: LatLng[], features: RoadFeature[]): RouteFeatureHit[] {
  return features
    .filter((feature) => feature.category === 'bridge')
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

  routeGeometry.forEach((routePoint, index) => {
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
