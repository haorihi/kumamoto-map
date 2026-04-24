import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { KeyRound, MapPinned } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap as useLeafletMap } from 'react-leaflet'
import { center, type RoadFeature, type TimeBand } from '../data/kumamoto'

type Props = {
  features: RoadFeature[]
  activeFeature: RoadFeature
  timeBand: TimeBand
  trafficEnabled: boolean
}

function congestionColor(value: number) {
  if (value >= 80) return '#ef4444'
  if (value >= 65) return '#f59e0b'
  if (value >= 50) return '#22c55e'
  return '#38bdf8'
}

function LeafletFocus({ activeFeature }: { activeFeature: RoadFeature }) {
  const map = useLeafletMap()

  useEffect(() => {
    const bounds = L.latLngBounds(activeFeature.path.map((point) => [point.lat, point.lng]))
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16, animate: true })
  }, [activeFeature, map])

  return null
}

function MapOverlays({ features, activeFeature, timeBand, trafficEnabled }: Props) {
  const map = useMap()

  useEffect(() => {
    if (!map || !window.google) return

    const polylines = features.map((feature) => {
      const active = feature.id === activeFeature.id
      const level = feature.congestion[timeBand]
      const polyline = new google.maps.Polyline({
        path: feature.path,
        map,
        geodesic: true,
        strokeColor: active ? feature.color : congestionColor(level),
        strokeOpacity: active ? 1 : 0.72,
        strokeWeight: active ? 9 : 5,
        zIndex: active ? 20 : 10,
      })

      const marker = new google.maps.Marker({
        position: feature.path[Math.floor(feature.path.length / 2)],
        map,
        label: {
          text: feature.category === 'bridge' ? '橋' : '道',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: '700',
        },
        title: feature.name,
      })

      return { polyline, marker }
    })

    const bounds = new google.maps.LatLngBounds()
    activeFeature.path.forEach((point) => bounds.extend(point))
    map.fitBounds(bounds, 80)

    return () => {
      polylines.forEach(({ polyline, marker }) => {
        polyline.setMap(null)
        marker.setMap(null)
      })
    }
  }, [activeFeature, features, map, timeBand])

  useEffect(() => {
    if (!map || !window.google || !trafficEnabled) return
    const layer = new google.maps.TrafficLayer()
    layer.setMap(map)
    return () => layer.setMap(null)
  }, [map, trafficEnabled])

  return null
}

function OpenStreetMapPanel({ features, activeFeature, timeBand }: Omit<Props, 'trafficEnabled'>) {
  const pinIcon = L.divIcon({
    className: 'route-pin',
    html: '<span>道</span>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
  const activeMidpoint = activeFeature.path[Math.floor(activeFeature.path.length / 2)]

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
      {features.map((feature) => {
        const active = feature.id === activeFeature.id
        return (
          <Polyline
            key={feature.id}
            positions={feature.path.map((point) => [point.lat, point.lng])}
            pathOptions={{
              color: active ? feature.color : congestionColor(feature.congestion[timeBand]),
              opacity: active ? 0.96 : 0.68,
              weight: active ? 8 : 4,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            className={active ? 'leaflet-active-route' : undefined}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={0.95} permanent={active}>
              {feature.name}
            </Tooltip>
          </Polyline>
        )
      })}
      <Marker position={[activeMidpoint.lat, activeMidpoint.lng]} icon={pinIcon} />
      <LeafletFocus activeFeature={activeFeature} />
    </MapContainer>
  )
}

export function GoogleMapPanel(props: Props) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  return (
    <section className="map-surface" aria-label="熊本市内の道路学習マップ">
      <div className="map-status">
        <span><KeyRound size={15} /> {apiKey ? 'Google Maps API 接続' : 'OpenStreetMap 表示'}</span>
        {!apiKey && <span><MapPinned size={15} /> APIキーなしで実地図タイルを表示</span>}
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
            <MapOverlays {...props} />
          </Map>
        </APIProvider>
      ) : (
        <OpenStreetMapPanel features={props.features} activeFeature={props.activeFeature} timeBand={props.timeBand} />
      )}
    </section>
  )
}
