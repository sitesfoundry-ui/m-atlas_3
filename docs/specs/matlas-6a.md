# M Atlas 6a: the nine new specimens (data, collections, labels)

Paste this whole message into the Google AI Studio builder of project 3 (M Atlas). It adds one real, licence-clean 3D specimen to each of the nine collections that have none. This is part 1 of 3; credits and the capture helper come in parts 6b and 6c.

> **Part 1 of 3.** Do only this part. **Step 0:** save this whole message word for word as `docs/specs/matlas-6a.md` in the project (so it survives if the chat context is reset), then implement it. If you cannot see the complete text of this message (for example an attachment is missing or cut off), stop and tell me instead of guessing any data.

> Before you paste: replace every `{{MEDIA_BASE}}` in this message with the public base address of the media repository, with no trailing slash (for example `https://cdn.jsdelivr.net/gh/OWNER/m-atlas-media@main`). The nine `.glb` files must already be uploaded there.

---

## 0. Read first

1. **Look at the current code before you change anything.** Earlier fix prompts (matlas-3, 4, 5) may already have changed files. Open and read `src/content/{categories,specimens,volumes,assets}.js`, `src/pages/CollectionPage.jsx`, `src/features/atlas/**`, `src/i18n/*`, `docs/ASSETS.md`, `scripts/media-probe.mjs` and `package.json` first. Where this prompt names a file or a field that no longer matches the code, follow the code and keep the intent.
2. **The design stays exactly as it is.** Fonts, colours, spacing, layout, video, animation, breakpoints, the footer, the 404 page, the contact details (address, phone, links) and every existing page are not touched. In this part you add data only: the nine specimens, their links to the collections and volumes, a media base address and one trait label. The credit line, the tests and the capture helper come in parts 6b and 6c, so do not build them now.
3. **Mongolian text must never break the layout.** Several Mongolian strings below are longer than their English twins. Check every place a specimen name, tag, trait value, habitat, caption and credit line appears, in both languages, at 320, 360, 390, 414, 600, 768, 1024, 1280 and 1440 px wide. Fix the cause in CSS (wrapping, `min-width: 0`, `overflow-wrap`), never by shrinking fonts below what the design already uses.
4. Code must read as if a careful human wrote it: plain names, no dead code, no commented-out blocks, no `console.log`, no `any`-style shortcuts. No new npm dependency.
5. Do not paste, upload or "analyse" the model files inside this builder. They live on the media host and are only loaded by URL.

## 1. What to build

Nine specimens, one per collection that has no specimen today:

| Volume | Collection (slug) | New specimen id | `no` |
|---|---|---|---|
| birds | `songbirds` | `blue-jay` | MA-103 |
| birds | `owls` | `screech-owl` | MA-104 |
| birds | `hummingbirds` | `hummingbird` | MA-105 |
| birds | `raptors` | `golden-eagle` | MA-106 |
| birds | `waders` | `boat-billed-heron` | MA-107 |
| myths | `dragons` | `dragon` | MA-203 |
| myths | `chimeras` | `griffin` | MA-204 |
| myths | `giants` | `titan` | MA-205 |
| myths | `tricksters` | `kappa` | MA-206 |

### 1.1 `src/content/categories.js`
Add `specimen: "<id>"` to the nine matching entries, exactly the way `kingfisher` and `phoenix` already carry it. Do not change `count`, `icon` or `label`.

### 1.2 `src/content/volumes.js`
Append the new ids to `volumes.birds.specimens` and `volumes.myths.specimens`, in the order of the table above, after the existing ids. Do not change `defaultSpecimen`.

### 1.3 `src/content/mediaBase.js` (new, no imports)
```js
// Public address of the media repository that holds the .glb models and the cut-out images.
// The owner sets VITE_MEDIA_BASE in the environment; the literal below is the fallback.
export const MEDIA_BASE = import.meta.env?.VITE_MEDIA_BASE || "{{MEDIA_BASE}}";
```
It must also load under plain Node, because `scripts/media-probe.mjs` and the tests import `specimens.js`. That is why `import.meta.env` has the optional chaining. Declare `VITE_MEDIA_BASE` as optional in `.env.example` (if the file exists) and in `docs/ASSETS.md`.

### 1.4 `src/content/specimens.js`
Add the import as the first line of the file, and the `media` helper right after the existing `t` helper:

```js
import { MEDIA_BASE } from "./mediaBase.js";
const media = (path) => `${MEDIA_BASE}/${path}`;
```

Then append the nine entries from section 2 below after `kraken`. Keep the existing four entries untouched. The `image` and `model` of a new entry are full `https://` addresses, which is what the existing entries use too, so `assets.js` passes them through in remote mode. Confirm that in `assets.js` (`imageUrl`, `imageFallbackUrl`, `modelUrl`) and, if local mode (`VITE_ASSET_MODE`) rewrites them, make sure an absolute `https://` address is always left alone. Do not switch the site to local mode and do not put any binary file into `public/`.

### 1.5 One new trait label
The icon `t-weight` already exists in the sprite, but there is no label for it. Add `weight` to `traitLabels` in both `src/i18n/en.js` (`"Weight"`) and `src/i18n/mn.js` (`"Жин"`). `npm run check:i18n` must still print `i18n ok`.

### 1.7 Missing images must not look broken
Until the owner has uploaded the nine images (that step comes later, outside this part), the image address of a new specimen answers 404. In that state no card, thumbnail, search result, feature image or lens close-up may show a broken-image icon or a collapsed hole. Reuse whatever empty or loading treatment the design already has for an image that has not loaded (the loading fallback in `assets.js` is a starting point). Once the image exists, nothing else needs to change.

## 2. The nine entries (paste them as they are; tuning comes in part 6c)

All text below was written to fit the existing entries in length. `yaw`, `pitch`, `scale` and `lens` are **starting values**; part 6c tunes them in the live preview. `era` follows the existing rule (the timeline position is `(year + 800) / 2700`).

```js
  {
    id: "blue-jay", volume: "birds", no: "MA-103",
    latin: "Cyanocitta cristata",
    name: t("Blue Jay", "Цэнхэр хэрээ"),
    family: t("Corvidae", "Corvidae"),
    image: media("images/blue-jay.webp"),
    model: media("models/blue-jay.glb"),
    yaw: 0.75, pitch: 0.12,
    era: [1758, 1758], eraLabel: t("Linnaeus, 1758", "Линней, 1758"), scale: t("10 cm", "10 см"),
    tags: [t("Corvid", "Хэрээний овог"), t("Hoarder", "Нөөцлөгч"), t("Mimic", "Дууриагч")],
    lede: t(
      "A loud, clever songbird of the eastern North American oak woods. Its blue is not pigment: the feathers are brown, and the colour comes from light scattering inside them. A jay buries acorns by the thousand and sometimes imitates the cry of a hawk.",
      "Хойд Америкийн зүүн хэсгийн царс модтой ойн чанга, ухаалаг жиргээч шувуу. Түүний цэнхэр нь будагнаас биш: өд нь үнэндээ хүрэн бөгөөд өнгө нь өд доторх гэрлийн сарнилтаас үүсдэг. Цэнхэр хэрээ олон мянган царсны үр булж нөөцөлдөг, заримдаа шонхор шувууны дууг дууриадаг."
    ),
    traits: [
      { icon: "t-ruler", key: "length", value: t("22–30 cm", "22–30 см") },
      { icon: "t-wing", key: "wingspan", value: t("34–43 cm", "34–43 см") },
      { icon: "t-diet", key: "diet", value: t("Acorns, seeds and insects", "Царсны үр, үр тариа, шавж") },
      { icon: "t-range", key: "range", value: t("Eastern North America", "Хойд Америкийн зүүн хэсэг") },
    ],
    habitat: t("Oak and mixed woodland, parks and gardens.", "Царс болон холимог ой, цэцэрлэгт хүрээлэн, хашаа байшин."),
    caption: t("Brown in the hand, blue in the light.", "Гарт хүрэн, гэрэлд цэнхэр."),
    closeup: t("Black bars cross every blue wing and tail feather, and white tips edge the wing like a hem.", "Цэнхэр далавч, сүүлний өд бүрийг хар судал хөндлөн гатлаж, далавчийн ирмэгийг цагаан үзүүр хээ шиг тойруулна."),
    lens: "50% 30%",
    feature: { title: t("Blue by a trick of light.", "Гэрлийн мэхээр цэнхэр."), text: t("A crest that shows its mood. A memory for a thousand acorns.", "Сэтгэлийн байдлаа харуулдаг сүлд. Мянган царсны үрийн ой тогтоолт.") },
    credit: { title: "Blue Jay, Cyanocitta cristata (MLZ:Bird:65124)", author: "MooreLab", url: "https://sketchfab.com/3d-models/blue-jay-cyanocitta-cristata-bbe937f9a0ea441496159d8f7821d07f", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" },
  },
  {
    id: "screech-owl", volume: "birds", no: "MA-104",
    latin: "Megascops asio",
    name: t("Eastern Screech Owl", "Хашгирагч шар шувуу"),
    family: t("Strigidae", "Strigidae"),
    image: media("images/screech-owl.webp"),
    model: media("models/screech-owl.glb"),
    yaw: 0.75, pitch: 0.12,
    era: [1758, 1758], eraLabel: t("Linnaeus, 1758", "Линней, 1758"), scale: t("10 cm", "10 см"),
    tags: [t("Nocturnal", "Шөнийн"), t("Cavity nester", "Хонхорт үүрлэгч"), t("Camouflaged", "Нуугдмал өнгөтэй")],
    lede: t(
      "A small owl whose feathered “ear” tufts are not ears. Its voice is no screech at all but a quavering trill and a descending, horse-like whinny. It comes in two main colour forms, red and grey, and by day it sits in a tree hole so still against the bark that you can walk past it.",
      "Толгой дээрх өдөн «чих» нь чих биш жижиг шар шувуу. Дуу нь хашгираан огт биш, чичигнэсэн трель болон морины янцгаах мэт буурсан дуу юм. Голдуу улаан ба саарал гэсэн хоёр өнгөтэй бөгөөд өдөр нь модны хонхорт, холтостой нийлсэн хөдөлгөөнгүй суудаг тул хажуугаар нь өнгөрөөд ч анзаарахгүй байж болно."
    ),
    traits: [
      { icon: "t-ruler", key: "length", value: t("16–25 cm", "16–25 см") },
      { icon: "t-wing", key: "wingspan", value: t("46–61 cm", "46–61 см") },
      { icon: "t-diet", key: "diet", value: t("Insects, small mammals and birds", "Шавж, жижиг хөхтөн, шувуу") },
      { icon: "t-range", key: "range", value: t("Eastern North America", "Хойд Америкийн зүүн хэсэг") },
    ],
    habitat: t("Woodland edges, orchards and suburban gardens.", "Ойн зах, жимсний цэцэрлэг, хотын захын хашаа."),
    caption: t("Still enough to be mistaken for the tree.", "Модтой андуурмаар хөдөлгөөнгүй."),
    closeup: t("Grey streaks and bars break up its outline, so a roosting owl reads as a broken branch.", "Саарал судал, хөндлөн зураас нь биеийн дүрсийг бутлах тул амарч буй шар шувуу хугарсан мөчир шиг харагдана."),
    lens: "50% 25%",
    feature: { title: t("The tree that blinks.", "Цавчдаг мод."), text: t("Two colour forms. A trembling call that is never a screech.", "Хоёр өнгө. Хашгираан биш, чичигнэсэн дуу.") },
    credit: { title: "Eastern Screech Owl", author: "Innovation Studio, Carnegie Museum of Natural History", url: "https://sketchfab.com/3d-models/eastern-screech-owl-1b34de1b8208495abb37b4b629c1f8a3", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" },
  },
  {
    id: "hummingbird", volume: "birds", no: "MA-105",
    latin: "Eupherusa eximia",
    name: t("Stripe-tailed Hummingbird", "Судалт сүүлт колибри"),
    family: t("Trochilidae", "Trochilidae"),
    image: media("images/hummingbird.webp"),
    model: media("models/hummingbird.glb"),
    yaw: 0.75, pitch: 0.12,
    era: [1843, 1843], eraLabel: t("Delattre, 1843", "Делатр, 1843"), scale: t("2 cm", "2 см"),
    tags: [t("Nectar feeder", "Нектар сорогч"), t("Hoverer", "Хөвөгч"), t("Cloud forest", "Манантай ой")],
    lede: t(
      "A tiny emerald of the humid forests from southeastern Mexico to Panama. The male is brilliant green, and the black and white outer tail feathers that he flashes give the bird its name. His folded wing carries a cinnamon-rufous patch. It breeds higher on the mountain slope and moves down to lower ground afterwards.",
      "Мексикийн зүүн өмнөд хэсгээс Панам хүртэлх чийглэг ойн бяцхан маргад. Эр нь гялалзсан ногоон бөгөөд сүүлийнх нь гадна талын хар, цагаан өд шувууны нэрийг өгсөн. Эрийн нугалсан далавч дээр шанаган улаан толбо харагддаг. Уулын налуугийн өндөр хэсэгт үржиж, дараа нь нам дор газар руу буудаг."
    ),
    traits: [
      { icon: "t-ruler", key: "length", value: t("9–10.5 cm", "9–10.5 см") },
      { icon: "t-weight", key: "weight", value: t("4–4.5 g", "4–4.5 г") },
      { icon: "t-diet", key: "diet", value: t("Nectar and small arthropods", "Нектар, жижиг үе хөлтөн") },
      { icon: "t-range", key: "range", value: t("Southeastern Mexico to Panama", "Мексикийн зүүн өмнөдөөс Панам хүртэл") },
    ],
    habitat: t("Humid mountain forest and shade-grown coffee.", "Чийглэг уулын ой, сүүдэрт ургуулсан кофены тариа."),
    caption: t("A jewel that will not sit still.", "Нэг газар суухгүй эрдэнийн чулуу."),
    closeup: t("Black and white outer tail feathers give the bird its name and flash open as it turns.", "Сүүлний гадна талын хар, цагаан өд нь шувууны нэрийг өгсөн бөгөөд эргэх үед нь дэлгэгдэн анивчина."),
    lens: "70% 55%",
    feature: { title: t("Four grams of green fire.", "Дөрвөн грамм ногоон гал."), text: t("A wing patch the colour of cinnamon. A tail that flashes black and white.", "Шанаган өнгийн далавчны толбо. Хар, цагаан анивчдаг сүүл.") },
    credit: { title: "Stripe-tailed Hummingbird, Eupherusa eximia (MLZ:Bird:25869)", author: "MooreLab", url: "https://sketchfab.com/3d-models/stripe-tailed-hummingbird-eupherusa-eximia-d878d181cc3947f3a4e4fa22c6cd11f5", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" },
  },
  {
    id: "golden-eagle", volume: "birds", no: "MA-106",
    latin: "Aquila chrysaetos",
    name: t("Golden Eagle", "Алтан бүргэд"),
    family: t("Accipitridae", "Accipitridae"),
    image: media("images/golden-eagle.webp"),
    model: media("models/golden-eagle.glb"),
    yaw: 0.75, pitch: 0.12,
    era: [1758, 1758], eraLabel: t("Linnaeus, 1758", "Линней, 1758"), scale: t("20 cm", "20 см"),
    tags: [t("Apex hunter", "Дээд махчин"), t("Soaring", "Эргэлдэгч"), t("Hunter’s partner", "Анчны хамтрагч")],
    lede: t(
      "A broad-winged hunter of open mountain country across the Northern Hemisphere. It soars on warm air, then stoops on a hare, a marmot or a fox at more than 240 km/h. In western Mongolia, Kazakh eagle hunters still raise young eagles and fly them from horseback in winter. This one is a mounted museum specimen from southern Poland.",
      "Хойд хагас бөмбөгийн нээлттэй уулархаг нутгийн өргөн далавчтай анчин. Дулаан агаарын урсгалд эргэлдэж байгаад туулай, тарвага, үнэг рүү цагт 240 км-ээс дээш хурдтай шумбан буудаг. Баруун Монголд казах бүркэдчид одоо ч бүргэдийн дэгдээхий өсгөж, өвөл морин дээрээсээ агнуурт гаргадаг. Энэ нь Польшийн өмнөд хэсгийн музейн чихмэл сорьц юм."
    ),
    traits: [
      { icon: "t-wing", key: "wingspan", value: t("1.8–2.3 m", "1.8–2.3 м") },
      { icon: "t-speed", key: "diveSpeed", value: t("Over 240 km/h", "Цагт 240 км-ээс дээш") },
      { icon: "t-diet", key: "diet", value: t("Hares, marmots, foxes and birds", "Туулай, тарвага, үнэг, шувуу") },
      { icon: "t-range", key: "range", value: t("Across the Northern Hemisphere", "Хойд хагас бөмбөгийн өргөн нутаг") },
    ],
    habitat: t("Mountains, steppe edges and open cliffs.", "Уул, хээрийн зах, ил хад."),
    caption: t("A shadow before it is a bird.", "Шувуу болохоосоо өмнө сүүдэр."),
    closeup: t("Golden feathers on the nape gave the species its name; the hooked bill and the talons do the work.", "Хүзүүний ар талын алтлаг өд нэрийг нь өгсөн; харин ажлыг нь муруй хошуу, хүчтэй хумс гүйцэтгэдэг."),
    lens: "35% 25%",
    feature: { title: t("The sky’s own hunter.", "Тэнгэрийн анчин."), text: t("Two-metre wings. A partnership of rider, horse and eagle.", "Хоёр метр далавч. Морьтон, морь, бүргэдийн хамтын ажиллагаа.") },
    credit: { title: "Golden Eagle (Tomek Natural Science Museum, Ciężkowice, inv. MP 407)", author: "Virtual Museums of Małopolska", url: "https://sketchfab.com/3d-models/golden-eagle-dd0552b1f93b441cbdd626a5b2abebbf", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" },
  },
  {
    id: "boat-billed-heron", volume: "birds", no: "MA-107",
    latin: "Cochlearius cochlearius",
    name: t("Boat-billed Heron", "Завь хошуут сагсагана"),
    family: t("Ardeidae", "Ardeidae"),
    image: media("images/boat-billed-heron.webp"),
    model: media("models/boat-billed-heron.glb"),
    yaw: 0.75, pitch: 0.12,
    era: [1766, 1766], eraLabel: t("Linnaeus, 1766", "Линней, 1766"), scale: t("10 cm", "10 см"),
    tags: [t("Nocturnal", "Шөнийн"), t("Mangrove", "Мангр ойн"), t("Colonial", "Колонит")],
    lede: t(
      "A stocky night heron with a broad bill like an upturned boat and huge eyes for the dark. It nests semi-colonially in mangrove trees and feeds after dusk on shrimp and small fish. It was once given a family of its own and is now counted among the herons. Males generally carry a longer crest than females, which is thought to help attract a mate.",
      "Онхолдсон завь шиг өргөн хошуутай, харанхуйд зориулсан асар том нүдтэй, гүвэгэр биетэй шөнийн сагсагана. Мангр модод хагас колони болж үүрлэдэг бөгөөд үдшийн дараа сам хорхой, жижиг загас агнадаг. Нэгэн цагт тусдаа овогт тооцогдож байсан ч одоо сагсаганын Ardeidae овогт багтдаг. Эр нь эмээсээ урт сүлдтэй байдаг нь хань татахад тус болдог гэж үздэг."
    ),
    traits: [
      { icon: "t-ruler", key: "length", value: t("About 54 cm", "Ойролцоогоор 54 см") },
      { icon: "t-diet", key: "diet", value: t("Small fish and shrimp at night", "Шөнө жижиг загас, сам хорхой") },
      { icon: "t-range", key: "range", value: t("Mexico to South America", "Мексикээс Өмнөд Америк хүртэл") },
      { icon: "t-time", key: "reported", value: t("Sinaloa, Mexico, 1935", "Синалоа, Мексик, 1935") },
    ],
    habitat: t("Mangrove swamps and wooded wetlands.", "Мангр намаг, ойт нойтон нутаг."),
    caption: t("Awake when the pond goes dark. This specimen was collected in Sinaloa in 1935.", "Цөөрөм харанхуйлахад сэрдэг. Энэ сорьцыг 1935 онд Синалоагаас цуглуулжээ."),
    closeup: t("The bill is a broad scoop, and the dark crest is longer in the male.", "Хошуу нь өргөн халбага шиг, харин хар сүлд нь эр дээр илүү урт."),
    lens: "30% 30%",
    feature: { title: t("A bill like an upturned boat.", "Онхолдсон завь шиг хошуу."), text: t("Huge eyes for the dark. A night shift on the mangrove pond.", "Харанхуйд зориулсан том нүд. Мангр цөөрмийн шөнийн ээлж.") },
    credit: { title: "Boat-billed Heron, Cochlearius cochlearius (MLZ:Bird:13447)", author: "MooreLab", url: "https://sketchfab.com/3d-models/boat-billed-heron-cochlearius-cochlearius-4fad4a07bacd432b88736c95475c6dbb", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" },
  },
  {
    id: "dragon", volume: "myths", no: "MA-203",
    latin: "Draco pennatus",
    name: t("Winged Dragon", "Далавчит луу"),
    family: t("Dragons", "Луунууд"),
    image: media("images/dragon.webp"),
    model: media("models/dragon.glb"),
    yaw: 0.75, pitch: 0.12,
    era: [-450, -350], eraLabel: t("Warring States, 5th–4th c. BC", "Дайтагч улсын үе, МЭӨ V–IV зуун"), scale: t("10 m", "10 м"),
    tags: [t("Rain-bringer", "Бороо авчирагч"), t("Bronze", "Хүрэл"), t("Zodiac", "Жилийн тооллын")],
    lede: t(
      "A bronze winged dragon from China, 5th–4th century BC, its moustache and tail patterns typical of the Warring States. A Chinese dragon is not a monster to be slain but a power of water and weather: it lives in rivers and clouds and brings the rain. In the twelve-animal calendar that Mongolia also keeps, it is the only creature nobody has ever met.",
      "МЭӨ V–IV зууны үеийн Хятадын хүрэл далавчит луу. Сахал, сүүлний хээ нь Дайтагч улсын үеийн ердийн хэв шинж. Хятадын луу бол алах ёстой мангас бус, ус, цаг агаарын хүч: гол мөрөн, үүлэнд амьдарч, бороо авчирдаг. Монголчуудын мөн баримталдаг арван хоёр жилийн тооллын амьтдаас хэн ч нүдээр үзээгүй цорын ганц нь луу."
    ),
    traits: [
      { icon: "t-ruler", key: "length", value: t("As long as the river, by report", "Голын адил урт (домгоор)") },
      { icon: "t-time", key: "lifespan", value: t("Older than the river", "Голоос ч эртний") },
      { icon: "t-diet", key: "diet", value: t("Rain clouds and river mist", "Бороот үүл, голын манан") },
      { icon: "t-range", key: "range", value: t("Rivers, clouds and mountains of East Asia", "Зүүн Азийн гол, үүл, уул") },
    ],
    habitat: t("Deep river pools, thunderclouds and temple roofs.", "Голын гүн ус, аянгат үүл, сүмийн дээвэр."),
    caption: t("The river turned over, and the sky answered.", "Гол эргэхэд тэнгэр хариулав."),
    closeup: t("Curled moustache and tail patterns, typical of Warring States bronze, are cast into the body.", "Мурийсан сахал, сүүлний хээ нь Дайтагч улсын үеийн хүрэлд ердийн, биед нь цутгаастай."),
    lens: "30% 25%",
    feature: { title: t("A storm with a spine.", "Нуруутай шуурга."), text: t("Wings of bronze. A cloud for a home.", "Хүрэл далавч. Үүл бол гэр.") },
    credit: { title: "Winged Dragon (one of pair), 5th–4th century BCE", author: "Minneapolis Institute of Art", url: "https://sketchfab.com/3d-models/winged-dragon-one-of-pair-5th-4th-century-bce-b390b4046d6c46beb811c8c9e21014d4", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" },
  },
  {
    id: "griffin", volume: "myths", no: "MA-204",
    latin: "Gryps aurifer",
    name: t("Griffin", "Грифон"),
    family: t("Chimeras", "Химерууд"),
    image: media("images/griffin.webp"),
    model: media("models/griffin.glb"),
    yaw: 0.75, pitch: 0.12,
    era: [-800, -430], eraLabel: t("Herodotus, 430 BC", "Геродот, МЭӨ 430 он"), scale: t("2 m", "2 м"),
    tags: [t("Gold-guard", "Алт манагч"), t("Composite", "Хосолмол"), t("Stone", "Чулуун")],
    lede: t(
      "A lion’s body with an eagle’s head, wings and talons. Herodotus set griffins in the far north, guarding gold, and repeated the story at second hand without vouching for it. One modern theory, the folklorist Adrienne Mayor’s, ties the legend to dinosaur fossils that nomads found in the Gobi. This one is a carved stone griffin from Downing College, Cambridge.",
      "Арслангийн бие, бүргэдийн толгой, далавч, хумстай амьтан. Геродот грифоныг алс умардад алт хамгаалдаг хэмээн бичсэн бөгөөд энэ түүхийг хоёр дахь гараас сонссон тул өөрөө баталгаа өгөөгүй. Орчин үеийн нэг онол (Адриенн Майор) энэ домгийг нүүдэлчдийн Говиос олсон үлэг гүрвэлийн чулуужсан ястай холбодог. Энэ бол Кембрижийн Даунинг коллежийн чулуун сийлбэр грифон."
    ),
    traits: [
      { icon: "t-ruler", key: "length", value: t("Lion-sized", "Арслангийн хэмжээтэй") },
      { icon: "t-wing", key: "wingspan", value: t("Broad as a lion is long", "Арслангийн биеийн урттай тэнцүү") },
      { icon: "t-diet", key: "diet", value: t("Horses and trespassers", "Морь, зөвшөөрөлгүй орогч") },
      { icon: "t-range", key: "reported", value: t("Beyond Scythia, by the gold hills", "Скифийн цаана, алтат толгодын дэргэд") },
    ],
    habitat: t("Gold-bearing hills beyond the steppe.", "Хээрийн цаадах алтат толгод."),
    caption: t("It does not blink. It does not share.", "Нүд цавчдаггүй. Хуваалцдаггүй."),
    closeup: t("Where the eagle ends and the lion begins is the whole legend.", "Бүргэд хаана дуусч, арслан хаанаас эхэлдэг нь домгийн мөн чанар."),
    lens: "35% 25%",
    feature: { title: t("Two kings in one body.", "Нэг биед хоёр хаан."), text: t("Lion and eagle. A guard that never sleeps.", "Арслан ба бүргэд. Хэзээ ч унтдаггүй манаач.") },
    credit: { title: "Stone Griffin, Downing College, Cambridge", author: "Thomas Flynn", url: "https://sketchfab.com/3d-models/stone-griffin-downing-college-cambridge-d94638d6c6ad4119b868567cf8e9fe2b", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" },
  },
  {
    id: "titan", volume: "myths", no: "MA-205",
    latin: "Titan primordialis",
    name: t("Titan", "Титан"),
    family: t("Giants", "Аваргууд"),
    image: media("images/titan.webp"),
    model: media("models/titan.glb"),
    yaw: 0.75, pitch: 0.12,
    era: [-800, -700], eraLabel: t("Hesiod, c. 700 BC", "Гесиод, МЭӨ 700 орчим"), scale: t("50 m", "50 м"),
    tags: [t("Elder god", "Эртний бурхан"), t("Mountain-sized", "Уул чинээ"), t("Imprisoned", "Хоригдсон")],
    lede: t(
      "The Titans were the elder gods of Greece, children of Earth and Sky, who ruled before the Olympians. Hesiod tells how Zeus overthrew them in a ten-year war and shut them in Tartarus. The word has meant “huge” ever since. This one is a modern digital sculpt of a titan statue.",
      "Титанууд бол Дэлхий ба Тэнгэрийн үр удам, Олимпийн бурхдаас өмнө захирч байсан Грекийн эртний бурхад юм. Гесиодын өгүүлснээр Зевс тэднийг арван жилийн дайнд ялж, Тартарт хорьсон. Тэр цагаас хойш энэ үг «асар том» гэсэн утгатай болсон. Энэ бол орчин үеийн дижитал сийлбэрээр бүтээсэн титаны хөшөө юм."
    ),
    traits: [
      { icon: "t-ruler", key: "length", value: t("Taller than mountains, by report", "Уулнаас өндөр (домгоор)") },
      { icon: "t-time", key: "lifespan", value: t("Immortal, until the Olympians", "Мөнх, Олимпийнхон гарч иртэл") },
      { icon: "t-diet", key: "diet", value: t("Ambrosia and old grudges", "Амброзиа, хуучин өшөө") },
      { icon: "t-range", key: "range", value: t("Mount Othrys, then Tartarus", "Отрис уул, дараа нь Тартар") },
    ],
    habitat: t("Mount Othrys, then the pit of Tartarus.", "Отрис уул, дараа нь Тартарын нүх."),
    caption: t("Before the gods, there were these.", "Бурхдаас өмнө эдгээр байв."),
    closeup: t("Shoulders broad enough to hold a sky: Atlas, one of the Titans, was condemned to carry it.", "Тэнгэр үүрэхээр өргөн мөр: Титануудын нэг Атлас тэнгэрийг үүрэхээр шийтгэгдсэн."),
    lens: "50% 20%",
    feature: { title: t("The gods before the gods.", "Бурхдын өмнөх бурхад."), text: t("Mountain-sized. Older than Olympus. Locked away, never forgotten.", "Уул чинээ. Олимпоос ч эртний. Хорьсон ч мартагдаагүй.") },
    credit: { title: "Ancient Titan Statue", author: "Kaan Tezcan", url: "https://sketchfab.com/3d-models/ancient-titan-statue-c7e1295da4574a248f717367c842430b", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" },
  },
  {
    id: "kappa", volume: "myths", no: "MA-206",
    latin: "Kappa fluvialis",
    name: t("Kappa", "Каппа"),
    family: t("Tricksters", "Мэхлэгчид"),
    image: media("images/kappa.webp"),
    model: media("models/kappa.glb"),
    yaw: 0.75, pitch: 0.12,
    era: [1603, 1868], eraLabel: t("Edo period", "Эдогийн үе"), scale: t("1 m", "1 м"),
    tags: [t("Water sprite", "Усны сүнс"), t("Prankster", "Тоглоомч"), t("Wrestler", "Барилдаач")],
    lede: t(
      "A river sprite of Japan with a dish of water on its head, a shell on its back and a love of cucumbers. It drags horses into the water and challenges travellers to wrestle. But it is strictly polite: bow to it and it bows back, spilling the water that gives it strength. This one is a late-19th-century netsuke, a small carved toggle, showing a kappa with a toad.",
      "Японы голын сүнс: толгой дээрээ усны аяга, нуруундаа хясаан бүрхүүл тээж, өргөст хэмхэнд хайртай. Морийг усанд чирч, зорчигчдыг барилдахыг сорьдог. Гэхдээ маш ёсорхог: түүнд мэхийн мэндэлбэл тэр ч мэхийн хариулж, хүч өгдөг усаа асгачихдаг. Энэ бол XIX зууны сүүлийн үеийн нэцүкэ, жижиг сийлбэр зүүлт бөгөөд каппа ба бахыг дүрсэлжээ."
    ),
    traits: [
      { icon: "t-ruler", key: "length", value: t("Child-sized", "Хүүхдийн хэмжээтэй") },
      { icon: "t-depth", key: "depth", value: t("Deep river pools", "Голын гүн ус") },
      { icon: "t-diet", key: "diet", value: t("Cucumbers, and the unwary", "Өргөст хэмх, болгоомжгүй хүн") },
      { icon: "t-range", key: "range", value: t("Rivers and ponds across Japan", "Японы гол, цөөрөм") },
    ],
    habitat: t("Rivers, ponds and the edges of rice fields.", "Гол, цөөрөм, будааны талбайн захад."),
    caption: t("Bow to it, and it bows back.", "Мэхийн мэндлэхэд мэхийн хариулна."),
    closeup: t("The dish on its crown holds the water that gives it strength; one deep bow and it spills.", "Тэргүүн дээрх аяган дахь ус түүнд хүч өгдөг; гүн мэхийн мэндлэхэд асгарна."),
    lens: "40% 25%",
    feature: { title: t("The river’s polite prankster.", "Голын ёсорхог тоглоомч."), text: t("Strong in water, helpless with an empty dish. A trick as old as the bow.", "Усанд хүчтэй, аяга хоосорвол арчаагүй. Мэхийн мэнд шиг эртний заль.") },
    credit: { title: "Netsuke: Kappa and Toad", author: "Minneapolis Institute of Art", url: "https://sketchfab.com/3d-models/netsuke-kappa-and-toad-745efca54e0244d48d2719516f8a6c7f", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" },
  },
```

## Checks to run and report

1. `npm run check:i18n` prints `i18n ok`, `npm run lint` reports zero errors, `npm test` passes, `npm run build` succeeds.
2. Each of the nine collection pages lists its specimen (a card with the cut-out image, name, family and number) and keeps its existing count. The "plates have not been drawn yet" line stays only for collections that still have no specimen. Check `CollectionPage.jsx` and make the smallest change that makes the card appear exactly as the kingfisher and phoenix cards do.
3. The specimen rail, search, the About thumbnails and the timeline work with seven birds and six myths. No horizontal page scroll at any width in the list above, nothing clipped, keyboard focus order unchanged. Search finds the new names in both languages (for example "heron", "сагсагана", "dragon", "луу", "griffin", "грифон").
4. Switching language on a new specimen re-renders all its text.
5. `npm run media:probe` (or the same check by hand) lists every new model address with its status. The `.glb` addresses must answer 200; the image addresses may still answer 404 for now.
6. Report: which of the nine models load, and any console error with its exact text. Do not invent a different model address.
