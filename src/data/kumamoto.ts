export type LatLng = { lat: number; lng: number }

export type TimeBand = 'morning' | 'midday' | 'evening' | 'night'

export type RoadFeature = {
  id: string
  name: string
  kana: string
  category: 'road' | 'bridge'
  aliases: string[]
  path: LatLng[]
  labelPoint?: LatLng
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

export type RouteCandidate = {
  id: string
  name: string
  style: string
  featureIds: string[]
  routeGeometry: LatLng[]
  minutes: Record<TimeBand, number>
  fare: number
  comfort: number
  merit: string
  demerit: string
  learningPoint: string
}

export type LearningScenario = {
  id: string
  originId: string
  destinationId: string
  timeBand: TimeBand
  prompt: string
  learningGoal: string
  recallPrompt: string
  candidates: RouteCandidate[]
}

export type CompletedLesson = {
  id: string
  scenarioId: string
  origin: PickupPoint
  destination: PickupPoint
  selectedRoute: RouteCandidate
  featureIds: string[]
  recalledFeatureIds: string[]
  missedFeatureIds: string[]
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
    labelPoint: { lat: 32.7974, lng: 130.7219 },
    hint: '市電と並走し、通町筋から水前寺方面へ延びる中心軸。',
    taxiNote: '繁華街、ホテル、県庁方面の説明で頻出。停車位置と右左折制限に注意。',
    reason: '市電、バス、歩行者、商業施設の乗降が重なり、短い区間でも速度が落ちやすい場所です。',
    congestion: { morning: 78, midday: 66, evening: 88, night: 62 },
  },
  {
    id: 'tram-core',
    name: '電車通り',
    kana: 'でんしゃどおり',
    category: 'road',
    aliases: ['新市街-通町筋', '中心部の電車通り'],
    color: '#0f766e',
    path: [
      { lat: 32.7926, lng: 130.6962 },
      { lat: 32.7958, lng: 130.7009 },
      { lat: 32.7995, lng: 130.7058 },
      { lat: 32.8031, lng: 130.7106 },
    ],
    labelPoint: { lat: 32.7995, lng: 130.7058 },
    hint: '熊本駅側から新市街・通町筋へ入る時の中心部の軸。',
    taxiNote: '駅から中心街へ入る時は、白川を渡った後にこの軸へどうつなぐかが基準になります。',
    reason: '新市街、花畑町、通町筋へ向かう流れが集まり、朝夕は短距離でも速度差が出やすい区間です。',
    congestion: { morning: 74, midday: 61, evening: 86, night: 53 },
  },
  {
    id: 'route3-core',
    name: '国道3号',
    kana: 'こくどうさんごう',
    category: 'road',
    aliases: ['城下町側の3号線', '中心部西側の国道3号'],
    color: '#2563eb',
    path: [
      { lat: 32.7971, lng: 130.6994 },
      { lat: 32.7992, lng: 130.7017 },
      { lat: 32.8014, lng: 130.7048 },
      { lat: 32.8033, lng: 130.7077 },
    ],
    labelPoint: { lat: 32.8005, lng: 130.7034 },
    hint: '泰平橋から城下町・熊本城側へ寄せる時の国道3号。',
    taxiNote: '駅北側から城下町へ入る時の基準線ですが、北へ引っ張られすぎると遠回りになります。',
    reason: '熊本城側の流れと幹線交通が重なり、方向は分かりやすいが朝は滞留しやすい区間です。',
    congestion: { morning: 82, midday: 63, evening: 84, night: 42 },
  },
  {
    id: 'chouroku-dori',
    name: '長六橋通り',
    kana: 'ちょうろくばしどおり',
    category: 'road',
    aliases: ['河原町側', '新市街南側'],
    color: '#7c3aed',
    path: [
      { lat: 32.7938, lng: 130.7139 },
      { lat: 32.7962, lng: 130.7115 },
      { lat: 32.7992, lng: 130.7086 },
      { lat: 32.8021, lng: 130.7076 },
    ],
    labelPoint: { lat: 32.7981, lng: 130.7096 },
    hint: '長六橋から新市街南側へ寄せる時の軸。',
    taxiNote: '辛島町・河原町側から中心部へ回り込む時の向きが作りやすい道です。',
    reason: '橋詰めと南側の流入が重なり、回り込むぶん所要の振れ幅が出やすい区間です。',
    congestion: { morning: 71, midday: 58, evening: 79, night: 49 },
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
    labelPoint: { lat: 32.8046, lng: 130.7399 },
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
    labelPoint: { lat: 32.796, lng: 130.766 },
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
    labelPoint: { lat: 32.780, lng: 130.733 },
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
    labelPoint: { lat: 32.78979, lng: 130.6932 },
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
    labelPoint: { lat: 32.7968, lng: 130.69895 },
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
    labelPoint: { lat: 32.7995, lng: 130.719 },
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
    labelPoint: { lat: 32.7952, lng: 130.7125 },
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

const routeGeometries = {
  stationShirakawaTram: [
    { lat: 32.79025, lng: 130.690215 }, { lat: 32.791008, lng: 130.691134 }, { lat: 32.792584, lng: 130.693131 },
    { lat: 32.792613, lng: 130.693976 }, { lat: 32.792156, lng: 130.693527 }, { lat: 32.790833, lng: 130.692487 },
    { lat: 32.789899, lng: 130.692325 }, { lat: 32.789825, lng: 130.694004 }, { lat: 32.789884, lng: 130.695163 },
    { lat: 32.789961, lng: 130.696057 }, { lat: 32.790514, lng: 130.697068 }, { lat: 32.79167, lng: 130.697013 },
    { lat: 32.793107, lng: 130.697982 }, { lat: 32.793778, lng: 130.700381 }, { lat: 32.794731, lng: 130.701235 },
    { lat: 32.794802, lng: 130.701434 }, { lat: 32.794893, lng: 130.701844 }, { lat: 32.795025, lng: 130.70207 },
    { lat: 32.795498, lng: 130.703304 }, { lat: 32.795763, lng: 130.704064 }, { lat: 32.796079, lng: 130.70452 },
    { lat: 32.79664, lng: 130.706017 }, { lat: 32.797303, lng: 130.708317 }, { lat: 32.798118, lng: 130.710061 },
    { lat: 32.799311, lng: 130.71143 }, { lat: 32.80013, lng: 130.712066 }, { lat: 32.801876, lng: 130.712837 },
    { lat: 32.802522, lng: 130.71184 }, { lat: 32.802988, lng: 130.710527 }, { lat: 32.803014, lng: 130.710565 },
  ],
  stationTaheiCastle: [
    { lat: 32.79025, lng: 130.690215 }, { lat: 32.791008, lng: 130.691134 }, { lat: 32.792584, lng: 130.693131 },
    { lat: 32.793405, lng: 130.693027 }, { lat: 32.7944, lng: 130.692798 }, { lat: 32.794309, lng: 130.694742 },
    { lat: 32.797594, lng: 130.696333 }, { lat: 32.796991, lng: 130.69891 }, { lat: 32.79909, lng: 130.699358 },
    { lat: 32.799099, lng: 130.699982 }, { lat: 32.799794, lng: 130.700646 }, { lat: 32.799344, lng: 130.704016 },
    { lat: 32.799918, lng: 130.705114 }, { lat: 32.800637, lng: 130.705227 }, { lat: 32.802529, lng: 130.706592 },
    { lat: 32.803536, lng: 130.707519 }, { lat: 32.80433, lng: 130.708379 }, { lat: 32.803485, lng: 130.709661 },
    { lat: 32.80302, lng: 130.710543 }, { lat: 32.803014, lng: 130.710565 },
  ],
  stationChourokuSouth: [
    { lat: 32.79025, lng: 130.690215 }, { lat: 32.791008, lng: 130.691134 }, { lat: 32.790817, lng: 130.691092 },
    { lat: 32.789891, lng: 130.690169 }, { lat: 32.789743, lng: 130.691521 }, { lat: 32.789738, lng: 130.692398 },
    { lat: 32.789884, lng: 130.695163 }, { lat: 32.789961, lng: 130.696057 }, { lat: 32.790514, lng: 130.697068 },
    { lat: 32.791301, lng: 130.696766 }, { lat: 32.791576, lng: 130.698561 }, { lat: 32.791879, lng: 130.69972 },
    { lat: 32.792513, lng: 130.701074 }, { lat: 32.791428, lng: 130.702034 }, { lat: 32.792129, lng: 130.704073 },
    { lat: 32.793152, lng: 130.707081 }, { lat: 32.793625, lng: 130.708789 }, { lat: 32.794522, lng: 130.710796 },
    { lat: 32.793794, lng: 130.713278 }, { lat: 32.793887, lng: 130.714791 }, { lat: 32.79434, lng: 130.715736 },
    { lat: 32.795276, lng: 130.715893 }, { lat: 32.796873, lng: 130.71483 }, { lat: 32.79854, lng: 130.713031 },
    { lat: 32.799452, lng: 130.712012 }, { lat: 32.799157, lng: 130.711543 }, { lat: 32.797891, lng: 130.709858 },
    { lat: 32.798113, lng: 130.708671 }, { lat: 32.798189, lng: 130.708536 }, { lat: 32.798118, lng: 130.710061 },
    { lat: 32.799311, lng: 130.71143 }, { lat: 32.80013, lng: 130.712066 }, { lat: 32.801876, lng: 130.712837 },
    { lat: 32.802522, lng: 130.71184 }, { lat: 32.802988, lng: 130.710527 }, { lat: 32.803014, lng: 130.710565 },
  ],
  karashimaDaikoTram: [
    { lat: 32.798134, lng: 130.705445 }, { lat: 32.797008, lng: 130.70687 }, { lat: 32.797303, lng: 130.708317 },
    { lat: 32.798118, lng: 130.710061 }, { lat: 32.799311, lng: 130.71143 }, { lat: 32.80013, lng: 130.712066 },
    { lat: 32.801876, lng: 130.712837 }, { lat: 32.802329, lng: 130.713011 }, { lat: 32.801941, lng: 130.714251 },
    { lat: 32.800904, lng: 130.716302 }, { lat: 32.800886, lng: 130.717598 }, { lat: 32.801961, lng: 130.718598 },
    { lat: 32.800405, lng: 130.718167 }, { lat: 32.797689, lng: 130.719957 }, { lat: 32.797204, lng: 130.720496 },
    { lat: 32.796416, lng: 130.721842 }, { lat: 32.796062, lng: 130.72281 }, { lat: 32.795204, lng: 130.724667 },
    { lat: 32.794432, lng: 130.725783 }, { lat: 32.793578, lng: 130.727024 }, { lat: 32.794011, lng: 130.729506 },
    { lat: 32.795154, lng: 130.731032 }, { lat: 32.793973, lng: 130.731927 }, { lat: 32.791387, lng: 130.733134 },
    { lat: 32.791125, lng: 130.733498 },
  ],
  karashimaChourokuHonjo: [
    { lat: 32.798134, lng: 130.705445 }, { lat: 32.797008, lng: 130.70687 }, { lat: 32.797303, lng: 130.708317 },
    { lat: 32.798118, lng: 130.710061 }, { lat: 32.799311, lng: 130.71143 }, { lat: 32.799658, lng: 130.712129 },
    { lat: 32.799784, lng: 130.712259 }, { lat: 32.799603, lng: 130.71199 }, { lat: 32.798697, lng: 130.712842 },
    { lat: 32.797528, lng: 130.711442 }, { lat: 32.796781, lng: 130.71019 }, { lat: 32.795673, lng: 130.710129 },
    { lat: 32.793126, lng: 130.71158 }, { lat: 32.793837, lng: 130.713899 }, { lat: 32.794075, lng: 130.715713 },
    { lat: 32.79233, lng: 130.716564 }, { lat: 32.792611, lng: 130.717982 }, { lat: 32.79278, lng: 130.718512 },
    { lat: 32.793151, lng: 130.719534 }, { lat: 32.793687, lng: 130.720419 }, { lat: 32.794278, lng: 130.722395 },
    { lat: 32.793524, lng: 130.723172 }, { lat: 32.792423, lng: 130.724077 }, { lat: 32.791714, lng: 130.723884 },
    { lat: 32.792915, lng: 130.724946 }, { lat: 32.794274, lng: 130.725614 }, { lat: 32.794055, lng: 130.726365 },
    { lat: 32.792867, lng: 130.728056 }, { lat: 32.791249, lng: 130.730435 }, { lat: 32.791147, lng: 130.732126 },
    { lat: 32.791129, lng: 130.7328 }, { lat: 32.791125, lng: 130.733498 },
  ],
  karashimaSangyoEast: [
    { lat: 32.798134, lng: 130.705445 }, { lat: 32.797008, lng: 130.70687 }, { lat: 32.797303, lng: 130.708317 },
    { lat: 32.798118, lng: 130.710061 }, { lat: 32.799311, lng: 130.71143 }, { lat: 32.80013, lng: 130.712066 },
    { lat: 32.801876, lng: 130.712837 }, { lat: 32.802329, lng: 130.713011 }, { lat: 32.801941, lng: 130.714251 },
    { lat: 32.800904, lng: 130.716302 }, { lat: 32.799749, lng: 130.717668 }, { lat: 32.800933, lng: 130.718528 },
    { lat: 32.799044, lng: 130.718455 }, { lat: 32.797331, lng: 130.720345 }, { lat: 32.796627, lng: 130.721368 },
    { lat: 32.796142, lng: 130.722589 }, { lat: 32.795586, lng: 130.724069 }, { lat: 32.794934, lng: 130.725079 },
    { lat: 32.79371, lng: 130.726844 }, { lat: 32.794068, lng: 130.727376 }, { lat: 32.795187, lng: 130.728617 },
    { lat: 32.796659, lng: 130.730241 }, { lat: 32.798066, lng: 130.731725 }, { lat: 32.80037, lng: 130.734213 },
    { lat: 32.803042, lng: 130.737117 }, { lat: 32.803898, lng: 130.738041 }, { lat: 32.804578, lng: 130.739835 },
    { lat: 32.803656, lng: 130.74205 }, { lat: 32.80211, lng: 130.74397 }, { lat: 32.80175, lng: 130.744554 },
    { lat: 32.800592, lng: 130.746528 }, { lat: 32.799832, lng: 130.74895 }, { lat: 32.800036, lng: 130.750641 },
    { lat: 32.79842, lng: 130.751789 }, { lat: 32.7975, lng: 130.751036 }, { lat: 32.797056, lng: 130.749422 },
    { lat: 32.79714, lng: 130.748902 }, { lat: 32.797379, lng: 130.74812 }, { lat: 32.797492, lng: 130.747127 },
    { lat: 32.797523, lng: 130.745012 }, { lat: 32.797424, lng: 130.744166 }, { lat: 32.796105, lng: 130.743244 },
    { lat: 32.794863, lng: 130.742522 }, { lat: 32.793954, lng: 130.74221 }, { lat: 32.793089, lng: 130.741403 },
    { lat: 32.792706, lng: 130.738529 }, { lat: 32.792583, lng: 130.736786 }, { lat: 32.792513, lng: 130.734935 },
    { lat: 32.792358, lng: 130.733407 }, { lat: 32.791387, lng: 130.733134 }, { lat: 32.791125, lng: 130.733498 },
  ],
  suizenjiTramKengun: [
    { lat: 32.791125, lng: 130.733498 }, { lat: 32.791134, lng: 130.732445 }, { lat: 32.790182, lng: 130.732418 },
    { lat: 32.788534, lng: 130.734631 }, { lat: 32.787452, lng: 130.736638 }, { lat: 32.789004, lng: 130.738681 },
    { lat: 32.79049, lng: 130.739632 }, { lat: 32.79202, lng: 130.740675 }, { lat: 32.792987, lng: 130.74278 },
    { lat: 32.792836, lng: 130.74483 }, { lat: 32.791373, lng: 130.745461 }, { lat: 32.789644, lng: 130.745924 },
    { lat: 32.787891, lng: 130.74758 }, { lat: 32.787995, lng: 130.750704 }, { lat: 32.788075, lng: 130.752722 },
    { lat: 32.785283, lng: 130.753792 }, { lat: 32.783948, lng: 130.754125 }, { lat: 32.782841, lng: 130.754046 },
    { lat: 32.781382, lng: 130.753285 }, { lat: 32.780639, lng: 130.75457 }, { lat: 32.779484, lng: 130.757647 },
    { lat: 32.778738, lng: 130.759756 }, { lat: 32.778703, lng: 130.761355 },
  ],
  suizenjiHigashiBypass: [
    { lat: 32.791125, lng: 130.733498 }, { lat: 32.792418, lng: 130.732841 }, { lat: 32.792366, lng: 130.733866 },
    { lat: 32.792527, lng: 130.735474 }, { lat: 32.792625, lng: 130.73769 }, { lat: 32.792819, lng: 130.739264 },
    { lat: 32.793273, lng: 130.741683 }, { lat: 32.794257, lng: 130.742385 }, { lat: 32.795323, lng: 130.742736 },
    { lat: 32.796411, lng: 130.743432 }, { lat: 32.79748, lng: 130.744569 }, { lat: 32.797535, lng: 130.745441 },
    { lat: 32.797453, lng: 130.747655 }, { lat: 32.797342, lng: 130.748266 }, { lat: 32.797031, lng: 130.749237 },
    { lat: 32.796148, lng: 130.751171 }, { lat: 32.795619, lng: 130.752482 }, { lat: 32.796507, lng: 130.755496 },
    { lat: 32.797179, lng: 130.757609 }, { lat: 32.797529, lng: 130.758708 }, { lat: 32.798021, lng: 130.760233 },
    { lat: 32.798654, lng: 130.762224 }, { lat: 32.79793, lng: 130.763765 }, { lat: 32.796009, lng: 130.766397 },
    { lat: 32.795397, lng: 130.765434 }, { lat: 32.794584, lng: 130.764595 }, { lat: 32.791852, lng: 130.764019 },
    { lat: 32.785815, lng: 130.765206 }, { lat: 32.781041, lng: 130.765926 }, { lat: 32.781032, lng: 130.763464 },
    { lat: 32.780472, lng: 130.761974 }, { lat: 32.778846, lng: 130.761358 }, { lat: 32.778703, lng: 130.761355 },
  ],
  suizenjiSangyoKengun: [
    { lat: 32.791125, lng: 130.733498 }, { lat: 32.792418, lng: 130.732841 }, { lat: 32.792366, lng: 130.733866 },
    { lat: 32.792527, lng: 130.735474 }, { lat: 32.792625, lng: 130.73769 }, { lat: 32.792819, lng: 130.739264 },
    { lat: 32.793273, lng: 130.741683 }, { lat: 32.794257, lng: 130.742385 }, { lat: 32.795323, lng: 130.742736 },
    { lat: 32.796411, lng: 130.743432 }, { lat: 32.79748, lng: 130.744569 }, { lat: 32.797535, lng: 130.745441 },
    { lat: 32.797453, lng: 130.747655 }, { lat: 32.797342, lng: 130.748266 }, { lat: 32.797031, lng: 130.749237 },
    { lat: 32.796949, lng: 130.749726 }, { lat: 32.797587, lng: 130.751784 }, { lat: 32.796001, lng: 130.752382 },
    { lat: 32.794748, lng: 130.75306 }, { lat: 32.792177, lng: 130.752591 }, { lat: 32.79044, lng: 130.752881 },
    { lat: 32.78819, lng: 130.755094 }, { lat: 32.788339, lng: 130.758602 }, { lat: 32.788387, lng: 130.759953 },
    { lat: 32.787825, lng: 130.762277 }, { lat: 32.788773, lng: 130.762194 }, { lat: 32.789631, lng: 130.762738 },
    { lat: 32.788173, lng: 130.764761 }, { lat: 32.787767, lng: 130.762386 }, { lat: 32.787225, lng: 130.760094 },
    { lat: 32.783871, lng: 130.760696 }, { lat: 32.780389, lng: 130.761361 }, { lat: 32.778703, lng: 130.761355 },
  ],
} as const satisfies Record<string, LatLng[]>

export const learningScenarios: LearningScenario[] = [
  {
    id: 'station-to-toricho',
    originId: 'kumamoto-station',
    destinationId: 'torichosuji',
    timeBand: 'morning',
    prompt: '熊本駅から中心市街地へ。白川をどう渡るかを判断する課題。',
    learningGoal: '熊本駅から中心部へ入る時の白川の渡り方を覚える。',
    recallPrompt: '選んだルートで通る橋・通りを順番に選んでください。',
    candidates: [
      {
        id: 'station-shirakawa-tram',
        name: '白川橋から電車通り',
        style: '基本を覚える',
        featureIds: ['shirakawa-bridge', 'tram-core'],
        routeGeometry: routeGeometries.stationShirakawaTram,
        minutes: { morning: 16, midday: 13, evening: 18, night: 11 },
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
        featureIds: ['tahei-bridge', 'route3-core'],
        routeGeometry: routeGeometries.stationTaheiCastle,
        minutes: { morning: 22, midday: 17, evening: 24, night: 14 },
        fare: 1880,
        comfort: 73,
        merit: '駅北側から熊本城・城下町側へ寄せる別ルートを覚えられる。',
        demerit: '通町筋へは北側に振れるぶん距離が伸びやすい。',
        learningPoint: '泰平橋は「北側から中心部へ入る」判断として白川橋と区別して覚える。',
      },
      {
        id: 'station-chouroku-south',
        name: '長六橋から南側進入',
        style: '南側確認',
        featureIds: ['chouroku-bridge', 'chouroku-dori'],
        routeGeometry: routeGeometries.stationChourokuSouth,
        minutes: { morning: 25, midday: 19, evening: 27, night: 16 },
        fare: 1980,
        comfort: 66,
        merit: '辛島町・新市街南側から中心部へ回り込む感覚を学べる。',
        demerit: '通町筋に対しては南へ振ってから戻るぶん最も遠回りになりやすい。',
        learningPoint: '長六橋は「南側確認用の回り込みルート」として白川橋と切り分けて覚える。',
      },
    ],
  },
  {
    id: 'karashima-to-suizenji',
    originId: 'karashima',
    destinationId: 'suizenji',
    timeBand: 'evening',
    prompt: '繁華街南側から水前寺方面へ。夕方の混雑をどう読むか。',
    learningGoal: '辛島町から水前寺方面へ抜ける中心部東西軸を整理する。',
    recallPrompt: 'どの橋・通りを使って水前寺方面へ向かったかを順番に選んでください。',
    candidates: [
      {
        id: 'karashima-daiko-tram',
        name: '大甲橋から電車通り',
        style: '中心軸',
        featureIds: ['daiko-bridge', 'tram'],
        routeGeometry: routeGeometries.karashimaDaikoTram,
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
        routeGeometry: routeGeometries.karashimaChourokuHonjo,
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
        routeGeometry: routeGeometries.karashimaSangyoEast,
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
    originId: 'suizenji',
    destinationId: 'kengun',
    timeBand: 'night',
    prompt: '水前寺から健軍へ。夜の見通しがよい道を選ぶ課題。',
    learningGoal: '水前寺から健軍へ続く東側の基本線と迂回軸を覚える。',
    recallPrompt: '水前寺から健軍へ向かう時に通った道を順番に選んでください。',
    candidates: [
      {
        id: 'suizenji-tram-kengun',
        name: '電車通りまっすぐ',
        style: 'わかりやすい',
        featureIds: ['tram'],
        routeGeometry: routeGeometries.suizenjiTramKengun,
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
        routeGeometry: routeGeometries.suizenjiHigashiBypass,
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
        routeGeometry: routeGeometries.suizenjiSangyoKengun,
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
