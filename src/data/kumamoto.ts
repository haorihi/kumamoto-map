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
      { lat: 32.7922, lng: 130.6964 },
      { lat: 32.7909, lng: 130.7004 },
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
