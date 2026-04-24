import {
  CarFront,
  CheckCircle2,
  Clock3,
  ListChecks,
  Map,
  Navigation,
  Radio,
  RefreshCw,
  Route,
  Sparkles,
  Timer,
  TriangleAlert,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import './App.css'
import { GoogleMapPanel } from './components/GoogleMapPanel'
import {
  type CompletedRide,
  kumamotoFeatures,
  passengers,
  pickupPoints,
  rideScenarios,
  timeBands,
  type RideScenario,
  type RouteCandidate,
} from './data/kumamoto'

type RideState = 'selecting' | 'driving' | 'completed' | 'transitioning'

function findScenario(index: number): RideScenario {
  return rideScenarios[index % rideScenarios.length]
}

function featureNames(route: RouteCandidate) {
  return route.featureIds
    .map((id) => kumamotoFeatures.find((feature) => feature.id === id)?.name)
    .filter(Boolean)
    .join(' / ')
}

function routeRisk(route: RouteCandidate, timeBand: RideScenario['timeBand']) {
  const features = route.featureIds
    .map((id) => kumamotoFeatures.find((feature) => feature.id === id))
    .filter((feature) => feature !== undefined)

  if (!features.length) return 50
  return Math.round(features.reduce((sum, feature) => sum + feature.congestion[timeBand], 0) / features.length)
}

function riskLabel(value: number) {
  if (value >= 80) return '高'
  if (value >= 65) return '中'
  return '低'
}

function statusLabel(state: RideState) {
  if (state === 'driving') return '走行中'
  if (state === 'completed') return '完了記録'
  if (state === 'transitioning') return '次の依頼へ'
  return '配車待機'
}

function App() {
  const timersRef = useRef<number[]>([])
  const rideCounterRef = useRef(0)
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [selectedRouteId, setSelectedRouteId] = useState(findScenario(0).candidates[0].id)
  const [rideState, setRideState] = useState<RideState>('selecting')
  const [completedRides, setCompletedRides] = useState<CompletedRide[]>([])

  const scenario = findScenario(scenarioIndex)
  const passenger = passengers.find((item) => item.id === scenario.passengerId)!
  const origin = pickupPoints.find((point) => point.id === scenario.originId)!
  const destination = pickupPoints.find((point) => point.id === scenario.destinationId)!
  const selectedRoute = scenario.candidates.find((route) => route.id === selectedRouteId) ?? scenario.candidates[0]
  const timeBand = timeBands.find((band) => band.id === scenario.timeBand)!

  const rankedRoutes = [...scenario.candidates].sort((a, b) => {
    const aScore = a.minutes[scenario.timeBand] + routeRisk(a, scenario.timeBand) * 0.12 - a.comfort * 0.04
    const bScore = b.minutes[scenario.timeBand] + routeRisk(b, scenario.timeBand) * 0.12 - b.comfort * 0.04
    return aScore - bScore
  })

  const bestRoute = rankedRoutes[0]
  const selectedRisk = routeRisk(selectedRoute, scenario.timeBand)
  const visitedFeatureIds = Array.from(new Set(completedRides.flatMap((ride) => ride.featureIds)))
  const latestRide = completedRides[0]

  const selectRoute = (route: RouteCandidate) => {
    if (rideState !== 'selecting') return
    setSelectedRouteId(route.id)
  }

  const clearRideTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }

  const loadScenario = (nextIndex: number) => {
    const nextScenario = findScenario(nextIndex)
    setScenarioIndex(nextIndex)
    setSelectedRouteId(nextScenario.candidates[0].id)
    setRideState('selecting')
  }

  const completeRide = () => {
    if (rideState !== 'selecting') return

    clearRideTimers()

    rideCounterRef.current += 1

    const completedRide: CompletedRide = {
      id: `${scenario.id}-${selectedRoute.id}-${rideCounterRef.current}`,
      scenarioId: scenario.id,
      passengerName: passenger.name,
      origin,
      destination,
      route: selectedRoute,
      featureIds: selectedRoute.featureIds,
      timeBand: scenario.timeBand,
      completedAtLabel: `${timeBand.label} ${origin.name} → ${destination.name}`,
    }

    setRideState('driving')
    timersRef.current = [
      window.setTimeout(() => {
        setCompletedRides((rides) => [completedRide, ...rides].slice(0, 10))
        setRideState('completed')
      }, 2800),
      window.setTimeout(() => {
        setRideState('transitioning')
      }, 4600),
      window.setTimeout(() => {
        loadScenario(scenarioIndex + 1)
      }, 5500),
    ]
  }

  const nextRide = () => {
    clearRideTimers()
    loadScenario(scenarioIndex + 1)
  }

  useEffect(() => () => clearRideTimers(), [])

  return (
    <main className={`app-shell ride-state-${rideState}`}>
      <section className="topbar">
        <div className="brand-lockup">
          <p className="eyebrow"><Radio size={16} /> Kumamoto Night Cab</p>
          <h1>橋と通りで送迎を組み立てる</h1>
          <p className="topbar-copy">今日の走行を光跡として残し、橋と通りの記憶に変えます。</p>
        </div>
        <div className="scoreboard dispatch-stats" aria-label="本日の送迎ステータス">
          <span><CarFront size={18} /> {completedRides.length} rides</span>
          <span><ListChecks size={18} /> {visitedFeatureIds.length} spots</span>
          <span><Radio size={18} /> {statusLabel(rideState)}</span>
        </div>
      </section>

      <section className="workspace">
        <GoogleMapPanel
          features={kumamotoFeatures}
          routeCandidates={scenario.candidates}
          selectedRoute={selectedRoute}
          origin={origin}
          destination={destination}
          timeBand={scenario.timeBand}
          trafficEnabled={false}
          rideState={rideState}
          completedRides={completedRides}
        />

        <aside className="control-panel">
          <div className="passenger-card">
            <div className="passenger-avatar" aria-hidden="true">{passenger.avatar}</div>
            <div>
              <span className="panel-kicker">{passenger.species}</span>
              <strong>{passenger.name}</strong>
              <p>{passenger.mood}</p>
            </div>
          </div>

          <section className="mission-card">
            <div className="mission-meta">
              <span><Timer size={15} /> {timeBand.label} {timeBand.time}</span>
              <span><Navigation size={15} /> Mission {scenarioIndex + 1}</span>
            </div>
            <h2>{scenario.prompt}</h2>
            <p className="passenger-line">「{passenger.request}」</p>
            <div className="trip-points">
              <div>
                <span>出発</span>
                <strong>{origin.name}</strong>
                <small>{origin.area}</small>
              </div>
              <Route size={20} />
              <div>
                <span>到着</span>
                <strong>{destination.name}</strong>
                <small>{destination.area}</small>
              </div>
            </div>
          </section>

          <section className="route-selector" aria-label="候補ルート">
            <div className="section-title">
              <h2>候補ルート</h2>
              <span>{scenario.candidates.length} routes</span>
            </div>
            <div className="route-list">
              {scenario.candidates.map((route) => {
                const risk = routeRisk(route, scenario.timeBand)
                const active = route.id === selectedRoute.id
                return (
                  <button
                    key={route.id}
                    type="button"
                    className={active ? 'route-option active' : 'route-option'}
                    onClick={() => selectRoute(route)}
                    disabled={rideState !== 'selecting'}
                  >
                    <div>
                      <strong>{route.name}</strong>
                      <small>{featureNames(route)}</small>
                    </div>
                    <span><Clock3 size={14} /> {route.minutes[scenario.timeBand]}分</span>
                    <span className={`risk risk-${riskLabel(risk)}`}>混雑 {riskLabel(risk)}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="route-detail">
            <div className="section-title">
              <h2>{selectedRoute.name}</h2>
              <span>{selectedRoute.style}</span>
            </div>
            <div className="route-stats">
              <div><span>所要</span><strong>{selectedRoute.minutes[scenario.timeBand]}分</strong></div>
              <div><span>通過</span><strong>{selectedRoute.featureIds.length}箇所</strong></div>
              <div><span>快適</span><strong>{selectedRoute.comfort}%</strong></div>
              <div><span>混雑</span><strong>{selectedRisk}%</strong></div>
            </div>
            <div className="pros-cons">
              <p><CheckCircle2 size={16} /> {selectedRoute.merit}</p>
              <p><TriangleAlert size={16} /> {selectedRoute.demerit}</p>
            </div>
            <div className="learning-note">
              <Sparkles size={17} />
              <p>{selectedRoute.learningPoint}</p>
            </div>
            <div className="action-row">
              <button type="button" className="primary-action" onClick={completeRide} disabled={rideState !== 'selecting'}>
                <CarFront size={18} /> {rideState === 'selecting' ? 'このルートで送迎' : statusLabel(rideState)}
              </button>
              <button type="button" className="ghost-action" onClick={nextRide} aria-label="次の依頼" disabled={rideState === 'driving'}>
                <RefreshCw size={18} />
              </button>
            </div>
            {(rideState === 'completed' || rideState === 'transitioning') && (
              <div className="ride-result">
                <strong>{selectedRoute.id === bestRoute.id ? '最適判断で送迎完了' : '送迎完了'}</strong>
                <p>「{passenger.thanks}」</p>
                <small>{selectedRoute.name} / {featureNames(selectedRoute)}</small>
              </div>
            )}
          </section>
        </aside>
      </section>

      <section className="insight-band">
        <article>
          <Map size={19} />
          <div>
            <h2>今回通る橋・通り</h2>
            <p>{featureNames(selectedRoute)}</p>
          </div>
        </article>
        <article>
          <Sparkles size={19} />
          <div>
            <h2>今日の走行ログ</h2>
            {latestRide ? (
              <p>{latestRide.completedAtLabel}: {featureNames(latestRide.route)} を通過。</p>
            ) : (
              <p>送迎を完了すると、通った橋・通りがここに時系列で残ります。</p>
            )}
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
