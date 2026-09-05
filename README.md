# Chinese Restaurant Menu

スマホ表示を前提にした、GitHub Pages向けのシンプルな中華料理メニューです。

## ファイル構成

```text
/
├── index.html
├── style.css
├── script.js
├── menu.csv
└── images/
    ├── cucumber.jpg
    ├── mapo-tofu.jpg
    └── ...
```

## データ管理

料理データは `menu.csv` に集約しています。

`写真ファイル名` に `images/` 以下のファイル名を指定すると、その画像が料理カードに表示されます。

例:

```csv
...,写真ファイル名,ソート順
...,mapo-tofu.jpg,2
```

## GitHub Pages

リポジトリ直下にファイルを置き、GitHub Pagesで `main` ブランチのルートを公開すれば動作します。

※ `index.html` を直接ブラウザの `file://` で開くと、ブラウザのセキュリティ制限によりCSVを読み込めない場合があります。GitHub Pages上で確認してください。
