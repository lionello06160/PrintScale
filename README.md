# PrintScale

[![CI](https://github.com/lionello06160/PrintScale/actions/workflows/ci.yml/badge.svg)](https://github.com/lionello06160/PrintScale/actions/workflows/ci.yml)

**[開啟網站 / Open app / アプリを開く](https://printscale-studio.lionel0616.chatgpt.site/)** · **[下載版本 / Releases / リリース](https://github.com/lionello06160/PrintScale/releases)**

[繁體中文](#繁體中文) · [English](#english) · [日本語](#日本語)

### v1.0.4

- **繁中：** 語言切換改為網站配色的圓角選單，支援鍵盤與觸控。英吋測試尺改為精確 4 in（101.6 mm），公式依測試尺基準計算；mm／cm 仍為100 mm／10 cm，舊校正設定相容。
- **English:** A rounded language menu matches the site and supports keyboard/touch input. New inch rulers use exactly 4 in (101.6 mm), with matching correction math. mm/cm rulers remain 100 mm/10 cm; legacy profiles retain their original reference.
- **日本語：** 言語切替をサイトに合う角丸メニューに変更し、キーボードとタッチに対応しました。インチ定規は正確な4 in（101.6 mm）とし、その基準長で補正します。mm／cmは100 mm／10 cmのまま、既存の校正設定も保持します。

### v1.0.3

- **繁中：** 測試尺、PDF 刻度與量測輸入跟隨成品的 mm／cm／in 選擇。實際尺長仍為 100 mm＝10 cm≈3.93700787 in，切換單位不改變校正係數。
- **English:** Ruler labels, PDF ticks and measurement inputs follow the selected mm/cm/in unit. The reference remains exactly 100 mm (10 cm / approximately 3.93700787 in); switching units preserves calibration factors.
- **日本語：** 定規・PDF目盛り・実測値の単位を仕上がり寸法の mm／cm／in に連動させました。基準の実寸は100 mm（10 cm／約3.93700787 in）のまま、単位を切り替えても補正係数を保持します。

### v1.0.2

- **繁中：** 頂部介紹區更扁，減少上下留白、縮小裝飾插圖，保留放大字級。1200 px 英文畫面高度減少約 42%；三語與手機排版均已檢查。
- **English:** A more compact introduction with less vertical spacing and a smaller illustration, preserving readable font sizes. Hero height is about 42% lower in the 1200 px English view; all three languages and mobile layouts were checked.
- **日本語：** 文字サイズを維持しながら上下の余白とイラストを小さくし、導入部分をコンパクトにしました。英語・幅1200 pxでは高さを約42%削減し、3言語とモバイル表示を確認しました。

### v1.0.1

- **繁中：** 操作文字放大為 14–16 px、章節標題 18 px。PDF 改用粗黑裁切角線與圓靶十字，並附符號說明；紙張與成品實際尺寸維持不變。
- **English:** Controls and helper text now use 14–16 px, with 18 px section headings. PDFs use bold black cut ticks and crosshair targets with a symbol legend; physical paper and poster sizes remain unchanged.
- **日本語：** 操作・説明文字を 14–16 px、見出しを 18 px に拡大しました。PDF は太い黒の裁断線と丸い十字マークを使用し、凡例を追加しました。用紙と仕上がりの実寸は変わりません。

<a id="繁體中文"></a>
## 繁體中文

PrintScale 是免費、免登入的海報分頁列印工具。設定實際成品尺寸，即可將圖片拆成家用印表機可列印的 PDF。介面支援繁體中文、英文與日文，適用桌面及手機。

### 功能

- **圖片本機處理：** PNG、JPG、WebP 拖放上傳、旋轉及圖形裁切。拖曳選取框或八個控制點調整範圍，也可輸入百分比微調；確認套用才更新成品，原始檔保留。
- **實際尺寸：** mm／cm／in、比例鎖定、留白或填滿。支援 A3、A4、A5、Letter、Legal、Tabloid、自訂紙張、四邊相同的安全邊界、重疊及紙張方向。
- **兩種分頁方案：**「精準對齊」優先減少接縫總長，再比較張數；「省紙優先」優先減少張數，再比較剩餘面積。兩者都保留指定成品尺寸、安全邊界與重疊，不會暗中縮放；條件相同時可能得到同一方案。
- **PDF 與拼接：** 分頁 PDF、原尺寸單頁 PDF、實際匯出 PDF 預覽、重疊黏貼／精準對切、裁切線、對位標記及獨立拼接指引。每頁分頁 PDF 的 MediaBox／CropBox 等於選定紙張大小；匯出後重新檢查幾何資料。
- **位置提示：** 完整拼接地圖、頁碼、行列及相鄰頁導覽。開啟頁碼且邊界足夠時，紙上印出位置小地圖、朝上箭頭及行列標籤，方便大量紙張定位。
- **印表機校正：** 下載未補償的 100 mm 橫／縱測試尺，輸入實際量測值並儲存本機校正檔。另行產生清楚標示的補償 PDF；標準 PDF 及原尺寸單頁 PDF 維持原設定。補償後可能需要更多紙張。

### 使用方式

1. 開啟網站，上傳圖片或載入範例，視需要旋轉與裁切。
2. 設定成品尺寸、紙張、安全邊界及重疊；比較兩種分頁方案。
3. 選擇拼接方式，查看實際 PDF 預覽與位置地圖，再下載 PDF／指引。
4. 用 PDF 閱讀器選擇 **實際大小／100%**，紙張與網站一致；關閉「符合頁面」及無邊界自動放大，先試印一張。
5. 如需校正，使用相同印表機、紙張方向及驅動設定列印測試尺，分別量測 X／Y，再測試補償輸出。

### 尺寸驗證範例

**350 × 466.7 mm 海報 + A4 210 × 297 mm + 四邊 15 mm 安全邊界 + 10 mm 重疊 → 2 欄 × 2 列，共 4 張。** 可列印區為 180 × 267 mm，分頁步距為 170／257 mm。每頁分頁 PDF 的 MediaBox 與 CropBox 都是 **210 × 297 mm**；原尺寸單頁為 **350 × 466.7 mm**。剩餘空間保持留白。

### 本機執行與驗證

建議 Node.js 24（最低 22.13）。不需 API 金鑰或後端服務。

```sh
git clone https://github.com/lionello06160/PrintScale.git
cd PrintScale
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

建置結果在 `dist/`，可部署於靜態網站的根目錄。Release 亦提供建置壓縮檔，解壓後透過 HTTP 伺服器提供服務。自動測試涵蓋分頁、裁切、校正、位置提示及實際 PDF 資料；詳見 [驗證紀錄](VERIFICATION.md) 與 [技術說明（英文）](docs/TECHNICAL.md)。

### 隱私與限制

圖片與 PDF 在瀏覽器內處理，不上傳到伺服器；無登入或分析追蹤。只有語言及印表機／校正設定儲存在本機，重新整理會清除圖片與匯出結果。

- 圖片上限：40 MB、4,000 萬像素、單邊 16,000 px；成品與自訂紙張單邊 1–5,080 mm，最多 200 頁。大圖可能暫時占用主執行緒。
- 預覽總覽顯示前 16 頁，完整地圖可跳至任一頁；下載包含全部頁面。紙上位置圖需要至少 12 mm 邊界及 40 mm 可列印寬度；不足時介面會提示。
- 解析度警示供參考；PDF 尺寸正確仍可能受驅動縮放與機械誤差影響。尚未進行實體印表機、Safari／Firefox 或實機手機驗證。Chromium 與觸控模擬測試不代表實機認證。
- V1 不含 CMYK 色彩管理、離線安裝、混合紙張或進階錯位分頁。

<a id="english"></a>
## English

PrintScale is a free poster tiling tool that requires no account. Set the finished physical size and turn an image into printable PDF sheets. The responsive interface supports Traditional Chinese, English and Japanese.

### Features

- **Local image processing:** drag and drop PNG, JPG or WebP; rotate and crop visually using a movable frame and eight handles, with optional percentage inputs. Changes apply only after confirmation; the original stays intact.
- **Physical dimensions:** mm/cm/in, aspect lock, contain or fill. A3/A4/A5/Letter/Legal/Tabloid/custom paper, equal safe margins, overlap and orientation.
- **Comparable layouts:** Precision minimizes total internal seam length, then sheet count. Paper saver minimizes sheet count, then unused area. Both preserve the requested finished size, margins and overlap without hidden scaling. Identical recommendations are possible.
- **PDF and assembly:** tiled PDF, original-size single-page PDF, previews rendered from the exported bytes, overlap/glue or butt-joint assembly, crop/registration marks and a separate assembly guide. Each tiled page's MediaBox/CropBox equals the selected paper size. Serialized output undergoes geometry validation.
- **Sheet location hints:** a complete assembly map, page numbers, row/column coordinates and neighbour navigation. With page numbers enabled and sufficient margins, printed sheets include a mini map, an upright arrow and position labels.
- **Printer calibration:** print an uncompensated 100 mm X/Y ruler, enter measured lengths and save local calibration profiles. Compensation produces a separate, clearly labelled PDF; standard and original-size PDFs remain unchanged. Corrected tiling may use additional sheets.

### How to use

1. Open the app, upload an image or load the sample, then rotate/crop if needed.
2. Set the finished size, paper, safe margin and overlap. Compare both layout modes.
3. Choose an assembly method, inspect the actual PDF preview and map, then download the PDF and guide.
4. Print from a PDF reader at **Actual size / 100%**, with matching paper. Disable Fit and automatic borderless enlargement. Test one sheet first.
5. For calibration, print and measure X/Y using the same printer, paper orientation and driver settings, then test the corrected output.

### Verified geometry example

**350 × 466.7 mm poster + A4 210 × 297 mm + 15 mm margins + 10 mm overlap → 2 columns × 2 rows = 4 sheets.** The printable region is 180 × 267 mm and the strides are 170/257 mm. Every tiled page has **210 × 297 mm** MediaBox and CropBox values; the original-size PDF has one **350 × 466.7 mm** page. Unused space stays blank.

### Local development and checks

Node.js 24 is recommended (minimum 22.13). No API keys or backend are required.

```sh
git clone https://github.com/lionello06160/PrintScale.git
cd PrintScale
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

Deploy `dist/` at the root of a static web host. Releases also include a built archive; extract and serve it over HTTP. Automated checks cover tiling, crop, calibration, page locations and serialized PDF data. See [verification results](VERIFICATION.md) and [technical details](docs/TECHNICAL.md).

### Privacy and limits

Images and PDFs stay in the browser; there are no image uploads, accounts or analytics. Only language and printer/calibration settings persist locally. Refreshing clears images and generated exports.

- Image limits: 40 MB, 40 megapixels, 16,000 px per edge. Finished/custom paper dimensions: 1–5,080 mm per edge; at most 200 sheets. Large images may temporarily occupy the main thread.
- Overview shows the first 16 pages; the complete map can jump to any page and exports contain all pages. Printed mini maps require at least 12 mm margins and 40 mm printable width; the UI warns when omitted.
- Resolution warnings are advisory. Correct PDF geometry cannot prevent printer-driver scaling or mechanical error. Physical printers, Safari/Firefox and real mobile devices have not been verified. Chromium viewport/touch emulation is not device certification.
- V1 excludes CMYK colour management, offline installation, mixed paper and advanced staggered tiling.

<a id="日本語"></a>
## 日本語

PrintScale は、登録不要・無料のポスター分割印刷ツールです。仕上がりの実寸を指定し、画像を家庭用プリンターで印刷できる PDF に分割します。繁体字中国語・英語・日本語に対応し、パソコンとスマートフォンで利用できます。

### 機能

- **端末内の画像処理：** PNG・JPG・WebP のドラッグ＆ドロップ、回転、視覚的なトリミング。選択枠と8つのハンドルをドラッグでき、パーセント入力で微調整も可能です。適用するまで変更は確定せず、元画像を保持します。
- **実寸指定：** mm／cm／in、縦横比固定、余白を残す／全面に合わせる配置。A3・A4・A5・Letter・Legal・Tabloid・カスタム用紙、四辺共通の安全余白、重なり幅、用紙方向に対応します。
- **比較できる分割案：** 精密モードは内部の継ぎ目の合計長を優先し、次に枚数を比較します。用紙節約モードは枚数を優先し、次に余り面積を比較します。どちらも指定した仕上がり寸法・余白・重なり幅を保持し、自動で縮小しません。同じ結果になる場合もあります。
- **PDF と貼り合わせ：** 分割 PDF、実寸の1ページ PDF、書き出した PDF からのプレビュー、重ね貼り／突き合わせ、裁断線、位置合わせマーク、別冊の組み立てガイド。各分割ページの MediaBox／CropBox は選択した用紙の実寸と一致し、書き出し後に幾何情報を検証します。
- **位置の目印：** 全ページの配置図、ページ番号、行・列、隣接ページへの移動。ページ番号が有効で余白が十分な場合、印刷物にもミニ配置図、上向き矢印、位置ラベルを追加します。
- **プリンター補正：** 補正なしの縦横 100 mm 定規を印刷し、実測値を入力して端末内に保存できます。補正 PDF は明示された別ファイルとして作成し、標準 PDF と実寸1ページ PDF は変更しません。補正後は枚数が増える場合があります。

### 使い方

1. アプリを開き、画像を選ぶかサンプルを読み込み、必要に応じて回転・トリミングします。
2. 仕上がり寸法、用紙、安全余白、重なり幅を設定し、2つの分割案を比較します。
3. 貼り合わせ方法を選び、実際の PDF プレビューと配置図を確認して PDF とガイドをダウンロードします。
4. PDF リーダーで **実際のサイズ／100%** を選び、用紙を一致させます。「用紙に合わせる」とフチなし自動拡大を無効にし、まず1枚を試し刷りします。
5. 補正する場合は、同じプリンター・用紙方向・ドライバー設定で定規を印刷し、X／Y を個別に測定して補正結果を確認します。

### 寸法の検証例

**350 × 466.7 mm のポスター ＋ A4 210 × 297 mm ＋ 四辺 15 mm の余白 ＋ 10 mm の重なり → 2列 × 2行、計4枚。** 印刷可能領域は 180 × 267 mm、送り幅は横 170 mm／縦 257 mm です。分割 PDF の全ページの MediaBox と CropBox は **210 × 297 mm**、実寸1ページ PDF は **350 × 466.7 mm** です。余った領域は白いまま残します。

### ローカル実行と検証

Node.js 24 を推奨します（最低 22.13）。API キーやバックエンドは不要です。

```sh
git clone https://github.com/lionello06160/PrintScale.git
cd PrintScale
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

`dist/` を静的ホスティングのルートに配置します。リリースのビルド済み ZIP も利用でき、展開後に HTTP サーバーで配信してください。自動テストは分割、トリミング、補正、ページ位置、書き出した PDF を検証します。[検証記録](VERIFICATION.md) と [技術説明（英語）](docs/TECHNICAL.md) を参照してください。

### プライバシーと制限

画像と PDF はブラウザー内で処理され、サーバーにアップロードしません。ログインやアクセス解析はありません。言語とプリンター／補正設定のみ端末に保存し、再読み込みすると画像と出力データは消去されます。

- 画像は 40 MB・4,000万画素・一辺 16,000 px まで。仕上がりとカスタム用紙は一辺 1–5,080 mm、分割は最大 200 ページです。大きな画像では処理中に操作が一時的に重くなる場合があります。
- 一覧プレビューは最初の16ページを表示し、全体配置図から任意のページへ移動できます。ダウンロードには全ページを含みます。印刷するミニ配置図には 12 mm 以上の余白と 40 mm 以上の印刷可能幅が必要で、不足時は画面に通知します。
- 解像度の警告は目安です。PDF の寸法が正確でもドライバーの拡大縮小や機械誤差は防げません。実機プリンター、Safari／Firefox、実機スマートフォンでは未検証です。Chromium の画面・タッチ模擬試験は実機保証ではありません。
- V1 は CMYK カラー管理、オフラインインストール、用紙混在、高度な千鳥配置を含みません。
