# M Atlas 6c: capture helper and tuning

Paste this whole message into the Google AI Studio builder of project 3 (M Atlas). Parts 6a and 6b must already be in the project. This is part 3 of 3.

> **Part 3 of 3.** Do only this part. **Step 0:** save this whole message word for word as `docs/specs/matlas-6c.md` in the project (so it survives if the chat context is reset), then implement it. If you cannot see the complete text of this message (for example an attachment is missing or cut off), stop and tell me instead of guessing any data.

---

## Rules

1. **Look at the current code before you change anything.** Earlier fix prompts may already have changed files. Where this prompt names a file or a field that no longer matches the code, follow the code and keep the intent.
2. **The design stays exactly as it is.** Fonts, colours, spacing, layout, video, animation, breakpoints, the footer, the 404 page, the contact details (address, phone, links) and every existing page are not touched.
3. **Mongolian text must never break the layout.** Check in both languages at 320, 360, 390, 414, 600, 768, 1024, 1280 and 1440 px wide. Fix the cause in CSS (wrapping, `min-width: 0`, `overflow-wrap`), never by shrinking fonts below what the design already uses.
4. Code must read as if a careful human wrote it: plain names, no dead code, no commented-out blocks, no `console.log`. No new npm dependency.
5. Do not paste, upload or "analyse" the model files inside this builder. They live on the media host and are only loaded by URL.

## 1. Dev-only capture helper (makes the nine cut-out images)
The cut-out image is used for the 110 px collection cards, the About thumbnails, the search and atlas thumbnails, the feature image, the lens close-up and the loading fallback. It must show **the same model, in the same pose and the same light as the viewer**, on a transparent background. So the site makes its own images:

- New file `src/features/atlas/dev/captureStill.js`, imported with a dynamic `import()` behind `if (import.meta.env.DEV)` only, so that nothing of it is in the production bundle (check after `npm run build` that the dist folder does not contain the word `captureStill`).
- It is active only when the address has `?capture=1`. Then **Shift + P** saves the current specimen as `{id}.webp` (a download): a transparent background, a square frame **2000 × 2000 px**, the model at its home pose (`specimen.yaw` and `specimen.pitch`, auto-rotation and the user's drag ignored), centred with about 6 % margin on every side, the same environment map, tone mapping and key light as the viewer, no ground, no shadow plate, no UI. Encode with `canvas.toBlob(callback, "image/webp", 0.92)`. If the viewer's renderer cannot do this without disturbing the live view, create a second temporary renderer (`alpha: true`, `preserveDrawingBuffer: true`) with a 2000 × 2000 canvas, render once with the same scene and a temporary camera of the same field of view, download, then dispose it.
- While `?capture=1` is on, show nothing new on screen except a very small text hint in the corner ("Shift+P: save still") that exists only in development.
- Document the helper in `docs/ASSETS.md` in five lines: how to open it, which key, the output size, where the files go (`images/{id}.webp` in the media repository), and that it is absent from production.

## 2. Tuning each specimen (do this one by one in the live preview)

For every new specimen, open it in the viewer in both languages and fix, in this order:

1. **Loads.** The `.glb` loads from `the media base address from `src/content/mediaBase.js` plus `/models/<id>.glb`` without errors in the console and without a CORS message. If a model does not load, report which one and the exact error. Do not invent a different address.
2. **Orientation.** `rig.js` only normalises by the bounding sphere, so every model starts in its own orientation. Set `yaw` and `pitch` so that the animal faces the same way the hoopoe does at its home pose (head toward the right of the frame, a gentle three-quarter view, eyes visible, nothing cropped). A griffin, a titan and a kappa are shown front three-quarter, with the face visible. If a model lies on its side or is upside down, do not rotate files: report it, so the owner can re-export it, and meanwhile use the closest pose you can reach with `yaw`/`pitch`.
3. **Size on screen.** It must fill the viewer the way the existing specimens do (same framing, no clipping at any breakpoint, nothing tiny). `scale` is only the scale-bar label: pick the label that matches what the model actually looks like on screen next to the bar. Keep the unit style of the existing entries.
4. **Materials.** Models that came without a colour texture (typically museum scans of metal or stone) will look flat grey. If a loaded model has no base-colour map, keep its material but make sure the existing environment light shows its form; do not recolour it. Report which ones look flat.
5. **Lens crop.** `lens` is a CSS `background-position` crop of the full image for the "Close-up detail" circle. Move it so the circle shows the detail the `closeup` sentence talks about (the head, the wing, the tail, the bill). Do this after the image exists (section 1 above), by opening the specimen and adjusting.
6. **Performance.** Scrolling and drag must stay smooth on the home viewer with the new specimen loaded. If one model is heavy, tell the owner its triangle count and file size instead of lowering the viewer quality.

## Checks to run and report

1. `npm run build` succeeds and the dist folder contains no `captureStill`. `npm run lint`, `npm test` and `npm run check:i18n` still pass.
2. A short report with, per specimen: loaded yes or no, final `yaw`/`pitch`/`scale`/`lens`, anything that looked wrong (flat grey, wrong orientation, heavy file), and the screenshots you could take at 390 px and 1440 px in both languages.

## 6. What the owner does next (do not do this yourself)

The owner opens each specimen with `?capture=1`, presses Shift + P, uploads the nine `{id}.webp` files to the media repository under `images/`, then reloads. You are done when all nine specimens work end to end except for that last image step.(# M Atlas 6: 9 шинэ сорьцын 3D загвар, зураг, зээл бичих заавар (Монгол)

Энэ заавар `matlas-6a-data-en.md`, `matlas-6b-credits-en.md`, `matlas-6c-capture-tuning-en.md` гэсэн 3 prompt-той хамт ажиллана (өмнөх урт `matlas-6-new-specimens-en.md`-ийг ашиглахаа боль, AI Studio түүнийг хэрэгжүүлж чадаагүй). Prompt нь кодыг бичнэ, харин **3D файл болон зургийг та өөрөө бэлтгэж, тусдаа хостод (GitHub media repo) тавина**. AI Studio-д файл ачаалахгүй, зөвхөн хаягийг нь өгнө. Учир нь AI Studio-д upload хийсэн binary файл гэмтэх, GitHub-д хадгалахад эвдрэх, дараагийн хадгалалтаар дарагдах мэдээлэл байдаг.

## 1. Сонгосон 9 загвар

Бүгд Sketchfab дээр, лиценз нь CC0 эсвэл CC BY 4.0 (түгээж, өөрчилж болно; CC BY-д зээл бичих ёстой). Лицензийг би Sketchfab хуудаснаас шалгасан.

| Цуглуулга | Загвар | Зохиогч | Лиценз | Хуудас |
|---|---|---|---|---|
| Жиргээчид (songbirds) | Blue Jay (MLZ:Bird:65124) | MooreLab | CC BY 4.0 | https://sketchfab.com/3d-models/blue-jay-cyanocitta-cristata-bbe937f9a0ea441496159d8f7821d07f |
| Шар шувуу (owls) | Eastern Screech Owl | Innovation Studio, Carnegie Museum of Natural History | CC BY 4.0 | https://sketchfab.com/3d-models/eastern-screech-owl-1b34de1b8208495abb37b4b629c1f8a3 |
| Колибри (hummingbirds) | Stripe-tailed Hummingbird (MLZ:Bird:25869) | MooreLab | CC BY 4.0 | https://sketchfab.com/3d-models/stripe-tailed-hummingbird-eupherusa-eximia-d878d181cc3947f3a4e4fa22c6cd11f5 |
| Махчин (raptors) | Golden Eagle (Tomek Natural Science Museum, inv. MP 407) | Virtual Museums of Małopolska | CC0 | https://sketchfab.com/3d-models/golden-eagle-dd0552b1f93b441cbdd626a5b2abebbf |
| Усны шувуу (waders) | Boat-billed Heron (MLZ:Bird:13447) | MooreLab | CC BY 4.0 | https://sketchfab.com/3d-models/boat-billed-heron-cochlearius-cochlearius-4fad4a07bacd432b88736c95475c6dbb |
| Луу (dragons) | Winged Dragon, 5th–4th century BCE | Minneapolis Institute of Art | CC0 | https://sketchfab.com/3d-models/winged-dragon-one-of-pair-5th-4th-century-bce-b390b4046d6c46beb811c8c9e21014d4 |
| Химер (chimeras) | Stone Griffin, Downing College, Cambridge | Thomas Flynn | CC BY 4.0 (NoAI) | https://sketchfab.com/3d-models/stone-griffin-downing-college-cambridge-d94638d6c6ad4119b868567cf8e9fe2b |
| Аварга (giants) | Ancient Titan Statue | Kaan Tezcan | CC BY 4.0 | https://sketchfab.com/3d-models/ancient-titan-statue-c7e1295da4574a248f717367c842430b |
| Мэхлэгч (tricksters) | Netsuke: Kappa and Toad | Minneapolis Institute of Art | CC0 | https://sketchfab.com/3d-models/netsuke-kappa-and-toad-745efca54e0244d48d2719516f8a6c7f |

Бусад сонгож үзсэн боловч хассан зүйл: Short Eared Owl (CC BY-NC-SA, арилжааны бус), Scarlet Robin (CC BY-SA, эрсдэлтэй), Red knot ба Boreal owl (татах боломжгүй эсвэл лицензгүй). Дракон дээр хэрэв "Winged Dragon" таалагдахгүй бол нөөц: "Dargon Statue" (mofashi, CC BY 4.0).

**NoAI анхааруулга:** Stone Griffin-д "NoAI" тэмдэглэгээ байгаа. Энэ файлыг **AI Studio, Claude, ChatGPT зэрэг ямар ч AI хэрэгсэлд upload хийж болохгүй**. Зөвхөн өөрийн GitHub media repo-д хадгал. (Prompt нь файлыг хаягаар нь л дууддаг тул AI файлыг огт хардаггүй.)

## 2. Ажлын дараалал (товч)

1. GitHub дээр media repo үүсгэх.
2. 9 загварыг Sketchfab-аас татах.
3. Хөнгөвчилж шахах (gltf-transform).
4. Media repo-д `models/` хавтсанд хуулах, хаягийг шалгах.
5. Prompt дахь `{{MEDIA_BASE}}`-г өөрийн хаягаар солих, AI Studio-д өгөх.
6. Сайт бүтсэний дараа 9 зургийг сайтын өөрийн "capture" хэрэгслээр авах, `images/` хавтсанд хуулах.
7. Зээлийн мөрүүд, лавлагаа файлыг шалгах.

## 3. Media repo үүсгэх

1. GitHub дээр шинэ **public** repo үүсгэ, нэр нь жишээ нь `m-atlas-media`. (Private бол CDN-ээр нээгдэхгүй.)
2. Repo дотор хоёр хавтас байх ёстой: `models/` ба `images/`. GitHub-ийн вэб дээр "Add file → Upload files" дарж, хавтасны замтай хамт файл чирж оруулж болно, эсвэл `models/blue-jay.glb` гэж нэрлэх үед хавтас өөрөө үүснэ.
3. Файл бүр **25 MB-аас бага** байх ёстой (GitHub вэб upload-ын хязгаар, миний мэдлэгээс). CDN-ийн хязгаар 20 MB (jsDelivr-ийн баримтаас баталгаажсан), тэгэхээр аль ч файл **20 MB-аас бага**, зорилго нь 5–10 MB.
4. Файлын нэр яг ийм байх ёстой (prompt дахь хаягууд эдгээрийг дууддаг):

| Загвар | Файл |
|---|---|
| Blue Jay | `models/blue-jay.glb`, `images/blue-jay.webp` |
| Screech Owl | `models/screech-owl.glb`, `images/screech-owl.webp` |
| Hummingbird | `models/hummingbird.glb`, `images/hummingbird.webp` |
| Golden Eagle | `models/golden-eagle.glb`, `images/golden-eagle.webp` |
| Boat-billed Heron | `models/boat-billed-heron.glb`, `images/boat-billed-heron.webp` |
| Dragon | `models/dragon.glb`, `images/dragon.webp` |
| Griffin | `models/griffin.glb`, `images/griffin.webp` |
| Titan | `models/titan.glb`, `images/titan.webp` |
| Kappa | `models/kappa.glb`, `images/kappa.webp` |

5. Нээлттэй хаяг (CDN) нь: `https://cdn.jsdelivr.net/gh/ТАНЫ_НЭР/m-atlas-media@main`. Жишээ нь файл `https://cdn.jsdelivr.net/gh/ТАНЫ_НЭР/m-atlas-media@main/models/kappa.glb` гэсэн хаягаар нээгдэнэ. **Энэ хаягийг браузерт хийж, файл татагдаж байгааг заавал шалга.**
6. Файлыг дараа нь солих бол jsDelivr хуучин хувилбарыг ~12 цаг хадгална. Шууд шинэчлэхийн тулд хаягийн эхний хэсгийг `https://purge.jsdelivr.net/gh/ТАНЫ_НЭР/m-atlas-media@main/models/kappa.glb` болгож нээ. Хэзээ нэг цагт тогтвортой болгохын тулд `@main`-ийн оронд tag (жишээ нь `@v1`) ашиглаж болно.

## 4. Загвар татах (Sketchfab)

1. Хүснэгтийн хуудас бүрийг нээ. Баруун доод талд **"Download 3D model"** товч байна. Sketchfab-д нэвтрэх шаардлагатай байж болно (үнэгүй бүртгэл; энэ нь шалгагдаагүй).
2. Формат нь **glTF** (Autoconverted) эсвэл **glb** сонго. Хамгийн өндөр чанартай текстуртай хувилбарыг ав. Зөвхөн "gltf" zip татагдвал задлаад дотор нь `scene.gltf`, `.bin`, `textures/` гарна, дараагийн алхам үүнийг нэг `.glb` болгоно.
3. Файлуудыг нэг хавтсанд (`downloads\blue-jay\` гэх мэт) хадгал. Эх файлыг хадгалж үлдээ.

## 5. Хөнгөвчлөх, шахах (gltf-transform)

Вэбд зориулан файлыг жижигрүүлнэ. Нэг удаа суулгана (Node.js шаардлагатай):

```
npm install --global @gltf-transform/cli
```

Сайтын viewer нь meshopt-ээр шахсан GLB-г уншдаг (кодоос шалгасан), WebP текстурыг GLTFLoader дэмждэг.

**Хөнгөн загварууд (owl, hummingbird, dragon, kappa)**: зөвхөн шахна.

```
gltf-transform optimize "owl\scene.gltf" screech-owl.glb --compress meshopt --texture-compress webp --texture-size 2048
```

**Хүнд загварууд**: олон өнцөгт (triangle)-г багасгана. `--simplify-ratio` нь хадгалах хувь.

| Загвар | Хэт хүнд (өнцөгт) | `--simplify-ratio` |
|---|---|---|
| Blue Jay | 121k | 0.5 |
| Griffin | 120k | 0.5 |
| Golden Eagle | 181k | 0.35 |
| Titan | 196k | 0.3 |
| Boat-billed Heron | 281k | 0.22 |

```
gltf-transform optimize "heron\scene.gltf" boat-billed-heron.glb --simplify-ratio 0.22 --simplify-error 0.01 --compress meshopt --texture-compress webp --texture-size 2048
```

Заавар:
- Шахсан файлыг заавал [gltf-viewer.donmccurdy.com](https://gltf-viewer.donmccurdy.com) шиг үзүүлэгчээр нээж үз: хэлбэр нь эвдэрсэн, цоорсон, бүдэг биш байгаа эсэхийг хар. Эвдэрсэн бол ratio-г нэмэгдүүл (жишээ нь 0.22 → 0.35).
- Текстур нь 2048 хэтэрвэл сайтын гүйцэтгэл буурна. Файл 10 MB-аас хэтрэх бол `--texture-size 1024`.
- Файлын нэрийг хүснэгтийн нэрээр яв: `blue-jay.glb`, `golden-eagle.glb` гэх мэт.
- Сканнердсан загварт simplify нь UV-г бага зэрэг эвдэж болно. Эв эвгүй харагдвал ratio-г нэмэгдүүл.

## 6. Prompt-уудаа AI Studio-д өгөх (3 хэсэг, дарааллаар)

Нэг урт prompt-ийг нэг дор өгөхөд AI Studio хэт удаан ажиллаж, чат-ийн агуулга шахагдахад хавсралт алдагдсан. Тиймээс 3 богино хэсэгт хуваасан. **Хэсэг бүрийг тусад нь, өмнөх нь дуустал хүлээж өг.**

1. **6a (өгөгдөл).** `matlas-6a-data-en.md`-г Notepad-ээр нээ. Find and replace: `{{MEDIA_BASE}}` → `https://cdn.jsdelivr.net/gh/ТАНЫ_НЭР/m-atlas-media@main` (**төгсгөлд "/" байхгүй**), "Replace all" ашиглаж `{{` үлдээгүйг шалга. Бүтнийг project 3-ын AI Studio-д paste хий. Дуусмагц тайланд 9 загвар ачаалагдсан эсэх, `check:i18n`, `lint`, `test`, `build` бүгд ногоон эсэхийг хар.
2. **6b (зээл ба тест).** 6a амжилттай болсны дараа `matlas-6b-credits-en.md`-г paste хий.
3. **6c (зураг авах хэрэгсэл ба тааруулалт).** `matlas-6c-capture-tuning-en.md`-г paste хий. Энэ хэсэг `yaw`/`pitch`/хэмжээг live дээр тааруулна. Загвар хажуулдаа хэвтсэн, доош харсан бол AI танд мэдэгдэнэ: тэр үед файлыг Blender-ээр эргүүлж дахин гаргах хэрэгтэй.

Хэсэг бүр эхлээд өөрийгөө `docs/specs/` хавтсанд хадгалахыг AI-д заасан. Ингэснээр AI-ийн чат шахагдсан ч текст алга болохгүй. Хэрэв AI дахин "хавсралт алга, дахин илгээнэ үү" гэвэл: тухайн хэсгийн текстийг **хавсралт биш, чатын талбарт шууд paste хий**, эсвэл 6a-г 2 хэсэгт (шувуу 5, домог 4) хувааж өг.

## 7. Зургуудыг авах (9 ширхэг)

Зураг нь хэрэгцээтэй тул загвартай **яг ижил байрлал, гэрэлтэй, ил тод дэвсгэртэй** байх ёстой (картын жижиг зураг, хайлт, ойрын дүрс, ачаалж байх үед). Үүнийг сайт өөрөө хийнэ:

1. Сайтыг **өөрийн компьютер дээр** ажиллуул: репог татаж (`git clone`), `npm install`, `npm run dev`, дараа нь `http://localhost:3000/?capture=1` нээ. (AI Studio-ийн preview дотор татах үйлдэл хаагдаж магадгүй, мөн dev горимд ажиллах эсэх шалгагдаагүй тул локал нь найдвартай.)
2. Загвар бүрийг rail-аас сонго, ачаалж дуусахыг хүлээ, **Shift + P** дар. `{id}.webp` нэртэй 2000 × 2000 px, ил тод дэвсгэртэй зураг татагдана.
3. 9 зургийг media repo-ийн `images/` хавтсанд хуулж, commit хий. Нэр нь хүснэгтийн нэртэй яг таарна.
4. Сайтыг шинэчилж (хэрэв cache бол purge), картууд болон ойрын дүрс зөв харагдаж байгааг шалга. Ойрын дүрсний `lens` байрлал тохироогүй бол AI-д "lens-ийг ... болгож тааруул" гэж хэл.

**Хэрэв capture ажиллахгүй бол (нөөц арга):** Sketchfab дээр загварыг нээж, хамгийн сайн өнцөг (толгой баруун тийш, гурван дөрөвний харагдац) тааруулаад дэлгэцийн зураг ав, дараа нь дэвсгэр арилгагчаар (remove.bg, Canva-ийн "Background Remover") ил тод дэвсгэртэй PNG/WebP болго. Хамгийн багадаа 1600 px урт тал, нэрийг дээрх хүснэгтээр. Гэхдээ байрлал нь viewer-ийн анхны байрлалтай таарахгүй бол ойрын дүрс зөрнө.

## 8. Зээл бичих (CC BY-ийн шаардлага)

CC BY загвар бүрт доор дурдсан 5 зүйлийг харуулах ёстой: нэр, зохиогч, эх хаяг, лиценз (холбоостой), өөрчлөлт хийсэн эсэх. Prompt нь үүнийг viewer-ийн доор нэг жижиг мөр болгож, мөн `docs/CREDITS.md` файлд хүснэгтээр бичнэ. Та хийх зүйл:

- Зээлийн мөр бүр харагдаж байгааг, холбоос нь шинэ цонхонд нээгдэж байгааг шалга.
- Хэрэв загварыг дахин солих бол `credit` талбарыг (нэр, зохиогч, хаяг) хамт солих.
- Titan: зохиогч (Kaan Tezcan) "нэр бичих шаардлагагүй" гэж тайлбарласан ч лиценз нь CC BY тул **бид зээлийг бичнэ**.
- CC0 загваруудад (Golden Eagle, Dragon, Kappa) зээл заавал биш, гэхдээ эх сурвалжийг хүндэтгэж үлдээнэ.

## 9. Шалгах жагсаалт

- [ ] Media repo public, 9 `.glb` файл `models/` дотор, бүгд < 20 MB
- [ ] Хаяг бүр браузерт нээгдэж файл татагдаж байна (404 биш)
- [ ] Prompt дахь `{{MEDIA_BASE}}` бүгд сольсон, төгсгөлд "/" байхгүй
- [ ] Griffin-г AI хэрэгсэлд upload хийгээгүй
- [ ] AI Studio-ийн тайлан: 9 загвар бүгд ачаалагдсан, console-д алдаа байхгүй
- [ ] Загвар бүр өөрийн байрлалд зөв харагдаж байна (толгой баруун тийш, хэтрээгүй, доош харсангүй)
- [ ] 9 зураг `images/` дотор, картууд, хайлт, ойрын дүрс, feature зураг зөв
- [ ] 7 шувуу, 6 домог rail-д, 320 px-ээс 1440 px хүртэл хэвтээ гүйлгэлт үгүй
- [ ] Монгол нэр, тайлбар нь байрлалыг эвдэхгүй
- [ ] Зээлийн мөр бүр харагдаж, холбоос нь ажиллана
- [ ] Хаяг, утас, футер, 404 хуудас хэвээр

## 10. Монгол нэрсийг баталгаажуул

Эдгээр нь миний бичсэн нэрс, зарим нь албан ёсны биш тул та хянаж засна уу:

| Англи | Миний бичсэн | Тайлбар |
|---|---|---|
| Blue Jay | Цэнхэр хэрээ | "жей" гэх шувууны албан ёсны Монгол нэр баталгаагүй, зөвхөн тохиромжтой нэр |
| Eastern Screech Owl | Хашгирагч шар шувуу | утгачилсан орчуулга |
| Stripe-tailed Hummingbird | Судалт сүүлт колибри | утгачилсан орчуулга |
| Golden Eagle | Алтан бүргэд | нийтлэг нэр |
| Boat-billed Heron | Завь хошуут сагсагана | "сагсагана" гэсэн үг баталгаагүй |
| Winged Dragon | Далавчит луу | |
| Griffin | Грифон | транслитераци |
| Titan | Титан | транслитераци |
| Kappa | Каппа | транслитераци |

## 11. Баталгаагүй зүйлс (ил тод хэлье)

- Загваруудын текстур, харагдах чанарыг би **харж чадахгүй** (sandbox Sketchfab, CDN руу хандаж чадахгүй). Лицензийг хуудасны текстээс шалгасан, харин загвар сайн харагдах эсэхийг та viewer дээр шалгана. Ялангуяа Kappa нэцүкэ өнгөт текстуртай эсэх мэдэгдэхгүй. Хоосон саарал бол AI танд мэдэгдэнэ.
- Sketchfab-ийн татах товч нэвтрэх шаардлагатай эсэх.
- jsDelivr-ийн CORS толгой (`access-control-allow-origin`) болон 404 хариултын cache-ийг би шалгаагүй. Модель ачаалагдахгүй бол AI-ийн console дахь CORS алдааг ав.
- Capture хэрэгслийн (Shift + P) AI Studio дотор ажиллах эсэх.
- `yaw`, `pitch`, `scale`, `lens`-ийн эцсийн утга: live дээр тааруулна.
- Prompt-ийн текстэнд бичсэн мэдээллийн ихэнхийг (хэмжээ, тархац, зан араншин) Wikipedia, Sketchfab хуудаснаас шалгасан боловч бүгдийг мэргэжлийн эх сурвалжтай харьцуулаагүй. Хэвлэхээс өмнө нэг удаа уншиж хар.
)
