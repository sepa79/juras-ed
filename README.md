# JurasEd

Prosty edytor HTML do rysowania pixel-artu/sprite’ów w palecie C64 i zapisywania do PNG z tłem transparentnym.

## Założenia

- **Paleta:** 16 kolorów C64 do rysowania.
- **Pole rysowania:** 24×21 (rozmiar sprajta) lub wielokrotności (składanie wielu sprajtów w jednym obrazie), albo **dowolna rozdzielczość**.
- **Kolor tła:** wybierany z normalnej palety RGB, ale **przy zapisie do PNG tło jest transparentne** (zapisywane są tylko narysowane piksele).
- **Tryb kursora:** normalny albo **2× wide pixel** (jak C64 multicolor – rysowanie w parach pikseli w poziomie).
- **Prawy przycisk myszy:** zawsze rysuje transparentem (działa jak „gumka” bez zmiany narzędzia).
- **Undo/Redo:** historia zmian (Ctrl+Z / Ctrl+Y lub Ctrl+Shift+Z).

## Uruchomienie

To jest statyczna strona – nie wymaga serwera.

- Otwórz `index.html` w przeglądarce (Chrome/Edge/Firefox).
- Albo odpal jako GitHub Pages: `https://sepa79.github.io/juras-ed/` (po włączeniu Pages w repo).
- Stan edytora jest zapisywany w `localStorage`, więc odświeżenie (`F5`) nie powinno kasować pracy.
- Import/Export:
  - `Export` / `Import` na górnym pasku zapisuje/ładuje projekt jako JSON.
  - `Sprites -> Import PNG` dodaje PNG jako nowy sprite (kolory mapowane do palety C64, alpha < 128 = transparent).
  - `Zapisz PNG` na górnym pasku eksportuje cały spritesheet (wszystkie sprite’y) do jednego PNG.

## GitHub Pages

Repo ma workflow do Pages (`.github/workflows/pages.yml`).

1. Wejdź w repo na GitHub → **Settings → Pages**
2. W **Source** wybierz **GitHub Actions**
3. Po pushu na `main` strona powinna się zdeployować automatycznie

## Easter egg theme

- Przycisk **Theme** w górnym pasku przełącza `light` (normalny) i `dark` (tryb "piekielny").

## Sterowanie

- **Kolory (C64, jak na C64):** `1` = FG, `2` = MC1, `3` = MC2, `4` = OUT (outline, teoretycznie jak 2gi sprite hires). Kliknięcie w palecie przypisuje kolor do aktywnego slotu.
- **Narzędzia (hotkeye po angielsku):** Pen (`P`), Eraser (`E`), Line (`L`), Fill (`F`), Rectangle (`R`), Circle (`C`).
- **Select / Copy / Paste:**
  - Select (`Q`) zaznaczenie prostokątne
  - Copy: przycisk **Copy** lub `Ctrl+C` (działa, gdy Select jest aktywny i jest zaznaczenie)
  - Paste: przycisk **Paste** lub `Ctrl+V` (wkleja aktywny swatch; można wklejać wielokrotnie)
  - `Esc` anuluje paste i czyści zaznaczenie
- **Swatches:** każdy `Ctrl+C` dodaje wycinek do panelu „Swatches” (po prawej). Kliknięcie miniatury ustawia aktywny bufor wklejania; można wklejać wielokrotnie. Przycisk `-> Sprite` tworzy nowy sprite z wycinka.
- **Sprites:** panel „Sprites” (po prawej) pokazuje sprite’y. `+ Add` dodaje nowy, klik miniatury przełącza aktywną edycję, `Duplicate` robi kopię, kosz usuwa, `-> Swatch` dodaje sprite do swatchy (do wklejania).
- **Wypełniaj kształty:** checkbox „Wypełniaj kształty” (dotyczy prostokąta i koła).
- **Siatka:** `G`
- **Wide pixel:** `W`
- **Wypełnianie (toggle):** `S`
- **Undo / Redo:** `Ctrl+Z`, `Ctrl+Y` (lub `Ctrl+Shift+Z`)
- **Zapis PNG:** przycisk „Zapisz PNG”.
- **Scroll:**
  - Wheel = zoom
  - `Shift` + wheel = zmiana slotu koloru (FG/MC1/MC2/OUT)
  - `Ctrl`/`Cmd` + wheel = zmiana koloru w aktywnym slocie

## Transform mode

- Włącz „Transform mode” (`T`) żeby pokazać przyciski dookoła płótna.
- **Roll:** strzałki w overlay (albo klawisze `Arrow` gdy tryb jest włączony) przesuwają obraz o 1px z zawijaniem.
- **Mirror (draw):** `X` (mirror X) i `Y` (mirror Y) odbijają rysowanie względem środka płótna.

## Resize canvas

- Zmiana rozmiaru płótna stara się **zachować** istniejące piksele (rozszerza przez transparent).
- Przy zmniejszaniu, jeśli grozi utrata danych, pojawi się ostrzeżenie.
