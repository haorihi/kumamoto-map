# Kumamoto Taxi Road Trainer

熊本市内でタクシー業務を始める前に、主要な道路名・橋名・混みやすい理由をゲーム感覚で覚えるためのウェブアプリです。

## できること

- 道路・橋の位置当てクイズ
- 道路名から地図上の場所を強調表示
- 朝・昼・夕方・夜の混雑傾向を可視化
- Google Maps API キーがある場合は Google Maps とリアルタイム交通レイヤーを表示
- API キーがない場合は OpenStreetMap の実地図タイルで操作可能

## 起動

```bash
npm install
npm run dev
```

Google Maps の交通レイヤーを使う場合は `.env.example` を参考に `.env` を作成します。

```bash
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_javascript_api_key
```

Google Cloud 側では Maps JavaScript API を有効化してください。リアルタイム交通表示は Google Maps JavaScript API の `TrafficLayer` を使用しています。API キー未設定時は OpenStreetMap タイルを使うため、Google Maps Platform の課金は発生しません。

## データについて

`src/data/kumamoto.ts` に、学習用の道路・橋・混雑傾向・理由を定義しています。現時点の混雑スコアは実測値ではなく、学習体験を作るためのサンプルです。

将来的には次のように発展できます。

- 乗務後のメモや走行ログを CSV で取り込む
- 時間帯、曜日、天気、イベント日で混雑傾向を分ける
- Google Directions API や Distance Matrix API と連携して所要時間差を比較する
- よく使う乗降地点からの「覚えるべき道順」を自動生成する
