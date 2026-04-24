import {
  BadgeCheck,
  Brain,
  Clock3,
  Eye,
  Flame,
  HelpCircle,
  Map,
  Navigation,
  RotateCcw,
  Sparkles,
  Timer,
  Waves,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import './App.css'
import { GoogleMapPanel } from './components/GoogleMapPanel'
import { kumamotoFeatures, timeBands, type RoadFeature, type TimeBand } from './data/kumamoto'

type GameMode = 'quiz' | 'route' | 'traffic'

const quizOrder = ['tram', 'shirakawa-bridge', 'sangyo', 'daiko-bridge', 'higashi-bypass', 'route3']

function pickOptions(answer: RoadFeature, round: number) {
  const pool = kumamotoFeatures.filter((feature) => feature.id !== answer.id)
  const first = pool[(round + 2) % pool.length]
  const second = pool[(round + 5) % pool.length]
  return [answer, first, second].sort((a, b) => a.name.localeCompare(b.name, 'ja'))
}

function App() {
  const [mode, setMode] = useState<GameMode>('quiz')
  const [round, setRound] = useState(0)
  const [selectedId, setSelectedId] = useState('tram')
  const [timeBand, setTimeBand] = useState<TimeBand>('evening')
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [trafficEnabled, setTrafficEnabled] = useState(true)

  const quizFeature = kumamotoFeatures.find((feature) => feature.id === quizOrder[round % quizOrder.length])!
  const selectedFeature = kumamotoFeatures.find((feature) => feature.id === selectedId) ?? quizFeature
  const activeFeature = mode === 'quiz' ? quizFeature : selectedFeature
  const options = useMemo(() => pickOptions(quizFeature, round), [quizFeature, round])

  const rankedCongestion = useMemo(
    () => [...kumamotoFeatures].sort((a, b) => b.congestion[timeBand] - a.congestion[timeBand]),
    [timeBand],
  )

  const answer = (feature: RoadFeature) => {
    const correct = feature.id === quizFeature.id
    setSelectedId(feature.id)
    setAnswerState(correct ? 'correct' : 'wrong')
    if (correct) {
      setScore((value) => value + 100 + streak * 20)
      setStreak((value) => value + 1)
      window.setTimeout(() => {
        setRound((value) => value + 1)
        setAnswerState('idle')
      }, 650)
    } else {
      setStreak(0)
    }
  }

  const nextQuestion = () => {
    setRound((value) => value + 1)
    setAnswerState('idle')
    setSelectedId(quizOrder[(round + 1) % quizOrder.length])
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow"><Navigation size={16} /> Kumamoto Taxi Road Trainer</p>
          <h1>熊本市内の道と橋を、走る前に体で覚える。</h1>
        </div>
        <div className="scoreboard" aria-label="スコア">
          <span><BadgeCheck size={18} /> {score.toLocaleString()} pt</span>
          <span><Flame size={18} /> {streak} streak</span>
        </div>
      </section>

      <section className="workspace">
        <GoogleMapPanel
          features={kumamotoFeatures}
          activeFeature={activeFeature}
          timeBand={timeBand}
          trafficEnabled={trafficEnabled}
        />

        <aside className="control-panel">
          <div className="mode-tabs" role="tablist" aria-label="学習モード">
            <button className={mode === 'quiz' ? 'active' : ''} onClick={() => setMode('quiz')} type="button">
              <Brain size={17} /> クイズ
            </button>
            <button className={mode === 'route' ? 'active' : ''} onClick={() => setMode('route')} type="button">
              <Map size={17} /> ルート
            </button>
            <button className={mode === 'traffic' ? 'active' : ''} onClick={() => setMode('traffic')} type="button">
              <Clock3 size={17} /> 混雑
            </button>
          </div>

          {mode === 'quiz' && (
            <section className="panel-section">
              <div className="question-head">
                <span><HelpCircle size={17} /> Round {round + 1}</span>
                <button type="button" className="icon-button" onClick={nextQuestion} aria-label="次の問題">
                  <RotateCcw size={18} />
                </button>
              </div>
              <h2>{quizFeature.hint}</h2>
              <p className="subtext">光っている場所に一致する名前を選んでください。</p>
              <div className="option-list">
                {options.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    className={selectedId === feature.id ? `option selected ${answerState}` : 'option'}
                    onClick={() => answer(feature)}
                  >
                    <span>{feature.category === 'bridge' ? <Waves size={18} /> : <Navigation size={18} />}</span>
                    <strong>{feature.name}</strong>
                    <small>{feature.kana}</small>
                  </button>
                ))}
              </div>
              {answerState !== 'idle' && (
                <div className={`feedback ${answerState}`}>
                  {answerState === 'correct' ? '正解。地図上の位置と名前が結びついてきています。' : `惜しい。正解は ${quizFeature.name} です。`}
                </div>
              )}
            </section>
          )}

          {mode === 'route' && (
            <section className="panel-section">
              <h2>名前から場所を呼び出す</h2>
              <p className="subtext">道路・橋を選ぶと地図上で強調され、タクシー目線のメモを確認できます。</p>
              <div className="feature-grid">
                {kumamotoFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    className={selectedFeature.id === feature.id ? 'feature-chip active' : 'feature-chip'}
                    onClick={() => setSelectedId(feature.id)}
                  >
                    <span style={{ background: feature.color }} />
                    {feature.name}
                  </button>
                ))}
              </div>
              <div className="route-card">
                <div className="route-title">
                  <strong>{selectedFeature.name}</strong>
                  <span>{selectedFeature.aliases.join(' / ')}</span>
                </div>
                <p>{selectedFeature.taxiNote}</p>
              </div>
            </section>
          )}

          {mode === 'traffic' && (
            <section className="panel-section">
              <div className="traffic-toggle">
                <h2>時間帯ごとの混雑感</h2>
                <label>
                  <input type="checkbox" checked={trafficEnabled} onChange={(event) => setTrafficEnabled(event.target.checked)} />
                  Google交通
                </label>
              </div>
              <div className="time-band-grid">
                {timeBands.map((band) => (
                  <button
                    key={band.id}
                    type="button"
                    className={timeBand === band.id ? 'time-band active' : 'time-band'}
                    onClick={() => setTimeBand(band.id)}
                  >
                    <Timer size={16} />
                    <strong>{band.label}</strong>
                    <small>{band.time}</small>
                  </button>
                ))}
              </div>
              <div className="rank-list">
                {rankedCongestion.slice(0, 5).map((feature, index) => (
                  <button key={feature.id} type="button" onClick={() => setSelectedId(feature.id)} className="rank-row">
                    <span>{index + 1}</span>
                    <strong>{feature.name}</strong>
                    <meter min="0" max="100" value={feature.congestion[timeBand]} />
                    <small>{feature.congestion[timeBand]}%</small>
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>
      </section>

      <section className="insight-band">
        <article>
          <Sparkles size={19} />
          <div>
            <h2>{activeFeature.name}</h2>
            <p>{activeFeature.reason}</p>
          </div>
        </article>
        <article>
          <Eye size={19} />
          <div>
            <h2>学習の狙い</h2>
            <p>名前、位置、混む理由を同時に見ることで、配車時や乗客への説明で使える道の記憶に変えます。</p>
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
