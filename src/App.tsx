import {
  BrainCircuit,
  CarFront,
  Clock3,
  EyeOff,
  ListChecks,
  Map,
  MapPin,
  Navigation,
  Radio,
  RefreshCw,
  Route,
  TriangleAlert,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import './App.css'
import { GoogleMapPanel } from './components/GoogleMapPanel'
import { kumamotoFeatures, type LatLng } from './data/kumamoto'
import {
  fetchRouteSession,
  formatPoint,
  type DynamicRouteCandidate,
  type RouteFeatureHit,
  type RouteSession,
} from './lib/routing'

type LessonState = 'selecting' | 'recalling' | 'reviewing'
type RouteRequestState = 'idle' | 'loading' | 'ready' | 'error'
type PointSelectionState = 'origin' | 'destination' | 'ready'

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

function statusLabel(routeRequestState: RouteRequestState, lessonState: LessonState) {
  if (routeRequestState === 'loading') return 'ルート計算中'
  if (routeRequestState === 'error') return '再指定が必要'
  if (lessonState === 'recalling') return '記憶チェック'
  if (lessonState === 'reviewing') return '結果確認'
  return '地点指定'
}

function sequenceEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function routeLabels(route: DynamicRouteCandidate | undefined) {
  return route?.quizFeatureSequence.map((hit) => hit.label) ?? []
}

function isLessonPerfect(lesson: CompletedDynamicLesson) {
  const answerLabels = lesson.quizFeatureSequence.map((hit) => hit.label)
  return lesson.missedLabels.length === 0 && sequenceEqual(answerLabels, lesson.recalledLabels)
}

function weakLabels(lesson: CompletedDynamicLesson) {
  if (isLessonPerfect(lesson)) return []
  return lesson.missedLabels.length ? lesson.missedLabels : lesson.quizFeatureSequence.map((hit) => hit.label)
}

function distanceLabel(distanceMeters: number) {
  if (distanceMeters >= 1000) return `${(distanceMeters / 1000).toFixed(1)}km`
  return `${distanceMeters}m`
}

function uniqueLabels(hits: RouteFeatureHit[]) {
  return Array.from(new Set(hits.map((hit) => hit.label)))
}

function pointInstruction(pointSelectionState: PointSelectionState) {
  if (pointSelectionState === 'origin') return '地図をクリックして出発点を置く'
  if (pointSelectionState === 'destination') return '地図をクリックして到着点を置く'
  return '候補ルートから覚える道順を選ぶ'
}

function routeMetaLabel(routeRequestState: RouteRequestState, pointSelectionState: PointSelectionState, candidateCount: number) {
  if (routeRequestState === 'loading') return 'routing'
  if (routeRequestState === 'error') return 'error'
  if (routeRequestState === 'ready') return `${candidateCount} candidates`
  return pointSelectionState
}

function goalInstruction(routeRequestState: RouteRequestState, pointSelectionState: PointSelectionState) {
  if (routeRequestState === 'loading') return '候補ルートを計算中'
  if (routeRequestState === 'error') return '地点を指定し直す'
  return pointInstruction(pointSelectionState)
}

function App() {
  const lessonCounterRef = useRef(0)
  const routeAbortRef = useRef<AbortController | null>(null)
  const [origin, setOrigin] = useState<LatLng | null>(null)
  const [destination, setDestination] = useState<LatLng | null>(null)
  const [routeSession, setRouteSession] = useState<RouteSession | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [routeRequestState, setRouteRequestState] = useState<RouteRequestState>('idle')
  const [routeError, setRouteError] = useState('')
  const [lessonState, setLessonState] = useState<LessonState>('selecting')
  const [completedLessons, setCompletedLessons] = useState<CompletedDynamicLesson[]>([])
  const [recalledLabels, setRecalledLabels] = useState<string[]>([])

  const selectedRoute = routeSession?.candidates.find((route) => route.id === selectedRouteId) ?? routeSession?.candidates[0]
  const latestLesson = completedLessons[0]
  const answerLabels = routeLabels(selectedRoute)
  const recallOptionLabels = useMemo(
    () => uniqueLabels(routeSession?.candidates.flatMap((route) => route.quizFeatureSequence) ?? []),
    [routeSession],
  )
  const masteredLabels = Array.from(new Set(completedLessons.filter(isLessonPerfect).flatMap((lesson) => lesson.quizFeatureSequence.map((hit) => hit.label))))
  const reviewLabels = Array.from(new Set(completedLessons.flatMap(weakLabels)))
  const latestPerfect = latestLesson ? isLessonPerfect(latestLesson) : false
  const latestOrderWrong = latestLesson
    ? latestLesson.missedLabels.length === 0 && !sequenceEqual(latestLesson.quizFeatureSequence.map((hit) => hit.label), latestLesson.recalledLabels)
    : false
  const pointSelectionState: PointSelectionState = !origin ? 'origin' : !destination ? 'destination' : 'ready'

  const requestRoutes = (nextOrigin: LatLng, nextDestination: LatLng) => {
    routeAbortRef.current?.abort()
    const abortController = new AbortController()
    routeAbortRef.current = abortController
    setRouteRequestState('loading')
    setRouteError('')
    setRouteSession(null)
    setSelectedRouteId(null)
    setLessonState('selecting')
    setRecalledLabels([])

    fetchRouteSession(nextOrigin, nextDestination, kumamotoFeatures, abortController.signal)
      .then((session) => {
        setRouteSession(session)
        setSelectedRouteId(session.selectedRouteId)
        setRouteRequestState('ready')
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) return
        setRouteRequestState('error')
        setRouteError(error instanceof Error ? error.message : 'ルート計算に失敗しました。')
      })
  }

  const handleMapClick = (point: LatLng) => {
    if (lessonState !== 'selecting') return

    if (!origin || (origin && destination)) {
      setOrigin(point)
      setDestination(null)
      setRouteSession(null)
      setSelectedRouteId(null)
      setRouteRequestState('idle')
      setRouteError('')
      setRecalledLabels([])
      return
    }

    setDestination(point)
    requestRoutes(origin, point)
  }

  const resetRoute = () => {
    routeAbortRef.current?.abort()
    setOrigin(null)
    setDestination(null)
    setRouteSession(null)
    setSelectedRouteId(null)
    setRouteRequestState('idle')
    setRouteError('')
    setLessonState('selecting')
    setRecalledLabels([])
  }

  const selectRoute = (route: DynamicRouteCandidate) => {
    if (lessonState !== 'selecting') return
    setSelectedRouteId(route.id)
    setRecalledLabels([])
  }

  const startLesson = () => {
    if (!selectedRoute || lessonState !== 'selecting') return
    setRecalledLabels([])
    setLessonState('recalling')
  }

  const selectRecallLabel = (label: string) => {
    if (lessonState !== 'recalling' || recalledLabels.includes(label)) return
    setRecalledLabels((current) => [...current, label])
  }

  const removeRecallLabel = (index: number) => {
    if (lessonState !== 'recalling') return
    setRecalledLabels((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const resetRecall = () => {
    if (lessonState !== 'recalling') return
    setRecalledLabels([])
  }

  const submitRecall = () => {
    if (!origin || !destination || !selectedRoute || lessonState !== 'recalling') return

    lessonCounterRef.current += 1
    const missedLabels = answerLabels.filter((label) => !recalledLabels.includes(label))
    const completedLesson: CompletedDynamicLesson = {
      id: `${selectedRoute.id}-${lessonCounterRef.current}`,
      origin,
      destination,
      selectedRoute,
      quizFeatureSequence: selectedRoute.quizFeatureSequence,
      recalledLabels,
      missedLabels,
      completedAtLabel: `${formatPoint(origin)} → ${formatPoint(destination)}`,
    }

    setCompletedLessons((lessons) => [completedLesson, ...lessons].slice(0, 12))
    setLessonState('reviewing')
  }

  const backToRoutes = () => {
    setLessonState('selecting')
    setRecalledLabels([])
  }

  return (
    <main className={`app-shell lesson-state-${lessonState}`}>
      <section className="topbar">
        <div className="brand-lockup">
          <p className="eyebrow"><Radio size={16} /> Kumamoto Taxi Trainer</p>
          <h1>任意地点で道順を覚える</h1>
          <p className="topbar-copy">地図上で出発点と到着点を指定し、実道路ルートから通過する道路名・橋名を確認します。</p>
        </div>
        <div className="scoreboard dispatch-stats" aria-label="本日の学習ステータス">
          <span><CarFront size={18} /> 課題 {completedLessons.length}</span>
          <span><ListChecks size={18} /> 定着 {masteredLabels.length}</span>
          <span><TriangleAlert size={18} /> 復習 {reviewLabels.length}</span>
          <span><Radio size={18} /> {statusLabel(routeRequestState, lessonState)}</span>
        </div>
      </section>

      <section className="workspace">
        <GoogleMapPanel
          features={kumamotoFeatures}
          origin={origin}
          destination={destination}
          candidates={routeSession?.candidates ?? []}
          selectedRoute={selectedRoute}
          lessonState={lessonState}
          routeRequestState={routeRequestState}
          completedLessons={completedLessons}
          onMapClick={handleMapClick}
        />

        <aside className="control-panel">
          <div className="lesson-goal-card">
            <div className="lesson-goal-icon" aria-hidden="true"><MapPin size={25} /></div>
            <div>
              <span className="panel-kicker">地点指定</span>
              <strong>{goalInstruction(routeRequestState, pointSelectionState)}</strong>
              <p>対象は熊本都市圏・近郊です。出発点と到着点がそろうとOSRMで候補ルートを計算します。</p>
            </div>
          </div>

          <section className="mission-card">
            <div className="mission-meta">
              <span><Navigation size={15} /> Dynamic route</span>
              <span><MapPin size={15} /> {routeMetaLabel(routeRequestState, pointSelectionState, routeSession?.candidates.length ?? 0)}</span>
            </div>
            <h2>地図クリックで出発地と到着地を指定</h2>
            <div className="trip-points">
              <div>
                <span>出発</span>
                <strong>{origin ? formatPoint(origin) : '未指定'}</strong>
                <small>1回目のクリック</small>
              </div>
              <Route size={20} />
              <div>
                <span>到着</span>
                <strong>{destination ? formatPoint(destination) : '未指定'}</strong>
                <small>2回目のクリック</small>
              </div>
            </div>
            <div className="action-row route-tools">
              <button type="button" className="ghost-action wide-action" onClick={resetRoute}>
                <RefreshCw size={18} /> リセット
              </button>
            </div>
          </section>

          {routeRequestState === 'loading' && (
            <section className="route-detail">
              <div className="section-title">
                <h2>ルート計算中</h2>
                <span><RefreshCw size={14} /> OSRM</span>
              </div>
              <p className="lesson-instruction">実道路の候補ルートと道路名ステップを取得しています。</p>
            </section>
          )}

          {routeRequestState === 'error' && (
            <section className="review-panel" aria-label="ルート計算エラー">
              <div className="section-title">
                <h2>ルートを取得できません</h2>
                <span>error</span>
              </div>
              <div className="review-needed">
                <TriangleAlert size={16} />
                <p>{routeError}</p>
              </div>
              <div className="action-row">
                <button type="button" className="primary-action" onClick={resetRoute}>
                  <RefreshCw size={18} /> 地点を指定し直す
                </button>
              </div>
            </section>
          )}

          {routeRequestState === 'ready' && selectedRoute && lessonState === 'selecting' && (
            <>
              <section className="route-selector" aria-label="候補ルート">
                <div className="section-title">
                  <h2>候補ルート</h2>
                  <span>{routeSession?.candidates.length ?? 0} routes</span>
                </div>
                <div className="route-list">
                  {routeSession?.candidates.map((route, index) => {
                    const active = route.id === selectedRoute.id
                    return (
                      <button
                        key={route.id}
                        type="button"
                        className={active ? 'route-option active' : 'route-option'}
                        onClick={() => selectRoute(route)}
                      >
                        <div>
                          <strong>候補 {index + 1}</strong>
                          <small>{route.quizFeatureSequence.slice(0, 4).map((hit) => hit.label).join(' / ') || '道路名なし'}</small>
                        </div>
                        <span><Clock3 size={14} /> {route.minutes}分</span>
                        <span className="risk">{distanceLabel(route.distanceMeters)}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="route-detail">
                <div className="section-title">
                  <h2>候補ルートの通過名</h2>
                  <span>{selectedRoute.summaryLabel}</span>
                </div>
                <div className="route-stats">
                  <div><span>所要</span><strong>{selectedRoute.minutes}分</strong></div>
                  <div><span>距離</span><strong>{distanceLabel(selectedRoute.distanceMeters)}</strong></div>
                  <div><span>道路</span><strong>{selectedRoute.roadNames.length}</strong></div>
                  <div><span>橋</span><strong>{selectedRoute.bridgeFeatureIds.length}</strong></div>
                </div>
                <div className="dynamic-feature-list" aria-label="通過する道路名と橋名">
                  {selectedRoute.quizFeatureSequence.map((hit, index) => (
                    <span key={`${hit.label}-${index}`} className={hit.type === 'bridge' ? 'feature-chip bridge-chip' : 'feature-chip'}>
                      {index + 1}. {hit.label}
                    </span>
                  ))}
                </div>
                <div className="learning-note">
                  <BrainCircuit size={17} />
                  <p>地図上の黒線はOSRMで取得した実道路ルートです。右の順番を見てから、ラベルを隠して思い出します。</p>
                </div>
                <div className="action-row">
                  <button type="button" className="primary-action" onClick={startLesson} disabled={!selectedRoute.quizFeatureSequence.length}>
                    <EyeOff size={18} /> ラベルを隠して覚える
                  </button>
                  <button type="button" className="ghost-action" onClick={resetRoute} aria-label="地点をリセット">
                    <RefreshCw size={18} />
                  </button>
                </div>
              </section>
            </>
          )}

          {lessonState === 'recalling' && selectedRoute && (
            <section className="recall-panel" aria-label="記憶チェック">
              <div className="section-title">
                <h2>記憶チェック</h2>
                <span><EyeOff size={14} /> ラベル非表示</span>
              </div>
              <p>{routeSession?.recallPrompt ?? '通過した道路名・橋名を順番に選んでください。'}</p>
              <div className="recall-sequence" aria-label="選択した順番">
                {recalledLabels.length ? (
                  recalledLabels.map((label, index) => (
                    <button key={`${label}-${index}`} type="button" onClick={() => removeRecallLabel(index)}>
                      <span>{index + 1}</span>{label}
                    </button>
                  ))
                ) : (
                  <div className="recall-empty">地図を思い出しながら、下の候補を順番に選択</div>
                )}
              </div>
              <div className="recall-options" aria-label="候補の道路名・橋名">
                {recallOptionLabels.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => selectRecallLabel(label)}
                    disabled={recalledLabels.includes(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="action-row">
                <button type="button" className="primary-action" onClick={submitRecall} disabled={!recalledLabels.length}>
                  <ListChecks size={18} /> 答え合わせ
                </button>
                <button type="button" className="ghost-action" onClick={resetRecall} aria-label="選択をリセット">
                  <RefreshCw size={18} />
                </button>
              </div>
            </section>
          )}

          {lessonState === 'reviewing' && latestLesson && (
            <section className="review-panel" aria-label="結果と復習">
              <div className="section-title">
                <h2>{latestPerfect ? '順番まで正解' : latestOrderWrong ? '順番を確認' : '復習ポイントあり'}</h2>
                <span>review</span>
              </div>
              <p>
                {latestPerfect
                  ? '通った道路名・橋名を正しい順番で思い出せました。'
                  : latestOrderWrong
                    ? '通った名前は合っています。順番だけもう一度確認しましょう。'
                    : '抜けた道路名・橋名を確認してください。'}
              </p>
              <div className="answer-block">
                <span>正しい順番</span>
                <div>{latestLesson.quizFeatureSequence.map((hit, index) => <strong key={`${hit.label}-${index}`}>{index + 1}. {hit.label}</strong>)}</div>
              </div>
              <div className="answer-block">
                <span>選んだ順番</span>
                <div>
                  {latestLesson.recalledLabels.length
                    ? latestLesson.recalledLabels.map((label, index) => <strong key={`${label}-${index}`}>{index + 1}. {label}</strong>)
                    : <strong>未選択</strong>}
                </div>
              </div>
              {!latestPerfect && (
                <div className="review-needed">
                  <TriangleAlert size={16} />
                  <p>復習: {weakLabels(latestLesson).join(' / ')}</p>
                </div>
              )}
              <div className="action-row">
                <button type="button" className="primary-action" onClick={backToRoutes}>
                  <Navigation size={18} /> ルート選択に戻る
                </button>
                <button type="button" className="ghost-action" onClick={resetRoute} aria-label="新しい地点を指定">
                  <MapPin size={18} />
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
            <h2>今回覚える道路名・橋名</h2>
            <p>{lessonState === 'recalling' ? '記憶チェック中は地図ラベルを隠しています。' : answerLabels.join(' / ') || '出発点と到着点を指定してください。'}</p>
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
                    <strong>{lesson.quizFeatureSequence.map((hit) => hit.label).join(' / ')}</strong>
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
            <p>{reviewLabels.length ? reviewLabels.join(' / ') : '今のところ復習対象はありません。'}</p>
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
