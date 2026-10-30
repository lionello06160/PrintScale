# PrintScale

[![CI](https://github.com/lionello06160/PrintScale/actions/workflows/ci.yml/badge.svg)](https://github.com/lionello06160/PrintScale/actions/workflows/ci.yml)

**[開啟網站 / Open app / アプリを開く](https://printscale-studio.lionel0616.chatgpt.site/)** · **[下載版本 / Releases / リリース](https://github.com/lionello06160/PrintScale/releases)**

[繁體中文](#繁體中文) · [English](#english) · [日本語](#日本語)

操作指南 / Workflow guide / 操作ガイド：[繁中](#workflow-zh) · [English](#workflow-en) · [日本語](#workflow-ja)

### v1.0.6

- **繁中：** 開啟頁面先彈出「實際大小／100%」列印提醒；下方提示區同步加強，並可再次查看。保留三語、鍵盤關閉、焦點返回與手機捲動操作，PDF 尺寸維持不變。
- **English:** A reminder now opens on page entry to highlight Actual size / 100%. The final-step notice is more prominent and can reopen the reminder. Three languages, keyboard dismissal, focus return and mobile scrolling preserve the existing workflow and PDF geometry.
- **日本語：** ページを開くと「実際のサイズ／100%」の印刷リマインダーを表示します。下部の注意欄も強調し、再表示できます。3言語、キーボードで閉じる操作、フォーカス復帰、モバイルのスクロールに対応し、PDF寸法は変わりません。

### v1.0.5

- **繁中：** 紙張、方向、圖片配置、留白配置、設定檔與頁面跳轉等下拉選單，全部統一為圓角樣式。支援鍵盤、觸控、長清單捲動及視窗內選取，原有設定與 PDF 尺寸保持不變。
- **English:** All remaining dropdowns now match the rounded language menu, including paper, orientation, fit, alignment, profiles and sheet navigation. Keyboard/touch support, scrollable long lists and dialog use preserve existing settings and PDF dimensions.
- **日本語：** 用紙・向き・画像配置・余白配置・設定・ページ移動のドロップダウンを角丸に統一しました。キーボード、タッチ、長いリストのスクロール、ダイアログ内の操作に対応し、設定内容とPDF寸法は保持します。

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
- **印表機校正：** 依所選單位下載未補償的 100 mm／10 cm／4 in 橫／縱測試尺，輸入實際量測值並儲存本機校正檔。另行產生清楚標示的補償 PDF；標準 PDF 及原尺寸單頁 PDF 維持原設定。補償後可能需要更多紙張。

### 使用方式

1. 開啟網站，閱讀並關閉「實際大小／100%」提醒，再上傳圖片或載入範例，視需要旋轉與裁切。
2. 設定成品尺寸、紙張、安全邊界及重疊；比較兩種分頁方案。
3. 選擇拼接方式，查看實際 PDF 預覽與位置地圖，再下載 PDF／指引。
4. 用 PDF 閱讀器選擇 **實際大小／100%**，紙張與網站一致；關閉「符合頁面」及無邊界自動放大，先試印一張。
5. 如需校正，使用相同印表機、紙張方向及驅動設定列印測試尺，分別量測 X／Y，再測試補償輸出。

<a id="workflow-zh"></a>
### 操作邏輯：每一步在決定什麼

建議依序完成：**圖片內容 → 成品尺寸 → 紙張與邊界 → 分頁方案 → 拼接方式 → 預覽／下載 → 100% 列印**。印表機校正是量測後才使用的選用步驟。

#### 1. 先決定圖案範圍，再確認成品尺寸

- 點「裁切圖片」，拖曳裁切框或八個控制點，確認後按「套用裁切」。取消或 Escape 不會套用變更；重新開啟仍能在完整原圖上調整。
- **比例鎖定時**，修改寬或高會連動另一邊；套用新裁切時保留目前寬度，依新圖案比例更新高度。先看裁切視窗顯示的成品尺寸，再套用。
- **解除比例鎖定時**，可分別指定寬、高；圖片仍等比例縮放。「完整圖片，留白」保留全部內容，「填滿成品，置中裁切」會裁掉超出範圍的部分。這兩者不會拉伸圖片，也不會改變指定的成品寬高。
- 切換 mm／cm／in 只換算顯示單位，不改變實際尺寸。載入範例會恢復範例的 350 × 466.7 mm、A4、15 mm 邊界、10 mm 重疊與精準對齊設定，建議先載入範例再改自己的設定。

#### 2. 紙張、邊界與重疊各自控制不同事情

| 設定 | 何時調整／調整後的效果 |
| --- | --- |
| 紙張尺寸 | 選擇印表機實際放入的紙張；選「自訂」才輸入紙張寬高。這是每張分頁 PDF 的大小，不是海報大小。 |
| 方向 | 選「自動比較」讓兩種模式比較直向／橫向；指定直向或橫向會限制兩個模式都使用該方向。 |
| 安全邊界 | 四邊各保留同樣的不可用範圍，依印表機能力設定。邊界增加會縮小每張可印區，可能增加張數，海報尺寸不變。 |
| 重疊區 | 相鄰紙張重複印出的圖案寬度。增加可提供更多拼接餘量，也可能增加張數；重疊不會加到海報尺寸上。 |
| 多餘空間配置 | 將排版後剩餘空間平均分配、靠左上或靠右下，不改變成品尺寸。 |

「印表機設定檔」可保存紙張、方向、邊界與重疊，方便下次載入；它不保存圖片或成品尺寸，也不等於量測用的「校正設定」。

#### 3. 兩種分頁模式怎麼選

| 模式 | 優先順序 | 操作上的取捨 |
| --- | --- | --- |
| 精準對齊 | 接縫總長較短，再比較張數 | 在意拼接工作時先看此方案；可能多用紙。名稱指接縫取捨，不代表 PDF 尺寸更準。 |
| 省紙優先 | 張數較少，再比較剩餘面積 | 想少印幾張時先看此方案；接縫總長可能增加。 |

**兩種模式的成品尺寸準確度相同。** 目前比較的是同一種紙張的直向／橫向規則網格，沒有混合方向或錯位排版。兩張卡片同為「12 張、3 × 4、橫向」，表示兩個目標選到同一方案；指定單一方向時也會得到同一方案。

可直接照填的差異範例：先解除比例鎖定，設定 **360 × 750 mm、A4、15 mm 邊界、10 mm 重疊、方向「自動比較」**。

| 模式 | 排列（欄 × 列） | 張數 | 接縫總長 |
| --- | --- | ---: | ---: |
| 精準對齊 | 橫向，2 × 5 | 10 | 2,190 mm |
| 省紙優先 | 直向，3 × 3 | 9 | 2,220 mm |

這個例子多用一張紙只減少 30 mm 接縫；可依自己的紙張成本與拼接習慣選擇。兩者都維持 360 × 750 mm，切換模式後請以更新的預覽與頁數為準。

#### 4. 選拼接方式，再讀位置圖與標記

- **重疊黏貼：** 裁去外圍白邊，保留重複圖案作黏貼區；右頁蓋住左頁、下頁蓋住上頁，將重複圖案對齊。
- **精準對切：** 依重疊區中線上的對應裁切標記裁去多餘部分，讓兩頁邊緣相接，再從背面固定。兩種拼接方式的成品尺寸相同。
- **粗角線是裁切位置，圓靶十字是對位位置**，不要沿圓靶裁切。開啟頁碼且邊界足夠時，紙上會有朝上箭頭、行列與小地圖；標記因空間不足而省略時，介面會提示。
- 張數多時，從「選擇紙張位置」選頁，或在清單內輸入頁碼、按 Home／End、方向鍵定位後按 Enter。總覽雖只預覽前 16 頁，完整清單、位置圖與下載 PDF 仍包含所有頁面；拼接指引視窗也能選頁。

#### 5. 依列印用途選擇輸出

| 輸出／預覽 | 用途 |
| --- | --- |
| 分頁 PDF／「分頁」預覽 | 家用印表機使用；每頁等於所選紙張大小，含安全邊界與啟用的標記。 |
| 原尺寸單頁 PDF／「整張」預覽 | 查看完整海報，或交由大圖輸出店列印；頁面大小等於成品尺寸。 |
| 「裁切後」預覽 | 從實際分頁 PDF 重建裁切後的拼接樣貌，用來檢查接縫。 |
| 拼接指引 | 另下載文字指引，對照頁碼與拼接方法；不額外插入海報 PDF，以免多印一張。 |

修改圖片、尺寸、紙張、邊界、重疊或拼接選項後，等預覽更新、幾何驗證通過再重新下載。**已下載的舊檔不會自動更新。** 解析度警示表示可能看見顆粒，不表示程式會自動縮小成品。

#### 6. 有實際尺寸偏差時，才建立印表機校正

1. 先確認 PDF 閱讀器已用 **實際大小／100%**，並關閉符合頁面與無邊界放大；軟體校正不能取代這些列印設定。
2. 在校正區下載測試尺：mm 為 **100 mm**、cm 為 **10 cm**、in 為精確 **4 in（101.6 mm）**。用相同印表機、紙張、方向與驅動設定列印，分別量測 X／Y 的整段基準長度。
3. 以畫面顯示的單位輸入實測值並命名、儲存。係數是「該尺基準長度 ÷ 實測長度」；例如 4 in 尺量得 3.92／4.08 in，X／Y 補償約為 102.0408%／98.0392%。
4. 選擇**校正版分頁 PDF**與它自己的拼接指引、位置圖。上方標準分頁與原尺寸單頁不套用補償；校正版會重新分頁，張數可能增加，不要混用兩套紙張。
5. 先試印、再次量測；更換印表機、紙張方向或驅動設定後應重新量測。

校正設定會記住原測試尺基準。切換顯示單位不會改變已儲存的係數；若要從舊的 100 mm 尺改用新的 4 in 尺，需下載新尺並重新量測，不能把舊量測值當作 4 in 的結果。設定檔只存在目前瀏覽器／裝置，重新整理會清除圖片與輸出，並再次顯示進站列印提醒。

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
- **Printer calibration:** print an uncompensated 100 mm / 10 cm / 4 in X/Y ruler in the selected unit, enter measured lengths and save local calibration profiles. Compensation produces a separate, clearly labelled PDF; standard and original-size PDFs remain unchanged. Corrected tiling may use additional sheets.

### How to use

1. Open the app, read and dismiss the Actual size / 100% reminder, then upload an image or load the sample and rotate/crop if needed.
2. Set the finished size, paper, safe margin and overlap. Compare both layout modes.
3. Choose an assembly method, inspect the actual PDF preview and map, then download the PDF and guide.
4. Print from a PDF reader at **Actual size / 100%**, with matching paper. Disable Fit and automatic borderless enlargement. Test one sheet first.
5. For calibration, print and measure X/Y using the same printer, paper orientation and driver settings, then test the corrected output.

<a id="workflow-en"></a>
### Operating logic: what each step decides

Work in this order: **image content → finished size → paper and margins → layout mode → assembly method → preview/export → print at 100%**. Calibration is an optional step based on actual measurements.

#### 1. Choose the image region, then confirm the finished size

- Open **Crop image**, drag the frame or its eight handles, and choose **Apply crop**. Cancel or Escape discards the draft. Reopening lets you adjust the selection on the complete original.
- With **aspect lock on**, changing width or height updates the other dimension. Applying a crop preserves width and recalculates height from the new image ratio; inspect the proposed finished dimensions before applying.
- With **aspect lock off**, set width and height independently. **Fit image, add white space** keeps the whole image; **Fill poster, crop centrally** removes excess edges. Both scale uniformly, without stretching or changing the requested finished dimensions.
- mm/cm/in changes only the displayed unit. Loading the sample restores its 350 × 466.7 mm, A4, 15 mm margin, 10 mm overlap and Precision settings, so load the sample before entering your own settings.

#### 2. Paper, margins and overlap control different things

| Setting | When to change it / effect |
| --- | --- |
| Paper size | Match the physical paper loaded in the printer. Choose Custom to enter paper dimensions. This sets each tiled PDF page, not the poster size. |
| Orientation | Auto compares portrait/landscape for both modes. A manual orientation restricts both modes to that direction. |
| Safe margin | Reserves the same amount on each edge according to printer limits. Larger margins reduce printable area and may add sheets; the poster size stays fixed. |
| Overlap | Repeats an image strip between neighbouring sheets. More overlap provides more assembly allowance and may add sheets; it does not enlarge the poster. |
| Unused space | Places excess coverage at the centre, top-left or bottom-right without resizing the finished poster. |

Printer profiles save paper, orientation, margins and overlap for reuse. They do not save the image or finished dimensions and are separate from measured calibration profiles.

#### 3. Choose between the two layout modes

| Mode | Priority | Practical tradeoff |
| --- | --- | --- |
| Precision | Shorter total internal seam length, then fewer sheets | Inspect this when assembly work matters; it may use more paper. The name refers to seams, not higher PDF dimensional accuracy. |
| Paper saver | Fewer sheets, then less unused area | Inspect this when paper count matters; total seam length may increase. |

**Both modes have the same finished-size accuracy.** This version compares portrait and landscape regular grids on one paper size, without mixed-orientation or staggered tiling. Identical cards such as “12 sheets, 3 × 4, Landscape” mean both priorities found the same plan. Selecting a single orientation also gives both modes the same plan.

Try this concrete comparison: unlock the aspect ratio and enter **360 × 750 mm, A4, 15 mm margins, 10 mm overlap, Auto orientation**.

| Mode | Layout (columns × rows) | Sheets | Total seam length |
| --- | --- | ---: | ---: |
| Precision | Landscape, 2 × 5 | 10 | 2,190 mm |
| Paper saver | Portrait, 3 × 3 | 9 | 2,220 mm |

Here, one extra sheet saves only 30 mm of seams. Choose according to paper cost and your assembly preference. Both remain 360 × 750 mm; check the refreshed preview and page count after switching.

#### 4. Choose assembly, then read the map and marks

- **Overlap & glue:** trim outside white margins, keep the repeated image strip, and align the image. Right sheets cover left sheets; lower sheets cover upper sheets.
- **Butt joint:** cut matching edges at the marked midpoint of the overlap, discard the extra material and tape the touching edges from behind. Both methods keep the same finished size.
- **Bold corner ticks locate cuts; circular crosshair targets locate alignment.** Do not cut at the targets. With page numbers enabled and enough margin space, printed sheets include an upright arrow, row/column labels and a mini map. The interface explains omitted marks when space is insufficient.
- For large jobs, use **Jump to a sheet**, or type a page number in the open list and confirm with Enter; arrows and Home/End also work. Overview shows only the first 16 pages, while the complete list, map and PDF include every sheet. The assembly-guide dialog also supports page selection.

#### 5. Export for the intended printing workflow

| Output / preview | Purpose |
| --- | --- |
| Tiled PDF / Pages | Home printers: every page matches the selected paper, including safe margins and enabled marks. |
| Original-size single-page PDF / Whole poster | Review the complete poster or use a large-format print shop. The PDF page equals the finished dimensions. |
| After trimming | Reconstructs the trimmed assembly from the actual tiled PDF to inspect seams. |
| Assembly guide | A separate downloadable text guide for page order and assembly; it adds no page to the poster PDF. |

After changing the image, dimensions, paper, margins, overlap or assembly options, wait for the preview and geometry verification before downloading again. **Existing downloads do not update themselves.** A resolution warning indicates potentially soft detail, not automatic downscaling of your poster.

#### 6. Calibrate only from measured size differences

1. First set the PDF reader to **Actual size / 100%** and disable Fit and borderless enlargement. Calibration does not replace these print settings.
2. Download a ruler: **100 mm**, **10 cm** or exactly **4 in (101.6 mm)** according to the selected unit. Print with the same printer, paper, orientation and driver settings; measure the full reference span separately for X and Y.
3. Enter measurements in the displayed unit, name the profile and save it. Each factor is reference length / measured length. A 4 in ruler measured as 3.92/4.08 in gives approximately 102.0408%/98.0392% X/Y compensation.
4. Use the **corrected tiled PDF** with its own guide and map. Standard tiled and original-size PDFs remain uncompensated. Corrected tiling can use additional sheets; do not mix the two sets.
5. Test a sheet and remeasure. Repeat calibration after changing printer, orientation or driver settings.

Profiles retain the reference used for their measurement. Changing display units does not alter saved factors. To replace an older 100 mm reference with a new 4 in reference, download the new ruler and measure again rather than reinterpreting the old values. Profiles live only in the current browser/device. Refreshing clears images and exports and shows the entry print reminder again.

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
- **比較できる分割案：** 「位置合わせ優先」は内部の継ぎ目の合計長を優先し、次に枚数を比較します。「用紙節約優先」は枚数を優先し、次に余り面積を比較します。どちらも指定した仕上がり寸法・余白・重なり幅を保持し、自動で縮小しません。同じ結果になる場合もあります。
- **PDF と貼り合わせ：** 分割 PDF、実寸の1ページ PDF、書き出した PDF からのプレビュー、重ね貼り／突き合わせ、裁断線、位置合わせマーク、別冊の組み立てガイド。各分割ページの MediaBox／CropBox は選択した用紙の実寸と一致し、書き出し後に幾何情報を検証します。
- **位置の目印：** 全ページの配置図、ページ番号、行・列、隣接ページへの移動。ページ番号が有効で余白が十分な場合、印刷物にもミニ配置図、上向き矢印、位置ラベルを追加します。
- **プリンター補正：** 選択した単位の未補正定規（100 mm／10 cm／4 in）を印刷し、実測値を入力して端末内に保存できます。補正 PDF は明示された別ファイルとして作成し、標準 PDF と実寸1ページ PDF は変更しません。補正後は枚数が増える場合があります。

### 使い方

1. アプリを開き、「実際のサイズ／100%」の注意を確認して閉じます。画像またはサンプルを読み込み、必要に応じて回転・トリミングします。
2. 仕上がり寸法、用紙、安全余白、重なり幅を設定し、2つの分割案を比較します。
3. 貼り合わせ方法を選び、実際の PDF プレビューと配置図を確認して PDF とガイドをダウンロードします。
4. PDF リーダーで **実際のサイズ／100%** を選び、用紙を一致させます。「用紙に合わせる」とフチなし自動拡大を無効にし、まず1枚を試し刷りします。
5. 補正する場合は、同じプリンター・用紙方向・ドライバー設定で定規を印刷し、X／Y を個別に測定して補正結果を確認します。

<a id="workflow-ja"></a>
### 操作の考え方：各ステップで決めること

**画像の範囲 → 仕上がり寸法 → 用紙と余白 → 分割案 → 貼り合わせ方法 → プレビュー／出力 → 100%印刷** の順に進めます。プリンター校正は、実測に基づいて必要なときに使う機能です。

#### 1. 画像の範囲を決めてから仕上がり寸法を確認

- 「画像を切り抜く」を開き、枠と8つのハンドルをドラッグして適用します。キャンセル／Escapeでは確定しません。再度開くと、元画像全体の上で範囲を調整できます。
- **縦横比固定中**は幅・高さが連動します。切り抜き適用時は幅を維持し、新しい比率に応じて高さが変わるため、適用前に表示される仕上がり寸法を確認してください。
- **縦横比を解除した場合**は幅・高さを個別に指定できます。「画像全体を収めて余白を追加」は全体を残し、「中央を切り抜いて全面に配置」は余分な端を切り抜きます。どちらも画像を引き伸ばさず、指定した仕上がり寸法を保持します。
- mm／cm／inの切替は表示単位の換算です。サンプルを読み込むと350 × 466.7 mm、A4、余白15 mm、重なり10 mm、位置合わせ優先に戻るため、独自設定を入力する前にサンプルを読み込んでください。

#### 2. 用紙・安全余白・重なり幅は別の設定

| 設定 | 変更する場面と効果 |
| --- | --- |
| 用紙サイズ | 実際にプリンターへ入れる用紙を選びます。カスタムでは用紙の幅・高さを入力します。分割PDFの各ページの大きさであり、ポスター寸法ではありません。 |
| 向き | 自動比較は両モードで縦／横を比較します。向きを固定すると、両モードともその向きだけを使います。 |
| 安全余白 | プリンターの印刷範囲に応じ、四辺に同じ余白を確保します。増やすと印刷可能領域が狭まり、枚数が増える場合がありますが、仕上がり寸法は変わりません。 |
| 重なり幅 | 隣り合う用紙に同じ画像部分を印刷する幅です。増やすと貼り合わせの余裕が増え、枚数も増える場合があります。ポスター寸法には加算しません。 |
| 余白の配置 | 分割後の余った領域を中央・左上・右下に配置します。仕上がり寸法は変更しません。 |

プリンター設定には用紙・向き・余白・重なり幅を保存できます。画像や仕上がり寸法は保存せず、実測に基づく校正設定とは別です。

#### 3. 2つの分割モードを選ぶ基準

| モード | 優先順位 | 操作上の取捨 |
| --- | --- | --- |
| 位置合わせ優先 | 内部の継ぎ目の総長を短くし、次に枚数を比較 | 貼り合わせ作業を重視する場合に確認します。用紙が増える場合があります。PDFの寸法精度が高くなるという意味ではありません。 |
| 用紙節約優先 | 枚数を減らし、次に余り面積を比較 | 用紙を節約したい場合に確認します。継ぎ目の総長が増える場合があります。 |

**どちらのモードも仕上がり寸法の精度は同じです。** 現在は同じ用紙の縦／横による規則的な分割を比較し、向きの混在や千鳥配置は行いません。「12枚・3 × 4・横」が両方に出る場合は、同じ案を選んだ正常な結果です。向きを固定した場合も同じ案になります。

違いを確認する例：縦横比を解除し、**360 × 750 mm、A4、余白15 mm、重なり10 mm、向きは自動比較**にします。

| モード | 配置（列 × 行） | 枚数 | 継ぎ目の総長 |
| --- | --- | ---: | ---: |
| 位置合わせ優先 | 横、2 × 5 | 10 | 2,190 mm |
| 用紙節約優先 | 縦、3 × 3 | 9 | 2,220 mm |

この例では、1枚増やすことで短くなる継ぎ目は30 mmです。用紙の費用と貼り合わせ方に合わせて選んでください。両方とも360 × 750 mmを保持し、切替後のプレビューと枚数を確認できます。

#### 4. 貼り合わせ方法と配置図・マークを読む

- **重ね貼り：** 外側の白い余白を切り取り、繰り返し印刷された絵柄を残して合わせます。右の用紙を左に、下の用紙を上に重ねます。
- **突き合わせ：** 重なり部分の中央にある対応する裁断マークで切り、余分を除いて端を突き合わせ、裏側から固定します。どちらも仕上がり寸法は同じです。
- **太い角線は裁断位置、丸い十字は位置合わせ位置**です。丸い的では切りません。ページ番号が有効で余白が十分なら、上向き矢印、行・列、小さな配置図を印刷します。場所が足りない場合は画面に通知します。
- 枚数が多いときは「用紙位置を選択」を使います。開いたリストでページ番号を入力しEnterで確定でき、方向キーやHome／Endでも移動できます。一覧プレビューは最初の16ページですが、全体リスト・配置図・PDFには全ページを含みます。組み立てガイド内でも選択できます。

#### 5. 印刷方法に合う出力を選ぶ

| 出力／プレビュー | 用途 |
| --- | --- |
| 分割PDF／分割プレビュー | 家庭用プリンター向け。各ページは選択した用紙の実寸で、安全余白と有効なマークを含みます。 |
| 実寸1ページPDF／全体プレビュー | ポスター全体の確認や大判出力店向け。ページ寸法は仕上がり寸法と一致します。 |
| 裁断後プレビュー | 実際の分割PDFから裁断後の貼り合わせ状態を再構成し、継ぎ目を確認します。 |
| 組み立てガイド | ページ順と貼り合わせ方法を確認する別のテキストファイルです。ポスターPDFに余分なページを追加しません。 |

画像、寸法、用紙、余白、重なり、貼り合わせオプションを変更したら、プレビュー更新と幾何検証を待ってから再ダウンロードしてください。**ダウンロード済みのファイルは自動更新されません。** 解像度の警告は粗さの目安であり、仕上がりを自動縮小する意味ではありません。

#### 6. 実測で寸法差を確認してからプリンター校正

1. まずPDFリーダーで **実際のサイズ／100%** を選び、用紙に合わせる機能とフチなし自動拡大を無効にします。校正はこれらの印刷設定の代わりにはなりません。
2. 単位に応じた **100 mm／10 cm／正確な4 in（101.6 mm）** の定規をダウンロードします。同じプリンター・用紙・向き・ドライバー設定で印刷し、X／Yそれぞれ基準長全体を測ります。
3. 表示単位で実測値を入力し、名前を付けて保存します。係数は「定規の基準長 ÷ 実測長」です。4 in定規が3.92／4.08 inなら、X／Y補正は約102.0408%／98.0392%になります。
4. **補正PDF**専用のガイドと配置図を使います。標準の分割PDFと実寸1ページPDFには補正を適用しません。補正後は枚数が増える場合があるため、2つの用紙セットを混ぜないでください。
5. まず1枚試し刷りして再測定します。プリンター・用紙の向き・ドライバー設定を変更した場合は再度測定してください。

校正設定は測定時の基準長を保持します。表示単位を切り替えても保存済みの係数は変わりません。古い100 mm定規から新しい4 in定規へ変更する場合は、新しい定規をダウンロードして測り直し、古い値を4 inの結果として使わないでください。設定は現在のブラウザー／端末だけに保存されます。再読み込みでは画像と出力を消去し、最初の印刷リマインダーを再表示します。

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
