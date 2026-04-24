import {
  BrainCircuit,
  CarFront,
  CheckCircle2,
  Clock3,
  EyeOff,
  ListChecks,
  Map,
  Navigation,
  Radio,
  RefreshCw,
  Route,
  Timer,
  TriangleAlert,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import './App.css'
import { GoogleMapPanel } from './components/GoogleMapPanel'
import {
  type CompletedLesson,
  kumamotoFeatures,
  learningScenarios,
  pickupPoints,
  timeBands,
  type LearningScenario,
  type RouteCandidate,
} from './data/kumamoto'

type LessonState = 'selecting' | 'recalling' | 'reviewing' | 'transitioning'

function findScenario(index: number): LearningScenario {
  return learningScenarios[index % learningScenarios.length]
}

function featureName(id: string) {
  return kumamotoFeatures.find((feature) => feature.id === id)?.name ?? id
}

function featureNamesFromIds(featureIds: string[]) {
  return featureIds.map(featureName).join(' / ')
}

function featureNames(route: RouteCandidate) {
  return featureNamesFromIds(route.featureIds)
}

function routeRisk(route: RouteCandidate, timeBand: LearningScenario['timeBand']) {
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

function statusLabel(state: LessonState) {
  if (state === 'recalling') return '記憶チェック'
  if (state === 'reviewing') return '結果確認'
  if (state === 'transitioning') return '次の課題へ'
  return 'ルート選択'
}

function sequenceEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function isLessonPerfect(lesson: CompletedLesson) {
  return lesson.missedFeatureIds.length === 0 && sequenceEqual(lesson.featureIds, lesson.recalledFeatureIds)
}

function weakFeatureIds(lesson: CompletedLesson) {
  if (isLessonPerfect(lesson)) return []
  return lesson.missedFeatureIds.length ? lesson.missedFeatureIds : lesson.featureIds
}

function App() {
  const timersRef = useRef<number[]>([])
  const lessonCounterRef = useRef(0)
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [selectedRouteId, setSelectedRouteId] = useState(findScenario(0).candidates[0].id)
  const [lessonState, setLessonState] = useState<LessonState>('selecting')
  const [completedLessons, setCompletedLessons] = useState<CompletedLesson[]>([])
  const [recalledFeatureIds, setRecalledFeatureIds] = useState<string[]>([])

  const scenario = findScenario(scenarioIndex)
  const origin = pickupPoints.find((point) => point.id === scenario.originId)!
  const destination = pickupPoints.find((point) => point.id === scenario.destinationId)!
  const selectedRoute = scenario.candidates.find((route) => route.id === selectedRouteId) ?? scenario.candidates[0]
  const timeBand = timeBands.find((band) => band.id === scenario.timeBand)!
  const latestLesson = completedLessons[0]

  const rankedRoutes = [...scenario.candidates].sort((a, b) => {
    const aScore = a.minutes[scenario.timeBand] + routeRisk(a, scenario.timeBand) * 0.12 - a.comfort * 0.04
    const bScore = b.minutes[scenario.timeBand] + routeRisk(b, scenario.timeBand) * 0.12 - b.comfort * 0.04
    return aScore - bScore
  })

  const bestRoute = rankedRoutes[0]
  const selectedRisk = routeRisk(selectedRoute, scenario.timeBand)
  const recallOptionIds = Array.from(new Set(scenario.candidates.flatMap((route) => route.featureIds)))
  const masteredFeatureIds = Array.from(new Set(completedLessons.filter(isLessonPerfect).flatMap((lesson) => lesson.featureIds)))
  const reviewFeatureIds = Array.from(new Set(completedLessons.flatMap(weakFeatureIds)))
  const selectedRouteIsBest = selectedRoute.id === bestRoute.id
  const latestPerfect = latestLesson ? isLessonPerfect(latestLesson) : false
  const latestOrderWrong = latestLesson
    ? latestLesson.missedFeatureIds.length === 0 && !sequenceEqual(latestLesson.featureIds, latestLesson.recalledFeatureIds)
    : false

  const selectRoute = (route: RouteCandidate) => {
    if (lessonState !== 'selecting') return
    setSelectedRouteId(route.id)
  }

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }

  const loadScenario = (nextIndex: number) => {
    const nextScenario = findScenario(nextIndex)
    setScenarioIndex(nextIndex)
    setSelectedRouteId(nextScenario.candidates[0].id)
    setRecalledFeatureIds([])
    setLessonState('selecting')
  }

  const startLesson = () => {
    if (lessonState !== 'selecting') return

    clearTimers()
    setRecalledFeatureIds([])
    setLessonState('recalling')
  }

  const selectRecallFeature = (featureId: string) => {
    if (lessonState !== 'recalling' || recalledFeatureIds.includes(featureId)) return
    setRecalledFeatureIds((current) => [...current, featureId])
  }

  const removeRecallFeature = (index: number) => {
    if (lessonState !== 'recalling') return
    setRecalledFeatureIds((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const resetRecall = () => {
    if (lessonState !== 'recalling') return
    setRecalledFeatureIds([])
  }

  const scheduleNextScenario = () => {
    clearTimers()
    timersRef.current = [
      window.setTimeout(() => {
        setLessonState('transitioning')
      }, 2600),
      window.setTimeout(() => {
        loadScenario(scenarioIndex + 1)
      }, 3500),
    ]
  }

  const submitRecall = () => {
    if (lessonState !== 'recalling') return

    lessonCounterRef.current += 1

    const missedFeatureIds = selectedRoute.featureIds.filter((id) => !recalledFeatureIds.includes(id))
    const completedLesson: CompletedLesson = {
      id: `${scenario.id}-${selectedRoute.id}-${lessonCounterRef.current}`,
      scenarioId: scenario.id,
      origin,
      destination,
      selectedRoute,
      featureIds: selectedRoute.featureIds,
      recalledFeatureIds,
      missedFeatureIds,
      timeBand: scenario.timeBand,
      completedAtLabel: `${timeBand.label} ${origin.name} → ${destination.name}`,
    }

    setCompletedLessons((lessons) => [completedLesson, ...lessons].slice(0, 12))
    setLessonState('reviewing')
    scheduleNextScenario()
  }

  const nextLesson = () => {
    clearTimers()
    setLessonState('transitioning')
    timersRef.current = [
      window.setTimeout(() => {
        loadScenario(scenarioIndex + 1)
      }, 450),
    ]
  }

  useEffect(() => () => clearTimers(), [])

  return (
    <main className={`app-shell lesson-state-${lessonState}`}>
      <section className="topbar">
        <div className="brand-lockup">
          <p className="eyebrow"><Radio size={16} /> Kumamoto Taxi Trainer</p>
          <h1>橋・通りを覚える</h1>
          <p className="topbar-copy">見る、選ぶ、思い出す。熊本市内の道を記憶に残すための練習画面です。</p>
        </div>
        <div className="scoreboard dispatch-stats" aria-label="本日の学習ステータス">
          <span><CarFront size={18} /> 課題 {completedLessons.length}</span>
          <span><ListChecks size={18} /> 定着 {masteredFeatureIds.length}</span>
          <span><TriangleAlert size={18} /> 復習 {reviewFeatureIds.length}</span>
          <span><Radio size={18} /> {statusLabel(lessonState)}</span>
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
          lessonState={lessonState}
          completedLessons={completedLessons}
        />

        <aside className="control-panel">
          <div className="lesson-goal-card">
            <div className="lesson-goal-icon" aria-hidden="true"><BrainCircuit size={25} /></div>
            <div>
              <span className="panel-kicker">今回の学習目標</span>
              <strong>{origin.name} → {destination.name}</strong>
              <p>{scenario.learningGoal}</p>
            </div>
          </div>

          <section className="mission-card">
            <div className="mission-meta">
              <span><Timer size={15} /> {timeBand.label} {timeBand.time}</span>
              <span><Navigation size={15} /> Lesson {scenarioIndex + 1}</span>
            </div>
            <h2>{scenario.prompt}</h2>
            <p className="lesson-instruction">{scenario.recallPrompt}</p>
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

          {lessonState === 'selecting' && (
            <>
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
                        disabled={lessonState !== 'selecting'}
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
                  <BrainCircuit size={17} />
                  <p>{selectedRoute.learningPoint}</p>
                </div>
                <div className="action-row">
                  <button type="button" className="primary-action" onClick={startLesson} disabled={lessonState !== 'selecting'}>
                    <CarFront size={18} /> このルートを覚える
                  </button>
                  <button type="button" className="ghost-action" onClick={nextLesson} aria-label="次の課題">
                    <RefreshCw size={18} />
                  </button>
                </div>
              </section>
            </>
          )}

          {lessonState === 'recalling' && (
            <section className="recall-panel" aria-label="記憶チェック">
              <div className="section-title">
                <h2>記憶チェック</h2>
                <span><EyeOff size={14} /> ラベル非表示</span>
              </div>
              <p>{scenario.recallPrompt}</p>
              <div className="recall-sequence" aria-label="選択した順番">
                {recalledFeatureIds.length ? (
                  recalledFeatureIds.map((featureId, index) => (
                    <button key={`${featureId}-${index}`} type="button" onClick={() => removeRecallFeature(index)}>
                      <span>{index + 1}</span>{featureName(featureId)}
                    </button>
                  ))
                ) : (
                  <div className="recall-empty">地図を思い出しながら、下の候補を順番に選択</div>
                )}
              </div>
              <div className="recall-options" aria-label="候補の橋・通り">
                {recallOptionIds.map((featureId) => (
                  <button
                    key={featureId}
                    type="button"
                    onClick={() => selectRecallFeature(featureId)}
                    disabled={recalledFeatureIds.includes(featureId)}
                  >
                    {featureName(featureId)}
                  </button>
                ))}
              </div>
              <div className="action-row">
                <button type="button" className="primary-action" onClick={submitRecall} disabled={!recalledFeatureIds.length}>
                  <ListChecks size={18} /> 答え合わせ
                </button>
                <button type="button" className="ghost-action" onClick={resetRecall} aria-label="選択をリセット">
                  <RefreshCw size={18} />
                </button>
              </div>
            </section>
          )}

          {(lessonState === 'reviewing' || lessonState === 'transitioning') && latestLesson && (
            <section className="review-panel" aria-label="結果と復習">
              <div className="section-title">
                <h2>{latestPerfect ? '順番まで正解' : latestOrderWrong ? '順番を確認' : '復習ポイントあり'}</h2>
                <span>{selectedRouteIsBest ? '判断良好' : '別解あり'}</span>
              </div>
              <p>
                {latestPerfect
                  ? '通った橋・通りを正しい順番で思い出せました。'
                  : latestOrderWrong
                    ? '通った道は合っています。順番だけもう一度確認しましょう。'
                    : '抜けた橋・通りを地図上で赤く表示しています。'}
              </p>
              <div className="answer-block">
                <span>正しい順番</span>
                <div>{latestLesson.featureIds.map((id, index) => <strong key={id}>{index + 1}. {featureName(id)}</strong>)}</div>
              </div>
              <div className="answer-block">
                <span>選んだ順番</span>
                <div>
                  {latestLesson.recalledFeatureIds.length
                    ? latestLesson.recalledFeatureIds.map((id, index) => <strong key={`${id}-${index}`}>{index + 1}. {featureName(id)}</strong>)
                    : <strong>未選択</strong>}
                </div>
              </div>
              {!latestPerfect && (
                <div className="review-needed">
                  <TriangleAlert size={16} />
                  <p>復習: {featureNamesFromIds(weakFeatureIds(latestLesson))}</p>
                </div>
              )}
              <div className="action-row">
                <button type="button" className="primary-action" onClick={nextLesson}>
                  <Navigation size={18} /> 次の課題
                </button>
              </div>
            </section>
          )}
        </aside>
      </section>

      <section className="insight-band">
        <article>
          <Map size={19} />
          <div>
            <h2>今回覚える橋・通り</h2>
            <p>{lessonState === 'recalling' ? '記憶チェック中は地図ラベルを隠しています。' : featureNames(selectedRoute)}</p>
          </div>
        </article>
        <article className="learning-log-card">
          <ListChecks size={19} />
          <div>
            <h2>今日覚えた道</h2>
            {completedLessons.length ? (
              <ol className="learning-log-list">
                {completedLessons.map((lesson) => (
                  <li key={lesson.id}>
                    <span>{lesson.completedAtLabel}</span>
                    <strong>{featureNamesFromIds(lesson.featureIds)}</strong>
                    <small className={isLessonPerfect(lesson) ? 'log-good' : 'log-review'}>
                      {isLessonPerfect(lesson) ? '定着' : '復習'}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p>記憶チェックを完了すると、ここに学習履歴が残ります。</p>
            )}
          </div>
        </article>
        <article className="review-log-card">
          <TriangleAlert size={19} />
          <div>
            <h2>復習が必要な道</h2>
            <p>{reviewFeatureIds.length ? featureNamesFromIds(reviewFeatureIds) : '今のところ復習対象はありません。'}</p>
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
