import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { KeyRound, MapPinned } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap as useLeafletMap } from 'react-leaflet'
import {
  center,
  type CompletedLesson,
  type LatLng,
  type PickupPoint,
  type RoadFeature,
  type RouteCandidate,
  type TimeBand,
} from '../data/kumamoto'

type LessonState = 'selecting' | 'recalling' | 'reviewing' | 'transitioning'

type Props = {
  features: RoadFeature[]
  routeCandidates: RouteCandidate[]
  selectedRoute: RouteCandidate
  origin: PickupPoint
  destination: PickupPoint
  timeBand: TimeBand
  trafficEnabled: boolean
  lessonState: LessonState
  completedLessons: CompletedLesson[]
}

const emptyCompletedLessons: CompletedLesson[] = []

function latLngBounds(points: LatLng[]) {
  return L.latLngBounds(points.map((point) => [point.lat, point.lng]))
}

function routePoints(route: RouteCandidate) {
  return route.routeGeometry
}

function LeafletFocus({
  origin,
  destination,
  selectedRoute,
}: {
  origin: PickupPoint
  destination: PickupPoint
  selectedRoute: RouteCandidate
}) {
  const map = useLeafletMap()

  useEffect(() => {
    const allPoints = [
      origin.position,
      destination.position,
      ...routePoints(selectedRoute),
    ]
    const bounds = latLngBounds(allPoints)
    const focusMap = () => {
      map.invalidateSize()
      map.fitBounds(bounds, { padding: [96, 96], maxZoom: 14, animate: true })
    }

    focusMap()
    const timer = window.setTimeout(focusMap, 120)

    return () => window.clearTimeout(timer)
  }, [destination, map, origin, selectedRoute])

  return null
}

function GoogleMapOverlays({
  features,
  selectedRoute,
  origin,
  destination,
  trafficEnabled,
  lessonState,
  completedLessons,
}: Props) {
  const map = useMap()
  const completedLessonHistory = completedLessons ?? emptyCompletedLessons
  const reviewLesson = lessonState === 'reviewing' || lessonState === 'transitioning'
    ? completedLessonHistory[0]
    : undefined

  useEffect(() => {
    if (!map || !window.google) return

    const historyPolylines = completedLessonHistory.flatMap((lesson, index) =>
      [lesson.selectedRoute.routeGeometry].map((geometry) => new google.maps.Polyline({
        path: geometry,
        map,
        geodesic: true,
        strokeColor: '#000000',
        strokeOpacity: Math.max(0.12, 0.28 - index * 0.03),
        strokeWeight: 2,
        zIndex: 6,
      })),
    )

    const selectedRoutePolyline = new google.maps.Polyline({
        path: selectedRoute.routeGeometry,
        map,
        geodesic: true,
        strokeColor: '#000000',
        strokeOpacity: 0.9,
        strokeWeight: 8,
        zIndex: 30,
    })

    const missedFeatureIds = new Set(reviewLesson?.missedFeatureIds ?? [])
    const reviewPolylines = reviewLesson
      ? selectedRoute.featureIds
        .map((id) => {
          const feature = features.find((item) => item.id === id)
          if (!feature) return undefined
          const missed = missedFeatureIds.has(id)
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
      new google.maps.Marker({ position: origin.position, map, label: '発', title: origin.name }),
      new google.maps.Marker({ position: destination.position, map, label: '着', title: destination.name }),
    ]

    const bounds = new google.maps.LatLngBounds()
    routePoints(selectedRoute).forEach((point) => bounds.extend(point))
    bounds.extend(origin.position)
    bounds.extend(destination.position)
    map.fitBounds(bounds, 80)

    return () => {
      historyPolylines.forEach((polyline) => polyline.setMap(null))
      selectedRoutePolyline.setMap(null)
      reviewPolylines.forEach((polyline) => polyline.setMap(null))
      markers.forEach((marker) => marker.setMap(null))
    }
  }, [completedLessonHistory, destination, features, map, origin, reviewLesson, selectedRoute])

  useEffect(() => {
    if (!map || !window.google || !trafficEnabled) return
    const layer = new google.maps.TrafficLayer()
    layer.setMap(map)
    return () => layer.setMap(null)
  }, [map, trafficEnabled])

  return null
}

function OpenStreetMapPanel(props: Omit<Props, 'trafficEnabled'>) {
  const { features, selectedRoute, origin, destination, lessonState, completedLessons } = props
  const completedLessonHistory = completedLessons ?? emptyCompletedLessons
  const reviewLesson = lessonState === 'reviewing' || lessonState === 'transitioning'
    ? completedLessonHistory[0]
    : undefined
  const missedFeatureIds = new Set(reviewLesson?.missedFeatureIds ?? [])
  const showRouteLabels = lessonState !== 'recalling'

  const originIcon = useMemo(
    () =>
      L.divIcon({
        className: 'ride-pin ride-pin-origin',
        html: '<span>出発</span>',
        iconSize: [56, 56],
        iconAnchor: [28, 10],
      }),
    [],
  )

  const destinationIcon = useMemo(
    () =>
      L.divIcon({
        className: 'ride-pin ride-pin-destination',
        html: '<span>到着</span>',
        iconSize: [56, 56],
        iconAnchor: [28, 10],
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

      {completedLessonHistory.map((lesson, index) => (
        [lesson.selectedRoute.routeGeometry].map((geometry) => (
          <Polyline
            key={`${lesson.id}-history`}
            positions={geometry.map((point) => [point.lat, point.lng])}
            pathOptions={{
              color: '#000000',
              opacity: Math.max(0.12, 0.3 - index * 0.035),
              weight: 2,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            className="learning-segment-history"
          />
        ))
      ))}

      <Polyline
        key={selectedRoute.id}
        positions={selectedRoute.routeGeometry.map((point) => [point.lat, point.lng])}
        pathOptions={{
          color: '#000000',
          opacity: 0.9,
          weight: 8,
          lineCap: 'round',
          lineJoin: 'round',
        }}
        className="learning-segment-active"
      />

      {reviewLesson && selectedRoute.featureIds.map((id) => {
        const feature = features.find((item) => item.id === id)
        if (!feature) return null
        const missed = missedFeatureIds.has(id)
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

      {showRouteLabels && (
        <Marker
          position={[selectedRoute.routeGeometry[0]?.lat ?? origin.position.lat, selectedRoute.routeGeometry[0]?.lng ?? origin.position.lng]}
          icon={L.divIcon({
            className: 'route-name-pin',
            html: `<span>${selectedRoute.name}</span>`,
            iconSize: [180, 32],
            iconAnchor: [90, 16],
          })}
        />
      )}

      {showRouteLabels && selectedRoute.featureIds.map((id) => {
        const feature = features.find((item) => item.id === id)
        if (!feature) return null
        const labelPoint = feature.labelPoint ?? feature.path[Math.floor(feature.path.length / 2)]
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

      <Marker position={[origin.position.lat, origin.position.lng]} icon={originIcon}>
        <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
          {origin.name}
        </Tooltip>
      </Marker>
      <Marker position={[destination.position.lat, destination.position.lng]} icon={destinationIcon}>
        <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
          {destination.name}
        </Tooltip>
      </Marker>
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
        {!apiKey && <span><MapPinned size={15} /> APIキーなしで学習ルートを表示</span>}
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
          routeCandidates={props.routeCandidates}
          selectedRoute={props.selectedRoute}
          origin={props.origin}
          destination={props.destination}
          timeBand={props.timeBand}
          lessonState={props.lessonState}
          completedLessons={props.completedLessons}
        />
      )}
      <div className={props.lessonState === 'transitioning' ? 'map-wipe active' : 'map-wipe'} aria-hidden="true">
        <span>NEXT LESSON</span>
      </div>
    </section>
  )
}
