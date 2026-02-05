# C64 tryby “C64/MC” – notatki projektowe + format Koala (`.kla/.koa`)

Ten plik zbiera:
1) ustalenia modelu danych dla trybów `C64`, `C64 + Cheat Overlay`, `PNG`,
2) opis formatu Koala (`.kla/.koa`) i to, co jest potrzebne do eksportu obrazków MC (multicolor bitmap).

## Tryby edycji (ustalenia)

### `PNG` (jak teraz)
- Jeden raster “PC-towy” z pikselami jako indeks palety C64 `0..15` + `TRANSPARENT`.
- Brak ograniczeń C64 (poza tym, że paleta to 16 kolorów C64).

### `C64`
- Sloty `1..4`:
  - `1/2/3` = Sprite 1 **MC** (multicolor) – 3 kolory: `FG/MC1/MC2` + transparent.
  - `4` = Sprite 2 **Hires** – `OUT` jako 1‑bit maska z jednym kolorem.
- Podgląd “merged PNG”:
  - Sprite 2 (`OUT`) jest na wierzchu i **zawsze przykrywa** Sprite 1.

### `C64 + Cheat Overlay`
- Tło = wynik `C64` (Sprite 1 + Sprite 2 jeśli jest).
- Nad tym warstwa `Cheat`:
  - hires,
  - **bez limitów** (dowolne piksele),
  - ale na razie dalej **paleta C64 (16)**.

## Model danych: “bundle + warstwy”

Docelowo biblioteka sprite’ów najlepiej działa jako **bundle** (grupa), w której są warstwy:
- `MC` (Sprite 1),
- `OUT` (Sprite 2),
- `CHEAT` (opcjonalny),
- `PREVIEW` (renderowany, nie musi być zapisywany jako osobna warstwa).

Każdy bundle pamięta `lastEditedLayerId`, żeby kliknięcie miniatury w bibliotece przełączało edycję na “ostatnio edytowaną” warstwę.

## Koala (`.kla/.koa`) – struktura pliku

Klasyczny plik Koala dla multicolor bitmap ma **10003 bajty**:

| Offset | Rozmiar | Opis |
|---:|---:|---|
| `0x0000` | 2 | adres ładowania (zwykle `$6000`, więc bajty `00 60`) |
| `0x0002` | 8000 | **bitmap** (multicolor bitmap) |
| `0x1F42` | 1000 | **screen RAM** (tzw. “video matrix”) |
| `0x232A` | 1000 | **color RAM** (kolor per komórka 8×8; zwykle używany tylko low‑nibble) |
| `0x2712` | 1 | **background color** (kolor tła; VIC `$D021`) |

Uwagi praktyczne:
- W praktyce, gdy “ładujesz” plik na C64 do `$6000`, dwa pierwsze bajty (adres) nie są częścią danych obrazka w RAM (są nagłówkiem loadera). Dlatego wiele narzędzi traktuje “payload” jako 10001 bajtów (bez nagłówka).
- Rozmieszczenie w pamięci (typowo) odpowiada:
  - bitmap: `$6000..$7F3F` (8000),
  - screen: `$7F40..$8327` (1000),
  - color: `$8328..$870F` (1000),
  - bg: `$8710` (1).

## Multicolor bitmap mode (MC bitmap) – jak C64 mapuje kolory

### Rozdzielczość i komórki
- Multicolor bitmap to **160×200** “dużych pikseli” (poziomo piksel jest 2× szerszy).
- Atrybuty kolorów są **per komórka 8×8** (czyli siatka 40×25 komórek).

### 2 bity na piksel
Bitmap przechowuje 2 bity na piksel:
- W 1 bajcie jest 8 bitów = **4 piksele** (po 2 bity każdy).
- Pary bitów idą: `(7,6)`, `(5,4)`, `(3,2)`, `(1,0)`.

### Znaczenie wartości 2‑bitowych w multicolor bitmap

W multicolor bitmap mode:
- `00` → kolor tła z rejestru VIC `$D021` (background)
- `01` → kolor z **high nibble** bajtu w **screen RAM** (bity `4..7`)
- `10` → kolor z **low nibble** bajtu w **screen RAM** (bity `0..3`)
- `11` → kolor z **color RAM** (low‑nibble; `0..15`)

Wartości w screen RAM i color RAM to indeksy koloru `0..15` w palecie C64.

## Jak to się przekłada na nasz przyszły eksport “MC obrazków” (8×8)

Docelowy “MC obrazek” (bitmap) jest bardzo podobny do Sprite 1 MC, tylko:
- ma większą rozdzielczość (wybieraną),
- i kolory `FG/MC1/MC2` są **per 8×8**, nie globalnie.

Najprostsza i spójna z naszą semantyką (Sprite MC) konwencja mapowania slotów:
- `00` = BG (globalny background)
- `01` = MC1
- `10` = MC2
- `11` = FG

Wtedy eksport do Koala dla każdej komórki 8×8 robi:
- `screenByte.highNibble = MC1`
- `screenByte.lowNibble  = MC2`
- `colorNibble           = FG`
- `bgByte                = BG`

oraz bitmapę wypełnia 2‑bitowymi wartościami zgodnie z pikselami w komórce.

### Transparent w świecie PC vs BG na C64
- C64 bitmap nie ma “alpha” – tło to zawsze BG (`$D021`).
- W podglądzie/exp PNG na PC można dalej traktować `00` (BG) jako:
  - realny kolor tła (BG), albo
  - “transparent” (jeśli chcemy PNG bez tła).
To jest decyzja UI/eksportu, a nie ograniczenie formatu.

## Różnica: sprite MC vs bitmap MC

Sprite MC:
- ma globalne sloty (3 kolory + transparent) per sprite,
- jest w pamięci sprite’ów i ma własny format 64 bajty / sprite.

Bitmap MC (Koala):
- ma globalny BG (`$D021`),
- i **per 8×8 komórka** ma 3 kolory (2 w screen RAM + 1 w color RAM),
- i bitmapę 8000 bajtów.

To właśnie powoduje, że przy bitmapach potrzebujemy `attrs` per komórka 8×8.

