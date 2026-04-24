import {
  BadgeCheck,
  CarFront,
  CheckCircle2,
  Clock3,
  Coins,
  Map,
  Navigation,
  RefreshCw,
  Route,
  Sparkles,
  Star,
  Timer,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import './App.css'
import { GoogleMapPanel } from './components/GoogleMapPanel'
import {
  kumamotoFeatures,
  passengers,
  pickupPoints,
  rideScenarios,
  timeBands,
  type RideScenario,
  type RouteCandidate,
} from './data/kumamoto'

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

function App() {
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [selectedRouteId, setSelectedRouteId] = useState(findScenario(0).candidates[0].id)
  const [farePoints, setFarePoints] = useState(0)
  const [satisfaction, setSatisfaction] = useState(86)
  const [streak, setStreak] = useState(0)
  const [completedRouteId, setCompletedRouteId] = useState<string | null>(null)
  const [learnedLogs, setLearnedLogs] = useState<string[]>([])

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
  const completed = completedRouteId === selectedRoute.id

  const selectRoute = (route: RouteCandidate) => {
    setSelectedRouteId(route.id)
    setCompletedRouteId(null)
  }

  const completeRide = () => {
    const isBest = selectedRoute.id === bestRoute.id
    const points = selectedRoute.fare + (isBest ? 240 : 80) + Math.max(0, 90 - selectedRisk)
    setFarePoints((value) => value + points)
    setSatisfaction((value) => Math.min(100, Math.max(35, value + (isBest ? 4 : -2) + Math.round((selectedRoute.comfort - 76) / 8))))
    setStreak((value) => (isBest ? value + 1 : 0))
    setCompletedRouteId(selectedRoute.id)
    setLearnedLogs((logs) => [
      `${selectedRoute.name}: ${selectedRoute.learningPoint}`,
      ...logs.filter((log) => !log.startsWith(`${selectedRoute.name}:`)),
    ].slice(0, 5))
  }

  const nextRide = () => {
    const nextIndex = scenarioIndex + 1
    const nextScenario = findScenario(nextIndex)
    setScenarioIndex(nextIndex)
    setSelectedRouteId(nextScenario.candidates[0].id)
    setCompletedRouteId(null)
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div className="brand-lockup">
          <p className="eyebrow"><CarFront size={16} /> Kumamoto Night Cab</p>
          <h1>橋と通りで送迎を組み立てる</h1>
          <p className="topbar-copy">ルートを選び、送迎しながら熊本市内の地名を覚えます。</p>
        </div>
        <div className="scoreboard" aria-label="ゲームスコア">
          <span><Coins size={18} /> {farePoints.toLocaleString()} pt</span>
          <span><Star size={18} /> {satisfaction}%</span>
          <span><BadgeCheck size={18} /> {streak} chain</span>
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
              <div><span>運賃</span><strong>{selectedRoute.fare.toLocaleString()} pt</strong></div>
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
              <button type="button" className="primary-action" onClick={completeRide}>
                <CarFront size={18} /> このルートで送迎
              </button>
              <button type="button" className="ghost-action" onClick={nextRide} aria-label="次の依頼">
                <RefreshCw size={18} />
              </button>
            </div>
            {completed && (
              <div className="ride-result">
                <strong>{selectedRoute.id === bestRoute.id ? '最適判断' : '送迎完了'}</strong>
                <p>「{passenger.thanks}」</p>
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
            <h2>学習ログ</h2>
            <p>{learnedLogs[0] ?? '送迎を完了すると、覚えた橋・通りのログがここに残ります。'}</p>
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
