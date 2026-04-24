export type LatLng = { lat: number; lng: number }

export type TimeBand = 'morning' | 'midday' | 'evening' | 'night'

export type RoadFeature = {
  id: string
  name: string
  kana: string
  category: 'road' | 'bridge'
  aliases: string[]
  path: LatLng[]
  color: string
  hint: string
  taxiNote: string
  reason: string
  congestion: Record<TimeBand, number>
}

export type PickupPoint = {
  id: string
  name: string
  area: string
  position: LatLng
}

export type Passenger = {
  id: string
  name: string
  species: string
  mood: string
  avatar: string
  request: string
  thanks: string
}

export type RouteCandidate = {
  id: string
  name: string
  style: string
  featureIds: string[]
  path: LatLng[]
  minutes: Record<TimeBand, number>
  fare: number
  comfort: number
  merit: string
  demerit: string
  learningPoint: string
}

export type RideScenario = {
  id: string
  passengerId: string
  originId: string
  destinationId: string
  timeBand: TimeBand
  prompt: string
  candidates: RouteCandidate[]
}

export type CompletedRide = {
  id: string
  scenarioId: string
  passengerName: string
  origin: PickupPoint
  destination: PickupPoint
  route: RouteCandidate
  featureIds: string[]
  timeBand: TimeBand
  completedAtLabel: string
}

export const timeBands: Array<{ id: TimeBand; label: string; time: string }> = [
  { id: 'morning', label: '朝', time: '7:00-9:30' },
  { id: 'midday', label: '昼', time: '11:00-14:00' },
  { id: 'evening', label: '夕方', time: '17:00-19:30' },
  { id: 'night', label: '夜', time: '21:00-24:00' },
]

export const kumamotoFeatures: RoadFeature[] = [
  {
    id: 'route3',
    name: '国道3号',
    kana: 'こくどうさんごう',
    category: 'road',
    aliases: ['清水バイパス', '薩摩街道'],
    color: '#2563eb',
    path: [
      { lat: 32.8407, lng: 130.7244 },
      { lat: 32.8256, lng: 130.7187 },
      { lat: 32.8082, lng: 130.7116 },
      { lat: 32.7892, lng: 130.7047 },
      { lat: 32.7715, lng: 130.6974 },
    ],
    hint: '北区方面から中心部西側へ抜ける南北の幹線。',
    taxiNote: '熊本駅、上熊本、植木方面をつなぐ移動で位置感を作りやすい軸です。',
    reason: '幹線交通と生活道路からの流入が重なり、朝夕は交差点ごとの滞留が伸びやすい想定です。',
    congestion: { morning: 86, midday: 57, evening: 82, night: 36 },
  },
  {
    id: 'tram',
    name: '電車通り',
    kana: 'でんしゃどおり',
    category: 'road',
    aliases: ['市電沿い', '通町筋-水前寺線'],
    color: '#0f766e',
    path: [
      { lat: 32.8031, lng: 130.7079 },
      { lat: 32.8008, lng: 130.7136 },
      { lat: 32.7974, lng: 130.7219 },
      { lat: 32.7948, lng: 130.7304 },
      { lat: 32.7914, lng: 130.7401 },
    ],
    hint: '市電と並走し、通町筋から水前寺方面へ延びる中心軸。',
    taxiNote: '繁華街、ホテル、県庁方面の説明で頻出。停車位置と右左折制限に注意。',
    reason: '市電、バス、歩行者、商業施設の乗降が重なり、短い区間でも速度が落ちやすい場所です。',
    congestion: { morning: 78, midday: 66, evening: 88, night: 62 },
  },
  {
    id: 'sangyo',
    name: '産業道路',
    kana: 'さんぎょうどうろ',
    category: 'road',
    aliases: ['県道22号方面', '保田窪-健軍方面'],
    color: '#dc2626',
    path: [
      { lat: 32.8118, lng: 130.7295 },
      { lat: 32.8046, lng: 130.7399 },
      { lat: 32.7975, lng: 130.7518 },
      { lat: 32.7896, lng: 130.7635 },
    ],
    hint: '中心部東側を斜めに走り、保田窪・健軍方面を結ぶ。',
    taxiNote: '東区の住宅地、病院、商業施設へ向かう時の迂回判断に役立ちます。',
    reason: '生活道路からの合流と右折待ちが多く、夕方は買い物・帰宅交通が混ざります。',
    congestion: { morning: 73, midday: 55, evening: 84, night: 41 },
  },
  {
    id: 'higashi-bypass',
    name: '熊本東バイパス',
    kana: 'くまもとひがしばいぱす',
    category: 'road',
    aliases: ['東バイパス', '国道57号'],
    color: '#7c3aed',
    path: [
      { lat: 32.824, lng: 130.762 },
      { lat: 32.811, lng: 130.765 },
      { lat: 32.796, lng: 130.766 },
      { lat: 32.781, lng: 130.763 },
      { lat: 32.768, lng: 130.758 },
    ],
    hint: '市街地東側を南北に抜ける広いバイパス。',
    taxiNote: '郊外施設、空港方面、水前寺・健軍周辺の大きな移動で基準線になります。',
    reason: '広域移動とロードサイド施設への出入りが重なり、交差点単位で波が出ます。',
    congestion: { morning: 81, midday: 61, evening: 79, night: 43 },
  },
  {
    id: 'hamasen',
    name: '浜線バイパス',
    kana: 'はませんばいぱす',
    category: 'road',
    aliases: ['浜線', '国道266号方面'],
    color: '#ea580c',
    path: [
      { lat: 32.792, lng: 130.734 },
      { lat: 32.780, lng: 130.733 },
      { lat: 32.764, lng: 130.731 },
      { lat: 32.748, lng: 130.729 },
    ],
    hint: '南区・嘉島方面へ下る商業施設の多い幹線。',
    taxiNote: 'ゆめタウン周辺や南方面の送迎で「混む時間」を覚える価値が高い道です。',
    reason: '大型商業施設、右折入庫、休日交通の影響を受けやすい路線です。',
    congestion: { morning: 62, midday: 70, evening: 87, night: 48 },
  },
  {
    id: 'shirakawa-bridge',
    name: '白川橋',
    kana: 'しらかわばし',
    category: 'bridge',
    aliases: ['熊本駅近くの橋'],
    color: '#0891b2',
    path: [
      { lat: 32.78983, lng: 130.6924 },
      { lat: 32.78974, lng: 130.694 },
    ],
    hint: '熊本駅から中心市街地へ向かう時に意識したい白川の橋。',
    taxiNote: '駅発着の説明で「白川を渡る」感覚を作る入口になります。',
    reason: '駅前交通と中心部へ向かう車が合流し、信号待ちの影響が出やすい橋です。',
    congestion: { morning: 76, midday: 58, evening: 81, night: 45 },
  },
  {
    id: 'tahei-bridge',
    name: '泰平橋',
    kana: 'たいへいばし',
    category: 'bridge',
    aliases: ['たいへい橋'],
    color: '#16a34a',
    path: [
      { lat: 32.7974, lng: 130.6968 },
      { lat: 32.7962, lng: 130.7011 },
    ],
    hint: '熊本駅北側から市街地方面へ白川を渡る橋。',
    taxiNote: '駅北側、上熊本、中心部のつながりを覚える時のランドマークです。',
    reason: '駅周辺の送迎交通と橋詰め交差点の右左折が重なりやすい想定です。',
    congestion: { morning: 69, midday: 50, evening: 76, night: 38 },
  },
  {
    id: 'daiko-bridge',
    name: '大甲橋',
    kana: 'だいこうばし',
    category: 'bridge',
    aliases: ['大甲橋通り'],
    color: '#be123c',
    path: [
      { lat: 32.8012, lng: 130.7179 },
      { lat: 32.7978, lng: 130.7201 },
    ],
    hint: '水道町・九品寺方面の白川に架かる中心部の橋。',
    taxiNote: '繁華街から新屋敷、九品寺、水前寺方面へ抜ける感覚を作れます。',
    reason: '中心市街地の歩行者・バス・右折流入が多く、夕方に詰まりやすい地点です。',
    congestion: { morning: 72, midday: 63, evening: 86, night: 57 },
  },
  {
    id: 'chouroku-bridge',
    name: '長六橋',
    kana: 'ちょうろくばし',
    category: 'bridge',
    aliases: ['長六橋通り'],
    color: '#9333ea',
    path: [
      { lat: 32.7966, lng: 130.7111 },
      { lat: 32.7938, lng: 130.7139 },
    ],
    hint: '辛島町・河原町方面から白川を渡る橋。',
    taxiNote: '繁華街南側から九品寺、南熊本方面へ向かう時の分岐感覚に効きます。',
    reason: '中心部南側の流入、バス通行、橋詰め交差点が絡み、短距離でも待ちが発生します。',
    congestion: { morning: 67, midday: 56, evening: 80, night: 52 },
  },
]

export const center = { lat: 32.7959, lng: 130.7156 }

export const pickupPoints: PickupPoint[] = [
  { id: 'kumamoto-station', name: '熊本駅白川口', area: '熊本駅', position: { lat: 32.7904, lng: 130.6899 } },
  { id: 'karashima', name: '辛島町電停', area: '中心部南側', position: { lat: 32.7981, lng: 130.7055 } },
  { id: 'torichosuji', name: '通町筋', area: '中心市街地', position: { lat: 32.8031, lng: 130.7106 } },
  { id: 'suizenji', name: '水前寺公園前', area: '水前寺', position: { lat: 32.7909, lng: 130.7335 } },
  { id: 'kumamoto-castle', name: '熊本城・市役所前', area: '熊本城周辺', position: { lat: 32.8038, lng: 130.7077 } },
  { id: 'honjo', name: '本荘交差点', area: '本荘', position: { lat: 32.7937, lng: 130.7144 } },
  { id: 'kengun', name: '健軍町電停', area: '健軍', position: { lat: 32.7787, lng: 130.7616 } },
  { id: 'heisei', name: '平成駅前', area: '平成', position: { lat: 32.7816, lng: 130.7044 } },
]

export const passengers: Passenger[] = [
  {
    id: 'puku',
    name: 'ぷくモチ',
    species: 'まるい水辺の精',
    mood: '急ぎだが、揺れに弱い',
    avatar: 'ぷ',
    request: '白川の近くを通るなら、橋の名前も教えてほしいぷく。',
    thanks: '橋の名前、ちゃんと覚えたぷく。次もこの道でお願いしたいぷく。',
  },
  {
    id: 'nibi',
    name: 'ニビまる',
    species: '夜道を光る小さな客',
    mood: '混雑を避けたい',
    avatar: 'に',
    request: '時間は少しかかっても、詰まりにくい道がいいな。',
    thanks: '流れが読める運転だった。通りの名前も頭に残ったよ。',
  },
  {
    id: 'moko',
    name: 'モコリ',
    species: '雲みたいな旅好き',
    mood: '景色重視',
    avatar: 'も',
    request: '川を渡る瞬間が好き。どの橋を通るか楽しみにしてる。',
    thanks: '橋を渡る感じ、よかった。地図の向きも少しわかったよ。',
  },
  {
    id: 'ruri',
    name: 'ルリッカ',
    species: '青い羽の案内好き',
    mood: '早く着きたい',
    avatar: 'る',
    request: 'できるだけ早く。でも、なぜその道なのかも聞きたい。',
    thanks: '理由があるルート選びだったね。通りの名前も納得できた。',
  },
]

export const rideScenarios: RideScenario[] = [
  {
    id: 'station-to-toricho',
    passengerId: 'puku',
    originId: 'kumamoto-station',
    destinationId: 'torichosuji',
    timeBand: 'morning',
    prompt: '熊本駅から中心市街地へ。白川をどう渡るかを判断する依頼。',
    candidates: [
      {
        id: 'station-shirakawa-tram',
        name: '白川橋から電車通り',
        style: '基本を覚える',
        featureIds: ['shirakawa-bridge', 'tram'],
        path: [
          { lat: 32.7904, lng: 130.6899 },
          { lat: 32.78983, lng: 130.6924 },
          { lat: 32.78974, lng: 130.694 },
          { lat: 32.7952, lng: 130.7025 },
          { lat: 32.8031, lng: 130.7106 },
        ],
        minutes: { morning: 16, midday: 13, evening: 17, night: 11 },
        fare: 1680,
        comfort: 82,
        merit: '熊本駅から白川橋を渡る感覚が定着しやすい。',
        demerit: '朝夕は駅前と橋詰めで待ちが出やすい。',
        learningPoint: '熊本駅発で「白川橋を渡って中心部へ入る」基準線を作る。',
      },
      {
        id: 'station-tahei-castle',
        name: '泰平橋から城下町側',
        style: '北側回り',
        featureIds: ['tahei-bridge', 'route3'],
        path: [
          { lat: 32.7904, lng: 130.6899 },
          { lat: 32.7944, lng: 130.6928 },
          { lat: 32.7974, lng: 130.6968 },
          { lat: 32.8002, lng: 130.7031 },
          { lat: 32.8031, lng: 130.7106 },
        ],
        minutes: { morning: 18, midday: 14, evening: 18, night: 12 },
        fare: 1760,
        comfort: 76,
        merit: '駅北側から中心部へ入る別ルートを覚えられる。',
        demerit: '国道3号側の流れに引っ張られやすい。',
        learningPoint: '泰平橋は熊本駅北側から中心部へ入る橋として覚える。',
      },
      {
        id: 'station-chouroku-south',
        name: '長六橋から南側進入',
        style: '南側確認',
        featureIds: ['chouroku-bridge'],
        path: [
          { lat: 32.7904, lng: 130.6899 },
          { lat: 32.792, lng: 130.6985 },
          { lat: 32.7938, lng: 130.7139 },
          { lat: 32.7981, lng: 130.708 },
          { lat: 32.8031, lng: 130.7106 },
        ],
        minutes: { morning: 20, midday: 15, evening: 19, night: 13 },
        fare: 1840,
        comfort: 70,
        merit: '辛島町・河原町側から入る方向感を学べる。',
        demerit: '目的地に対してやや回り込みになる。',
        learningPoint: '長六橋は中心部南側へ入る橋として整理する。',
      },
    ],
  },
  {
    id: 'karashima-to-suizenji',
    passengerId: 'ruri',
    originId: 'karashima',
    destinationId: 'suizenji',
    timeBand: 'evening',
    prompt: '繁華街南側から水前寺方面へ。夕方の混雑をどう読むか。',
    candidates: [
      {
        id: 'karashima-daiko-tram',
        name: '大甲橋から電車通り',
        style: '中心軸',
        featureIds: ['daiko-bridge', 'tram'],
        path: [
          { lat: 32.7981, lng: 130.7055 },
          { lat: 32.8012, lng: 130.7179 },
          { lat: 32.7978, lng: 130.7201 },
          { lat: 32.7948, lng: 130.7304 },
          { lat: 32.7909, lng: 130.7335 },
        ],
        minutes: { morning: 15, midday: 13, evening: 19, night: 12 },
        fare: 1580,
        comfort: 78,
        merit: '電車通りの東西感を覚えやすい。',
        demerit: '夕方は市電・バス・歩行者で速度が落ちる。',
        learningPoint: '大甲橋から水前寺方面へ抜ける流れを覚える。',
      },
      {
        id: 'karashima-chouroku-honjo',
        name: '長六橋から本荘側',
        style: '南側回避',
        featureIds: ['chouroku-bridge'],
        path: [
          { lat: 32.7981, lng: 130.7055 },
          { lat: 32.7966, lng: 130.7111 },
          { lat: 32.7938, lng: 130.7139 },
          { lat: 32.7918, lng: 130.724 },
          { lat: 32.7909, lng: 130.7335 },
        ],
        minutes: { morning: 17, midday: 14, evening: 17, night: 12 },
        fare: 1660,
        comfort: 84,
        merit: '電車通りの混雑を少し避ける考え方を学べる。',
        demerit: '細かい道の方向感が必要。',
        learningPoint: '長六橋は南側から水前寺方面へ回す選択肢になる。',
      },
      {
        id: 'karashima-sangyo-east',
        name: '産業道路寄せ',
        style: '東側へ逃がす',
        featureIds: ['sangyo'],
        path: [
          { lat: 32.7981, lng: 130.7055 },
          { lat: 32.8006, lng: 130.718 },
          { lat: 32.8046, lng: 130.7399 },
          { lat: 32.7975, lng: 130.7518 },
          { lat: 32.7909, lng: 130.7335 },
        ],
        minutes: { morning: 19, midday: 15, evening: 20, night: 13 },
        fare: 1880,
        comfort: 68,
        merit: '産業道路の斜め軸を地図上で把握できる。',
        demerit: '水前寺に対しては遠回りで夕方のリスクもある。',
        learningPoint: '産業道路は東側の斜め軸。目的地次第で使い分ける。',
      },
    ],
  },
  {
    id: 'suizenji-to-kengun',
    passengerId: 'nibi',
    originId: 'suizenji',
    destinationId: 'kengun',
    timeBand: 'night',
    prompt: '水前寺から健軍へ。夜の見通しがよい道を選ぶ依頼。',
    candidates: [
      {
        id: 'suizenji-tram-kengun',
        name: '電車通りまっすぐ',
        style: 'わかりやすい',
        featureIds: ['tram'],
        path: [
          { lat: 32.7909, lng: 130.7335 },
          { lat: 32.7914, lng: 130.7401 },
          { lat: 32.7885, lng: 130.751 },
          { lat: 32.7787, lng: 130.7616 },
        ],
        minutes: { morning: 18, midday: 15, evening: 20, night: 12 },
        fare: 1720,
        comfort: 88,
        merit: '市電沿いで説明しやすく、夜は位置感を失いにくい。',
        demerit: '夕方は停車・乗降で遅くなりやすい。',
        learningPoint: '電車通りは水前寺から健軍へ続く東西の基本線。',
      },
      {
        id: 'suizenji-higashi-bypass',
        name: '東バイパス寄せ',
        style: '広い道',
        featureIds: ['higashi-bypass'],
        path: [
          { lat: 32.7909, lng: 130.7335 },
          { lat: 32.796, lng: 130.766 },
          { lat: 32.781, lng: 130.763 },
          { lat: 32.7787, lng: 130.7616 },
        ],
        minutes: { morning: 20, midday: 16, evening: 21, night: 13 },
        fare: 1880,
        comfort: 82,
        merit: '東バイパスの南北軸を確認できる。',
        demerit: '目的地によっては大きく回る。',
        learningPoint: '東バイパスは健軍周辺へ広く回す時の基準になる。',
      },
      {
        id: 'suizenji-sangyo-kengun',
        name: '産業道路から健軍',
        style: '混雑読み',
        featureIds: ['sangyo'],
        path: [
          { lat: 32.7909, lng: 130.7335 },
          { lat: 32.7975, lng: 130.7518 },
          { lat: 32.7896, lng: 130.7635 },
          { lat: 32.7787, lng: 130.7616 },
        ],
        minutes: { morning: 19, midday: 15, evening: 19, night: 12 },
        fare: 1800,
        comfort: 78,
        merit: '産業道路と健軍方面の接続感を覚えられる。',
        demerit: '時間帯によって右折や合流の詰まりが出る。',
        learningPoint: '産業道路は東区方面の送迎で頻出の判断材料。',
      },
    ],
  },
]
