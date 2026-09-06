# Text Evidence Generator — Audit & Implementation Plan

Status: **IMPLEMENTED** — shipped in `entrypoints/editor/text-evidence/*`.

## BƯỚC 1 — Audit kết quả

| # | Câu hỏi | Trả lời (file:line) |
|---|---|---|
|1|Capture nằm ở đâu|`entrypoints/background.ts` — `captureVisibleTab()` (78), `captureWithSelection()` (96), `captureFullPage()` (202), stitch tại `stitchImages()` (395)|
|2|Popup→BG→Editor flow|`popup/App.tsx:18` gửi `runtime.sendMessage({type:'capture'})` → `background.ts:24` nhận, gọi `handleCapture()` (46) → lưu `browser.storage.local.set({capturedImage})` (64) → `browser.tabs.create(editor.html)` (66)|
|3|Editor/Konva|`entrypoints/editor/Editor.tsx` — toàn bộ 1616 dòng, dùng `react-konva` (`Stage/Layer/Image/Rect/...`)|
|4|`DrawingElement` model|`Editor.tsx:17-47` — interface phẳng, field chính: `id,type,x,y,width,height,points,color,strokeWidth,opacity,dash,visible,name`|
|5|Annotation tạo/update/xoá|Tạo: `handleStageMouseDown` (633) đẩy vào `setElements`/`setCurrentElement`. Update: `updateElementProperty()` (582). Mọi thay đổi đều gọi `addToHistory()` (614)|
|6|`renderElement()`|`Editor.tsx:1108-1128` — switch theo `el.type`, mỗi type map ra 1 Konva shape, `commonProps` (1110) gán chung x/y/draggable/opacity/dash + handler click/drag/transform|
|7|Undo/Redo|`history: DrawingElement[][]` state (196) + `historyIndex` (197). `addToHistory()` (614) cắt history sau index hiện tại rồi push snapshot mới. `undo()`(1008)/`redo()`(1015) chỉ dịch `historyIndex` và `setElements(history[idx])`|
|8|Zoom & coordinate transform|`zoom` state (210) chỉ set `<Stage scaleX={zoom} scaleY={zoom}>` (1244-1245) — **thuần hiển thị**. Mọi `DrawingElement.x/y` lưu theo pixel ảnh gốc, KHÔNG nhân/chia zoom. `getPointerPosition()` (621) dùng `stage.getAbsoluteTransform().invert()` để tự trừ zoom ra, trả toạ độ đã ở hệ ảnh gốc|
|9|Crop|`applyCrop()` (1047-1066): vẽ canvas mới từ `image` hiện tại theo `cropRect`, tạo `Image` mới, `setImage/setStageSize` theo kích thước crop, **reset toàn bộ `elements`+`history`** (1063)|
|10|Image/stage size|`stageSize` set = `img.width/img.height` lúc load (useEffect 324-379, dòng 349) hoặc = kích thước crop (1061). `KonvaImage` vẽ full stageSize (1252)|
|11|Export|`handleDownload()` (1022) và `handleCopy()` (1034) đều gọi `stageRef.current.toDataURL(...)` — xuất theo pixel Stage hiện tại (= stageSize×zoom)|
|12|Utility reuse được|`addToHistory`, `elements/setElements`, `elementCounter` (211), `renderElement` switch (không cần sửa nếu dùng đúng type có sẵn `rectangle`/`text`)|
|13|Dependency OCR/fuzzy có sẵn|**Không có** — `package.json` chỉ có `konva, react, react-dom, react-konva` + devDeps build tool. Không có OCR lib, không có fuzzy-match lib nào cả|
|14|File cần sửa thật sự|Chỉ `Editor.tsx` (thêm state toggle panel + render panel + wire vào `setElements/addToHistory` có sẵn) và `wxt.config.ts` (thêm `web_accessible_resources` cho asset OCR nếu dùng Tesseract.js). `package.json` thêm 1 dependency. Không đụng `background.ts`, `content.ts`, `popup/*`|

**Phát hiện quan trọng nhất**: zoom và toạ độ lưu trữ đã tách biệt sẵn trong kiến trúc hiện tại — `DrawingElement.x/y` luôn ở hệ pixel ảnh gốc, zoom chỉ là scale hiển thị Stage. Crop tạo ảnh gốc mới + reset elements, nên ảnh đang có trong state `image` tại thời điểm bấm Generate Evidence luôn là ảnh gốc đúng nghĩa (post-crop nếu có). → OCR chạy trên `image` state hiện tại, bbox trả về map thẳng 1:1 vào `DrawingElement.x/y/width/height`, không cần transform theo zoom hay theo crop-offset.

## BƯỚC 2 — Implementation Plan

### 1. Current Architecture
```
Popup → Background (capture) → storage.local → Editor tab
  → decode Image → Konva Stage (scale=zoom)
  → DrawingElement[] (elements state)
  → history[][] (undo/redo)
  → renderElement() switch → Konva shapes
  → export: stage.toDataURL()
```

### 2. Feature Architecture
```
image (state hiện tại, đã qua crop nếu có)
  → OCR (text-evidence/ocr.ts)
  → normalize (text-evidence/normalize.ts)
  → match ExpectedText[] × OCRResult[] (text-evidence/matcher.ts)
  → build DrawingElement[] (rectangle đỏ + text số) (text-evidence/annotate.ts)
  → setElements([...elements, ...newOnes]) + addToHistory()  ← dùng nguyên mechanism cũ
  → render bởi renderElement() có sẵn, không sửa gì
  → export bằng handleDownload/handleCopy có sẵn, không sửa gì
```

### 3. Files To Add
```
entrypoints/editor/text-evidence/
├── types.ts        — ExpectedText, OCRResult, MatchStatus enum, MatchResult
├── normalize.ts     — lowercase + collapse whitespace + trim
├── matcher.ts       — Levenshtein tự viết (~15 dòng, không thêm dep) + pipeline exact→normalized→fuzzy + greedy 1-1 assignment (xử lý duplicate)
├── ocr.ts           — wrap OCR engine (Tesseract.js), input: HTMLImageElement, output: OCRResult[] (word/line bbox theo pixel ảnh gốc), cache theo image.src
├── annotate.ts       — MatchResult[] → DrawingElement[] (rectangle + text pair), heuristic đặt số tránh đè cơ bản
└── TextEvidencePanel.tsx — UI thuần: textarea + nút Generate Evidence + result list, nhận props/callback, KHÔNG tự giữ elements/history
```
Asset OCR (nếu Tesseract.js): `public/tesseract/` chứa worker/core/wasm/traineddata — load local, không CDN.

### 4. Files To Modify
- **`entrypoints/editor/Editor.tsx`**: thêm 1 state `isTextEvidenceOpen`, 1 nút toggle trong sidebar, render `<TextEvidencePanel image={image} onAddAnnotations={handleAddEvidence} />` ở cuối. Thêm 1 hàm nhỏ `handleAddEvidence(newElements)` gọi đúng `setElements([...elements, ...newElements])` + `addToHistory()` có sẵn. Không sửa `renderElement`, `applyCrop`, `handleDownload`, `handleCopy`, history logic.
- **`wxt.config.ts`**: thêm `web_accessible_resources` trỏ asset OCR (chỉ khi dùng Tesseract.js cần load worker/wasm qua URL).
- **`package.json`**: thêm 1 dependency OCR (chờ duyệt trước khi cài).

Không đụng: `background.ts`, `content.ts`, `popup/*`.

### 5. Existing Code To Reuse
- `DrawingElement` interface + type `'rectangle'`/`'text'` có sẵn → dùng thẳng, có thể thêm 1 field optional `source?: string` để nhận diện batch, không breaking.
- `renderElement()` switch — không đổi.
- `elements`/`setElements`, `addToHistory()`, `historyIndex`, `undo()`/`redo()` — dùng nguyên.
- `elementCounter` — tăng đúng khi thêm annotation mới, giữ naming convention.
- `handleDownload()`/`handleCopy()` — dùng nguyên.
- `image` state (đã qua crop nếu có) — nguồn input duy nhất cho OCR.

### 6. Data Flow
```
ExpectedText[] (user paste, giữ index gốc)
  → OCRResult[] (OCR chạy trên `image` hiện tại)
  → MatchResult[] { expectedIndex, status, ocrResult?, similarity }
  → DrawingElement[] (rectangle theo bbox + text theo expectedIndex, chỉ cho status FOUND/POSSIBLE_MATCH)
  → setElements([...elements, ...new]) + addToHistory()
  → Editor render/export như cũ
```

### 7. Coordinate Strategy
- OCR chạy trực tiếp trên `image` đang có trong Editor state — luôn là ảnh sau crop nếu có.
- Bbox OCR = đúng hệ toạ độ mà mọi `DrawingElement` khác đang dùng → gán thẳng, không transform.
- Zoom không liên quan tới bước tạo annotation, chỉ ảnh hưởng hiển thị.
- Cache OCR result theo `image.src`; invalidate khi ảnh đổi (crop lại), chỉ re-run khi user bấm lại Generate Evidence.

### 8. Duplicate & Matching Strategy
- Normalize 2 phía (lowercase + collapse whitespace + trim).
- Pipeline: exact-raw → normalized-exact → fuzzy (Levenshtein similarity). Ngưỡng đề xuất: `≥0.95` FOUND, `0.75–0.95` POSSIBLE_MATCH, `<0.75` NOT_FOUND (tinh chỉnh sau khi test thật).
- OCR granularity: word-level bbox + sliding-window n-gram (ghép N từ liên tiếp cùng dòng theo số từ expected).
- Duplicate: candidate pool tất cả n-gram match được, **greedy assignment giảm dần similarity, one-to-one**, bbox đã dùng thì loại khỏi pool.
- Số thứ tự = index trong `ExpectedText[]` user paste, không liên quan thứ tự OCR.

### 9. Undo/Redo & Export
- Generate Evidence tạo 1 mảng `DrawingElement[]` mới, gọi 1 lần `setElements([...elements, ...newElements])` rồi `addToHistory(merged)` — 1 action duy nhất trong history.
- Export: không đụng `handleDownload`/`handleCopy` — evidence annotation nằm trong `elements`, tự động xuất theo.

### 10. Regression Risks
| Risk | Cách tránh |
|---|---|
|Thêm field mới vào `DrawingElement` phá type cũ|Chỉ thêm field optional|
|Panel mới chiếm layout, đè lên tool cũ|Isolate CSS riêng, toggle ẩn/hiện, không sửa `editor.css` chung|
|OCR chạy block UI thread|Chạy trong Worker, chỉ trigger khi bấm nút|
|Bundle size tăng do OCR asset|Để trong `public/`, không ảnh hưởng code path cũ|
|Cache OCR stale sau crop|Invalidate theo `image.src`/reference khi ảnh đổi|
|Annotation batch sai nhiều, khó sửa|Đã có Undo sẵn xử lý|

### 11. Implementation Steps
1. Viết `types.ts` + `normalize.ts` + `matcher.ts` — test độc lập bằng case tay, chưa đụng Editor.
2. Cài OCR lib (chờ duyệt), viết `ocr.ts` — test độc lập trên ảnh mẫu.
3. Viết `annotate.ts` — test bằng mock MatchResult[].
4. Viết `TextEvidencePanel.tsx` (UI thuần, mock data).
5. Nối ocr+matcher+annotate vào panel (logic thật, chưa nối Editor).
6. Sửa `Editor.tsx`: state toggle + render panel + `handleAddEvidence`.
7. Build lại, load unpacked, test full flow trên form UI thật.
8. Test regression toàn bộ tool cũ (crop/pencil/arrow/rectangle/circle/text/blur/undo/redo/zoom/export).

---
**Chờ approve trước khi code.**
