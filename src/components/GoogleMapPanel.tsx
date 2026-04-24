import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { KeyRound, MapPinned } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap as useLeafletMap } from 'react-leaflet'
import {
  center,
  type CompletedRide,
  type LatLng,
  type PickupPoint,
  type RoadFeature,
  type RouteCandidate,
  type TimeBand,
} from '../data/kumamoto'

type RideState = 'selecting' | 'driving' | 'completed' | 'transitioning'

type Props = {
  features: RoadFeature[]
  routeCandidates: RouteCandidate[]
  selectedRoute: RouteCandidate
  origin: PickupPoint
  destination: PickupPoint
  timeBand: TimeBand
  trafficEnabled: boolean
  rideState: RideState
  completedRides: CompletedRide[]
}

const emptyCompletedRides: CompletedRide[] = []

function congestionColor(value: number) {
  if (value >= 80) return '#ef4444'
  if (value >= 65) return '#f59e0b'
  if (value >= 50) return '#22c55e'
  return '#38bdf8'
}

function routeRisk(route: RouteCandidate, features: RoadFeature[], timeBand: TimeBand) {
  const routeFeatures = route.featureIds
    .map((id) => features.find((feature) => feature.id === id))
    .filter(Boolean) as RoadFeature[]

  if (!routeFeatures.length) return 50
  return Math.round(routeFeatures.reduce((sum, feature) => sum + feature.congestion[timeBand], 0) / routeFeatures.length)
}

function latLngBounds(points: LatLng[]) {
  return L.latLngBounds(points.map((point) => [point.lat, point.lng]))
}

function segmentDistance(start: LatLng, end: LatLng) {
  const lat = end.lat - start.lat
  const lng = end.lng - start.lng
  return Math.sqrt(lat * lat + lng * lng)
}

function routePosition(path: LatLng[], progress: number) {
  if (path.length < 2) return { position: path[0], angle: 0 }

  const distances = path.slice(1).map((point, index) => segmentDistance(path[index], point))
  const total = distances.reduce((sum, distance) => sum + distance, 0)
  let remaining = total * Math.min(1, Math.max(0, progress))

  for (let index = 0; index < distances.length; index += 1) {
    const distance = distances[index]
    const start = path[index]
    const end = path[index + 1]
    if (remaining <= distance || index === distances.length - 1) {
      const ratio = distance === 0 ? 0 : remaining / distance
      const position = {
        lat: start.lat + (end.lat - start.lat) * ratio,
        lng: start.lng + (end.lng - start.lng) * ratio,
      }
      const angle = Math.atan2(end.lng - start.lng, -(end.lat - start.lat)) * (180 / Math.PI)
      return { position, angle }
    }
    remaining -= distance
  }

  return { position: path[path.length - 1], angle: 0 }
}

function LeafletFocus({
  origin,
  destination,
  routeCandidates,
}: {
  origin: PickupPoint
  destination: PickupPoint
  routeCandidates: RouteCandidate[]
}) {
  const map = useLeafletMap()

  useEffect(() => {
    const allPoints = [
      origin.position,
      destination.position,
      ...routeCandidates.flatMap((route) => route.path),
    ]
    map.fitBounds(latLngBounds(allPoints), { padding: [70, 70], maxZoom: 15, animate: true })
  }, [destination, map, origin, routeCandidates])

  return null
}

function GoogleMapOverlays({
  features,
  routeCandidates,
  selectedRoute,
  origin,
  destination,
  timeBand,
  trafficEnabled,
  completedRides,
}: Props) {
  const map = useMap()
  const completedRideHistory = completedRides ?? emptyCompletedRides

  useEffect(() => {
    if (!map || !window.google) return

    const historyPolylines = completedRideHistory.map((ride, index) => new google.maps.Polyline({
      path: ride.route.path,
      map,
      geodesic: true,
      strokeColor: '#22d3ee',
      strokeOpacity: Math.max(0.14, 0.34 - index * 0.035),
      strokeWeight: 3,
      zIndex: 6,
    }))

    const polylines = routeCandidates.map((route) => {
      const active = route.id === selectedRoute.id
      const polyline = new google.maps.Polyline({
        path: route.path,
        map,
        geodesic: true,
        strokeColor: active ? '#007aff' : congestionColor(routeRisk(route, features, timeBand)),
        strokeOpacity: active ? 0.96 : 0.36,
        strokeWeight: active ? 7 : 4,
        zIndex: active ? 30 : 10,
      })
      return polyline
    })

    const markers = [
      new google.maps.Marker({ position: origin.position, map, label: '発', title: origin.name }),
      new google.maps.Marker({ position: destination.position, map, label: '着', title: destination.name }),
    ]

    const bounds = new google.maps.LatLngBounds()
    routeCandidates.flatMap((route) => route.path).forEach((point) => bounds.extend(point))
    bounds.extend(origin.position)
    bounds.extend(destination.position)
    map.fitBounds(bounds, 80)

    return () => {
      historyPolylines.forEach((polyline) => polyline.setMap(null))
      polylines.forEach((polyline) => polyline.setMap(null))
      markers.forEach((marker) => marker.setMap(null))
    }
  }, [completedRideHistory, destination, features, map, origin, routeCandidates, selectedRoute, timeBand])

  useEffect(() => {
    if (!map || !window.google || !trafficEnabled) return
    const layer = new google.maps.TrafficLayer()
    layer.setMap(map)
    return () => layer.setMap(null)
  }, [map, trafficEnabled])

  return null
}

function OpenStreetMapPanel(props: Omit<Props, 'trafficEnabled'>) {
  const { features, routeCandidates, selectedRoute, origin, destination, timeBand, rideState, completedRides } = props
  const completedRideHistory = completedRides ?? emptyCompletedRides
  const [driveProgress, setDriveProgress] = useState(0)

  useEffect(() => {
    if (rideState !== 'driving') {
      return undefined
    }

    const startedAt = performance.now()
    const duration = 2800
    const resetFrame = window.requestAnimationFrame(() => setDriveProgress(0))
    const interval = window.setInterval(() => {
      setDriveProgress(Math.min(1, (performance.now() - startedAt) / duration))
    }, 34)

    return () => {
      window.cancelAnimationFrame(resetFrame)
      window.clearInterval(interval)
    }
  }, [rideState, selectedRoute.id])

  const originIcon = useMemo(
    () =>
      L.divIcon({
        className: 'ride-pin ride-pin-origin',
        html: '<span>発</span>',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      }),
    [],
  )

  const destinationIcon = useMemo(
    () =>
      L.divIcon({
        className: 'ride-pin ride-pin-destination',
        html: '<span>着</span>',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      }),
    [],
  )

  const effectiveDriveProgress = rideState === 'driving'
    ? driveProgress
    : rideState === 'completed' || rideState === 'transitioning'
      ? 1
      : 0
  const vehicle = routePosition(selectedRoute.path, effectiveDriveProgress)
  const vehicleIcon = useMemo(
    () =>
      L.divIcon({
        className: 'vehicle-pin',
        html: `<span style="transform: rotate(${vehicle.angle}deg)">▲</span>`,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      }),
    [vehicle.angle],
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

      {completedRideHistory.map((ride, index) => (
        <Polyline
          key={ride.id}
          positions={ride.route.path.map((point) => [point.lat, point.lng])}
          pathOptions={{
            color: '#22d3ee',
            opacity: Math.max(0.14, 0.36 - index * 0.04),
            weight: 3,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          className="ride-route-history"
        />
      ))}

      {routeCandidates.map((route) => {
        const active = route.id === selectedRoute.id
        const activeClass = rideState === 'driving' ? ' ride-route-driving' : ''
        return (
          <Polyline
            key={`${route.id}-${active ? 'active' : 'muted'}`}
            positions={route.path.map((point) => [point.lat, point.lng])}
            pathOptions={{
              color: active ? '#007aff' : congestionColor(routeRisk(route, features, timeBand)),
              opacity: active ? 0.96 : 0.36,
              weight: active ? 7 : 4,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            className={active ? `leaflet-active-route ride-route-active${activeClass}` : 'ride-route-muted'}
          >
            {active && (
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95} permanent>
                {route.name}
              </Tooltip>
            )}
          </Polyline>
        )
      })}

      {selectedRoute.featureIds.map((id) => {
        const feature = features.find((item) => item.id === id)
        if (!feature) return null
        const midpoint = feature.path[Math.floor(feature.path.length / 2)]
        return (
          <Marker
            key={feature.id}
            position={[midpoint.lat, midpoint.lng]}
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
      {(rideState === 'driving' || rideState === 'completed' || rideState === 'transitioning') && (
        <Marker position={[vehicle.position.lat, vehicle.position.lng]} icon={vehicleIcon} />
      )}
      <LeafletFocus origin={origin} destination={destination} routeCandidates={routeCandidates} />
    </MapContainer>
  )
}

export function GoogleMapPanel(props: Props) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  return (
    <section className="map-surface" aria-label="熊本市内の送迎ルートマップ">
      <div className="map-status">
        <span><KeyRound size={15} /> {apiKey ? 'Google Maps API 接続' : 'OpenStreetMap 表示'}</span>
        {!apiKey && <span><MapPinned size={15} /> APIキーなしで送迎ルートを表示</span>}
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
          rideState={props.rideState}
          completedRides={props.completedRides}
        />
      )}
      <div className={props.rideState === 'transitioning' ? 'map-wipe active' : 'map-wipe'} aria-hidden="true">
        <span>DISPATCH UPDATE</span>
      </div>
    </section>
  )
}
