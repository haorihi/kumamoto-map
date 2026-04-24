import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { KeyRound, MapPinned } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMap as useLeafletMap, useMapEvents } from 'react-leaflet'
import { center, type LatLng, type RoadFeature } from '../data/kumamoto'
import type { DynamicRouteCandidate, RouteFeatureHit } from '../lib/routing'

type LessonState = 'selecting' | 'recalling' | 'reviewing'
type RouteRequestState = 'idle' | 'loading' | 'ready' | 'error'

type CompletedDynamicLesson = {
  id: string
  origin: LatLng
  destination: LatLng
  selectedRoute: DynamicRouteCandidate
  quizFeatureSequence: RouteFeatureHit[]
  recalledLabels: string[]
  missedLabels: string[]
  completedAtLabel: string
}

type Props = {
  features: RoadFeature[]
  origin: LatLng | null
  destination: LatLng | null
  candidates: DynamicRouteCandidate[]
  selectedRoute: DynamicRouteCandidate | undefined
  lessonState: LessonState
  routeRequestState: RouteRequestState
  completedLessons: CompletedDynamicLesson[]
  onMapClick: (point: LatLng) => void
}

const emptyCompletedLessons: CompletedDynamicLesson[] = []
const redPinHtml = `
  <div style="
    width:48px;
    height:64px;
    background:#dc2626;
    border:4px solid #ffffff;
    clip-path:polygon(50% 100%, 20% 62%, 6% 38%, 8% 16%, 25% 2%, 50% 0, 75% 2%, 92% 16%, 94% 38%, 80% 62%);
    box-shadow:0 10px 18px rgba(0,0,0,.42);
    position:relative;
  ">
    <div style="
      position:absolute;
      left:50%;
      top:50%;
      width:18px;
      height:18px;
      border-radius:50%;
      background:#ffffff;
      border:3px solid #111111;
      transform:translate(-50%,-50%);
    "></div>
  </div>
`

function latLngBounds(points: LatLng[]) {
  return L.latLngBounds(points.map((point) => [point.lat, point.lng]))
}

function routePositions(route: DynamicRouteCandidate) {
  return route.routeGeometry.map((point) => [point.lat, point.lng] as [number, number])
}

function getFeatureLabelPoint(feature: RoadFeature) {
  return feature.labelPoint ?? feature.path[Math.floor(feature.path.length / 2)]
}

function bridgeHits(route: DynamicRouteCandidate | undefined) {
  return route?.quizFeatureSequence.filter((hit) => hit.type === 'bridge' && hit.featureId) ?? []
}

function offsetPoint(point: LatLng, northMeters: number, eastMeters: number): LatLng {
  const latOffset = northMeters / 111320
  const lngOffset = eastMeters / (111320 * Math.cos(point.lat * Math.PI / 180))
  return { lat: point.lat + latOffset, lng: point.lng + lngOffset }
}

function pinPolygon(point: LatLng): [number, number][] {
  return [
    [point.lat, point.lng],
    [offsetPoint(point, 85, -42).lat, offsetPoint(point, 85, -42).lng],
    [offsetPoint(point, 145, -36).lat, offsetPoint(point, 145, -36).lng],
    [offsetPoint(point, 178, 0).lat, offsetPoint(point, 178, 0).lng],
    [offsetPoint(point, 145, 36).lat, offsetPoint(point, 145, 36).lng],
    [offsetPoint(point, 85, 42).lat, offsetPoint(point, 85, 42).lng],
  ]
}

function ClickHandler({ onMapClick }: { onMapClick: (point: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onMapClick({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })

  return null
}

function LeafletFocus({
  origin,
  destination,
  selectedRoute,
}: {
  origin: LatLng | null
  destination: LatLng | null
  selectedRoute: DynamicRouteCandidate | undefined
}) {
  const map = useLeafletMap()

  useEffect(() => {
    const allPoints = [
      ...(origin ? [origin] : []),
      ...(destination ? [destination] : []),
      ...(selectedRoute?.routeGeometry ?? []),
    ]
    if (!allPoints.length) return

    const bounds = latLngBounds(allPoints)
    const focusMap = () => {
      map.invalidateSize()
      if (allPoints.length === 1) {
        map.setView([allPoints[0].lat, allPoints[0].lng], 15, { animate: true })
        return
      }
      map.fitBounds(bounds, { padding: [96, 96], maxZoom: 15, animate: true })
    }

    focusMap()
    const timer = window.setTimeout(focusMap, 120)

    return () => window.clearTimeout(timer)
  }, [destination, map, origin, selectedRoute])

  return null
}

function GoogleClickBridge({ onMapClick }: { onMapClick: (point: LatLng) => void }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return undefined
    const listener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      const latLng = event.latLng
      if (!latLng) return
      onMapClick({ lat: latLng.lat(), lng: latLng.lng() })
    })

    return () => listener.remove()
  }, [map, onMapClick])

  return null
}

function GoogleMapOverlays({
  features,
  selectedRoute,
  candidates,
  origin,
  destination,
  lessonState,
  completedLessons,
  onMapClick,
}: Props) {
  const map = useMap()
  const completedLessonHistory = completedLessons ?? emptyCompletedLessons
  const reviewLesson = lessonState === 'reviewing' ? completedLessonHistory[0] : undefined

  useEffect(() => {
    if (!map || !window.google) return undefined

    const historyPolylines = completedLessonHistory.map((lesson, index) => new google.maps.Polyline({
      path: lesson.selectedRoute.routeGeometry,
      map,
      geodesic: true,
      strokeColor: '#000000',
      strokeOpacity: Math.max(0.1, 0.24 - index * 0.03),
      strokeWeight: 2,
      zIndex: 6,
    }))

    const candidatePolylines = candidates.map((route) => {
      const active = route.id === selectedRoute?.id
      return new google.maps.Polyline({
        path: route.routeGeometry,
        map,
        geodesic: true,
        strokeColor: '#000000',
        strokeOpacity: active ? 0.9 : 0.24,
        strokeWeight: active ? 8 : 3,
        zIndex: active ? 30 : 12,
      })
    })

    const missedLabels = new Set(reviewLesson?.missedLabels ?? [])
    const reviewPolylines = reviewLesson
      ? bridgeHits(selectedRoute)
        .map((hit) => {
          const feature = features.find((item) => item.id === hit.featureId)
          if (!feature) return undefined
          const missed = missedLabels.has(hit.label)
          return new google.maps.Polyline({
            path: feature.path,
            map,
            geodesic: true,
            strokeColor: missed ? '#b91c1c' : '#000000',
            strokeOpacity: missed ? 0.92 : 0.78,
            strokeWeight: missed ? 8 : 6,
            zIndex: missed ? 46 : 44,
          })
        })
        .filter(Boolean) as google.maps.Polyline[]
      : []

    const markers = [
      origin ? new google.maps.Marker({ position: origin, map, label: '発', title: '出発' }) : undefined,
      destination ? new google.maps.Marker({ position: destination, map, label: '着', title: '到着' }) : undefined,
    ].filter(Boolean) as google.maps.Marker[]

    const bounds = new google.maps.LatLngBounds()
    const focusPoints = [
      ...(origin ? [origin] : []),
      ...(destination ? [destination] : []),
      ...(selectedRoute?.routeGeometry ?? []),
    ]
    focusPoints.forEach((point) => bounds.extend(point))
    if (focusPoints.length > 1) map.fitBounds(bounds, 80)
    if (focusPoints.length === 1) map.setCenter(focusPoints[0])

    return () => {
      historyPolylines.forEach((polyline) => polyline.setMap(null))
      candidatePolylines.forEach((polyline) => polyline.setMap(null))
      reviewPolylines.forEach((polyline) => polyline.setMap(null))
      markers.forEach((marker) => marker.setMap(null))
    }
  }, [candidates, completedLessonHistory, destination, features, map, origin, reviewLesson, selectedRoute])

  return <GoogleClickBridge onMapClick={onMapClick} />
}

function OpenStreetMapPanel(props: Omit<Props, 'routeRequestState'>) {
  const { features, selectedRoute, candidates, origin, destination, lessonState, completedLessons, onMapClick } = props
  const completedLessonHistory = completedLessons ?? emptyCompletedLessons
  const reviewLesson = lessonState === 'reviewing' ? completedLessonHistory[0] : undefined
  const missedLabels = new Set(reviewLesson?.missedLabels ?? [])
  const showRouteLabels = lessonState !== 'recalling'

  const originIcon = useMemo(
    () =>
      L.divIcon({
        className: 'map-red-pin-wrapper map-red-pin-origin',
        html: redPinHtml,
        iconSize: [72, 82],
        iconAnchor: [27, 66],
        tooltipAnchor: [0, -72],
      }),
    [],
  )

  const destinationIcon = useMemo(
    () =>
      L.divIcon({
        className: 'map-red-pin-wrapper map-red-pin-destination',
        html: redPinHtml,
        iconSize: [72, 82],
        iconAnchor: [27, 66],
        tooltipAnchor: [0, -72],
      }),
    [],
  )

  return (
    <MapContainer
      className="leaflet-map"
      center={[center.lat, center.lng]}
      zoom={13}
      minZoom={11}
      maxZoom={19}
      scrollWheelZoom
      zoomControl
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <ClickHandler onMapClick={onMapClick} />

      {completedLessonHistory.map((lesson, index) => (
        <Polyline
          key={`${lesson.id}-history`}
          positions={routePositions(lesson.selectedRoute)}
          pathOptions={{
            color: '#000000',
            opacity: Math.max(0.1, 0.24 - index * 0.03),
            weight: 2,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          className="learning-segment-history"
        />
      ))}

      {candidates.map((route) => {
        const active = route.id === selectedRoute?.id
        return (
          <Polyline
            key={route.id}
            positions={routePositions(route)}
            pathOptions={{
              color: '#000000',
              opacity: active ? 0.9 : 0.24,
              weight: active ? 8 : 3,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            className={active ? 'learning-segment-active' : 'learning-segment-muted'}
          />
        )
      })}

      {reviewLesson && bridgeHits(selectedRoute).map((hit) => {
        const feature = features.find((item) => item.id === hit.featureId)
        if (!feature) return null
        const missed = missedLabels.has(hit.label)
        return (
          <Polyline
            key={`review-${feature.id}-${missed ? 'missed' : 'ok'}`}
            positions={feature.path.map((point) => [point.lat, point.lng])}
            pathOptions={{
              color: missed ? '#b91c1c' : '#000000',
              opacity: missed ? 0.92 : 0.78,
              weight: missed ? 8 : 6,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            className={missed ? 'review-feature-missed' : 'review-feature-ok'}
          />
        )
      })}

      {origin && (
        <>
          <Polygon
            positions={pinPolygon(origin)}
            pathOptions={{ color: '#ffffff', fillColor: '#dc2626', fillOpacity: 1, opacity: 1, weight: 4 }}
          />
          <CircleMarker
            center={[offsetPoint(origin, 120, 0).lat, offsetPoint(origin, 120, 0).lng]}
            radius={7}
            pathOptions={{ color: '#111111', fillColor: '#ffffff', fillOpacity: 1, weight: 2 }}
          />
        </>
      )}
      {destination && (
        <>
          <Polygon
            positions={pinPolygon(destination)}
            pathOptions={{ color: '#ffffff', fillColor: '#dc2626', fillOpacity: 1, opacity: 1, weight: 4 }}
          />
          <CircleMarker
            center={[offsetPoint(destination, 120, 0).lat, offsetPoint(destination, 120, 0).lng]}
            radius={7}
            pathOptions={{ color: '#111111', fillColor: '#ffffff', fillOpacity: 1, weight: 2 }}
          />
        </>
      )}

      {showRouteLabels && selectedRoute && (
        <Marker
          position={[selectedRoute.routeGeometry[0]?.lat ?? origin?.lat ?? center.lat, selectedRoute.routeGeometry[0]?.lng ?? origin?.lng ?? center.lng]}
          icon={L.divIcon({
            className: 'route-name-pin',
            html: `<span>${selectedRoute.summaryLabel}</span>`,
            iconSize: [180, 32],
            iconAnchor: [90, 16],
          })}
        />
      )}

      {showRouteLabels && bridgeHits(selectedRoute).map((hit) => {
        const feature = features.find((item) => item.id === hit.featureId)
        if (!feature) return null
        const labelPoint = getFeatureLabelPoint(feature)
        return (
          <Marker
            key={feature.id}
            position={[labelPoint.lat, labelPoint.lng]}
            icon={L.divIcon({
              className: 'feature-label-pin',
              html: `<span>${feature.name}</span>`,
              iconSize: [120, 28],
              iconAnchor: [60, 14],
            })}
          />
        )
      })}

      {origin && (
        <Marker position={[origin.lat, origin.lng]} icon={originIcon} zIndexOffset={5000}>
          <Tooltip direction="top" offset={[0, -72]} opacity={0.98} className="point-tooltip">
            出発
          </Tooltip>
        </Marker>
      )}
      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} zIndexOffset={5010}>
          <Tooltip direction="top" offset={[0, -72]} opacity={0.98} className="point-tooltip">
            到着
          </Tooltip>
        </Marker>
      )}
      <LeafletFocus origin={origin} destination={destination} selectedRoute={selectedRoute} />
    </MapContainer>
  )
}

export function GoogleMapPanel(props: Props) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  return (
    <section className="map-surface" aria-label="熊本市内の道覚えマップ">
      <div className="map-status">
        <span><KeyRound size={15} /> {apiKey ? 'Google Maps API 接続' : 'OpenStreetMap 表示'}</span>
        {!apiKey && <span><MapPinned size={15} /> 地図クリックで地点指定</span>}
      </div>
      {apiKey ? (
        <APIProvider apiKey={apiKey} language="ja" region="JP">
          <Map
            defaultCenter={center}
            defaultZoom={13}
            mapId="kumamoto-taxi-trainer"
            gestureHandling="greedy"
            disableDefaultUI
            zoomControl
            fullscreenControl
          >
            <GoogleMapOverlays {...props} />
          </Map>
        </APIProvider>
      ) : (
        <OpenStreetMapPanel
          features={props.features}
          origin={props.origin}
          destination={props.destination}
          candidates={props.candidates}
          selectedRoute={props.selectedRoute}
          lessonState={props.lessonState}
          completedLessons={props.completedLessons}
          onMapClick={props.onMapClick}
        />
      )}
      <div className={props.routeRequestState === 'loading' ? 'map-wipe active' : 'map-wipe'} aria-hidden="true">
        <span>ROUTING</span>
      </div>
    </section>
  )
}
