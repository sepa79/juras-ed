(async () => {
  "use strict";

  const SPRITE_W = 24;
  const SPRITE_H = 21;
  const TRANSPARENT = 255;
  const MAX_SIZE = 512;
  const MAX_HISTORY = 50;
  const LS_KEY = "jurased_state_v1";
  let saveTimer = null;

  // Pepto C64 palette (commonly used).
  const C64 = [
    { name: "Black", hex: "#000000", rgb: [0, 0, 0] },
    { name: "White", hex: "#ffffff", rgb: [255, 255, 255] },
    { name: "Red", hex: "#68372b", rgb: [104, 55, 43] },
    { name: "Cyan", hex: "#70a4b2", rgb: [112, 164, 178] },
    { name: "Purple", hex: "#6f3d86", rgb: [111, 61, 134] },
    { name: "Green", hex: "#588d43", rgb: [88, 141, 67] },
    { name: "Blue", hex: "#352879", rgb: [53, 40, 121] },
    { name: "Yellow", hex: "#b8c76f", rgb: [184, 199, 111] },
    { name: "Orange", hex: "#6f4f25", rgb: [111, 79, 37] },
    { name: "Brown", hex: "#433900", rgb: [67, 57, 0] },
    { name: "Light red", hex: "#9a6759", rgb: [154, 103, 89] },
    { name: "Dark grey", hex: "#444444", rgb: [68, 68, 68] },
    { name: "Grey", hex: "#6c6c6c", rgb: [108, 108, 108] },
    { name: "Light green", hex: "#9ad284", rgb: [154, 210, 132] },
    { name: "Light blue", hex: "#6c5eb5", rgb: [108, 94, 181] },
    { name: "Light grey", hex: "#959595", rgb: [149, 149, 149] },
  ];

  const el = (id) => {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing element: #${id}`);
    return node;
  };

  const paletteEl = el("palette");
  const canvas = el("canvas");
  const wrap = el("canvasWrap");

  const slotFgBtn = el("slotFg");
  const slotMc1Btn = el("slotMc1");
  const slotMc2Btn = el("slotMc2");
  const slotOutBtn = el("slotOut");
  const slotCheatBtn = el("slotCheat");
  const slotFgSwatch = el("slotFgSwatch");
  const slotMc1Swatch = el("slotMc1Swatch");
  const slotMc2Swatch = el("slotMc2Swatch");
  const slotOutSwatch = el("slotOutSwatch");
  const slotCheatSwatch = el("slotCheatSwatch");

  const customResEl = el("customRes");
  const spriteControlsEl = el("spriteControls");
  const customControlsEl = el("customControls");
  const spritesXEl = el("spritesX");
  const spritesYEl = el("spritesY");
  const customWEl = el("customW");
  const customHEl = el("customH");

  const zoomEl = el("zoom");
  const bgColorEl = el("bgColor");
  const showGridEl = el("showGrid");
  const grid8El = el("grid8");
  const widePixelEl = el("widePixel");
  const shapeFillEl = el("shapeFill");
  const btnTransform = el("btnTransform");

  const btnSave = el("btnSave");
  const btnClear = el("btnClear");
  const btnUndo = el("btnUndo");
  const btnRedo = el("btnRedo");
  const btnTheme = el("btnTheme");
  // Modes removed: always C64 + Cheat.
  const fireCanvas = el("fireCanvas");
  const evilCursorEl = el("evilCursor");
  const btnHelp = el("btnHelp");
  const btnHotkeys = el("btnHotkeys");
  const btnLang = el("btnLang");
  const btnIO = el("btnIO");
  const helpModal = el("helpModal");
  const btnHelpClose = el("btnHelpClose");
  const helpText = el("helpText");
  const helpContent = el("helpContent");
  const keysModal = el("keysModal");
  const btnKeysClose = el("btnKeysClose");
  const keysTitle = el("keysTitle");
  const keysContent = el("keysContent");
  const confirmModal = el("confirmModal");
  const confirmTitle = el("confirmTitle");
  const confirmMsg = el("confirmMsg");
  const btnConfirmClose = el("btnConfirmClose");
  const btnConfirmCancel = el("btnConfirmCancel");
  const btnConfirmOk = el("btnConfirmOk");
  const projectNameEl = el("projectName");
  const lsInfoEl = el("lsInfo");
  const btnSaveNow = el("btnSaveNow");
  const btnLsClear = el("btnLsClear");

  const fileProject = el("fileProject");
  const fileSpd = el("fileSpd");
  const fileSpritePng = el("fileSpritePng");
  const fileSwatchPng = el("fileSwatchPng");
  const ioModal = el("ioModal");
  const btnIoClose = el("btnIoClose");
  const ioActionImport = el("ioActionImport");
  const ioActionExport = el("ioActionExport");
  const ioList = el("ioList");

  const spriteInspectorEl = el("spriteInspector");
  const spriteInspectorCanvas = el("spriteInspectorCanvas");
  const spriteInspectorNameEl = el("spriteInspectorName");
  const spriteInspectorLayersEl = el("spriteInspectorLayers");
  const inspToSwatch = el("inspToSwatch");
  const inspDuplicate = el("inspDuplicate");
  const inspDelete = el("inspDelete");

  const transformOverlayEl = el("transformOverlay");
  const btnRollUp = el("btnRollUp");
  const btnRollDown = el("btnRollDown");
  const btnRollLeft = el("btnRollLeft");
  const btnRollRight = el("btnRollRight");
  const btnMirrorX = el("btnMirrorX");
  const btnMirrorY = el("btnMirrorY");

  const btnAddSprite = el("btnAddSprite");
  const btnAddMcImage = el("btnAddMcImage");
  const spriteListEl = el("spriteList");
  const btnToggleSprites = el("btnToggleSprites");
  const btnToggleSwatches = el("btnToggleSwatches");
  const spritesBodyEl = el("spritesBody");
  const swatchesBodyEl = el("swatchesBody");
  const libraryListEl = el("libraryList");

  const toolButtons = {
    pen: el("toolPen"),
    eraser: el("toolEraser"),
    line: el("toolLine"),
    fill: el("toolFill"),
    rect: el("toolRect"),
    circle: el("toolCircle"),
    select: el("toolSelect"),
  };
  const toolCopyBtn = el("toolCopy");
  const toolPasteBtn = el("toolPaste");

  const layerRow = el("layerRow");
  const btnLayerMC = el("btnLayerMC");
  const btnLayerOUT = el("btnLayerOUT");
  const btnLayerCheat = el("btnLayerCheat");

  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = false;

  const pointer = { down: false, over: false, x: -1, y: -1, button: 0 };
  const action = {
    active: false,
    tool: "pen",
    button: 0,
    startX: 0,
    startY: 0,
    changed: false,
    pushedUndo: false,
    preview: null,
  };

  const colorSlots = {
    fg: 1,
    mc1: 3,
    mc2: 6,
    out: 0,
  };
  let cheatColor = 7;
  let activeSlot = "fg"; // fg|mc1|mc2|out|cheat
  let tool = "pen"; // pen|eraser|line|fill|rect|circle|select

  let customRes = !!customResEl.checked;
  let spritesX = clampInt(spritesXEl.value, 1, 8);
  let spritesY = clampInt(spritesYEl.value, 1, 8);
  let customW = clampInt(customWEl.value, 1, MAX_SIZE);
  let customH = clampInt(customHEl.value, 1, MAX_SIZE);

  let zoom = clampInt(zoomEl.value, 4, 64);
  let bgColor = bgColorEl.value || "#203040";
  let showGrid = !!showGridEl.checked;
  let grid8 = !!grid8El.checked;
  let widePixel = !!widePixelEl.checked;
  let shapeFill = !!shapeFillEl.checked;
  let transformMode = false;
  let mirrorX = false;
  let mirrorY = false;

  let gridW = 0;
  let gridH = 0;
  let pixels = new Uint8Array(0);

  const undoStack = [];
  const redoStack = [];

  function resizeCellLayer(prev, prevCw, prevCh, nextCw, nextCh, fill) {
    const out = new Uint8Array(nextCw * nextCh);
    out.fill(fill);
    const copyW = Math.min(prevCw, nextCw);
    const copyH = Math.min(prevCh, nextCh);
    for (let y = 0; y < copyH; y++) {
      const srcOff = y * prevCw;
      const dstOff = y * nextCw;
      for (let x = 0; x < copyW; x++) out[dstOff + x] = prev[srcOff + x];
    }
    return out;
  }

  function captureAllLayersSnapshot() {
    const sp = getActiveSprite();
    if (!sp) return { type: "all", layer: getEditLayer(), mc: new Uint8Array(0), out: new Uint8Array(0), cheat: new Uint8Array(0) };
    const c64 = ensureC64Layers(sp);
    return {
      type: "all",
      layer: getEditLayer(),
      mc: c64.mc.slice(),
      out: c64.out.slice(),
      cheat: c64.cheat.slice(),
    };
  }

  function pushUndo(snapshot = null) {
    const sp = getActiveSprite();
    if (!snapshot && sp && isMcImage(sp) && getEditLayer() === "mc") {
      undoStack.push(captureMcImageSnapshot());
    } else {
      undoStack.push(snapshot ?? pixels.slice());
    }
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack.length = 0;
    updateHistoryButtons();
  }

  function pushUndoAllLayers() {
    pushUndo(captureAllLayersSnapshot());
  }

  function applyUndoSnapshot(snap) {
    if (snap && typeof snap === "object" && !(snap instanceof Uint8Array) && snap.type === "all") {
      const sp = getActiveSprite();
      if (!sp) return;
      const c64 = ensureC64Layers(sp);
      c64.mc = snap.mc.slice();
      c64.out = snap.out.slice();
      c64.cheat = snap.cheat.slice();
      sp.pixels = c64.cheat;
      c64.lastLayer = snap.layer || "mc";
      setC64Layer(c64.lastLayer, { resetHistory: false });
      renderSprites();
      return;
    }
    if (snap && typeof snap === "object" && !(snap instanceof Uint8Array) && snap.type === "mcimg") {
      const sp = getActiveSprite();
      if (!sp || !isMcImage(sp)) return;
      const c64 = ensureMcImageCells(sp);
      c64.mc = snap.mc.slice();
      c64.cheat = snap.cheat.slice();
      if (c64.slots) c64.slots.bg = clampInt(snap.bg ?? c64.slots.bg ?? colorSlots.out, 0, 15);
      c64.cellA = snap.cellA.slice();
      c64.cellB = snap.cellB.slice();
      c64.cellC = snap.cellC.slice();
      sp.pixels = c64.cheat;
      c64.lastLayer = snap.layer || "mc";
      setC64Layer(c64.lastLayer, { resetHistory: false });
      renderSprites();
      return;
    }
    // Single-layer snapshot.
    pixels = snap;
    syncActiveSpriteFromCanvas();
  }

  const selection = {
    active: false,
    x0: 0,
    y0: 0,
    x1: -1,
    y1: -1,
  };
  const sprites = []; // [{id,name,w,h,pixels:Uint8Array}]
  let activeSpriteId = null;

  const library = []; // swatches: [{id,w,h,data:Uint8Array}]
  let activeLibraryId = null;
  let copyBuffer = null; // {w,h,data:Uint8Array}
  let pasteMode = false;

  const uiState = {
    spritesCollapsed: false,
    swatchesCollapsed: false,
  };
  let isHydrating = true;

  const editorMode = "c64_cheat"; // fixed (modes removed)
  const DOC_KIND_SPRITE = "sprite";
  const DOC_KIND_MC_IMAGE = "mc_image";

  function isMcImage(sp) {
    return !!sp && sp.kind === DOC_KIND_MC_IMAGE;
  }

  function mcCellDims(sp) {
    const w = clampInt(sp?.w, 1, MAX_SIZE);
    const h = clampInt(sp?.h, 1, MAX_SIZE);
    return { cw: Math.max(1, ((w + 7) / 8) | 0), ch: Math.max(1, ((h + 7) / 8) | 0) };
  }

  function ensureMcImageCells(sp) {
    if (!isMcImage(sp)) return null;
    const c64 = ensureC64Layers(sp);
    if (!c64) return null;
    const { cw, ch } = mcCellDims(sp);
    const count = cw * ch;
    const prevCw = clampInt(c64.cellW ?? cw, 1, 4096);
    const prevCh = clampInt(c64.cellH ?? ch, 1, 4096);
    c64.cellW = cw;
    c64.cellH = ch;
    if (!(c64.cellA instanceof Uint8Array)) c64.cellA = new Uint8Array(count).fill(clampInt(colorSlots.mc1, 0, 15));
    if (!(c64.cellB instanceof Uint8Array)) c64.cellB = new Uint8Array(count).fill(clampInt(colorSlots.mc2, 0, 15));
    if (!(c64.cellC instanceof Uint8Array)) c64.cellC = new Uint8Array(count).fill(clampInt(colorSlots.fg, 0, 15));
    if (c64.cellA.length !== count) c64.cellA = resizeCellLayer(c64.cellA, prevCw, prevCh, cw, ch, clampInt(colorSlots.mc1, 0, 15));
    if (c64.cellB.length !== count) c64.cellB = resizeCellLayer(c64.cellB, prevCw, prevCh, cw, ch, clampInt(colorSlots.mc2, 0, 15));
    if (c64.cellC.length !== count) c64.cellC = resizeCellLayer(c64.cellC, prevCw, prevCh, cw, ch, clampInt(colorSlots.fg, 0, 15));
    return c64;
  }

  function mcCellIndexAt(sp, x, y) {
    const { cw, ch } = mcCellDims(sp);
    const cx = clampInt((x / 8) | 0, 0, cw - 1);
    const cy = clampInt((y / 8) | 0, 0, ch - 1);
    return cy * cw + cx;
  }

  function captureMcImageSnapshot() {
    const sp = getActiveSprite();
    if (!sp || !isMcImage(sp)) {
      return { type: "mcimg", layer: getEditLayer(), mc: new Uint8Array(0), cheat: new Uint8Array(0), bg: 0, cellA: new Uint8Array(0), cellB: new Uint8Array(0), cellC: new Uint8Array(0) };
    }
    const c64 = ensureMcImageCells(sp);
    return {
      type: "mcimg",
      layer: getEditLayer(),
      mc: c64.mc.slice(),
      cheat: c64.cheat.slice(),
      bg: clampInt(c64.slots?.bg ?? colorSlots.out, 0, 15),
      cellA: c64.cellA.slice(),
      cellB: c64.cellB.slice(),
      cellC: c64.cellC.slice(),
    };
  }

  function mcImageDisplayedColorAt(sp, x, y) {
    const c64 = ensureMcImageCells(sp);
    const idx = y * sp.w + x;
    const v = c64.mc[idx] | 0;
    if (v === 0) return clampInt(c64.slots.bg ?? colorSlots.out, 0, 15);
    const ci = mcCellIndexAt(sp, x, y);
    if (v === 1) return clampInt(c64.cellA[ci] | 0, 0, 15);
    if (v === 2) return clampInt(c64.cellB[ci] | 0, 0, 15);
    return clampInt(c64.cellC[ci] | 0, 0, 15);
  }

  function mcImageCountCodesInCell(sp, ci) {
    const c64 = ensureMcImageCells(sp);
    const { cw } = mcCellDims(sp);
    const cx = ci % cw;
    const cy = (ci / cw) | 0;
    const x0 = cx * 8;
    const y0 = cy * 8;
    let a = 0;
    let b = 0;
    let c = 0;
    const x1 = Math.min(sp.w, x0 + 8);
    const y1 = Math.min(sp.h, y0 + 8);
    for (let y = y0; y < y1; y++) {
      const row = y * sp.w;
      for (let x = x0; x < x1; x++) {
        const v = c64.mc[row + x] | 0;
        if (v === 1) a++;
        else if (v === 2) b++;
        else if (v === 3) c++;
      }
    }
    return { a, b, c };
  }

  function mcImageCodeForDesiredColor(sp, x, y, desiredColor) {
    const c64 = ensureMcImageCells(sp);
    const bg = clampInt(c64.slots.bg ?? colorSlots.out, 0, 15);
    if (desiredColor == null || desiredColor === bg) return 0;
    const ci = mcCellIndexAt(sp, x, y);
    const col = clampInt(desiredColor, 0, 15);
    if ((c64.cellA[ci] | 0) === col) return 1;
    if ((c64.cellB[ci] | 0) === col) return 2;
    if ((c64.cellC[ci] | 0) === col) return 3;
    const counts = mcImageCountCodesInCell(sp, ci);
    // Evict the least-used slot in this 8x8 cell. Tie-break: A->B->C.
    let victim = 1;
    let best = counts.a;
    if (counts.b < best) {
      best = counts.b;
      victim = 2;
    }
    if (counts.c < best) {
      best = counts.c;
      victim = 3;
    }
    if (victim === 1) c64.cellA[ci] = col;
    else if (victim === 2) c64.cellB[ci] = col;
    else c64.cellC[ci] = col;
    return victim;
  }

  function mcImageSetPixel(x, y, desiredColor) {
    const sp = getActiveSprite();
    if (!sp || !isMcImage(sp) || getEditLayer() !== "mc") return false;
    let changed = false;
    for (const [xx, yy] of mirrorPoints(x, y)) {
      const code = mcImageCodeForDesiredColor(sp, xx, yy, desiredColor);
      changed = setPixelRaw(xx, yy, code) || changed;
    }
    return changed;
  }

  function mcImageStamp(x, y, desiredColor) {
    if (!widePixel) return mcImageSetPixel(x, y, desiredColor);
    const xx = x - (x % 2);
    let changed = false;
    changed = mcImageSetPixel(xx, y, desiredColor) || changed;
    if (xx + 1 < gridW) changed = mcImageSetPixel(xx + 1, y, desiredColor) || changed;
    return changed;
  }

  function mcImageDrawLine(x0, y0, x1, y1, desiredColor) {
    let changed = false;
    for (const [x, y] of bresenham(x0, y0, x1, y1)) changed = mcImageStamp(x, y, desiredColor) || changed;
    return changed;
  }

  function mcImageDrawRect(x0, y0, x1, y1, desiredColor, opts) {
    const fill = !!opts?.fill;
    const left = Math.min(x0, x1);
    const right = Math.max(x0, x1);
    const top = Math.min(y0, y1);
    const bottom = Math.max(y0, y1);
    let changed = false;
    if (fill) {
      for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) changed = mcImageStamp(x, y, desiredColor) || changed;
      return changed;
    }
    for (let x = left; x <= right; x++) {
      changed = mcImageStamp(x, top, desiredColor) || changed;
      changed = mcImageStamp(x, bottom, desiredColor) || changed;
    }
    for (let y = top; y <= bottom; y++) {
      changed = mcImageStamp(left, y, desiredColor) || changed;
      changed = mcImageStamp(right, y, desiredColor) || changed;
    }
    return changed;
  }

  function mcImageDrawCircle(x0, y0, x1, y1, desiredColor, opts) {
    const fill = !!opts?.fill;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const r = Math.max(0, Math.floor(Math.sqrt(dx * dx + dy * dy)));
    if (r === 0) return mcImageStamp(x0, y0, desiredColor);
    if (!fill) {
      let changed = false;
      for (const [x, y] of previewCircle(x0, y0, x1, y1)) changed = mcImageStamp(x, y, desiredColor) || changed;
      return changed;
    }
    let changed = false;
    let x = r;
    let y = 0;
    let err = 1 - x;
    while (x >= y) {
      for (let ix = x0 - x; ix <= x0 + x; ix++) {
        changed = mcImageStamp(ix, y0 + y, desiredColor) || changed;
        changed = mcImageStamp(ix, y0 - y, desiredColor) || changed;
      }
      for (let ix = x0 - y; ix <= x0 + y; ix++) {
        changed = mcImageStamp(ix, y0 + x, desiredColor) || changed;
        changed = mcImageStamp(ix, y0 - x, desiredColor) || changed;
      }
      y++;
      if (err < 0) err += 2 * y + 1;
      else {
        x--;
        err += 2 * (y - x) + 1;
      }
    }
    return changed;
  }

  function mcImageFloodFill(x, y, desiredColor) {
    const sp = getActiveSprite();
    if (!sp || !isMcImage(sp) || getEditLayer() !== "mc") return false;
    const c64 = ensureMcImageCells(sp);
    const target = mcImageDisplayedColorAt(sp, x, y);
    const bg = clampInt(c64.slots.bg ?? colorSlots.out, 0, 15);
    const desiredIdx = desiredColor == null ? bg : clampInt(desiredColor, 0, 15);
    if (desiredIdx === target) return false;

    const w = sp.w;
    const h = sp.h;
    const visited = new Uint8Array(w * h);
    const stack = [y * w + x];
    let changed = false;
    while (stack.length) {
      const idx = stack.pop();
      if (visited[idx]) continue;
      visited[idx] = 1;
      const px = idx % w;
      const py = (idx / w) | 0;
      if (mcImageDisplayedColorAt(sp, px, py) !== target) continue;
      changed = mcImageStamp(px, py, desiredColor) || changed;
      if (px > 0) stack.push(idx - 1);
      if (px + 1 < w) stack.push(idx + 1);
      if (py > 0) stack.push(idx - w);
      if (py + 1 < h) stack.push(idx + w);
    }
    return changed;
  }

  function getActiveSprite() {
    return sprites.find((s) => s.id === activeSpriteId) || null;
  }

  function resizeLayer(prev, prevW, prevH, nextW, nextH, fill) {
    const out = new Uint8Array(nextW * nextH);
    out.fill(fill);
    const copyW = Math.min(prevW, nextW);
    const copyH = Math.min(prevH, nextH);
    for (let y = 0; y < copyH; y++) {
      const srcOff = y * prevW;
      const dstOff = y * nextW;
      for (let x = 0; x < copyW; x++) out[dstOff + x] = prev[srcOff + x];
    }
    return out;
  }

  function ensureC64Layers(sp) {
    if (!sp) return null;
    const len = sp.w * sp.h;
    if (!sp.c64) {
      sp.c64 = {
        w: sp.w,
        h: sp.h,
        slots: {
          fg: clampInt(colorSlots.fg, 0, 15),
          mc1: clampInt(colorSlots.mc1, 0, 15),
          mc2: clampInt(colorSlots.mc2, 0, 15),
          out: clampInt(colorSlots.out, 0, 15),
          ...(isMcImage(sp) ? { bg: clampInt(colorSlots.out, 0, 15) } : {}),
        },
        mc: new Uint8Array(len).fill(0), // 0=transparent, 1=MC1, 2=MC2, 3=FG
        out: new Uint8Array(len).fill(0), // 0=transparent, 1=OUT mask
        cheat: new Uint8Array(len).fill(TRANSPARENT), // palette indices
        lastLayer: "mc", // mc|out|cheat (for c64_cheat)
        lastNonCheatLayer: "mc", // mc|out (for plain c64)
      };
      // Keep legacy field as alias for cheat layer (used by older code paths).
      sp.pixels = sp.c64.cheat;
      return sp.c64;
    }
    // Ensure slots exist.
    if (!sp.c64.slots || typeof sp.c64.slots !== "object") {
      sp.c64.slots = { fg: colorSlots.fg, mc1: colorSlots.mc1, mc2: colorSlots.mc2, out: colorSlots.out };
    }
    if (isMcImage(sp)) {
      const slots = sp.c64.slots;
      if (slots.bg === undefined) slots.bg = clampInt(slots.out ?? colorSlots.out, 0, 15);
    }
    const prevW = clampInt(sp.c64.w ?? sp.w, 1, MAX_SIZE);
    const prevH = clampInt(sp.c64.h ?? sp.h, 1, MAX_SIZE);
    sp.c64.w = sp.w;
    sp.c64.h = sp.h;

    // Ensure layers exist and match current size.
    if (!(sp.c64.mc instanceof Uint8Array)) sp.c64.mc = new Uint8Array(len).fill(0);
    if (!(sp.c64.out instanceof Uint8Array)) sp.c64.out = new Uint8Array(len).fill(0);
    if (!(sp.c64.cheat instanceof Uint8Array)) sp.c64.cheat = new Uint8Array(len).fill(TRANSPARENT);
    if (sp.c64.mc.length !== len) sp.c64.mc = resizeLayer(sp.c64.mc, prevW, prevH, sp.w, sp.h, 0);
    if (sp.c64.out.length !== len) sp.c64.out = resizeLayer(sp.c64.out, prevW, prevH, sp.w, sp.h, 0);
    if (sp.c64.cheat.length !== len) sp.c64.cheat = resizeLayer(sp.c64.cheat, prevW, prevH, sp.w, sp.h, TRANSPARENT);
    if (sp.c64.lastLayer !== "mc" && sp.c64.lastLayer !== "out" && sp.c64.lastLayer !== "cheat") sp.c64.lastLayer = "mc";
    if (sp.c64.lastNonCheatLayer !== "mc" && sp.c64.lastNonCheatLayer !== "out") sp.c64.lastNonCheatLayer = "mc";
    sp.pixels = sp.c64.cheat;
    return sp.c64;
  }

  function ensureSpriteVis(sp) {
    if (!sp) return { mc: true, out: true, cheat: true };
    if (!sp.vis || typeof sp.vis !== "object") sp.vis = { mc: true, out: true, cheat: true };
    sp.vis.mc = sp.vis.mc !== false;
    sp.vis.out = sp.vis.out !== false;
    sp.vis.cheat = sp.vis.cheat !== false;
    if (isMcImage(sp)) sp.vis.out = false;
    return sp.vis;
  }

  function getEditLayer() {
    const sp = getActiveSprite();
    if (!sp) return "mc";
    const c64 = ensureC64Layers(sp);
    const layer = c64?.lastLayer || "mc";
    return layer === "out" ? "out" : layer === "cheat" ? "cheat" : "mc";
  }

  function layerTransparentValue(layer) {
    return layer === "png" || layer === "cheat" ? TRANSPARENT : 0;
  }

  function activePaletteIndex() {
    if (activeSlot === "cheat") return clampInt(cheatColor, 0, 15);
    const sp = getActiveSprite();
    if (isMcImage(sp) && activeSlot === "out") {
      const c64 = ensureC64Layers(sp);
      return clampInt(c64?.slots?.bg ?? colorSlots.out, 0, 15);
    }
    return clampInt(colorSlots[activeSlot], 0, 15);
  }

  function setActivePaletteIndex(idx) {
    const v = clampInt(idx, 0, 15);
    if (activeSlot === "cheat") cheatColor = v;
    else {
      const sp = getActiveSprite();
      if (isMcImage(sp) && activeSlot === "out") {
        colorSlots.out = v;
        const c64 = ensureC64Layers(sp);
        if (c64 && c64.slots) c64.slots.bg = v;
        return;
      }
      colorSlots[activeSlot] = v;
    }
  }

  function slotToMcCode(slot) {
    if (slot === "mc1") return 1;
    if (slot === "mc2") return 2;
    return 3; // fg (default)
  }

  function currentPaintValue() {
    const layer = getEditLayer();
    if (layer === "png" || layer === "cheat") return activePaletteIndex();
    if (layer === "out") return 1;
    // mc
    const sp = getActiveSprite();
    if (isMcImage(sp) && activeSlot === "out") return 0; // BG in MC-image mode
    return slotToMcCode(activeSlot);
  }

  function currentEraseValue() {
    return layerTransparentValue(getEditLayer());
  }

  function canPasteToCurrentLayer() {
    const layer = getEditLayer();
    return layer === "cheat";
  }

  function syncSlotsFromSpriteIfNeeded() {
    const sp = getActiveSprite();
    if (!sp) return;
    const c64 = ensureC64Layers(sp);
    if (!c64) return;
    colorSlots.fg = clampInt(c64.slots.fg, 0, 15);
    colorSlots.mc1 = clampInt(c64.slots.mc1, 0, 15);
    colorSlots.mc2 = clampInt(c64.slots.mc2, 0, 15);
    if (isMcImage(sp)) colorSlots.out = clampInt(c64.slots.bg ?? c64.slots.out, 0, 15);
    else colorSlots.out = clampInt(c64.slots.out, 0, 15);
    syncSlotUi();
    syncPaletteSelection();
  }

  function persistSlotsToSpriteIfNeeded() {
    const sp = getActiveSprite();
    if (!sp) return;
    const c64 = ensureC64Layers(sp);
    if (!c64) return;
    if (isMcImage(sp)) {
      // In MC-image: keep brush color in slots.fg, BG in slots.bg.
      c64.slots.fg = clampInt(colorSlots.fg, 0, 15);
      c64.slots.bg = clampInt(colorSlots.out, 0, 15);
    } else {
      c64.slots.fg = clampInt(colorSlots.fg, 0, 15);
      c64.slots.mc1 = clampInt(colorSlots.mc1, 0, 15);
      c64.slots.mc2 = clampInt(colorSlots.mc2, 0, 15);
      c64.slots.out = clampInt(colorSlots.out, 0, 15);
    }
  }

  function compositeSpritePixels(sp) {
    if (!sp) return new Uint8Array(0);
    const w = sp.w;
    const h = sp.h;
    const len = w * h;
    const c64 = ensureC64Layers(sp);
    const out = new Uint8Array(len).fill(TRANSPARENT);
    const slots = c64?.slots || colorSlots;
    const vis = ensureSpriteVis(sp);
    const imgMode = isMcImage(sp);
    const bgIdx = imgMode ? clampInt(slots.bg ?? slots.out, 0, 15) : 0;
    let cw = 1;
    let cellA = null;
    let cellB = null;
    let cellC = null;
    if (imgMode) {
      const c = ensureMcImageCells(sp);
      cw = (c?.cellW | 0) || Math.max(1, (w / 8) | 0);
      cellA = c.cellA;
      cellB = c.cellB;
      cellC = c.cellC;
    }
    for (let i = 0; i < len; i++) {
      // Cheat overlay.
      if (vis.cheat) {
        const ch = c64.cheat[i];
        if (ch !== TRANSPARENT) {
          out[i] = ch;
          continue;
        }
      }
      // Outline (hires mask).
      if (!imgMode && vis.out && c64.out[i]) {
        out[i] = clampInt(slots.out, 0, 15);
        continue;
      }
      // Multicolor sprite.
      if (!vis.mc) {
        out[i] = TRANSPARENT;
      } else {
        const mc = c64.mc[i] | 0;
        if (imgMode) {
          const x = i % w;
          const y = (i / w) | 0;
          const ci = ((y / 8) | 0) * cw + ((x / 8) | 0);
          if (mc === 1) out[i] = clampInt(cellA[ci] | 0, 0, 15);
          else if (mc === 2) out[i] = clampInt(cellB[ci] | 0, 0, 15);
          else if (mc === 3) out[i] = clampInt(cellC[ci] | 0, 0, 15);
          else out[i] = bgIdx;
        } else {
          if (mc === 1) out[i] = clampInt(slots.mc1, 0, 15);
          else if (mc === 2) out[i] = clampInt(slots.mc2, 0, 15);
          else if (mc === 3) out[i] = clampInt(slots.fg, 0, 15);
          else out[i] = TRANSPARENT;
        }
      }
    }
    return out;
  }

  function displayPixelIndexAt(sp, idx) {
    if (!sp) return TRANSPARENT;
    const c64 = ensureC64Layers(sp);
    const slots = c64?.slots || colorSlots;
    if (ensureSpriteVis(sp).cheat) {
      const ch = c64.cheat[idx];
      if (ch !== TRANSPARENT) return ch;
    }
    const vis = ensureSpriteVis(sp);
    const imgMode = isMcImage(sp);
    if (!imgMode && vis.out && c64.out[idx]) return clampInt(slots.out, 0, 15);
    if (!vis.mc) return TRANSPARENT;
    const mc = c64.mc[idx] | 0;
    if (imgMode) {
      const c = ensureMcImageCells(sp);
      const w = sp.w;
      const x = idx % w;
      const y = (idx / w) | 0;
      const cw = (c?.cellW | 0) || Math.max(1, (w / 8) | 0);
      const ci = ((y / 8) | 0) * cw + ((x / 8) | 0);
      if (mc === 1) return clampInt(c.cellA[ci] | 0, 0, 15);
      if (mc === 2) return clampInt(c.cellB[ci] | 0, 0, 15);
      if (mc === 3) return clampInt(c.cellC[ci] | 0, 0, 15);
      return clampInt(slots.bg ?? slots.out, 0, 15);
    }
    if (mc === 1) return clampInt(slots.mc1, 0, 15);
    if (mc === 2) return clampInt(slots.mc2, 0, 15);
    if (mc === 3) return clampInt(slots.fg, 0, 15);
    return TRANSPARENT;
  }

  let theme = "light"; // light|dark-hell|dark-candles|dark-plain
  let fireRunning = false;
  let fireAnim = null;
  let fireOnResize = null;
  let evilSpinStart = 0;
  let evilMotionRaf = null;
  let evilMouseX = 0.5;
  let evilMouseY = 0.5;
  let evilCursorX = 0;
  let evilCursorY = 0;
  let evilCursorHitRaf = null;
  let evilCursorLastHitAt = 0;
  let evilCursorVisible = false;
  let helpOpen = false;
  let helpPrevFocus = null;
  let confirmOpen = false;
  let confirmPrevFocus = null;
  let confirmResolve = null;
  let confirmIsAlert = false;
  let projectName = (projectNameEl.value || "").trim();
  let lang = "pl"; // pl|en
  let keysOpen = false;
  let keysPrevFocus = null;
  let ioOpen = false;
  let ioPrevFocus = null;
  let ioAction = "import"; // import|export

  const I18N = {
    pl: {
      brand_subtitle: "Edytor C64 Sprite 'dla debili'.",
      collection: "Kolekcja",
      palette_c64: "Paleta C64",
      palette_hint: "Wybierz slot (FG/MC1/MC2/OUT), potem kliknij kolor w palecie, żeby go przypisać.",
      tools: "Narzędzia",
      wide_pixel: "2× wide pixel (multicolor)",
      shape_fill: "Wypełniaj kształty",
      transform_mode: "Transform mode",
      clear: "Wyczyść",
      rmb_eraser_hint: "Prawy przycisk myszy zawsze działa jak gumka (bez zmiany narzędzia).",
      canvas: "Płótno",
      custom_res: "Dowolna rozdzielczość",
      sprites_w: "Szerokość (sprajty)",
      sprites_h: "Wysokość (sprajty)",
      px_w: "Szerokość (px)",
      px_h: "Wysokość (px)",
      preview_bg: "Tło podglądu",
      grid: "Siatka",
      grid_8: "Siatka 8×8 (MC)",
      local_storage: "Local storage",
      io_title: "Import / Export",
      io_import: "Import",
      io_export: "Export",
      io_project_json: "Projekt (JSON)",
      io_spritepad_spd: "SpritePad (.spd)",
      io_sprite_png: "Aktywny sprite (PNG)",
      io_sprite_png_import: "PNG → sprite",
      io_swatch_png_import: "PNG → swatch",
      io_spritesheet_png: "Spritesheet (PNG)",
      save_now: "Zapisz teraz",
      clear_saved: "Wyczyść zapis",
      ls_tip: "Tip: Export/Import na górnym pasku to backup projektu jako plik JSON.",
      sprites: "Sprites",
      sprites_hint: "Klik miniatury przełącza aktywną edycję.",
      swatches: "Swatches",
      swatches_hint: "Ctrl+C dodaje wycinek. Klik miniatury ustawia Paste (wielokrotnie).",
      status_cursor: "Cursor",
      status_tool: "Tool",
      status_color: "Color",
      status_mode: "Mode",
      status_canvas: "Canvas",
      hotkeys: "Hotkeys",
      hk_colors: "Kolory",
      hk_tools: "Narzędzia",
      hk_edit: "Edycja",
      hk_view: "Widok",
      hk_transform: "Transform",
      hk_scroll: "Scroll",
      hk_colors_desc: "`1` FG, `2` MC1, `3` MC2, `4` OUT, `5` CH",
      hk_pen: "Pen",
      hk_eraser: "Eraser",
      hk_line: "Line",
      hk_fill: "Fill",
      hk_rect: "Rectangle",
      hk_circle: "Circle",
      hk_select: "Select",
      hk_layers: "Warstwy",
      hk_layer_mc: "MC layer (Sprite 1)",
      hk_layer_out: "OUT layer (Sprite 2)",
      hk_layer_cheat: "CHEAT layer",
      hk_vis: "Widoczność warstw (Alt)",
      hk_undo: "Undo",
      hk_redo: "Redo",
      hk_copy: "Copy (Select)",
      hk_paste: "Paste",
      hk_cancel: "Esc cancel paste/selection",
      hk_grid: "Grid toggle",
      hk_shape_fill: "Shape fill toggle",
      hk_transform_mode: "Transform mode toggle",
      hk_mirrorx: "Mirror X (draw)",
      hk_mirrory: "Mirror Y (draw)",
      hk_roll: "Roll (arrows in transform mode)",
      hk_zoom: "Wheel = zoom",
      hk_shift_wheel: "Shift+Wheel = slot 1–5",
      hk_ctrl_wheel: "Ctrl/Cmd+Wheel = change color in active slot",
      ls_base: "Auto-zapis: localStorage",
      lang_title: "Język (PL/EN)",
      export: "Export",
      import: "Import",
      save_png: "Zapisz PNG",
      help: "Pomoc",
      default_collection: "Moja kolekcja",
      project_placeholder: "Nazwa kolekcji…",
      swatches_empty: "Brak swatchy. Zaznacz fragment (Select/Q) i Ctrl+C.",
      clear_ls_confirm: "Wyczyścić zapis localStorage i zresetować edytor?",
      clear_ls_title: "Wyczyść localStorage",
      clear_canvas_title: "Wyczyść",
      clear_canvas_confirm: "Wyczyścić całe płótno?",
      clear_canvas_confirm_all: "Wyczyścić wszystkie warstwy?",
      delete_sprite_title: "Usuń sprite",
      delete_swatch_title: "Usuń swatch",
      delete_confirm: "Usunąć",
      delete_ok: "Usuń",
      confirm: "Potwierdź",
      cancel: "Anuluj",
      ok: "OK",
      mode_png: "PNG",
      mode_c64: "C64",
      mode_c64_cheat: "C64 + Cheat",
      layer_mc: "MC",
      layer_out: "OUT",
      layer_cheat: "CHEAT",
    },
    en: {
      brand_subtitle: "C64 sprite editor for dummies.",
      collection: "Collection",
      palette_c64: "C64 Palette",
      palette_hint: "Pick slot (FG/MC1/MC2/OUT), then click a palette color to assign it.",
      tools: "Tools",
      wide_pixel: "2× wide pixel (multicolor)",
      shape_fill: "Fill shapes",
      transform_mode: "Transform mode",
      clear: "Clear",
      rmb_eraser_hint: "Right mouse button always erases (no tool switch).",
      canvas: "Canvas",
      custom_res: "Custom resolution",
      sprites_w: "Width (sprites)",
      sprites_h: "Height (sprites)",
      px_w: "Width (px)",
      px_h: "Height (px)",
      preview_bg: "Preview background",
      grid: "Grid",
      grid_8: "8×8 grid (MC)",
      local_storage: "Local storage",
      io_title: "Import / Export",
      io_import: "Import",
      io_export: "Export",
      io_project_json: "Project (JSON)",
      io_spritepad_spd: "SpritePad (.spd)",
      io_sprite_png: "Active sprite (PNG)",
      io_sprite_png_import: "PNG → sprite",
      io_swatch_png_import: "PNG → swatch",
      io_spritesheet_png: "Spritesheet (PNG)",
      save_now: "Save now",
      clear_saved: "Clear saved",
      ls_tip: "Tip: Export/Import in the top bar is a JSON backup.",
      sprites: "Sprites",
      sprites_hint: "Click a thumbnail to edit it.",
      swatches: "Swatches",
      swatches_hint: "Ctrl+C adds a cutout. Click a thumbnail to set Paste (multi-use).",
      status_cursor: "Cursor",
      status_tool: "Tool",
      status_color: "Color",
      status_mode: "Mode",
      status_canvas: "Canvas",
      hotkeys: "Hotkeys",
      hk_colors: "Colors",
      hk_tools: "Tools",
      hk_edit: "Edit",
      hk_view: "View",
      hk_transform: "Transform",
      hk_scroll: "Scroll",
      hk_colors_desc: "`1` FG, `2` MC1, `3` MC2, `4` OUT, `5` CH",
      hk_pen: "Pen",
      hk_eraser: "Eraser",
      hk_line: "Line",
      hk_fill: "Fill",
      hk_rect: "Rectangle",
      hk_circle: "Circle",
      hk_select: "Select",
      hk_layers: "Layers",
      hk_layer_mc: "MC layer (Sprite 1)",
      hk_layer_out: "OUT layer (Sprite 2)",
      hk_layer_cheat: "CHEAT layer",
      hk_vis: "Layer visibility (Alt)",
      hk_undo: "Undo",
      hk_redo: "Redo",
      hk_copy: "Copy (Select)",
      hk_paste: "Paste",
      hk_cancel: "Esc cancels paste/selection",
      hk_grid: "Grid toggle",
      hk_shape_fill: "Shape fill toggle",
      hk_transform_mode: "Transform mode toggle",
      hk_mirrorx: "Mirror X (draw)",
      hk_mirrory: "Mirror Y (draw)",
      hk_roll: "Roll (arrows in transform mode)",
      hk_zoom: "Wheel = zoom",
      hk_shift_wheel: "Shift+Wheel = slot 1–5",
      hk_ctrl_wheel: "Ctrl/Cmd+Wheel = change active slot color",
      ls_base: "Autosave: localStorage",
      lang_title: "Language (PL/EN)",
      export: "Export",
      import: "Import",
      save_png: "Save PNG",
      help: "Help",
      default_collection: "My collection",
      project_placeholder: "Collection name…",
      swatches_empty: "No swatches. Select a region (Select/Q) and press Ctrl+C.",
      clear_ls_confirm: "Clear localStorage save and reset the editor?",
      clear_ls_title: "Clear localStorage",
      clear_canvas_title: "Clear",
      clear_canvas_confirm: "Clear the entire canvas?",
      clear_canvas_confirm_all: "Clear all layers?",
      delete_sprite_title: "Delete sprite",
      delete_swatch_title: "Delete swatch",
      delete_confirm: "Delete",
      delete_ok: "Delete",
      confirm: "Confirm",
      cancel: "Cancel",
      ok: "OK",
      mode_png: "PNG",
      mode_c64: "C64",
      mode_c64_cheat: "C64 + Cheat",
      layer_mc: "MC",
      layer_out: "OUT",
      layer_cheat: "CHEAT",
    },
  };

  const t = (key) => I18N[lang]?.[key] ?? I18N.en[key] ?? key;

  buildPalette();
  syncSlotUi();
  setActiveSlot("fg");
  setTool("pen");
  syncResUi();
  await setInitialGrid();
  wireEvents();
  wirePersistenceGuards();
  if (!loadState()) {
    initSprites();
  }
  applyCollapseUi();
  renderSprites();
  renderLibrary();
  render();
  isHydrating = false;
  applyTheme(theme);
  syncThumbBgVar();
  applyLanguage();
  ensureProjectName();
  syncProjectNameUi();
  syncLsInfo();
  wireEvilMotion();
  wireEvilCursor();

  function wirePersistenceGuards() {
    // localStorage writes are debounced; flush immediately when leaving the page
    // so quick F5 / close doesn't lose the last changes.
    window.addEventListener("pagehide", () => saveState());
    window.addEventListener("beforeunload", () => saveState());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") saveState();
    });
  }

  function wireEvilMotion() {
    const root = document.documentElement;
    const onMove = (e) => {
      evilMouseX = clamp01(e.clientX / Math.max(1, window.innerWidth));
      evilMouseY = clamp01(e.clientY / Math.max(1, window.innerHeight));
      if (evilMotionRaf) return;
      evilMotionRaf = requestAnimationFrame(() => {
        evilMotionRaf = null;
        const active = theme === "dark-hell" || theme === "dark-candles";
        if (!active) {
          root.style.removeProperty("--evil-pan-x");
          root.style.removeProperty("--evil-pan-y");
          root.style.removeProperty("--evil-rot-x");
          root.style.removeProperty("--evil-rot-y");
          return;
        }
        const nx = (evilMouseX - 0.5) * 2; // -1..1
        const ny = (evilMouseY - 0.5) * 2; // -1..1
        root.style.setProperty("--evil-pan-x", `${nx * 26}px`);
        root.style.setProperty("--evil-pan-y", `${ny * 16}px`);
        root.style.setProperty("--evil-rot-y", `${nx * 6}deg`);
        root.style.setProperty("--evil-rot-x", `${-ny * 5}deg`);
      });
    };
    document.addEventListener("mousemove", onMove, { passive: true });
    // initial
    onMove({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
  }

  function clamp01(v) {
    if (!Number.isFinite(v)) return 0;
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }

  function wireEvents() {
    spritesXEl.addEventListener("change", async () => {
      const prev = spritesX;
      spritesX = clampInt(spritesXEl.value, 1, 8);
      spritesXEl.value = String(spritesX);
      if (!customRes) {
        const ok = await setGridSize(SPRITE_W * spritesX, SPRITE_H * spritesY, { keep: true });
        if (!ok) {
          spritesX = prev;
          spritesXEl.value = String(prev);
        }
      }
    });
    spritesYEl.addEventListener("change", async () => {
      const prev = spritesY;
      spritesY = clampInt(spritesYEl.value, 1, 8);
      spritesYEl.value = String(spritesY);
      if (!customRes) {
        const ok = await setGridSize(SPRITE_W * spritesX, SPRITE_H * spritesY, { keep: true });
        if (!ok) {
          spritesY = prev;
          spritesYEl.value = String(prev);
        }
      }
    });
    customWEl.addEventListener("change", async () => {
      const prev = customW;
      customW = clampInt(customWEl.value, 1, MAX_SIZE);
      customWEl.value = String(customW);
      if (customRes) {
        const ok = await setGridSize(customW, customH, { keep: true });
        if (!ok) {
          customW = prev;
          customWEl.value = String(prev);
        }
      }
    });
    customHEl.addEventListener("change", async () => {
      const prev = customH;
      customH = clampInt(customHEl.value, 1, MAX_SIZE);
      customHEl.value = String(customH);
      if (customRes) {
        const ok = await setGridSize(customW, customH, { keep: true });
        if (!ok) {
          customH = prev;
          customHEl.value = String(prev);
        }
      }
    });
    customResEl.addEventListener("change", async () => {
      const prev = customRes;
      customRes = !!customResEl.checked;
      syncResUi();
      const ok = await (customRes
        ? setGridSize(customW, customH, { keep: true })
        : setGridSize(SPRITE_W * spritesX, SPRITE_H * spritesY, { keep: true }));
      if (!ok) {
        customRes = prev;
        customResEl.checked = prev;
        syncResUi();
      }
    });

    zoomEl.addEventListener("input", () => {
      zoom = clampInt(zoomEl.value, 4, 64);
      resizeCanvasOnly();
      scheduleSave();
      render();
    });
    bgColorEl.addEventListener("input", () => {
      bgColor = bgColorEl.value || "#203040";
      scheduleSave();
      renderSprites();
      syncThumbBgVar();
      render();
    });
    bgColorEl.addEventListener("change", () => {
      bgColor = bgColorEl.value || "#203040";
      scheduleSave();
      renderSprites();
      syncThumbBgVar();
      render();
    });
    showGridEl.addEventListener("change", () => {
      showGrid = !!showGridEl.checked;
      scheduleSave();
      render();
    });
    grid8El.addEventListener("change", () => {
      grid8 = !!grid8El.checked;
      scheduleSave();
      render();
    });
    widePixelEl.addEventListener("change", () => {
      if (widePixelEl.disabled) {
        widePixelEl.checked = widePixel;
        return;
      }
      widePixel = !!widePixelEl.checked;
      if (widePixel && pointer.x >= 0) pointer.x = pointer.x - (pointer.x % 2);
      scheduleSave();
      render();
    });
    shapeFillEl.addEventListener("change", () => {
      shapeFill = !!shapeFillEl.checked;
      if (action.active) updatePreview();
      scheduleSave();
      render();
    });

    btnTransform.addEventListener("click", () => {
      transformMode = !transformMode;
      btnTransform.setAttribute("aria-pressed", transformMode ? "true" : "false");
      transformOverlayEl.hidden = !transformMode;
      render();
    });

    btnRollUp.addEventListener("click", () => roll(0, -1));
    btnRollDown.addEventListener("click", () => roll(0, 1));
    btnRollLeft.addEventListener("click", () => roll(-1, 0));
    btnRollRight.addEventListener("click", () => roll(1, 0));
    btnMirrorX.addEventListener("click", () => {
      mirrorX = !mirrorX;
      btnMirrorX.setAttribute("aria-pressed", mirrorX ? "true" : "false");
      render();
    });
    btnMirrorY.addEventListener("click", () => {
      mirrorY = !mirrorY;
      btnMirrorY.setAttribute("aria-pressed", mirrorY ? "true" : "false");
      render();
    });

    btnSave.addEventListener("click", async () => {
      await exportSpritesheetPng();
    });
    btnTheme.addEventListener("click", () => {
      const order = ["light", "dark-hell", "dark-candles", "dark-plain"];
      const idx = Math.max(0, order.indexOf(theme));
      theme = order[(idx + 1) % order.length];
      applyTheme(theme);
      scheduleSave();
    });
    btnHelp.addEventListener("click", () => openHelp());
    btnHotkeys.addEventListener("click", () => openHotkeys());
    btnLang.addEventListener("click", () => {
      lang = lang === "pl" ? "en" : "pl";
      applyLanguage();
      scheduleSave();
    });
    btnIO.addEventListener("click", () => openIO());
    projectNameEl.addEventListener("input", () => {
      projectName = (projectNameEl.value || "").trim();
      ensureProjectName();
      syncProjectNameUi();
      scheduleSave();
    });
    btnSaveNow.addEventListener("click", () => {
      saveState();
      flashLsInfo("Zapisano.");
    });
    btnLsClear.addEventListener("click", async (e) => {
      if (!e.shiftKey) {
        const ok = await askConfirm(t("clear_ls_confirm"), {
          title: t("clear_ls_title"),
          okText: t("clear_saved"),
        });
        if (!ok) return;
      }
      try {
        localStorage.removeItem(LS_KEY);
      } catch (err) {
        console.warn("[JurasEd] localStorage clear failed:", err);
      }
      location.reload();
    });
    fileProject.addEventListener("change", async () => {
      const f = fileProject.files?.[0];
      if (!f) return;
      await importProjectFile(f);
    });

    fileSpd.addEventListener("change", async () => {
      const f = fileSpd.files?.[0];
      if (!f) return;
      await importSpritePadSpd(f);
    });
    fileSpritePng.addEventListener("change", async () => {
      const f = fileSpritePng.files?.[0];
      if (!f) return;
      await importPngAsSprite(f);
    });

    fileSwatchPng.addEventListener("change", async () => {
      const f = fileSwatchPng.files?.[0];
      if (!f) return;
      await importPngAsSwatch(f);
    });

    btnClear.addEventListener("click", async (e) => {
      const all = !!e.shiftKey;
      const ok = await askConfirm(all ? t("clear_canvas_confirm_all") : t("clear_canvas_confirm"), {
        title: t("clear_canvas_title"),
        okText: t("clear_canvas_title"),
      });
      if (!ok) return;
      if (all) {
        pushUndoAllLayers();
        const sp = getActiveSprite();
        if (sp) {
          const c64 = ensureC64Layers(sp);
          c64.mc.fill(0);
          if (!isMcImage(sp)) c64.out.fill(0);
          c64.cheat.fill(TRANSPARENT);
          sp.pixels = c64.cheat;
          // Keep editing the current layer buffer reference.
          pixels = getEditLayer() === "out" ? c64.out : getEditLayer() === "cheat" ? c64.cheat : c64.mc;
          markSpritesDirty();
          scheduleSave();
        } else {
          pixels.fill(currentEraseValue());
        }
      } else {
        pushUndo();
        pixels.fill(currentEraseValue());
        syncActiveSpriteFromCanvas();
      }
      updateHistoryButtons();
      render();
    });
    btnUndo.addEventListener("click", () => undo());
    btnRedo.addEventListener("click", () => redo());

    slotFgBtn.addEventListener("click", () => selectSlot("fg"));
    slotMc1Btn.addEventListener("click", () => selectSlot("mc1"));
    slotMc2Btn.addEventListener("click", () => selectSlot("mc2"));
    slotOutBtn.addEventListener("click", () => selectSlot("out"));
    slotCheatBtn.addEventListener("click", () => selectSlot("cheat"));

    toolButtons.pen.addEventListener("click", () => setTool("pen"));
    toolButtons.eraser.addEventListener("click", () => setTool("eraser"));
    toolButtons.line.addEventListener("click", () => setTool("line"));
    toolButtons.fill.addEventListener("click", () => setTool("fill"));
    toolButtons.rect.addEventListener("click", () => setTool("rect"));
    toolButtons.circle.addEventListener("click", () => setTool("circle"));
    toolButtons.select.addEventListener("click", () => setTool("select"));

    btnLayerMC.addEventListener("click", () => setC64Layer("mc"));
    btnLayerOUT.addEventListener("click", () => setC64Layer("out"));
    btnLayerCheat.addEventListener("click", () => setC64Layer("cheat"));

    toolCopyBtn.addEventListener("click", () => {
      if (tool !== "select") return;
      if (hasSelection()) copySelection();
      updateToolButtons();
    });
    toolPasteBtn.addEventListener("click", () => {
      if (!copyBuffer) return;
      if (!canPasteToCurrentLayer()) return;
      pasteMode = true;
      setTool("select");
      updateToolButtons();
      render();
    });

    btnAddSprite.addEventListener("click", () => addSprite());
    btnAddMcImage.addEventListener("click", () => addMcImage());

    spriteInspectorNameEl.addEventListener("input", () => {
      const sp = getActiveSprite();
      if (!sp) return;
      sp.name = (spriteInspectorNameEl.value || "").trim() || "Sprite";
      scheduleSave();
      renderSprites();
    });

    inspToSwatch.addEventListener("click", (e) => {
      e.preventDefault();
      const sp = getActiveSprite();
      if (!sp) return;
      addToLibrary({ w: sp.w, h: sp.h, data: compositeSpritePixels(sp).slice() });
    });
    inspDuplicate.addEventListener("click", (e) => {
      e.preventDefault();
      const sp = getActiveSprite();
      if (!sp) return;
      duplicateSprite(sp.id);
    });
    inspDelete.addEventListener("click", async (e) => {
      e.preventDefault();
      const sp = getActiveSprite();
      if (!sp) return;
      if (!e.shiftKey) {
        const msg = lang === "pl" ? `Usunąć ${sp.name}?` : `${t("delete_confirm")} ${sp.name}?`;
        const ok = await askConfirm(msg, { title: t("delete_sprite_title"), okText: t("delete_ok") });
        if (!ok) return;
      }
      removeSprite(sp.id);
    });

    btnToggleSprites.addEventListener("click", () => {
      uiState.spritesCollapsed = !uiState.spritesCollapsed;
      applyCollapseUi();
      scheduleSave();
    });
    btnToggleSwatches.addEventListener("click", () => {
      uiState.swatchesCollapsed = !uiState.swatchesCollapsed;
      applyCollapseUi();
      scheduleSave();
    });

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    wrap.addEventListener(
      "wheel",
      (e) => {
        // Scroll to zoom. Modifiers:
        // - Shift + wheel: select color slot (FG/MC1/MC2/OUT)
        // - Ctrl/Meta + wheel: change color in active slot
      if (e.ctrlKey || e.metaKey) {
        const dir = e.deltaY > 0 ? 1 : -1;
        if (activeSlot === "cheat") cheatColor = wrapIndex(clampInt(cheatColor, 0, 15) + dir, C64.length);
        else colorSlots[activeSlot] = wrapIndex(colorSlots[activeSlot] + dir, C64.length);
        persistSlotsToSpriteIfNeeded();
        syncSlotUi();
        syncPaletteSelection();
        scheduleSave();
        render();
        e.preventDefault();
        return;
        }
          if (e.shiftKey) {
            const dir = e.deltaY > 0 ? 1 : -1;
            const sp = getActiveSprite();
            const order = sp && isMcImage(sp) ? ["out", "fg", "cheat"] : ["fg", "mc1", "mc2", "out", "cheat"];
            const idx = Math.max(0, order.indexOf(activeSlot));
            selectSlot(order[wrapIndex(idx + dir, order.length)]);
            e.preventDefault();
            return;
          }

        const dir = e.deltaY > 0 ? -1 : 1;
        zoom = clampInt(zoom + dir, 4, 64);
        zoomEl.value = String(clampInt(zoom, Number(zoomEl.min), Number(zoomEl.max)));
        resizeCanvasOnly();
        scheduleSave();
        render();
        e.preventDefault();
      },
      { passive: false },
    );
    canvas.addEventListener("pointerdown", (e) => {
      if (!(e.button === 0 || e.button === 2)) return;
      canvas.setPointerCapture(e.pointerId);
      pointer.down = true;
      pointer.over = true;
      pointer.button = e.button;
      updatePointer(e);
      beginAction(e.button);
      handlePointerDown();
      render();
    });
    canvas.addEventListener("pointermove", (e) => {
      pointer.over = true;
      updatePointer(e);
      if (pointer.down) handlePointerMove();
      else action.preview = null;
      render();
    });
    canvas.addEventListener("pointerup", () => {
      if (!pointer.down) return;
      pointer.down = false;
      handlePointerUp();
      finalizeAction();
      render();
    });
    canvas.addEventListener("pointerleave", () => {
      pointer.over = false;
      pointer.x = -1;
      pointer.y = -1;
      if (!pointer.down) action.preview = null;
      render();
    });

    wrap.addEventListener("keydown", (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const target = e.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      }

      if (e.altKey && !ctrl) {
        const sp = getActiveSprite();
        if (!sp) return;
        const v = ensureSpriteVis(sp);
        if (e.key === "m" || e.key === "M") {
          v.mc = !v.mc;
          scheduleSave();
          renderSprites();
          render();
          e.preventDefault();
          return;
        }
        if (e.key === "o" || e.key === "O") {
          v.out = !v.out;
          scheduleSave();
          renderSprites();
          render();
          e.preventDefault();
          return;
        }
        if (e.key === "h" || e.key === "H") {
          v.cheat = !v.cheat;
          scheduleSave();
          renderSprites();
          render();
          e.preventDefault();
          return;
        }
      }

      if (!ctrl) {
        if (e.key === "m" || e.key === "M") {
          setC64Layer("mc", { resetHistory: false });
          e.preventDefault();
          return;
        }
        if (e.key === "o" || e.key === "O") {
          setC64Layer("out", { resetHistory: false });
          e.preventDefault();
          return;
        }
        if (e.key === "h" || e.key === "H") {
          setC64Layer("cheat", { resetHistory: false });
          e.preventDefault();
          return;
        }
      }
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        openHotkeys();
        e.preventDefault();
        return;
      }
      if (ctrl && (e.key === "z" || e.key === "Z")) {
        if (e.shiftKey) redo();
        else undo();
        e.preventDefault();
        return;
      }
      if (ctrl && (e.key === "y" || e.key === "Y")) {
        redo();
        e.preventDefault();
        return;
      }
      if (ctrl && (e.key === "c" || e.key === "C")) {
        if (hasSelection()) copySelection();
        e.preventDefault();
        return;
      }
      if (ctrl && (e.key === "v" || e.key === "V")) {
        if (copyBuffer && canPasteToCurrentLayer()) {
          pasteMode = true;
          setTool("select");
          render();
        }
        e.preventDefault();
        return;
      }
      if (e.key === "Escape") {
        pasteMode = false;
        clearSelection();
        render();
        e.preventDefault();
        return;
      }

      if (e.key === "1") {
        selectSlot("fg");
        e.preventDefault();
        return;
      }
      if (e.key === "2") {
        selectSlot("mc1");
        e.preventDefault();
        return;
      }
      if (e.key === "3") {
        selectSlot("mc2");
        e.preventDefault();
        return;
      }
      if (e.key === "4") {
        selectSlot("out");
        e.preventDefault();
        return;
      }
      if (e.key === "5") {
        selectSlot("cheat");
        e.preventDefault();
        return;
      }

      if (e.key === "g" || e.key === "G") {
        showGridEl.checked = !showGridEl.checked;
        showGrid = !!showGridEl.checked;
        render();
        e.preventDefault();
        return;
      }
      if (e.key === "w" || e.key === "W") {
        if (widePixelEl.disabled) {
          e.preventDefault();
          return;
        }
        widePixelEl.checked = !widePixelEl.checked;
        widePixel = !!widePixelEl.checked;
        render();
        e.preventDefault();
        return;
      }
      if (e.key === "s" || e.key === "S") {
        shapeFillEl.checked = !shapeFillEl.checked;
        shapeFill = !!shapeFillEl.checked;
        if (action.active) updatePreview();
        render();
        e.preventDefault();
        return;
      }
      if (e.key === "t" || e.key === "T") {
        btnTransform.click();
        e.preventDefault();
        return;
      }
      if (transformMode && (e.key === "x" || e.key === "X")) {
        btnMirrorX.click();
        e.preventDefault();
        return;
      }
      if (transformMode && (e.key === "y" || e.key === "Y")) {
        btnMirrorY.click();
        e.preventDefault();
        return;
      }
      if (transformMode && e.key === "ArrowUp") {
        roll(0, -1);
        e.preventDefault();
        return;
      }
      if (transformMode && e.key === "ArrowDown") {
        roll(0, 1);
        e.preventDefault();
        return;
      }
      if (transformMode && e.key === "ArrowLeft") {
        roll(-1, 0);
        e.preventDefault();
        return;
      }
      if (transformMode && e.key === "ArrowRight") {
        roll(1, 0);
        e.preventDefault();
        return;
      }
      if (e.key === "p" || e.key === "P") {
        setTool("pen");
        e.preventDefault();
        return;
      }
      if (e.key === "e" || e.key === "E") {
        setTool("eraser");
        e.preventDefault();
        return;
      }
      if (e.key === "l" || e.key === "L") {
        setTool("line");
        e.preventDefault();
        return;
      }
      if (e.key === "f" || e.key === "F") {
        setTool("fill");
        e.preventDefault();
        return;
      }
      if (e.key === "r" || e.key === "R") {
        setTool("rect");
        e.preventDefault();
        return;
      }
      if (e.key === "c" || e.key === "C") {
        setTool("circle");
        e.preventDefault();
        return;
      }
      if (e.key === "q" || e.key === "Q") {
        setTool("select");
        e.preventDefault();
        return;
      }
    });

    btnHelpClose.addEventListener("click", () => closeHelp());
    helpModal.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest("[data-close]")) closeHelp();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!helpOpen) return;
      closeHelp();
      e.preventDefault();
    });

    btnKeysClose.addEventListener("click", () => closeHotkeys());
    keysModal.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest("[data-close]")) closeHotkeys();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!keysOpen) return;
      closeHotkeys();
      e.preventDefault();
    });

    btnIoClose.addEventListener("click", () => closeIO());
    ioModal.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest("[data-close]")) closeIO();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!ioOpen) return;
      closeIO();
      e.preventDefault();
    });
    ioActionImport.addEventListener("click", () => {
      ioAction = "import";
      syncIOActionUi();
      renderIO();
    });
    ioActionExport.addEventListener("click", () => {
      ioAction = "export";
      syncIOActionUi();
      renderIO();
    });

    btnConfirmClose.addEventListener("click", () => closeConfirm(false));
    btnConfirmCancel.addEventListener("click", () => closeConfirm(false));
    btnConfirmOk.addEventListener("click", () => closeConfirm(true));
    confirmModal.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest("[data-close]")) closeConfirm(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!confirmOpen) return;
      closeConfirm(false);
      e.preventDefault();
    });
  }

  function openHelp() {
    if (helpOpen) return;
    helpPrevFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    helpText.textContent = (helpContent.textContent || "").trim();
    helpModal.hidden = false;
    helpOpen = true;
    btnHelpClose.focus();
  }

  function closeHelp() {
    if (!helpOpen) return;
    helpModal.hidden = true;
    helpOpen = false;
    const f = helpPrevFocus;
    helpPrevFocus = null;
    if (f && document.contains(f)) f.focus();
    else btnHelp.focus();
  }

  function openHotkeys() {
    if (keysOpen) return;
    keysPrevFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    renderHotkeys();
    keysModal.hidden = false;
    keysOpen = true;
    btnKeysClose.focus();
  }

  function closeHotkeys() {
    if (!keysOpen) return;
    keysModal.hidden = true;
    keysOpen = false;
    const f = keysPrevFocus;
    keysPrevFocus = null;
    if (f && document.contains(f)) f.focus();
    else btnHotkeys.focus();
  }

  function renderIO() {
    const options = [
      {
        id: "project_json",
        label: "Project (JSON)",
        i18n: "io_project_json",
        action: "both",
        run: async (kind) => {
          if (kind === "import") {
            fileProject.value = "";
            fileProject.click();
          } else {
            exportProject();
          }
        },
      },
      {
        id: "spritepad_spd",
        label: "SpritePad (.spd)",
        i18n: "io_spritepad_spd",
        action: "both",
        run: async (kind) => {
          if (kind === "import") {
            fileSpd.value = "";
            fileSpd.click();
          } else {
            await exportSpritePadSpd();
          }
        },
      },
      {
        id: "sprite_png",
        label: "Active sprite (PNG)",
        i18n: "io_sprite_png",
        action: "export",
        run: async () => {
          await exportActiveSpritePng();
        },
      },
      {
        id: "sprite_png_import",
        label: "Sprite (PNG → sprite)",
        i18n: "io_sprite_png_import",
        action: "import",
        run: async () => {
          fileSpritePng.value = "";
          fileSpritePng.click();
        },
      },
      {
        id: "swatch_png_import",
        label: "Swatch (PNG → swatch)",
        i18n: "io_swatch_png_import",
        action: "import",
        run: async () => {
          fileSwatchPng.value = "";
          fileSwatchPng.click();
        },
      },
      {
        id: "spritesheet_png",
        label: "Spritesheet (PNG)",
        i18n: "io_spritesheet_png",
        action: "export",
        run: async () => {
          await exportSpritesheetPng();
        },
      },
    ];

    ioList.innerHTML = "";
    for (const opt of options) {
      const allowed = opt.action === "both" || opt.action === ioAction;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ioItem btn";
      btn.disabled = !allowed;
      btn.dataset.io = opt.id;
      btn.innerHTML = `<div class="ioItem__title">${t(opt.i18n)}</div>`;
      btn.addEventListener("click", async () => {
        if (btn.disabled) return;
        await opt.run(ioAction);
        closeIO();
      });
      ioList.appendChild(btn);
    }
  }

  function syncIOActionUi() {
    ioActionImport.setAttribute("aria-pressed", ioAction === "import" ? "true" : "false");
    ioActionExport.setAttribute("aria-pressed", ioAction === "export" ? "true" : "false");
  }

  function openIO() {
    if (ioOpen) return;
    if (helpOpen) closeHelp();
    if (keysOpen) closeHotkeys();
    ioPrevFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ioModal.hidden = false;
    ioOpen = true;
    syncIOActionUi();
    renderIO();
    btnIoClose.focus();
  }

  function closeIO() {
    if (!ioOpen) return;
    ioModal.hidden = true;
    ioOpen = false;
    const f = ioPrevFocus;
    ioPrevFocus = null;
    if (f && document.contains(f)) f.focus();
    else btnIO.focus();
  }

  function askConfirm(message, opts = {}) {
    const title = opts.title ?? t("confirm");
    const okText = opts.okText ?? t("ok");
    const cancelText = opts.cancelText ?? t("cancel");
    if (helpOpen) closeHelp();
    if (keysOpen) closeHotkeys();

    confirmTitle.textContent = title;
    confirmMsg.textContent = message;
    btnConfirmOk.textContent = okText;
    btnConfirmCancel.textContent = cancelText;
    btnConfirmCancel.hidden = false;
    confirmIsAlert = false;

    confirmPrevFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    confirmModal.hidden = false;
    confirmOpen = true;

    return new Promise((resolve) => {
      confirmResolve = resolve;
      btnConfirmOk.focus();
    });
  }

  function showAlert(message, opts = {}) {
    const title = opts.title ?? t("confirm");
    const okText = opts.okText ?? t("ok");
    if (helpOpen) closeHelp();
    if (keysOpen) closeHotkeys();

    confirmTitle.textContent = title;
    confirmMsg.textContent = message;
    btnConfirmOk.textContent = okText;
    btnConfirmCancel.hidden = true;
    confirmIsAlert = true;

    confirmPrevFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    confirmModal.hidden = false;
    confirmOpen = true;

    return new Promise((resolve) => {
      confirmResolve = resolve;
      btnConfirmOk.focus();
    });
  }

  function closeConfirm(result) {
    if (!confirmOpen) return;
    confirmModal.hidden = true;
    confirmOpen = false;
    const resolve = confirmResolve;
    confirmResolve = null;
    if (typeof resolve === "function") resolve(confirmIsAlert ? true : !!result);
    confirmIsAlert = false;
    btnConfirmCancel.hidden = false;

    const f = confirmPrevFocus;
    confirmPrevFocus = null;
    if (f && document.contains(f)) f.focus();
  }

  async function setInitialGrid() {
    if (customRes) await setGridSize(customW, customH, { keep: false, resetHistory: true });
    else await setGridSize(SPRITE_W * spritesX, SPRITE_H * spritesY, { keep: false, resetHistory: true });
  }

  function syncResUi() {
    const sp = getActiveSprite();
    const imgMode = isMcImage(sp);
    const forcedCustom = imgMode ? true : customRes;
    spriteControlsEl.hidden = forcedCustom || imgMode;
    customControlsEl.hidden = !forcedCustom;
    customResEl.disabled = imgMode;
    if (imgMode) {
      customResEl.checked = true;
      customRes = true;
    }
    spritesXEl.disabled = imgMode;
    spritesYEl.disabled = imgMode;
  }

  function buildPalette() {
    paletteEl.innerHTML = "";
    C64.forEach((c, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.style.background = c.hex;
      b.setAttribute("role", "radio");
      b.setAttribute("aria-label", `${idx}: ${c.name}`);
      b.setAttribute("aria-checked", idx === activePaletteIndex() ? "true" : "false");
      b.title = `${idx}: ${c.name} (${c.hex})`;
      b.addEventListener("click", () => {
        setActivePaletteIndex(idx);
        persistSlotsToSpriteIfNeeded();
        syncSlotUi();
        syncPaletteSelection();
        scheduleSave();
        render();
      });
      paletteEl.appendChild(b);
    });
  }

  function syncPaletteSelection() {
    const children = Array.from(paletteEl.children);
    const sel = activePaletteIndex();
    children.forEach((node, i) => node.setAttribute("aria-checked", i === sel ? "true" : "false"));
  }

  function textColorForHex(hex) {
    // Return a readable text color for a given #rrggbb background.
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
    if (!m) return "#ffffff";
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    // sRGB relative luminance approx.
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return l > 0.58 ? "#111111" : "#ffffff";
  }

  function setSlotBtnColor(btn, hex) {
    if (!btn) return;
    btn.style.background = hex;
    btn.style.color = textColorForHex(hex);
  }

  function setActiveSlot(slot) {
    const layer = getEditLayer();
    const sp = getActiveSprite();
    let next = slot;
    if (layer !== "cheat" && next === "cheat") next = "fg";
    if (layer === "mc" && next === "out" && !isMcImage(sp)) next = "fg";
    if (layer === "out") next = "out";
    if (layer === "cheat") next = "cheat";
    activeSlot = next;
    slotFgBtn.setAttribute("aria-pressed", activeSlot === "fg" ? "true" : "false");
    slotMc1Btn.setAttribute("aria-pressed", activeSlot === "mc1" ? "true" : "false");
    slotMc2Btn.setAttribute("aria-pressed", activeSlot === "mc2" ? "true" : "false");
    slotOutBtn.setAttribute("aria-pressed", activeSlot === "out" ? "true" : "false");
    slotCheatBtn.setAttribute("aria-pressed", activeSlot === "cheat" ? "true" : "false");
    syncPaletteSelection();
    render();
  }

  function selectSlot(slot) {
    // Selecting a slot implies selecting the matching editable layer.
    const sp = getActiveSprite();
    if (sp && isMcImage(sp) && (slot === "mc1" || slot === "mc2")) slot = "fg";
    if (slot === "out" && !isMcImage(sp)) setC64Layer("out", { resetHistory: false });
    else if (slot === "cheat") setC64Layer("cheat", { resetHistory: false });
    else setC64Layer("mc", { resetHistory: false });
    setActiveSlot(slot);
    updateToolButtons();
    syncModeUi();
  }

  function syncSlotUi() {
    const fgHex = C64[colorSlots.fg].hex;
    const mc1Hex = C64[colorSlots.mc1].hex;
    const mc2Hex = C64[colorSlots.mc2].hex;
    const outHex = C64[colorSlots.out].hex;
    const chHex = C64[clampInt(cheatColor, 0, 15)].hex;

    // Compact slots: button background = color, label on top.
    setSlotBtnColor(slotFgBtn, fgHex);
    setSlotBtnColor(slotMc1Btn, mc1Hex);
    setSlotBtnColor(slotMc2Btn, mc2Hex);
    setSlotBtnColor(slotOutBtn, outHex);
    setSlotBtnColor(slotCheatBtn, chHex);

    // Keep swatches in sync (hidden in CSS, but harmless).
    slotFgSwatch.style.background = fgHex;
    slotMc1Swatch.style.background = mc1Hex;
    slotMc2Swatch.style.background = mc2Hex;
    slotOutSwatch.style.background = outHex;
    slotCheatSwatch.style.background = chHex;
  }

  function setTool(next) {
    tool = next;
    Object.entries(toolButtons).forEach(([key, btn]) => btn.setAttribute("aria-pressed", key === next ? "true" : "false"));
    if (next !== "select") {
      pasteMode = false;
      clearSelection();
    }
    updateToolButtons();
    render();
  }

  function updateToolButtons() {
    const selectActive = tool === "select";
    toolCopyBtn.disabled = !selectActive || !hasSelection();
    toolPasteBtn.disabled = !selectActive || !copyBuffer || !canPasteToCurrentLayer();
    if (!canPasteToCurrentLayer()) pasteMode = false;
    toolPasteBtn.setAttribute("aria-pressed", pasteMode ? "true" : "false");
  }

  function syncModeUi() {
    layerRow.hidden = false;
    btnLayerCheat.hidden = false;
    btnLayerCheat.disabled = false;

    const sp = getActiveSprite();
    const imgMode = isMcImage(sp);
    const layer = getEditLayer();
    btnLayerMC.setAttribute("aria-pressed", layer === "mc" ? "true" : "false");
    btnLayerOUT.setAttribute("aria-pressed", layer === "out" ? "true" : "false");
    btnLayerCheat.setAttribute("aria-pressed", layer === "cheat" ? "true" : "false");

    // In C64 modes we force cursor width based on layer.
    widePixelEl.disabled = true;

    // Cheat color slot only when cheat mode is available.
    slotCheatBtn.hidden = false;
    slotCheatBtn.disabled = false;

    // MC-image has no OUT layer: repurpose slot OUT as BG and hide OUT layer button.
    btnLayerOUT.hidden = imgMode;
    btnLayerOUT.disabled = imgMode;
    const outLbl = slotOutBtn.querySelector(".slotLbl");
    if (outLbl) outLbl.textContent = imgMode ? "BG" : "OUT";

    // MC-image uses BG/FG/CHEAT (no MC1/MC2 UI).
    slotMc1Btn.hidden = imgMode;
    slotMc2Btn.hidden = imgMode;
    slotMc1Btn.disabled = imgMode;
    slotMc2Btn.disabled = imgMode;

    if (imgMode) {
      slotOutBtn.style.order = "0";
      slotFgBtn.style.order = "1";
      slotCheatBtn.style.order = "2";
    } else {
      slotOutBtn.style.order = "";
      slotFgBtn.style.order = "";
      slotCheatBtn.style.order = "";
    }

    // Grid 8x8 only makes sense for MC-image.
    grid8El.disabled = !imgMode;
    if (!imgMode) {
      grid8El.checked = false;
      grid8 = false;
    }
  }

  function setC64Layer(layer, opts = {}) {
    const sp = getActiveSprite();
    if (!sp) return;
    const c64 = ensureC64Layers(sp);
    let next = layer === "cheat" ? "cheat" : layer === "out" ? "out" : "mc";
    if (isMcImage(sp) && next === "out") next = "mc";

    if (next === "cheat") {
      c64.lastLayer = "cheat";
    } else {
      c64.lastNonCheatLayer = next;
      c64.lastLayer = next; // also update "last" when switching layers inside cheat mode
    }

    if (next === "mc") {
      widePixel = true;
      widePixelEl.checked = true;
      pixels = c64.mc;
      if (!isMcImage(sp) && activeSlot === "out") setActiveSlot("fg");
      if (activeSlot === "cheat") setActiveSlot("fg");
    } else if (next === "out") {
      widePixel = false;
      widePixelEl.checked = false;
      pixels = c64.out;
      setActiveSlot("out");
    } else {
      // cheat
      widePixel = false;
      widePixelEl.checked = false;
      pixels = c64.cheat;
      setActiveSlot("cheat");
    }

    pasteMode = false;
    updateToolButtons();
    syncModeUi();
    if (opts.resetHistory !== false) resetHistory();
    scheduleSave();
    render();
  }

  function updatePointer(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) / rect.width;
    const sy = (e.clientY - rect.top) / rect.height;
    let x = Math.floor(sx * gridW);
    let y = Math.floor(sy * gridH);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      x = -1;
      y = -1;
    }
    x = clampInt(x, 0, gridW - 1);
    y = clampInt(y, 0, gridH - 1);
    if (widePixel) x = x - (x % 2);
    pointer.x = x;
    pointer.y = y;
  }

  function beginAction(button) {
    action.active = true;
    action.tool = tool;
    action.button = button;
    action.startX = pointer.x;
    action.startY = pointer.y;
    action.changed = false;
    action.pushedUndo = false;
    action.preview = null;
  }

  function finalizeAction() {
    action.active = false;
    action.pushedUndo = false;
    action.preview = null;
    updateHistoryButtons();
  }

  function ensureUndo() {
    if (action.pushedUndo) return;
    pushUndo();
    action.pushedUndo = true;
  }

  function undo() {
    if (undoStack.length === 0) return;
    const snap = undoStack.pop();
    const sp = getActiveSprite();
    if (snap && typeof snap === "object" && !(snap instanceof Uint8Array) && snap.type === "all") redoStack.push(captureAllLayersSnapshot());
    else if (snap && typeof snap === "object" && !(snap instanceof Uint8Array) && snap.type === "mcimg") redoStack.push(captureMcImageSnapshot());
    else if (sp && isMcImage(sp) && getEditLayer() === "mc") redoStack.push(captureMcImageSnapshot());
    else redoStack.push(pixels.slice());
    applyUndoSnapshot(snap);
    updateHistoryButtons();
    render();
  }

  function redo() {
    if (redoStack.length === 0) return;
    const snap = redoStack.pop();
    const sp = getActiveSprite();
    if (snap && typeof snap === "object" && !(snap instanceof Uint8Array) && snap.type === "all") undoStack.push(captureAllLayersSnapshot());
    else if (snap && typeof snap === "object" && !(snap instanceof Uint8Array) && snap.type === "mcimg") undoStack.push(captureMcImageSnapshot());
    else if (sp && isMcImage(sp) && getEditLayer() === "mc") undoStack.push(captureMcImageSnapshot());
    else undoStack.push(pixels.slice());
    applyUndoSnapshot(snap);
    updateHistoryButtons();
    render();
  }

  function resetHistory() {
    undoStack.length = 0;
    redoStack.length = 0;
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    btnUndo.disabled = undoStack.length === 0;
    btnRedo.disabled = redoStack.length === 0;
  }

  async function setGridSize(w, h, opts = {}) {
    const keep = !!opts.keep;
    const reset = opts.resetHistory !== false;

    const nextW = clampInt(w, 1, MAX_SIZE);
    const nextH = clampInt(h, 1, MAX_SIZE);
    if (!(await canResizeWithoutDataLoss(nextW, nextH))) return false;

    const sp = getActiveSprite();
    const prevW = gridW;
    const prevH = gridH;

    gridW = nextW;
    gridH = nextH;

    if (!sp) {
      const prev = pixels;
      pixels = new Uint8Array(gridW * gridH).fill(TRANSPARENT);
      if (keep && prev && prev.length) pixels = resizeLayer(prev, prevW, prevH, gridW, gridH, TRANSPARENT);
      resizeCanvasOnly();
      if (reset) resetHistory();
      render();
      return true;
    }

    // Resize active sprite layers.
    sp.w = gridW;
    sp.h = gridH;
    const c64 = ensureC64Layers(sp);
    c64.mc = keep ? resizeLayer(c64.mc, prevW, prevH, gridW, gridH, 0) : new Uint8Array(gridW * gridH).fill(0);
    c64.out = keep ? resizeLayer(c64.out, prevW, prevH, gridW, gridH, 0) : new Uint8Array(gridW * gridH).fill(0);
    c64.cheat = keep ? resizeLayer(c64.cheat, prevW, prevH, gridW, gridH, TRANSPARENT) : new Uint8Array(gridW * gridH).fill(TRANSPARENT);
    c64.w = gridW;
    c64.h = gridH;
    sp.pixels = c64.cheat;

    // Re-point the active editing buffer.
    setC64Layer(getEditLayer(), { resetHistory: false });
    resizeCanvasOnly();
    if (reset) resetHistory();
    renderSprites();
    scheduleSave();
    render();
    return true;
  }

  async function canResizeWithoutDataLoss(nextW, nextH) {
    if (nextW >= gridW && nextH >= gridH) return true;

    const sp = getActiveSprite();

    const wouldCrop = (buf, transparentVal) => {
      if (!buf || !buf.length) return false;
      for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
          if (x < nextW && y < nextH) continue;
          if (buf[y * gridW + x] !== transparentVal) return true;
        }
      }
      return false;
    };

    if (!sp) {
      if (wouldCrop(pixels, TRANSPARENT)) return await askConfirm("Zmniejszenie rozmiaru może uciąć piksele. Kontynuować?");
      return true;
    }

    const c64 = ensureC64Layers(sp);
    if (wouldCrop(c64.mc, 0)) return await askConfirm("Zmniejszenie rozmiaru może uciąć piksele. Kontynuować?");
    if (wouldCrop(c64.out, 0)) return await askConfirm("Zmniejszenie rozmiaru może uciąć piksele. Kontynuować?");
    if (wouldCrop(c64.cheat, TRANSPARENT)) return await askConfirm("Zmniejszenie rozmiaru może uciąć piksele. Kontynuować?");
    return true;
  }

  function resizeCanvasOnly() {
    canvas.width = gridW * zoom;
    canvas.height = gridH * zoom;
    canvas.style.width = `${gridW * zoom}px`;
    canvas.style.height = `${gridH * zoom}px`;
  }

  function handlePointerDown() {
    if (pointer.x < 0 || pointer.y < 0) return;
    if (tool === "select") {
      if (pasteMode && copyBuffer && canPasteToCurrentLayer()) {
        // Paste at cursor.
        ensureUndo();
        const erase = action.button === 2;
        action.changed = pasteAt(pointer.x, pointer.y, { erase }) || action.changed;
        if (action.changed) syncActiveSpriteFromCanvas();
        updateToolButtons();
        render();
        return;
      }
      // Start selection.
      selection.active = true;
      selection.x0 = pointer.x;
      selection.y0 = pointer.y;
      selection.x1 = pointer.x;
      selection.y1 = pointer.y;
      updateToolButtons();
      render();
      return;
    }
    if (tool === "fill") {
      const sp = getActiveSprite();
      if (sp && isMcImage(sp) && getEditLayer() === "mc") {
        ensureUndo();
        const desired = action.button === 2 ? null : activeSlot === "out" ? null : clampInt(colorSlots.fg, 0, 15);
        action.changed = mcImageFloodFill(pointer.x, pointer.y, desired) || action.changed;
      } else {
        const value = action.button === 2 ? currentEraseValue() : currentPaintValue();
        if (fillWouldChange(pointer.x, pointer.y, value)) {
          ensureUndo();
          action.changed = floodFill(pointer.x, pointer.y, value) || action.changed;
        }
      }
      return;
    }

    if (tool === "pen" || tool === "eraser") {
      const sp = getActiveSprite();
      if (sp && isMcImage(sp) && getEditLayer() === "mc") {
        ensureUndo();
        const desired = action.button === 2 || tool === "eraser" ? null : activeSlot === "out" ? null : clampInt(colorSlots.fg, 0, 15);
        action.changed = mcImageStamp(pointer.x, pointer.y, desired) || action.changed;
      } else {
        const value = action.button === 2 || tool === "eraser" ? currentEraseValue() : currentPaintValue();
        if (wouldStampChange(pointer.x, pointer.y, value)) {
          ensureUndo();
          action.changed = stamp(pointer.x, pointer.y, value) || action.changed;
        }
      }
      return;
    }

    updatePreview();
  }

  function handlePointerMove() {
    if (pointer.x < 0 || pointer.y < 0) return;
    if (tool === "select") {
      if (selection.active) {
        selection.x1 = pointer.x;
        selection.y1 = pointer.y;
      }
      updateToolButtons();
      render();
      return;
    }
    if (tool === "pen" || tool === "eraser") {
      const sp = getActiveSprite();
      if (sp && isMcImage(sp) && getEditLayer() === "mc") {
        ensureUndo();
        const desired = action.button === 2 || tool === "eraser" ? null : activeSlot === "out" ? null : clampInt(colorSlots.fg, 0, 15);
        action.changed = mcImageStamp(pointer.x, pointer.y, desired) || action.changed;
      } else {
        const value = action.button === 2 || tool === "eraser" ? currentEraseValue() : currentPaintValue();
        if (wouldStampChange(pointer.x, pointer.y, value)) {
          ensureUndo();
          action.changed = stamp(pointer.x, pointer.y, value) || action.changed;
        }
      }
      return;
    }

    updatePreview();
  }

  function handlePointerUp() {
    if (tool === "select") {
      selection.active = false;
      normalizeSelection();
      updateToolButtons();
      render();
      return;
    }
    if (tool === "line") {
      const sp = getActiveSprite();
      if (sp && isMcImage(sp) && getEditLayer() === "mc") {
        ensureUndo();
        const desired = action.button === 2 ? null : activeSlot === "out" ? null : clampInt(colorSlots.fg, 0, 15);
        action.changed = mcImageDrawLine(action.startX, action.startY, pointer.x, pointer.y, desired) || action.changed;
      } else {
        const value = action.button === 2 ? currentEraseValue() : currentPaintValue();
        if (lineWouldChange(action.startX, action.startY, pointer.x, pointer.y, value)) {
          ensureUndo();
          action.changed = drawLine(action.startX, action.startY, pointer.x, pointer.y, value) || action.changed;
        }
      }
      return;
    }
    if (tool === "rect") {
      const sp = getActiveSprite();
      if (sp && isMcImage(sp) && getEditLayer() === "mc") {
        ensureUndo();
        const desired = action.button === 2 ? null : activeSlot === "out" ? null : clampInt(colorSlots.fg, 0, 15);
        action.changed =
          mcImageDrawRect(action.startX, action.startY, pointer.x, pointer.y, desired, { fill: shapeFill }) || action.changed;
      } else {
        const value = action.button === 2 ? currentEraseValue() : currentPaintValue();
        const willChange = rectWouldChange(action.startX, action.startY, pointer.x, pointer.y, value, { fill: shapeFill });
        if (willChange) {
          ensureUndo();
          action.changed =
            drawRect(action.startX, action.startY, pointer.x, pointer.y, value, { fill: shapeFill }) || action.changed;
        }
      }
      return;
    }
    if (tool === "circle") {
      const sp = getActiveSprite();
      if (sp && isMcImage(sp) && getEditLayer() === "mc") {
        ensureUndo();
        const desired = action.button === 2 ? null : activeSlot === "out" ? null : clampInt(colorSlots.fg, 0, 15);
        action.changed =
          mcImageDrawCircle(action.startX, action.startY, pointer.x, pointer.y, desired, { fill: shapeFill }) || action.changed;
      } else {
        const value = action.button === 2 ? currentEraseValue() : currentPaintValue();
        const willChange = circleWouldChange(action.startX, action.startY, pointer.x, pointer.y, value, { fill: shapeFill });
        if (willChange) {
          ensureUndo();
          action.changed =
            drawCircle(action.startX, action.startY, pointer.x, pointer.y, value, { fill: shapeFill }) || action.changed;
        }
      }
      return;
    }
  }

  function updatePreview() {
    if (pointer.x < 0 || pointer.y < 0) {
      action.preview = null;
      return;
    }

    if (!(tool === "line" || tool === "rect" || tool === "circle")) {
      action.preview = null;
      return;
    }

    const x0 = action.startX;
    const y0 = action.startY;
    const x1 = pointer.x;
    const y1 = pointer.y;

    if (tool === "line") {
      action.preview = previewLine(x0, y0, x1, y1);
      return;
    }
    if (tool === "rect") {
      action.preview = previewRect(x0, y0, x1, y1);
      return;
    }
    if (tool === "circle") {
      action.preview = previewCircle(x0, y0, x1, y1);
      return;
    }
  }

  let spritesDirtyTimer = null;
  function markSpritesDirty() {
    if (!spriteListEl) return;
    if (sprites.length === 0) return;
    if (spritesDirtyTimer) return;
    spritesDirtyTimer = setTimeout(() => {
      spritesDirtyTimer = null;
      renderSprites();
    }, 120);
  }

  function setPixelRaw(x, y, value) {
    if (x < 0 || y < 0 || x >= gridW || y >= gridH) return false;
    const idx = y * gridW + x;
    const prev = pixels[idx];
    if (prev === value) return false;
    pixels[idx] = value;
    markSpritesDirty();
    scheduleSave();
    return true;
  }

  function setPixel(x, y, value) {
    // Applies mirror-drawing mode (H/V around center) for drawing tools.
    let changed = false;
    for (const [xx, yy] of mirrorPoints(x, y)) changed = setPixelRaw(xx, yy, value) || changed;
    return changed;
  }

  function mirrorPoints(x, y) {
    const pts = [[x, y]];
    const mx = mirrorX ? gridW - 1 - x : x;
    const my = mirrorY ? gridH - 1 - y : y;
    if (mirrorX) pts.push([mx, y]);
    if (mirrorY) pts.push([x, my]);
    if (mirrorX && mirrorY) pts.push([mx, my]);
    // De-dupe small list.
    const out = [];
    const seen = new Set();
    for (const [px, py] of pts) {
      const key = `${px},${py}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([px, py]);
    }
    return out;
  }

  function stamp(x, y, value) {
    if (!widePixel) return setPixel(x, y, value);
    const xx = x - (x % 2);
    let changed = false;
    changed = setPixel(xx, y, value) || changed;
    if (xx + 1 < gridW) changed = setPixel(xx + 1, y, value) || changed;
    return changed;
  }

  function wouldStampChange(x, y, value) {
    if (x < 0 || y < 0 || x >= gridW || y >= gridH) return false;
    const pointsToCheck = [];
    if (!widePixel) pointsToCheck.push([x, y]);
    else {
      const xx = x - (x % 2);
      pointsToCheck.push([xx, y]);
      if (xx + 1 < gridW) pointsToCheck.push([xx + 1, y]);
    }
    for (const [px, py] of pointsToCheck) {
      for (const [mx, my] of mirrorPoints(px, py)) {
        if (mx < 0 || my < 0 || mx >= gridW || my >= gridH) continue;
        if (pixels[my * gridW + mx] !== value) return true;
      }
    }
    return false;
  }

  function fillWouldChange(x, y, replacement) {
    if (x < 0 || y < 0 || x >= gridW || y >= gridH) return false;
    if (!widePixel) return pixels[y * gridW + x] !== replacement;
    const xx = x - (x % 2);
    const idx0 = y * gridW + xx;
    if (pixels[idx0] !== replacement) return true;
    if (xx + 1 < gridW && pixels[idx0 + 1] !== replacement) return true;
    return false;
  }

  function lineWouldChange(x0, y0, x1, y1, value) {
    for (const [x, y] of bresenham(x0, y0, x1, y1)) if (wouldStampChange(x, y, value)) return true;
    return false;
  }

  function rectWouldChange(x0, y0, x1, y1, value, opts) {
    const fill = !!opts?.fill;
    const left = Math.min(x0, x1);
    const right = Math.max(x0, x1);
    const top = Math.min(y0, y1);
    const bottom = Math.max(y0, y1);
    if (fill) {
      for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) if (wouldStampChange(x, y, value)) return true;
      return false;
    }
    for (let x = left; x <= right; x++) if (wouldStampChange(x, top, value) || wouldStampChange(x, bottom, value)) return true;
    for (let y = top; y <= bottom; y++) if (wouldStampChange(left, y, value) || wouldStampChange(right, y, value)) return true;
    return false;
  }

  function circleWouldChange(x0, y0, x1, y1, value, opts) {
    const fill = !!opts?.fill;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const r = Math.max(0, Math.floor(Math.sqrt(dx * dx + dy * dy)));
    if (r === 0) return wouldStampChange(x0, y0, value);
    if (!fill) {
      for (const [x, y] of previewCircle(x0, y0, x1, y1)) if (wouldStampChange(x, y, value)) return true;
      return false;
    }

    let x = r;
    let y = 0;
    let err = 1 - x;
    while (x >= y) {
      if (hSpanWouldChange(x0 - x, x0 + x, y0 + y, value)) return true;
      if (hSpanWouldChange(x0 - x, x0 + x, y0 - y, value)) return true;
      if (hSpanWouldChange(x0 - y, x0 + y, y0 + x, value)) return true;
      if (hSpanWouldChange(x0 - y, x0 + y, y0 - x, value)) return true;

      y++;
      if (err < 0) err += 2 * y + 1;
      else {
        x--;
        err += 2 * (y - x) + 1;
      }
    }
    return false;
  }

  function hSpanWouldChange(x0, x1, y, value) {
    const left = Math.min(x0, x1);
    const right = Math.max(x0, x1);
    for (let x = left; x <= right; x++) if (wouldStampChange(x, y, value)) return true;
    return false;
  }

  function drawLine(x0, y0, x1, y1, value) {
    let changed = false;
    for (const [x, y] of bresenham(x0, y0, x1, y1)) changed = stamp(x, y, value) || changed;
    return changed;
  }

  function drawRect(x0, y0, x1, y1, value, opts) {
    const fill = !!opts?.fill;
    const left = Math.min(x0, x1);
    const right = Math.max(x0, x1);
    const top = Math.min(y0, y1);
    const bottom = Math.max(y0, y1);
    let changed = false;

    if (fill) {
      for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) changed = stamp(x, y, value) || changed;
      return changed;
    }

    for (let x = left; x <= right; x++) {
      changed = stamp(x, top, value) || changed;
      changed = stamp(x, bottom, value) || changed;
    }
    for (let y = top; y <= bottom; y++) {
      changed = stamp(left, y, value) || changed;
      changed = stamp(right, y, value) || changed;
    }
    return changed;
  }

  function drawCircle(x0, y0, x1, y1, value, opts) {
    const fill = !!opts?.fill;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const r = Math.max(0, Math.floor(Math.sqrt(dx * dx + dy * dy)));
    let changed = false;
    if (r === 0) return stamp(x0, y0, value);

    let x = r;
    let y = 0;
    let err = 1 - x;

    while (x >= y) {
      if (fill) {
        changed = drawHSpan(x0 - x, x0 + x, y0 + y, value) || changed;
        changed = drawHSpan(x0 - x, x0 + x, y0 - y, value) || changed;
        changed = drawHSpan(x0 - y, x0 + y, y0 + x, value) || changed;
        changed = drawHSpan(x0 - y, x0 + y, y0 - x, value) || changed;
      } else {
        changed = stamp(x0 + x, y0 + y, value) || changed;
        changed = stamp(x0 + y, y0 + x, value) || changed;
        changed = stamp(x0 - y, y0 + x, value) || changed;
        changed = stamp(x0 - x, y0 + y, value) || changed;
        changed = stamp(x0 - x, y0 - y, value) || changed;
        changed = stamp(x0 - y, y0 - x, value) || changed;
        changed = stamp(x0 + y, y0 - x, value) || changed;
        changed = stamp(x0 + x, y0 - y, value) || changed;
      }

      y++;
      if (err < 0) err += 2 * y + 1;
      else {
        x--;
        err += 2 * (y - x) + 1;
      }
    }
    return changed;
  }

  function drawHSpan(x0, x1, y, value) {
    const left = Math.min(x0, x1);
    const right = Math.max(x0, x1);
    let changed = false;
    for (let x = left; x <= right; x++) changed = stamp(x, y, value) || changed;
    return changed;
  }

  function previewLine(x0, y0, x1, y1) {
    const out = [];
    for (const [x, y] of bresenham(x0, y0, x1, y1)) out.push([x, y]);
    return out;
  }

  function previewRect(x0, y0, x1, y1) {
    const left = Math.min(x0, x1);
    const right = Math.max(x0, x1);
    const top = Math.min(y0, y1);
    const bottom = Math.max(y0, y1);
    const out = [];
    for (let x = left; x <= right; x++) {
      out.push([x, top], [x, bottom]);
    }
    for (let y = top; y <= bottom; y++) {
      out.push([left, y], [right, y]);
    }
    return out;
  }

  function previewCircle(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const r = Math.max(0, Math.floor(Math.sqrt(dx * dx + dy * dy)));
    if (r === 0) return [[x0, y0]];

    const out = [];
    let x = r;
    let y = 0;
    let err = 1 - x;
    while (x >= y) {
      out.push([x0 + x, y0 + y]);
      out.push([x0 + y, y0 + x]);
      out.push([x0 - y, y0 + x]);
      out.push([x0 - x, y0 + y]);
      out.push([x0 - x, y0 - y]);
      out.push([x0 - y, y0 - x]);
      out.push([x0 + y, y0 - x]);
      out.push([x0 + x, y0 - y]);

      y++;
      if (err < 0) err += 2 * y + 1;
      else {
        x--;
        err += 2 * (y - x) + 1;
      }
    }
    return out;
  }

  function* bresenham(x0, y0, x1, y1) {
    let dx = Math.abs(x1 - x0);
    let sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0);
    let sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;

    while (true) {
      yield [x, y];
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  function floodFill(startX, startY, replacement) {
    if (startX < 0 || startY < 0) return false;
    if (!widePixel) return floodFillNormal(startX, startY, replacement);
    return floodFillWide(startX, startY, replacement);
  }

  function floodFillNormal(startX, startY, replacement) {
    const startIdx = startY * gridW + startX;
    const target = pixels[startIdx];
    if (target === replacement) return false;

    const stack = [startIdx];
    let changed = false;

    while (stack.length) {
      const idx = stack.pop();
      if (pixels[idx] !== target) continue;
      pixels[idx] = replacement;
      changed = true;

      const x = idx % gridW;
      const y = (idx / gridW) | 0;
      if (x > 0) stack.push(idx - 1);
      if (x + 1 < gridW) stack.push(idx + 1);
      if (y > 0) stack.push(idx - gridW);
      if (y + 1 < gridH) stack.push(idx + gridW);
    }
    return changed;
  }

  function floodFillWide(startX, startY, replacement) {
    const pairW = Math.ceil(gridW / 2);
    const px0 = Math.floor(startX / 2);
    const py0 = startY;

    const evenX0 = px0 * 2;
    const startIdx = py0 * gridW + evenX0;
    const target = pixels[startIdx];
    if (target === replacement) return false;

    const stack = [py0 * pairW + px0];
    let changed = false;

    while (stack.length) {
      const pidx = stack.pop();
      const px = pidx % pairW;
      const py = (pidx / pairW) | 0;
      const evenX = px * 2;
      const base = py * gridW + evenX;
      if (py < 0 || py >= gridH) continue;
      if (pixels[base] !== target) continue;

      if (pixels[base] !== replacement) {
        pixels[base] = replacement;
        changed = true;
      }
      if (evenX + 1 < gridW && pixels[base + 1] !== replacement) {
        pixels[base + 1] = replacement;
        changed = true;
      }

      if (px > 0) stack.push(pidx - 1);
      if (px + 1 < pairW) stack.push(pidx + 1);
      if (py > 0) stack.push(pidx - pairW);
      if (py + 1 < gridH) stack.push(pidx + pairW);
    }
    return changed;
  }

  function render() {
    // Background preview.
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = isDarkTheme(theme) ? rgbaFromHex(bgColor, 0.22) : bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Pixels (display view depends on mode).
    const sp = getActiveSprite();
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const idx = y * gridW + x;
        const p = sp ? displayPixelIndexAt(sp, idx) : pixels[idx];
        if (p === TRANSPARENT) continue;
        ctx.fillStyle = C64[p].hex;
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }

    // Mirror axes preview.
    if (transformMode && (mirrorX || mirrorY)) {
      ctx.save();
      ctx.strokeStyle = "rgba(106,161,255,.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      if (mirrorX) {
        const x = (Math.floor(gridW / 2) * zoom) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, gridH * zoom);
        ctx.stroke();
      }
      if (mirrorY) {
        const y = (Math.floor(gridH / 2) * zoom) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(gridW * zoom, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Selection overlay.
    if (tool === "select" && hasSelection() && !(pasteMode && copyBuffer)) {
      const { x0, y0, x1, y1 } = normalizedSelection();
      if (x1 >= x0 && y1 >= y0) {
        const w = (x1 - x0 + 1) * zoom;
        const h = (y1 - y0 + 1) * zoom;
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(0,0,0,.85)";
        ctx.strokeRect(x0 * zoom + 0.5, y0 * zoom + 0.5, w - 1, h - 1);
        ctx.strokeStyle = "rgba(255,255,255,.85)";
        ctx.strokeRect(x0 * zoom + 1.5, y0 * zoom + 1.5, w - 3, h - 3);
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    // Paste preview.
    if (tool === "select" && pasteMode && copyBuffer) {
      const originX = clampInt(pointer.x, 0, gridW - 1);
      const originY = clampInt(pointer.y, 0, gridH - 1);
      ctx.save();
      ctx.globalAlpha = 0.65;
      for (let y = 0; y < copyBuffer.h; y++) {
        for (let x = 0; x < copyBuffer.w; x++) {
          const v = copyBuffer.data[y * copyBuffer.w + x];
          if (v === TRANSPARENT) continue;
          const px = originX + x;
          const py = originY + y;
          if (px < 0 || py < 0 || px >= gridW || py >= gridH) continue;
          ctx.fillStyle = C64[v].hex;
          ctx.fillRect(px * zoom, py * zoom, zoom, zoom);
        }
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(0,0,0,.75)";
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(originX * zoom + 0.5, originY * zoom + 0.5, copyBuffer.w * zoom - 1, copyBuffer.h * zoom - 1);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Preview for shapes.
    if (action.preview && action.preview.length) {
      const isErase = action.active && action.button === 2;
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = isErase ? "rgba(255,255,255,.35)" : C64[activePaletteIndex()].hex;
      for (const [x, y] of action.preview) {
        if (widePixel) {
          const xx = x - (x % 2);
          ctx.fillRect(xx * zoom, y * zoom, zoom * 2, zoom);
        } else {
          ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
        }
      }
      // Contrast outline (visible even on white).
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
      for (const [x, y] of action.preview) {
        const xx = widePixel ? x - (x % 2) : x;
        const w = widePixel ? 2 : 1;
        const px = xx * zoom;
        const py = y * zoom;
        ctx.strokeStyle = "rgba(0,0,0,.70)";
        ctx.strokeRect(px + 0.5, py + 0.5, zoom * w - 1, zoom - 1);
        ctx.strokeStyle = "rgba(255,255,255,.85)";
        ctx.strokeRect(px + 1.5, py + 1.5, zoom * w - 3, zoom - 3);
      }
      ctx.restore();
    }

    // Grid overlay (keep it visible even at smaller zoom).
    if (showGrid) {
      const a = zoom >= 10 ? 0.11 : zoom >= 6 ? 0.14 : 0.18;
      ctx.save();
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= gridW; x++) {
        const px = x * zoom + 0.5;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, gridH * zoom);
      }
      for (let y = 0; y <= gridH; y++) {
        const py = y * zoom + 0.5;
        ctx.moveTo(0, py);
        ctx.lineTo(gridW * zoom, py);
      }
      // Two-pass stroke for contrast on any background.
      ctx.strokeStyle = `rgba(0,0,0,${a})`;
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.85})`;
      ctx.stroke();
      ctx.restore();
    }

    // MC 8×8 cell grid (thicker). Independent toggle from the fine grid.
    if (grid8 && sp && isMcImage(sp)) {
      const a8 = zoom >= 10 ? 0.28 : zoom >= 6 ? 0.24 : 0.20;
      ctx.save();
      ctx.lineWidth = zoom >= 6 ? 2 : 1.5;
      ctx.beginPath();
      for (let x = 0; x <= gridW; x += 8) {
        const px = x * zoom + 0.5;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, gridH * zoom);
      }
      for (let y = 0; y <= gridH; y += 8) {
        const py = y * zoom + 0.5;
        ctx.moveTo(0, py);
        ctx.lineTo(gridW * zoom, py);
      }
      ctx.strokeStyle = `rgba(0,0,0,${a8})`;
      ctx.stroke();
      ctx.strokeStyle = isDarkTheme(theme) ? `rgba(255,45,45,${a8})` : `rgba(255,255,255,${a8})`;
      ctx.stroke();
      ctx.restore();
    }

    // Sprite boundaries (only in sprite mode).
    if (!customRes && spritesX > 1) {
      ctx.strokeStyle = "rgba(106,161,255,.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let sx = 1; sx < spritesX; sx++) {
        const px = sx * SPRITE_W * zoom + 0.5;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, gridH * zoom);
      }
      ctx.stroke();
    }
    if (!customRes && spritesY > 1) {
      ctx.strokeStyle = "rgba(106,161,255,.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let sy = 1; sy < spritesY; sy++) {
        const py = sy * SPRITE_H * zoom + 0.5;
        ctx.moveTo(0, py);
        ctx.lineTo(gridW * zoom, py);
      }
      ctx.stroke();
    }

    // Cursor preview.
    if (pointer.over && pointer.x >= 0 && pointer.y >= 0) {
      const w = widePixel ? 2 : 1;
      const cx = pointer.x * zoom;
      const cy = pointer.y * zoom;
      ctx.fillStyle = "rgba(255,255,255,.12)";
      ctx.fillRect(cx, cy, zoom * w, zoom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0,0,0,.55)";
      ctx.strokeRect(cx + 0.5, cy + 0.5, zoom * w - 1, zoom - 1);
      ctx.strokeStyle = "rgba(255,255,255,.80)";
      ctx.strokeRect(cx + 1.5, cy + 1.5, zoom * w - 3, zoom - 3);
    }

    const cursor = pointer.over && pointer.x >= 0 && pointer.y >= 0 ? `x:${pointer.x} y:${pointer.y}` : "—";
    const editLayer = getEditLayer();
    const layerLabel =
      editLayer === "png" ? "" : editLayer === "mc" ? t("layer_mc") : editLayer === "out" ? t("layer_out") : t("layer_cheat");
    const modeLabel = `${widePixel ? "wide (2×)" : "normal"} | ${layerLabel || t("layer_cheat")}`;
    const canvasLabel = customRes ? `${gridW}×${gridH}px` : `${spritesX}×${spritesY} sprite (${gridW}×${gridH})`;
    const toolLabel = toolName(tool);
    const slotKey = sp && isMcImage(sp) && activeSlot === "out" ? "BG" : slotName(activeSlot);
    let slotLabel = `${slotKey} (${C64[activePaletteIndex()].name})`;
    if (sp && isMcImage(sp) && editLayer === "mc" && pointer.over && pointer.x >= 0 && pointer.y >= 0) {
      const c64 = ensureMcImageCells(sp);
      const ci = mcCellIndexAt(sp, pointer.x, pointer.y);
      const a = C64[clampInt(c64.cellA[ci] | 0, 0, 15)].name;
      const b = C64[clampInt(c64.cellB[ci] | 0, 0, 15)].name;
      const c = C64[clampInt(c64.cellC[ci] | 0, 0, 15)].name;
      slotLabel += ` | cell A:${a} B:${b} C:${c}`;
    }

    setStatus("statusCursor", cursor);
    setStatus("statusTool", toolLabel);
    setStatus("statusColor", slotLabel);
    setStatus("statusMode", modeLabel);
    setStatus("statusCanvas", canvasLabel);
  }

  function hasSelection() {
    if (selection.active) return true;
    const { x0, y0, x1, y1 } = normalizedSelection();
    return x1 >= x0 && y1 >= y0;
  }

  function clearSelection() {
    selection.active = false;
    selection.x0 = 0;
    selection.y0 = 0;
    selection.x1 = -1;
    selection.y1 = -1;
  }

  function normalizeSelection() {
    const n = normalizedSelection();
    selection.x0 = n.x0;
    selection.y0 = n.y0;
    selection.x1 = n.x1;
    selection.y1 = n.y1;
  }

  function normalizedSelection() {
    const x0 = Math.min(selection.x0, selection.x1);
    const x1 = Math.max(selection.x0, selection.x1);
    const y0 = Math.min(selection.y0, selection.y1);
    const y1 = Math.max(selection.y0, selection.y1);
    return { x0, y0, x1, y1 };
  }

  function copySelection() {
    normalizeSelection();
    const { x0, y0, x1, y1 } = normalizedSelection();
    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;
    if (w <= 0 || h <= 0) return;
    const sp = getActiveSprite();
    const view = sp ? compositeSpritePixels(sp) : pixels;
    const data = new Uint8Array(w * h).fill(TRANSPARENT);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        data[y * w + x] = view[(y0 + y) * gridW + (x0 + x)];
      }
    }
    addToLibrary({ w, h, data });
  }

  function pasteAt(x, y, opts = {}) {
    if (!copyBuffer) return false;
    if (!canPasteToCurrentLayer()) return false;
    const erase = !!opts.erase;
    const eraseValue = currentEraseValue();
    let changed = false;
    for (let yy = 0; yy < copyBuffer.h; yy++) {
      for (let xx = 0; xx < copyBuffer.w; xx++) {
        const v = copyBuffer.data[yy * copyBuffer.w + xx];
        if (v === TRANSPARENT) continue;
        changed = setPixelRaw(x + xx, y + yy, erase ? eraseValue : v) || changed;
      }
    }
    return changed;
  }

  function addToLibrary(item) {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    library.unshift({ id, ...item });
    activeLibraryId = id;
    copyBuffer = { w: item.w, h: item.h, data: item.data.slice() };
    pasteMode = true;
    setTool("select");
    renderLibrary();
    scheduleSave();
    render();
  }

  function swatchToSprite(it) {
    const id = makeId("sprite");
    const name = `Sprite ${sprites.length + 1}`;
    const cheat = it.data.slice();
    const sp = { id, name, w: it.w, h: it.h, pixels: cheat };
    sp.c64 = {
      w: it.w,
      h: it.h,
      slots: { fg: colorSlots.fg, mc1: colorSlots.mc1, mc2: colorSlots.mc2, out: colorSlots.out },
      mc: new Uint8Array(it.w * it.h).fill(0),
      out: new Uint8Array(it.w * it.h).fill(0),
      cheat,
      lastLayer: "cheat",
      lastNonCheatLayer: "mc",
    };
    sprites.push(sp);
    setActiveSprite(id);
  }

  function setActiveLibrary(id) {
    const it = library.find((x) => x.id === id);
    if (!it) return;
    activeLibraryId = id;
    copyBuffer = { w: it.w, h: it.h, data: it.data.slice() };
    pasteMode = true;
    setTool("select");
    renderLibrary();
    render();
  }

  function removeFromLibrary(id) {
    const idx = library.findIndex((x) => x.id === id);
    if (idx < 0) return;
    library.splice(idx, 1);
    if (activeLibraryId === id) {
      activeLibraryId = library[0]?.id ?? null;
      if (activeLibraryId) {
        const it = library.find((x) => x.id === activeLibraryId);
        copyBuffer = it ? { w: it.w, h: it.h, data: it.data.slice() } : null;
        pasteMode = !!copyBuffer;
      } else {
        copyBuffer = null;
        pasteMode = false;
      }
    }
    renderLibrary();
    scheduleSave();
    render();
  }

  function renderLibrary() {
    if (!libraryListEl) return;
    libraryListEl.innerHTML = "";
    if (library.length === 0) {
      const empty = document.createElement("div");
      empty.className = "hint";
      empty.textContent = t("swatches_empty");
      libraryListEl.appendChild(empty);
      return;
    }

    for (const it of library) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "libItem";
      btn.title = "Kliknij, aby wkleić";
      btn.setAttribute("aria-pressed", it.id === activeLibraryId ? "true" : "false");
      btn.addEventListener("click", () => setActiveLibrary(it.id));

      const thumb = document.createElement("div");
      thumb.className = "libThumb";
      const c = document.createElement("canvas");
      c.width = it.w;
      c.height = it.h;
      drawThumb(c, it);
      thumb.appendChild(c);

      const row = document.createElement("div");
      row.className = "libRow";
      const meta = document.createElement("div");
      meta.className = "libMeta";
      meta.textContent = `${it.w}×${it.h}`;

      const actions = document.createElement("div");
      actions.className = "libActions";

      const toSprite = document.createElement("button");
      toSprite.type = "button";
      toSprite.className = "iconBtn";
      toSprite.title = "-> Sprite";
      toSprite.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        swatchToSprite(it);
      });
      toSprite.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 7h18v10H3V7zm2 2v6h14V9H5z"/><path fill="currentColor" d="M12 2l4 4h-3v4h-2V6H8l4-4z"/></svg>';

      const del = document.createElement("button");
      del.type = "button";
      del.className = "iconBtn";
      del.title = "Usuń (Shift: bez potwierdzenia)";
      del.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.shiftKey) {
          const ok = await askConfirm(`${t("delete_confirm")}?`, {
            title: t("delete_swatch_title"),
            okText: t("delete_ok"),
          });
          if (!ok) return;
        }
        removeFromLibrary(it.id);
      });
      del.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"/></svg>';

      actions.appendChild(toSprite);
      actions.appendChild(del);
      row.appendChild(meta);
      row.appendChild(actions);

      btn.appendChild(thumb);
      btn.appendChild(row);
      libraryListEl.appendChild(btn);
    }
  }

  function drawThumb(canvasEl, it) {
    const cctx = canvasEl.getContext("2d", { alpha: true });
    cctx.save();
    cctx.setTransform(1, 0, 0, 1, 0, 0);
    cctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    const img = cctx.createImageData(it.w, it.h);
    for (let i = 0; i < it.data.length; i++) {
      const v = it.data[i];
      const j = i * 4;
      if (v === TRANSPARENT) {
        img.data[j + 3] = 0;
      } else {
        const [r, g, b] = C64[v].rgb;
        img.data[j + 0] = r;
        img.data[j + 1] = g;
        img.data[j + 2] = b;
        img.data[j + 3] = 255;
      }
    }
    cctx.putImageData(img, 0, 0);
    cctx.restore();
  }

  function thumbBgColor() {
    return bgColor;
  }

  function syncThumbBgVar() {
    document.documentElement.style.setProperty("--thumb-bg", thumbBgColor());
  }

  function roll(dx, dy) {
    if (!dx && !dy) return;
    pushUndo();
    const next = new Uint8Array(gridW * gridH).fill(TRANSPARENT);
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const nx = wrapIndex(x + dx, gridW);
        const ny = wrapIndex(y + dy, gridH);
        next[ny * gridW + nx] = pixels[y * gridW + x];
      }
    }
    pixels = next;
    updateHistoryButtons();
    syncActiveSpriteFromCanvas();
    render();
  }

  function initSprites() {
    const id = makeId("sprite");
    const sp = { id, name: "Sprite 1", w: gridW, h: gridH, pixels: new Uint8Array(gridW * gridH).fill(TRANSPARENT) };
    sp.c64 = {
      w: gridW,
      h: gridH,
      slots: { fg: colorSlots.fg, mc1: colorSlots.mc1, mc2: colorSlots.mc2, out: colorSlots.out },
      mc: new Uint8Array(gridW * gridH).fill(0),
      out: new Uint8Array(gridW * gridH).fill(0),
      cheat: sp.pixels,
      lastLayer: "mc",
      lastNonCheatLayer: "mc",
    };
    sprites.push(sp);
    activeSpriteId = id;
    setC64Layer("mc", { resetHistory: true });
  }

  function addSprite() {
    const id = makeId("sprite");
    const name = `Sprite ${sprites.length + 1}`;
    const w = gridW;
    const h = gridH;
    const cheat = new Uint8Array(w * h).fill(TRANSPARENT);
    const sp = { id, kind: DOC_KIND_SPRITE, name, w, h, pixels: cheat };
    sp.c64 = {
      w,
      h,
      slots: { fg: colorSlots.fg, mc1: colorSlots.mc1, mc2: colorSlots.mc2, out: colorSlots.out },
      mc: new Uint8Array(w * h).fill(0),
      out: new Uint8Array(w * h).fill(0),
      cheat,
      lastLayer: "mc",
      lastNonCheatLayer: "mc",
    };
    sprites.push(sp);
    scheduleSave();
    setActiveSprite(id);
  }

  function addMcImage() {
    const id = makeId("mcimg");
    const name = `MC ${sprites.length + 1}`;
    const w = 320;
    const h = 200;
    const cheat = new Uint8Array(w * h).fill(TRANSPARENT);
    const sp = { id, kind: DOC_KIND_MC_IMAGE, name, w, h, pixels: cheat };
    sp.c64 = {
      w,
      h,
      slots: { fg: colorSlots.fg, mc1: colorSlots.mc1, mc2: colorSlots.mc2, out: colorSlots.out, bg: colorSlots.out },
      mc: new Uint8Array(w * h).fill(0),
      out: new Uint8Array(w * h).fill(0),
      cheat,
      lastLayer: "mc",
      lastNonCheatLayer: "mc",
    };
    sp.vis = { mc: true, out: false, cheat: true };
    sprites.push(sp);
    scheduleSave();
    setActiveSprite(id);
  }

  function duplicateSprite(id) {
    const sp = sprites.find((s) => s.id === id);
    if (!sp) return;
    const nextId = makeId("sprite");
    const name = `${sp.name} copy`;
    const dup = { id: nextId, kind: sp.kind || DOC_KIND_SPRITE, name, w: sp.w, h: sp.h, pixels: sp.pixels.slice() };
    if (sp.c64) {
      const c64 = ensureC64Layers(sp);
      dup.c64 = {
        w: sp.w,
        h: sp.h,
        slots: { ...c64.slots },
        mc: c64.mc.slice(),
        out: c64.out.slice(),
        cheat: c64.cheat.slice(),
        lastLayer: c64.lastLayer || "mc",
        lastNonCheatLayer: c64.lastNonCheatLayer || "mc",
      };
    }
    sprites.push(dup);
    scheduleSave();
    setActiveSprite(nextId);
  }

  function removeSprite(id) {
    const idx = sprites.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const isActive = sprites[idx].id === activeSpriteId;
    sprites.splice(idx, 1);
    scheduleSave();
    if (sprites.length === 0) {
      addSprite();
      return;
    }
    if (isActive) {
      setActiveSprite(sprites[Math.max(0, idx - 1)].id);
    } else {
      renderSprites();
    }
  }

  function setActiveSprite(id) {
    const sp = sprites.find((s) => s.id === id);
    if (!sp) return;
    activeSpriteId = sp.id;
    gridW = sp.w;
    gridH = sp.h;
    if (!isMcImage(sp) && gridW % SPRITE_W === 0 && gridH % SPRITE_H === 0) {
      customRes = false;
      customResEl.checked = false;
      spritesX = clampInt(gridW / SPRITE_W, 1, 8);
      spritesY = clampInt(gridH / SPRITE_H, 1, 8);
      spritesXEl.value = String(spritesX);
      spritesYEl.value = String(spritesY);
    } else {
      customRes = true;
      customResEl.checked = true;
      customW = clampInt(gridW, 1, MAX_SIZE);
      customH = clampInt(gridH, 1, MAX_SIZE);
      customWEl.value = String(customW);
      customHEl.value = String(customH);
    }
    syncResUi();
    resizeCanvasOnly();
    ensureC64Layers(sp);
    syncSlotsFromSpriteIfNeeded();
    setC64Layer(sp.c64?.lastLayer || "mc", { resetHistory: true });
    renderSprites();
    scheduleSave();
  }

  function syncActiveSpriteFromCanvas() {
    const sp = sprites.find((s) => s.id === activeSpriteId);
    if (!sp) return;
    sp.w = gridW;
    sp.h = gridH;
    const layer = getEditLayer();
    const c64 = ensureC64Layers(sp);
    c64.w = gridW;
    c64.h = gridH;
    if (layer === "mc") c64.mc = pixels;
    else if (layer === "out") c64.out = pixels;
    else c64.cheat = pixels;
    sp.pixels = c64.cheat;
    renderSprites();
    scheduleSave();
  }

  function renderSprites() {
    if (!spriteListEl) return;
    spriteListEl.innerHTML = "";
    if (sprites.length === 0) {
      spriteInspectorEl.hidden = true;
      return;
    }

    renderSpriteInspector();

    for (const sp of sprites) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "libItem";
      item.title = "Kliknij, aby edytować";
      item.setAttribute("aria-pressed", sp.id === activeSpriteId ? "true" : "false");
      item.addEventListener("click", () => {
        setActiveSprite(sp.id);
      });

      const thumb = document.createElement("div");
      thumb.className = "libThumb";
      const c = document.createElement("canvas");
      c.width = sp.w;
      c.height = sp.h;
      drawThumb(c, { w: sp.w, h: sp.h, data: compositeSpritePixels(sp) });
      thumb.appendChild(c);

      const row = document.createElement("div");
      row.className = "libRow";
      const div = document.createElement("div");
      div.className = "libMeta";
      div.textContent = sp.name;
      if (isMcImage(sp)) div.textContent = `MC: ${sp.name}`;
      row.appendChild(div);

      item.appendChild(thumb);
      item.appendChild(row);
      spriteListEl.appendChild(item);
    }
  }

  function layerPixelsForInspector(sp, kind) {
    if (!sp) return new Uint8Array(0);
    if (kind === "png") return sp.pixels;
    const c64 = ensureC64Layers(sp);
    const slots = c64?.slots || colorSlots;
    const len = sp.w * sp.h;
    const out = new Uint8Array(len).fill(TRANSPARENT);
    if (kind === "mc") {
      const bg = isMcImage(sp) ? clampInt(slots.bg ?? slots.out, 0, 15) : null;
      for (let i = 0; i < len; i++) {
        const v = c64.mc[i] | 0;
        if (v === 1) out[i] = clampInt(slots.mc1, 0, 15);
        else if (v === 2) out[i] = clampInt(slots.mc2, 0, 15);
        else if (v === 3) out[i] = clampInt(slots.fg, 0, 15);
        else out[i] = bg === null ? TRANSPARENT : bg;
      }
      return out;
    }
    if (kind === "out") {
      for (let i = 0; i < len; i++) out[i] = c64.out[i] ? clampInt(slots.out, 0, 15) : TRANSPARENT;
      return out;
    }
    // cheat
    return c64.cheat;
  }

  function renderSpriteInspector() {
    const sp = getActiveSprite();
    if (!sp) {
      spriteInspectorEl.hidden = true;
      return;
    }

    spriteInspectorEl.hidden = false;
    ensureSpriteVis(sp);

    // Name.
    if (spriteInspectorNameEl.value !== sp.name) spriteInspectorNameEl.value = sp.name;

    // Preview.
    spriteInspectorCanvas.width = sp.w;
    spriteInspectorCanvas.height = sp.h;
    drawThumb(spriteInspectorCanvas, { w: sp.w, h: sp.h, data: compositeSpritePixels(sp) });

    // Layers list.
    spriteInspectorLayersEl.innerHTML = "";
    const editLayer = getEditLayer();

    const addLayerRow = (kind, label, hint, enabled, visible, pressed) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "layerRowItem";
      row.setAttribute("aria-pressed", pressed ? "true" : "false");
      row.setAttribute("aria-disabled", enabled ? "false" : "true");
      row.disabled = !enabled;

      row.addEventListener("click", (e) => {
        e.preventDefault();
        if (!enabled) return;
        if (kind === "mc") setC64Layer("mc", { resetHistory: false });
        else if (kind === "out") setC64Layer("out", { resetHistory: false });
        else setC64Layer("cheat", { resetHistory: false });
        scheduleSave();
        renderSprites();
        render();
      });

      const visBtn = document.createElement("button");
      visBtn.type = "button";
      visBtn.className = "iconBtn layerVisBtn";
      visBtn.title = visible ? "Hide layer" : "Show layer";
      visBtn.setAttribute("aria-pressed", visible ? "true" : "false");
      visBtn.disabled = !enabled;
      visBtn.innerHTML = visible
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5c5 0 9 5 9 7s-4 7-9 7-9-5-9-7 4-7 9-7zm0 2c-3.3 0-6.3 3.1-7 5 .7 1.9 3.7 5 7 5s6.3-3.1 7-5c-.7-1.9-3.7-5-7-5zm0 2.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5z"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M2 5.27L3.28 4l17 17-1.27 1.27-3.1-3.1A10.7 10.7 0 0 1 12 19c-5 0-9-5-9-7a12.9 12.9 0 0 1 3.1-4.5L2 5.27zm7.1 7.1A2.5 2.5 0 0 0 12 14.5c.4 0 .8-.1 1.1-.26l-4.0-4.0zm9.6 4.5L16.7 14a4.5 4.5 0 0 0-6.7-6.7L8.1 5.4A10.5 10.5 0 0 1 12 5c5 0 9 5 9 7 0 1.1-1.1 3-2.9 4.9z"/></svg>';
      visBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!enabled) return;
        const v = ensureSpriteVis(sp);
        if (kind === "mc") v.mc = !v.mc;
        else if (kind === "out") v.out = !v.out;
        else v.cheat = !v.cheat;
        scheduleSave();
        renderSprites();
        render();
      });

      const thumb = document.createElement("div");
      thumb.className = "layerRowThumb";
      const c = document.createElement("canvas");
      c.width = sp.w;
      c.height = sp.h;
      drawThumb(c, { w: sp.w, h: sp.h, data: layerPixelsForInspector(sp, kind) });
      thumb.appendChild(c);

      const grow = document.createElement("div");
      grow.className = "layerRowGrow";
      const lab = document.createElement("div");
      lab.className = "layerRowLabel";
      lab.textContent = label;
      const hi = document.createElement("div");
      hi.className = "layerRowHint";
      hi.textContent = hint;
      grow.appendChild(lab);
      grow.appendChild(hi);

      row.appendChild(visBtn);
      row.appendChild(thumb);
      row.appendChild(grow);
      spriteInspectorLayersEl.appendChild(row);
    };

    if (isMcImage(sp)) {
      addLayerRow("mc", "MC", "Bitmap (multicolor)", true, sp.vis.mc, editLayer === "mc");
      addLayerRow("cheat", "CHEAT", "Overlay (hires)", true, sp.vis.cheat, editLayer === "cheat");
    } else {
      addLayerRow("mc", "MC", "Sprite 1 (multicolor)", true, sp.vis.mc, editLayer === "mc");
      addLayerRow("out", "OUT", "Sprite 2 (outline)", true, sp.vis.out, editLayer === "out");
      addLayerRow("cheat", "CHEAT", "Overlay (hires)", true, sp.vis.cheat, editLayer === "cheat");
    }
  }

  function applyCollapseUi() {
    spritesBodyEl.hidden = uiState.spritesCollapsed;
    swatchesBodyEl.hidden = uiState.swatchesCollapsed;
    btnToggleSprites.setAttribute("aria-expanded", uiState.spritesCollapsed ? "false" : "true");
    btnToggleSwatches.setAttribute("aria-expanded", uiState.swatchesCollapsed ? "false" : "true");
  }

  // localStorage persistence
  function scheduleSave() {
    if (isHydrating) return;
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      saveState();
    }, 300);
  }

  function saveState() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(buildStateObject()));
    } catch (err) {
      // Quota / blocked storage / serialization errors.
      console.warn("[JurasEd] localStorage save failed:", err);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return false;
      const state = JSON.parse(raw);
      return hydrateFromStateObject(state);
    } catch (err) {
      console.warn("[JurasEd] localStorage load failed:", err);
      return false;
    }
  }

  function buildStateObject() {
    return {
      v: 1,
      ts: Date.now(),
      project: { name: projectName },
      ui: uiState,
      settings: {
        theme,
        lang,
        activeSlot,
        colorSlots,
        cheatColor,
        tool,
        zoom,
        bgColor,
        showGrid,
        grid8,
        widePixel,
        shapeFill,
        customRes,
        spritesX,
        spritesY,
        customW,
        customH,
        transformMode,
        mirrorX,
        mirrorY,
        pasteMode,
        activeLibraryId,
        activeSpriteId,
      },
      sprites: sprites.map((s) => ({
        id: s.id,
        kind: s.kind || DOC_KIND_SPRITE,
        name: s.name,
        w: s.w,
        h: s.h,
        rle: encodeRle(s.pixels),
        vis: s.vis,
        c64: s.c64
          ? {
              slots: s.c64.slots,
              mcRle: encodeRle(s.c64.mc),
              outRle: encodeRle(s.c64.out),
              cheatRle: encodeRle(s.c64.cheat),
              cellW: s.c64.cellW,
              cellH: s.c64.cellH,
              cellARle: s.c64.cellA ? encodeRle(s.c64.cellA) : null,
              cellBRle: s.c64.cellB ? encodeRle(s.c64.cellB) : null,
              cellCRle: s.c64.cellC ? encodeRle(s.c64.cellC) : null,
              lastLayer: s.c64.lastLayer,
              lastNonCheatLayer: s.c64.lastNonCheatLayer,
            }
          : null,
      })),
      swatches: library.map((x) => ({ id: x.id, w: x.w, h: x.h, rle: encodeRle(x.data) })),
    };
  }

  function hydrateFromStateObject(state) {
    if (!state || state.v !== 1) return false;
    isHydrating = true;

    if (state.project && typeof state.project.name === "string") {
      projectName = state.project.name.trim() || projectName;
    }

    if (state.ui) {
      uiState.spritesCollapsed = !!state.ui.spritesCollapsed;
      uiState.swatchesCollapsed = !!state.ui.swatchesCollapsed;
    }

    const s = state.settings || {};
    if (typeof s.theme === "string") theme = normalizeTheme(s.theme);
    if (typeof s.lang === "string") lang = s.lang === "en" ? "en" : "pl";
    if (typeof s.activeSlot === "string") activeSlot = s.activeSlot;
    if (s.colorSlots && typeof s.colorSlots === "object") {
      colorSlots.fg = clampInt(s.colorSlots.fg, 0, 15);
      colorSlots.mc1 = clampInt(s.colorSlots.mc1, 0, 15);
      colorSlots.mc2 = clampInt(s.colorSlots.mc2, 0, 15);
      colorSlots.out = clampInt(s.colorSlots.out, 0, 15);
    }
    cheatColor = clampInt(s.cheatColor ?? cheatColor, 0, 15);
    if (typeof s.tool === "string") tool = s.tool;
    zoom = clampInt(s.zoom, 4, 64);
    bgColor = typeof s.bgColor === "string" ? s.bgColor : bgColor;
    showGrid = s.showGrid !== undefined ? !!s.showGrid : showGrid;
    grid8 = s.grid8 !== undefined ? !!s.grid8 : grid8;
    widePixel = s.widePixel !== undefined ? !!s.widePixel : widePixel;
    shapeFill = s.shapeFill !== undefined ? !!s.shapeFill : shapeFill;
    customRes = s.customRes !== undefined ? !!s.customRes : customRes;
    spritesX = clampInt(s.spritesX ?? spritesX, 1, 8);
    spritesY = clampInt(s.spritesY ?? spritesY, 1, 8);
    customW = clampInt(s.customW ?? customW, 1, MAX_SIZE);
    customH = clampInt(s.customH ?? customH, 1, MAX_SIZE);
    transformMode = !!s.transformMode;
    mirrorX = !!s.mirrorX;
    mirrorY = !!s.mirrorY;
    pasteMode = !!s.pasteMode;
    activeLibraryId = s.activeLibraryId ?? null;
    activeSpriteId = s.activeSpriteId ?? null;

    zoomEl.value = String(zoom);
    bgColorEl.value = bgColor;
    showGridEl.checked = showGrid;
    grid8El.checked = grid8;
    widePixelEl.checked = widePixel;
    shapeFillEl.checked = shapeFill;
    customResEl.checked = customRes;
    spritesXEl.value = String(spritesX);
    spritesYEl.value = String(spritesY);
    customWEl.value = String(customW);
    customHEl.value = String(customH);
    btnTransform.setAttribute("aria-pressed", transformMode ? "true" : "false");
    transformOverlayEl.hidden = !transformMode;
    btnMirrorX.setAttribute("aria-pressed", mirrorX ? "true" : "false");
    btnMirrorY.setAttribute("aria-pressed", mirrorY ? "true" : "false");
    syncResUi();

    // sprites
    sprites.length = 0;
    if (Array.isArray(state.sprites)) {
      for (const sp of state.sprites) {
        if (!sp || !sp.id) continue;
        const w = clampInt(sp.w, 1, MAX_SIZE);
        const h = clampInt(sp.h, 1, MAX_SIZE);
        const pix = decodeRle(sp.rle, w * h);
        const kind = sp.kind === DOC_KIND_MC_IMAGE ? DOC_KIND_MC_IMAGE : DOC_KIND_SPRITE;
        const sprite = { id: sp.id, kind, name: sp.name || "Sprite", w, h, pixels: pix };
        if (sp.vis && typeof sp.vis === "object") sprite.vis = { mc: sp.vis.mc !== false, out: sp.vis.out !== false, cheat: sp.vis.cheat !== false };
        if (sp.c64 && typeof sp.c64 === "object") {
          const slots = sp.c64.slots || {};
          const mc = decodeRle(sp.c64.mcRle, w * h, 0);
          const out = decodeRle(sp.c64.outRle, w * h, 0);
          const cheat = decodeRle(sp.c64.cheatRle, w * h, TRANSPARENT);
          for (let i = 0; i < mc.length; i++) mc[i] = clampInt(mc[i], 0, 3);
          for (let i = 0; i < out.length; i++) out[i] = out[i] ? 1 : 0;
          for (let i = 0; i < cheat.length; i++) cheat[i] = cheat[i] === TRANSPARENT ? TRANSPARENT : clampInt(cheat[i], 0, 15);
          sprite.c64 = {
            w,
            h,
            slots: {
              fg: clampInt(slots.fg ?? colorSlots.fg, 0, 15),
              mc1: clampInt(slots.mc1 ?? colorSlots.mc1, 0, 15),
              mc2: clampInt(slots.mc2 ?? colorSlots.mc2, 0, 15),
              out: clampInt(slots.out ?? colorSlots.out, 0, 15),
              ...(kind === DOC_KIND_MC_IMAGE ? { bg: clampInt(slots.bg ?? slots.out ?? colorSlots.out, 0, 15) } : {}),
            },
            mc,
            out,
            cheat,
            cellW: kind === DOC_KIND_MC_IMAGE ? clampInt(sp.c64.cellW ?? ((w / 8) | 0), 1, 4096) : undefined,
            cellH: kind === DOC_KIND_MC_IMAGE ? clampInt(sp.c64.cellH ?? ((h / 8) | 0), 1, 4096) : undefined,
            cellA: kind === DOC_KIND_MC_IMAGE ? decodeRle(sp.c64.cellARle, ((w / 8) | 0) * ((h / 8) | 0), clampInt(colorSlots.mc1, 0, 15)) : undefined,
            cellB: kind === DOC_KIND_MC_IMAGE ? decodeRle(sp.c64.cellBRle, ((w / 8) | 0) * ((h / 8) | 0), clampInt(colorSlots.mc2, 0, 15)) : undefined,
            cellC: kind === DOC_KIND_MC_IMAGE ? decodeRle(sp.c64.cellCRle, ((w / 8) | 0) * ((h / 8) | 0), clampInt(colorSlots.fg, 0, 15)) : undefined,
            lastLayer: sp.c64.lastLayer || "mc",
            lastNonCheatLayer: sp.c64.lastNonCheatLayer || "mc",
          };
          if (kind === DOC_KIND_MC_IMAGE) ensureMcImageCells(sprite);
          sprite.pixels = sprite.c64.cheat;
        } else {
          // Legacy project: treat old PNG pixels as CHEAT layer by default.
          sprite.c64 = {
            w,
            h,
            slots: {
              fg: colorSlots.fg,
              mc1: colorSlots.mc1,
              mc2: colorSlots.mc2,
              out: colorSlots.out,
              ...(kind === DOC_KIND_MC_IMAGE ? { bg: colorSlots.out } : {}),
            },
            mc: new Uint8Array(w * h).fill(0),
            out: new Uint8Array(w * h).fill(0),
            cheat: sprite.pixels,
            ...(kind === DOC_KIND_MC_IMAGE
              ? {
                  cellW: (w / 8) | 0,
                  cellH: (h / 8) | 0,
                  cellA: new Uint8Array(((w / 8) | 0) * ((h / 8) | 0)).fill(clampInt(colorSlots.mc1, 0, 15)),
                  cellB: new Uint8Array(((w / 8) | 0) * ((h / 8) | 0)).fill(clampInt(colorSlots.mc2, 0, 15)),
                  cellC: new Uint8Array(((w / 8) | 0) * ((h / 8) | 0)).fill(clampInt(colorSlots.fg, 0, 15)),
                }
              : {}),
            lastLayer: "cheat",
            lastNonCheatLayer: "mc",
          };
          if (kind === DOC_KIND_MC_IMAGE) ensureMcImageCells(sprite);
        }
        sprites.push(sprite);
      }
    }
    if (sprites.length === 0) {
      isHydrating = false;
      return false;
    }
    if (!activeSpriteId || !sprites.find((x) => x.id === activeSpriteId)) activeSpriteId = sprites[0].id;
    setActiveSprite(activeSpriteId);

    // swatches
    library.length = 0;
    if (Array.isArray(state.swatches)) {
      for (const it of state.swatches) {
        if (!it || !it.id) continue;
        const w = clampInt(it.w, 1, MAX_SIZE);
        const h = clampInt(it.h, 1, MAX_SIZE);
        const data = decodeRle(it.rle, w * h);
        library.push({ id: it.id, w, h, data });
      }
    }
    if (!activeLibraryId || !library.find((x) => x.id === activeLibraryId)) activeLibraryId = library[0]?.id ?? null;
    if (activeLibraryId) {
      const it = library.find((x) => x.id === activeLibraryId);
      if (it) copyBuffer = { w: it.w, h: it.h, data: it.data.slice() };
    }

    applyCollapseUi();
    applyTheme(theme);
    applyLanguage();
    ensureProjectName();
    syncProjectNameUi();
    syncLsInfo();
    syncSlotUi();
    setActiveSlot(activeSlot);
    setTool(tool);
    updateToolButtons();
    renderSprites();
    renderLibrary();
    render();
    isHydrating = false;
    return true;
  }

  function syncProjectNameUi() {
    if (projectNameEl.value !== projectName) projectNameEl.value = projectName;
    document.title = projectName ? `JurasEd — ${projectName}` : "JurasEd";
  }

  let lsInfoTimer = null;
  function flashLsInfo(text) {
    syncLsInfo(text);
    if (lsInfoTimer) clearTimeout(lsInfoTimer);
    lsInfoTimer = setTimeout(() => {
      lsInfoTimer = null;
      syncLsInfo();
    }, 900);
  }

  function syncLsInfo(extra) {
    const base = `${t("ls_base")} (${LS_KEY})`;
    lsInfoEl.textContent = extra ? `${base} • ${extra}` : base;
  }

  function applyLanguage() {
    document.documentElement.lang = lang === "en" ? "en" : "pl";
    btnLang.textContent = (lang === "en" ? "EN" : "PL");
    btnLang.title = t("lang_title");
    keysTitle.textContent = t("hotkeys");
    projectNameEl.placeholder = t("project_placeholder");
    confirmTitle.textContent = t("confirm");
    btnConfirmCancel.textContent = t("cancel");
    btnConfirmOk.textContent = t("ok");
    for (const node of document.querySelectorAll("[data-i18n]")) {
      const k = node.getAttribute("data-i18n");
      if (!k) continue;
      node.textContent = t(k);
    }
    renderHotkeys();
    if (ioOpen) renderIO();
    syncModeUi();
    syncLsInfo();
    maybeTranslateDefaultProjectName();
    renderLibrary();
    renderSprites();
  }

  function ensureProjectName() {
    if (projectName && projectName.trim()) return;
    projectName = t("default_collection");
    if (projectNameEl.value !== projectName) projectNameEl.value = projectName;
  }

  function isDefaultProjectName(name) {
    const n = (name || "").trim();
    if (!n) return true;
    const pl = I18N.pl.default_collection;
    const en = I18N.en.default_collection;
    return n === pl || n === en;
  }

  function maybeTranslateDefaultProjectName() {
    if (!isDefaultProjectName(projectName)) return;
    const next = t("default_collection");
    if (projectName === next) return;
    projectName = next;
    syncProjectNameUi();
    scheduleSave();
  }

  function normalizeTheme(value) {
    if (value === "dark") return "dark-hell";
    if (value === "dark-hell" || value === "dark-candles" || value === "dark-plain" || value === "light") return value;
    return "light";
  }

  function isDarkTheme(value) {
    return typeof value === "string" && value.startsWith("dark");
  }

  function renderHotkeys() {
    const section = (titleKey, items) => {
      const lis = items
        .map(([k, v]) => `<li><kbd>${k}</kbd> — ${v}</li>`)
        .join("");
      return `<h3>${t(titleKey)}</h3><ul>${lis}</ul>`;
    };

    keysContent.innerHTML = [
      section("hk_colors", [["1–5", t("hk_colors_desc")]]),
      section("hk_layers", [
        ["M", t("hk_layer_mc")],
        ["O", t("hk_layer_out")],
        ["H", t("hk_layer_cheat")],
      ]),
      section("hk_vis", [
        ["Alt+M", t("hk_layer_mc")],
        ["Alt+O", t("hk_layer_out")],
        ["Alt+H", t("hk_layer_cheat")],
      ]),
      section("hk_tools", [
        ["P", t("hk_pen")],
        ["E", t("hk_eraser")],
        ["L", t("hk_line")],
        ["F", t("hk_fill")],
        ["R", t("hk_rect")],
        ["C", t("hk_circle")],
        ["Q", t("hk_select")],
      ]),
      section("hk_edit", [
        ["Ctrl+Z", t("hk_undo")],
        ["Ctrl+Y / Ctrl+Shift+Z", t("hk_redo")],
        ["Ctrl+C", t("hk_copy")],
        ["Ctrl+V", t("hk_paste")],
        ["Esc", t("hk_cancel")],
      ]),
      section("hk_view", [
        ["G", t("hk_grid")],
        ["S", t("hk_shape_fill")],
      ]),
      section("hk_transform", [
        ["T", t("hk_transform_mode")],
        ["X", t("hk_mirrorx")],
        ["Y", t("hk_mirrory")],
        ["Arrows", t("hk_roll")],
      ]),
      section("hk_scroll", [
        ["Wheel", t("hk_zoom")],
        ["Shift+Wheel", t("hk_shift_wheel")],
        ["Ctrl/Cmd+Wheel", t("hk_ctrl_wheel")],
      ]),
    ].join("");
  }

  // SpritePad (.spd) import/export (24×21 hardware sprites).
  // We export each sprite as two SPD sprites: MC (multicolor) + OUT (hires overlay).
  // Cheat layer is not part of SPD; it is ignored on export and kept transparent on import.
  const SPD_W = 24;
  const SPD_H = 21;
  const SPD_BITMAP_BYTES = 63;
  const SPD_SPRITE_BYTES = 64; // 63 bitmap + 1 attr
  const SPD_HEADER_BYTES = 9;

  function encodeSpdHiresBitmap(mask, w, ox, oy) {
    const out = new Uint8Array(SPD_BITMAP_BYTES);
    for (let y = 0; y < SPD_H; y++) {
      const rowOff = (oy + y) * w + ox;
      const dstOff = y * 3;
      for (let bx = 0; bx < 3; bx++) {
        let b = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = bx * 8 + bit;
          if (mask[rowOff + x]) b |= 1 << (7 - bit);
        }
        out[dstOff + bx] = b;
      }
    }
    return out;
  }

  function encodeSpdMulticolorBitmap(mc, w, ox, oy) {
    const out = new Uint8Array(SPD_BITMAP_BYTES);
    for (let y = 0; y < SPD_H; y++) {
      const rowOff = (oy + y) * w + ox;
      const dstOff = y * 3;
      const bits = new Uint8Array(24);
      for (let g = 0; g < 12; g++) {
        const x = g * 2;
        const v = clampInt(mc[rowOff + x] | 0, 0, 3);
        bits[x] = (v >> 1) & 1;
        bits[x + 1] = v & 1;
      }
      for (let bx = 0; bx < 3; bx++) {
        let b = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = bx * 8 + bit;
          if (bits[x]) b |= 1 << (7 - bit);
        }
        out[dstOff + bx] = b;
      }
    }
    return out;
  }

  function decodeSpdHiresBitmap(bytes63) {
    const out = new Uint8Array(SPD_W * SPD_H);
    for (let y = 0; y < SPD_H; y++) {
      const srcOff = y * 3;
      const dstOff = y * SPD_W;
      for (let bx = 0; bx < 3; bx++) {
        const b = bytes63[srcOff + bx] | 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = bx * 8 + bit;
          out[dstOff + x] = (b >> (7 - bit)) & 1 ? 1 : 0;
        }
      }
    }
    return out;
  }

  function decodeSpdMulticolorBitmap(bytes63) {
    const out = new Uint8Array(SPD_W * SPD_H);
    const rowBits = new Uint8Array(24);
    for (let y = 0; y < SPD_H; y++) {
      const srcOff = y * 3;
      const dstOff = y * SPD_W;
      for (let bx = 0; bx < 3; bx++) {
        const b = bytes63[srcOff + bx] | 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = bx * 8 + bit;
          rowBits[x] = (b >> (7 - bit)) & 1 ? 1 : 0;
        }
      }
      for (let g = 0; g < 12; g++) {
        const msb = rowBits[g * 2] | 0;
        const lsb = rowBits[g * 2 + 1] | 0;
        const v = (msb << 1) | lsb; // 0..3
        const x = g * 2;
        out[dstOff + x] = v;
        out[dstOff + x + 1] = v;
      }
    }
    return out;
  }

  function spriteTilesForSpd(sp) {
    if (!sp) return [];
    const w = clampInt(sp.w, 1, MAX_SIZE);
    const h = clampInt(sp.h, 1, MAX_SIZE);
    if (w % SPD_W !== 0 || h % SPD_H !== 0) return [];
    const tiles = [];
    const tx = (w / SPD_W) | 0;
    const ty = (h / SPD_H) | 0;
    for (let y = 0; y < ty; y++) for (let x = 0; x < tx; x++) tiles.push({ ox: x * SPD_W, oy: y * SPD_H });
    return tiles;
  }

  async function exportSpritePadSpd() {
    if (sprites.length === 0) return;
    const blocks = [];
    const skipped = [];
    for (const sp of sprites) {
      const tiles = spriteTilesForSpd(sp);
      if (tiles.length === 0) {
        skipped.push(`${sp.name} (${sp.w}x${sp.h})`);
        continue;
      }
      const c64 = ensureC64Layers(sp);
      const slots = c64?.slots || colorSlots;
      for (const tile of tiles) blocks.push({ sp, c64, slots, ...tile });
    }
    if (blocks.length === 0) {
      await showAlert("Brak sprite’ów 24×21 (lub wielokrotności) do eksportu SpritePad (.spd).", { title: "SpritePad" });
      return;
    }

    const maxSpdSprites = 256;
    const maxBlocks = Math.floor(maxSpdSprites / 2);
    const clipped = blocks.length > maxBlocks;
    const useBlocks = clipped ? blocks.slice(0, maxBlocks) : blocks;

    const numSprites = useBlocks.length * 2;
    const numAnims = 1;
    const totalBytes = SPD_HEADER_BYTES + numSprites * SPD_SPRITE_BYTES + numAnims * 4;
    const out = new Uint8Array(totalBytes);

    out[0] = "S".charCodeAt(0);
    out[1] = "P".charCodeAt(0);
    out[2] = "D".charCodeAt(0);
    out[3] = 2; // version (SpritePad 2.x)
    out[4] = (numSprites - 1) & 0xff;
    out[5] = (numAnims - 1) & 0xff;
    out[6] = 0; // bg (display-only)
    out[7] = clampInt(colorSlots.mc1, 0, 15);
    out[8] = clampInt(colorSlots.mc2, 0, 15);

    let p = SPD_HEADER_BYTES;
    for (const b of useBlocks) {
      const mcBytes = encodeSpdMulticolorBitmap(b.c64.mc, b.sp.w, b.ox, b.oy);
      out.set(mcBytes, p);
      out[p + SPD_BITMAP_BYTES] = (clampInt(b.slots.fg, 0, 15) & 0x0f) | 0x80; // multicolor
      p += SPD_SPRITE_BYTES;

      const outBytes = encodeSpdHiresBitmap(b.c64.out, b.sp.w, b.ox, b.oy);
      out.set(outBytes, p);
      out[p + SPD_BITMAP_BYTES] = (clampInt(b.slots.out, 0, 15) & 0x0f) | 0x10; // overlay
      p += SPD_SPRITE_BYTES;
    }

    const animOff = SPD_HEADER_BYTES + numSprites * SPD_SPRITE_BYTES;
    out[animOff + 0] = 0; // start
    out[animOff + 1] = Math.max(0, numSprites - 1) & 0xff; // end
    out[animOff + 2] = 6; // timer (arbitrary)
    out[animOff + 3] = 0; // flags

    const now = new Date();
    const stamp = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(
      now.getMinutes(),
    )}${pad2(now.getSeconds())}`;
    const blob = new Blob([out], { type: "application/octet-stream" });
    downloadBlob(blob, `jurased_spritepad_${numSprites}sprites_${stamp}.spd`);

    if (skipped.length || clipped) {
      const msg = [
        clipped ? `Uwaga: eksport ograniczony do ${maxBlocks} bloków (256 sprite’ów SpritePad).` : null,
        skipped.length ? `Pominięte (nie 24×21 / wielokrotność):\n- ${skipped.join("\n- ")}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");
      if (msg) console.warn("[JurasEd] SPD export:", msg);
    }
  }

  async function importSpritePadSpd(file) {
    let bytes;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      await showAlert("Nie udało się wczytać pliku .spd.", { title: "SpritePad" });
      return;
    }
    if (bytes.length < SPD_HEADER_BYTES) {
      await showAlert("Nieprawidłowy plik .spd.", { title: "SpritePad" });
      return;
    }
    const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
    if (sig !== "SPD") {
      await showAlert("To nie wygląda na plik SpritePad (.spd).", { title: "SpritePad" });
      return;
    }
    const version = bytes[3] | 0;
    const numSprites = (bytes[4] | 0) + 1;
    const numAnims = (bytes[5] | 0) + 1;
    const mc1 = clampInt(bytes[7] | 0, 0, 15);
    const mc2 = clampInt(bytes[8] | 0, 0, 15);
    const needed = SPD_HEADER_BYTES + numSprites * SPD_SPRITE_BYTES + numAnims * 4;
    if (bytes.length < needed) {
      await showAlert("Plik .spd jest ucięty lub nieprawidłowy.", { title: "SpritePad" });
      return;
    }
    if (version !== 2 && version !== 1 && version !== 3) {
      console.warn("[JurasEd] SPD: unknown version:", version);
    }

    colorSlots.mc1 = mc1;
    colorSlots.mc2 = mc2;
    syncSlotUi();
    syncPaletteSelection();

    const imported = [];
    let pendingBase = null;
    for (let i = 0; i < numSprites; i++) {
      const off = SPD_HEADER_BYTES + i * SPD_SPRITE_BYTES;
      const bmp = bytes.slice(off, off + SPD_BITMAP_BYTES);
      const attr = bytes[off + SPD_BITMAP_BYTES] | 0;
      const colorNib = attr & 0x0f;
      const isOverlay = (attr & 0x10) !== 0;
      const isMulti = (attr & 0x80) !== 0;

      if (isOverlay && pendingBase) {
        const mask = decodeSpdHiresBitmap(bmp);
        const c64 = ensureC64Layers(pendingBase);
        c64.out.set(mask);
        c64.slots.out = clampInt(colorNib, 0, 15);
        pendingBase = null;
        continue;
      }

      const id = makeId("sprite");
      const name = `Sprite ${sprites.length + imported.length + 1}`;
      const w = SPD_W;
      const h = SPD_H;
      const cheat = new Uint8Array(w * h).fill(TRANSPARENT);
      const sp = { id, name, w, h, pixels: cheat };
      sp.c64 = {
        w,
        h,
        slots: { fg: clampInt(colorSlots.fg, 0, 15), mc1, mc2, out: clampInt(colorSlots.out, 0, 15) },
        mc: new Uint8Array(w * h).fill(0),
        out: new Uint8Array(w * h).fill(0),
        cheat,
        lastLayer: "mc",
        lastNonCheatLayer: "mc",
      };
      sp.vis = { mc: true, out: true, cheat: false };

      if (isMulti) {
        sp.c64.mc = decodeSpdMulticolorBitmap(bmp);
        sp.c64.slots.fg = clampInt(colorNib, 0, 15);
      } else {
        sp.c64.out = decodeSpdHiresBitmap(bmp);
        sp.c64.slots.out = clampInt(colorNib, 0, 15);
      }

      sprites.push(sp);
      imported.push(sp);
      pendingBase = sp;
    }

    if (imported.length) {
      setActiveSprite(imported[0].id);
      saveState();
    }
  }

  function exportProject() {
    const json = JSON.stringify(buildStateObject());
    downloadText(json, "jurased_project.json", "application/json");
  }

  async function importProjectFile(file) {
    try {
      const text = await file.text();
      const state = JSON.parse(text);
      const ok = hydrateFromStateObject(state);
      if (!ok) await showAlert("Nieprawidłowy plik projektu.", { title: "Projekt" });
      else saveState();
    } catch {
      await showAlert("Nie udało się zaimportować projektu.", { title: "Projekt" });
    }
  }

  async function importPngAsSprite(file) {
    const img = await loadImageFromFile(file);
    const w = clampInt(img.naturalWidth || img.width, 1, MAX_SIZE);
    const h = clampInt(img.naturalHeight || img.height, 1, MAX_SIZE);
    const data = imageToC64Pixels(img, w, h);
    const id = makeId("sprite");
    const name = `Sprite ${sprites.length + 1}`;
    const cheat = data;
    const sp = { id, name, w, h, pixels: cheat };
    sp.c64 = {
      w,
      h,
      slots: { fg: colorSlots.fg, mc1: colorSlots.mc1, mc2: colorSlots.mc2, out: colorSlots.out },
      mc: new Uint8Array(w * h).fill(0),
      out: new Uint8Array(w * h).fill(0),
      cheat,
      lastLayer: "cheat",
      lastNonCheatLayer: "mc",
    };
    sprites.push(sp);
    setActiveSprite(id);
    saveState();
  }

  async function importPngAsSwatch(file) {
    const img = await loadImageFromFile(file);
    const w = clampInt(img.naturalWidth || img.width, 1, MAX_SIZE);
    const h = clampInt(img.naturalHeight || img.height, 1, MAX_SIZE);
    const data = imageToC64Pixels(img, w, h);
    addToLibrary({ w, h, data });
    saveState();
  }

  async function exportActiveSpritePng() {
    const sp = sprites.find((s) => s.id === activeSpriteId);
    if (!sp) return;
    const view = compositeSpritePixels(sp);
    const blob = await pixelsToPngBlob(view, sp.w, sp.h);
    downloadBlob(blob, `${sp.name.replaceAll(" ", "_")}.png`);
  }

  async function exportSpritesheetPng() {
    const list = sprites.slice();
    if (list.length === 0) return;

    const cellW = Math.max(...list.map((s) => s.w));
    const cellH = Math.max(...list.map((s) => s.h));
    const cols = Math.min(8, Math.max(1, Math.ceil(Math.sqrt(list.length))));
    const rows = Math.ceil(list.length / cols);

    const sheetW = cellW * cols;
    const sheetH = cellH * rows;

    const canvas = document.createElement("canvas");
    canvas.width = sheetW;
    canvas.height = sheetH;
    const ctx = canvas.getContext("2d", { alpha: true });
    const img = ctx.createImageData(sheetW, sheetH);

    // Init transparent.
    for (let i = 0; i < img.data.length; i += 4) img.data[i + 3] = 0;

    for (let i = 0; i < list.length; i++) {
      const sp = list[i];
      const col = i % cols;
      const row = (i / cols) | 0;
      const ox = col * cellW;
      const oy = row * cellH;

      const view = compositeSpritePixels(sp);
      for (let y = 0; y < sp.h; y++) {
        for (let x = 0; x < sp.w; x++) {
          const p = view[y * sp.w + x];
          if (p === TRANSPARENT) continue;
          const idx = (oy + y) * sheetW + (ox + x);
          const j = idx * 4;
          const [r, g, b] = C64[p].rgb;
          img.data[j + 0] = r;
          img.data[j + 1] = g;
          img.data[j + 2] = b;
          img.data[j + 3] = 255;
        }
      }
    }

    ctx.putImageData(img, 0, 0);

    const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
    if (!blob) return;
    const now = new Date();
    const stamp = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(
      now.getMinutes(),
    )}${pad2(now.getSeconds())}`;
    downloadBlob(blob, `jurased_spritesheet_${sheetW}x${sheetH}_${stamp}.png`);
  }

  function imageToC64Pixels(img, w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const cctx = c.getContext("2d", { willReadFrequently: true });
    cctx.clearRect(0, 0, w, h);
    cctx.drawImage(img, 0, 0, w, h);
    const { data } = cctx.getImageData(0, 0, w, h);
    const out = new Uint8Array(w * h).fill(TRANSPARENT);
    for (let i = 0; i < w * h; i++) {
      const j = i * 4;
      const a = data[j + 3];
      if (a < 128) {
        out[i] = TRANSPARENT;
        continue;
      }
      const r = data[j + 0];
      const g = data[j + 1];
      const b = data[j + 2];
      out[i] = nearestC64(r, g, b);
    }
    return out;
  }

  function nearestC64(r, g, b) {
    let best = 0;
    let bestD = Number.POSITIVE_INFINITY;
    for (let i = 0; i < C64.length; i++) {
      const [rr, gg, bb] = C64[i].rgb;
      const dr = r - rr;
      const dg = g - gg;
      const db = b - bb;
      const d = dr * dr + dg * dg + db * db;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function pixelsToPngBlob(pix, w, h) {
    return new Promise((resolve) => {
      const out = document.createElement("canvas");
      out.width = w;
      out.height = h;
      const octx = out.getContext("2d", { alpha: true });
      const img = octx.createImageData(w, h);
      for (let i = 0; i < pix.length; i++) {
        const p = pix[i];
        const j = i * 4;
        if (p === TRANSPARENT) {
          img.data[j + 3] = 0;
        } else {
          const [r, g, b] = C64[p].rgb;
          img.data[j + 0] = r;
          img.data[j + 1] = g;
          img.data[j + 2] = b;
          img.data[j + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      out.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  function downloadText(text, filename, mime) {
    const blob = new Blob([text], { type: mime });
    downloadBlob(blob, filename);
  }

  function downloadBlob(blob, filename) {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image load failed"));
      };
      img.src = url;
    });
  }

  function wireEvilCursor() {
    const onMove = (e) => {
      evilCursorX = e.clientX;
      evilCursorY = e.clientY;
      // Fast path: follow the pointer via transform (no layout).
      evilCursorEl.style.transform = `translate3d(${evilCursorX}px, ${evilCursorY}px, 0) translate(-50%,-50%)`;
      scheduleEvilCursorHitTest();
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener(
      "mouseleave",
      () => {
        evilCursorX = -9999;
        evilCursorY = -9999;
        evilCursorEl.style.transform = `translate3d(${evilCursorX}px, ${evilCursorY}px, 0) translate(-50%,-50%)`;
        setEvilCursorVisible(false);
      },
      { passive: true },
    );
    // Initial state.
    evilCursorEl.style.transform = `translate3d(${window.innerWidth / 2}px, ${window.innerHeight / 2}px, 0) translate(-50%,-50%)`;
    updateEvilCursorVisibility(true);
  }

  function isEvilThemeActive() {
    return theme === "dark-hell" || theme === "dark-candles";
  }

  function scheduleEvilCursorHitTest(force) {
    if (!isEvilThemeActive()) return;
    const now = performance.now();
    if (!force && now - evilCursorLastHitAt < 80) return; // ~12.5 Hz
    if (evilCursorHitRaf) return;
    evilCursorHitRaf = requestAnimationFrame(() => {
      evilCursorHitRaf = null;
      evilCursorLastHitAt = performance.now();
      updateEvilCursorVisibility();
    });
  }

  function setEvilCursorVisible(visible) {
    if (evilCursorVisible === visible) return;
    evilCursorVisible = visible;
    evilCursorEl.style.opacity = visible ? "1" : "0";
  }

  function updateEvilCursorVisibility(force) {
    if (!isEvilThemeActive()) {
      setEvilCursorVisible(false);
      return;
    }
    if (evilCursorX < 0 || evilCursorY < 0) {
      setEvilCursorVisible(false);
      return;
    }

    const rect = wrap.getBoundingClientRect();
    const overEditor = evilCursorX >= rect.left && evilCursorX <= rect.right && evilCursorY >= rect.top && evilCursorY <= rect.bottom;
    if (overEditor) {
      setEvilCursorVisible(false);
      return;
    }

    const hit = document.elementFromPoint(evilCursorX, evilCursorY);
    const overUiContainer = !!hit?.closest?.(".card, .panel, .topbar, .statusbar, .modal, .modal__card");
    const overInteractive = !!hit?.closest?.("button, a, input, select, textarea, [role='button'], .btn, .iconBtn, .overlayBtn");
    setEvilCursorVisible(!(overUiContainer || overInteractive));
    if (force) scheduleEvilCursorHitTest(true);
  }

  function applyTheme(next) {
    next = normalizeTheme(next);
    const root = document.documentElement;
    if (next === "light") delete root.dataset.theme;
    else root.dataset.theme = next;
    btnTheme.setAttribute("aria-pressed", next !== "light" ? "true" : "false");
    btnTheme.title = `Theme: ${next}`;
    setEvilEnabled(next === "dark-hell" || next === "dark-candles");
    updateEvilCursorVisibility(true);
    syncThumbBgVar();
  }

  function setEvilEnabled(enabled) {
    if (!fireCanvas) return;
    if (enabled) {
      if (fireRunning) return;
      fireRunning = true;
      evilSpinStart = performance.now();
      startEvilRenderer();
      return;
    }
    fireRunning = false;
    if (fireAnim) cancelAnimationFrame(fireAnim);
    fireAnim = null;
    if (fireOnResize) window.removeEventListener("resize", fireOnResize);
    fireOnResize = null;
    const ctx = fireCanvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, fireCanvas.width, fireCanvas.height);
  }

  function evilSpinAngle(now) {
    const periodMs = 18000;
    const t = ((now - evilSpinStart) % periodMs) / periodMs;
    return t * Math.PI * 2;
  }

  function rotX3d(y, z, a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return { y: y * c - z * s, z: y * s + z * c };
  }

  function rotY3d(x, z, a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return { x: x * c + z * s, z: -x * s + z * c };
  }

  function startEvilRenderer() {
    const ctx = fireCanvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const pickScale = () => {
      const s = Math.round(Math.min(window.innerWidth, window.innerHeight) / 240);
      return clampInt(s, 4, 7);
    };
    const scale = pickScale();
    const width = Math.max(140, Math.floor(window.innerWidth / scale));
    const height = Math.max(120, Math.floor(window.innerHeight / scale));
    fireCanvas.width = width;
    fireCanvas.height = height;

    let heatA = new Uint16Array(width * height);
    let heatB = new Uint16Array(width * height);
    const img = ctx.createImageData(width, height);
    const palette = buildFirePalette();
    const bottomSeed = new Uint16Array(width);
    for (let x = 0; x < width; x++) bottomSeed[x] = 170 + ((Math.random() * 85) | 0);
    let bottomTick = 0;

    const seedBlob = (arr, sx, sy, base, rand, radius) => {
      const r = radius;
      for (let yy = -r; yy <= r; yy++) {
        for (let xx = -r; xx <= r; xx++) {
          const x = sx + xx;
          const y = sy + yy;
          if (x < 1 || y < 1 || x >= width - 1 || y >= height - 1) continue;
          const d2 = xx * xx + yy * yy;
          if (d2 > r * r) continue;
          const idx = y * width + x;
          const v = base + ((Math.random() * rand) | 0);
          if (v > arr[idx]) arr[idx] = v;
        }
      }
    };

    const seedCursorFlame = (now, arr) => {
      if (!evilCursorVisible) return;
      const wv = Math.max(1, window.innerWidth);
      const hv = Math.max(1, window.innerHeight);
      const sx = Math.floor((evilCursorX / wv) * width);
      const sy = Math.floor((evilCursorY / hv) * height);
      // Single jittering ember with a rounded "aura" (no long trail / no random splits).
      const jx = Math.round(Math.sin(now / 80) * 1.2);
      const jy = Math.round(Math.cos(now / 96) * 0.9);
      const x = sx + jx;
      const y = sy + jy;
      seedBlob(arr, x, y, 140, 95, 2);
      seedBlob(arr, x, y, 70, 45, 3);
      // Tiny upward lick.
      seedBlob(arr, x, y - 2, 95, 60, 1);
    };

    const candleRects = [];

    const computeSigil = (now) => {
      const screenW = Math.max(1, window.innerWidth);
      const screenH = Math.max(1, window.innerHeight);
      const sx = width / screenW;
      const sy = height / screenH;

      const rig = Math.min(780, screenW * 0.92);
      const scale = (rig / 200) * sx;

      const nx = (evilMouseX - 0.5) * 2;
      const ny = (evilMouseY - 0.5) * 2;
      const cx = (screenW * 0.5 + nx * 26) * sx;
      const cy = (screenH * 0.46 + ny * 16) * sy;

      const evilRotX = (-ny * 5 * Math.PI) / 180;
      const evilRotY = (nx * 6 * Math.PI) / 180;
      const tiltX = (58 * Math.PI) / 180;
      const spin = evilSpinAngle(now);

      const cosZ = Math.cos(spin);
      const sinZ = Math.sin(spin);

      const project = (x0, y0) => {
        let x = x0 * cosZ - y0 * sinZ;
        let y = x0 * sinZ + y0 * cosZ;
        let z = 0;
        ({ y, z } = rotX3d(y, z, tiltX));
        ({ y, z } = rotX3d(y, z, evilRotX));
        ({ x, z } = rotY3d(x, z, evilRotY));
        // Subtle perspective so the rig feels 3D without skewing the UI too much.
        const persp = clamp01((z + 110) / 220) * 0.18 + 0.91; // ~0.91..1.09
        x *= persp;
        y *= persp;
        const px = cx + x * scale;
        const py = cy + y * scale;
        const depth = clamp01((z / 80 + 1) / 2);
        return { x: px, y: py, depth };
      };

      const R = 72;
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        pts.push(project(Math.cos(a) * R, Math.sin(a) * R));
      }

      const ring = [];
      const ringSteps = 140;
      for (let i = 0; i <= ringSteps; i++) {
        const a = (i / ringSteps) * Math.PI * 2;
        ring.push(project(Math.cos(a) * R, Math.sin(a) * R));
      }

      return { pts, ring };
    };

    const inBounds = (x, y) => x >= 0 && y >= 0 && x < width && y < height;
    const addPixel = (data, x, y, r, g, b, a) => {
      if (!inBounds(x, y)) return;
      const j = (y * width + x) * 4;
      const t = a / 255;
      data[j + 0] = clampInt(data[j + 0] + r * t, 0, 255);
      data[j + 1] = clampInt(data[j + 1] + g * t, 0, 255);
      data[j + 2] = clampInt(data[j + 2] + b * t, 0, 255);
      data[j + 3] = clampInt(data[j + 3] + a * 0.6, 0, 255);
    };
    const setPixel = (data, x, y, r, g, b, a) => {
      if (!inBounds(x, y)) return;
      const j = (y * width + x) * 4;
      data[j + 0] = r;
      data[j + 1] = g;
      data[j + 2] = b;
      data[j + 3] = a;
    };
    const drawDot = (data, x, y, t, rgba, mode) => {
      const r = Math.floor(t / 2);
      for (let yy = -r; yy <= r; yy++) {
        for (let xx = -r; xx <= r; xx++) {
          const px = x + xx;
          const py = y + yy;
          if (mode === "set") setPixel(data, px, py, rgba[0], rgba[1], rgba[2], rgba[3]);
          else addPixel(data, px, py, rgba[0], rgba[1], rgba[2], rgba[3]);
        }
      }
    };
    const drawLine = (data, x0, y0, x1, y1, thickness, rgba, mode) => {
      x0 |= 0;
      y0 |= 0;
      x1 |= 0;
      y1 |= 0;
      let dx = Math.abs(x1 - x0);
      let sx = x0 < x1 ? 1 : -1;
      let dy = -Math.abs(y1 - y0);
      let sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        drawDot(data, x0, y0, thickness, rgba, mode);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
          err += dy;
          x0 += sx;
        }
        if (e2 <= dx) {
          err += dx;
          y0 += sy;
        }
      }
    };
    const drawRect = (data, x, y, ww, hh, rgba, mode) => {
      for (let yy = 0; yy < hh; yy++) {
        for (let xx = 0; xx < ww; xx++) {
          const px = x + xx;
          const py = y + yy;
          if (mode === "set") setPixel(data, px, py, rgba[0], rgba[1], rgba[2], rgba[3]);
          else addPixel(data, px, py, rgba[0], rgba[1], rgba[2], rgba[3]);
        }
      }
    };

    const cursorBufPos = (now) => {
      const wv = Math.max(1, window.innerWidth);
      const hv = Math.max(1, window.innerHeight);
      const sx = Math.floor((evilCursorX / wv) * width);
      const sy = Math.floor((evilCursorY / hv) * height);
      const jx = Math.round(Math.sin(now / 80) * 1.2);
      const jy = Math.round(Math.cos(now / 96) * 0.9);
      return { x: sx + jx, y: sy + jy };
    };

    const addCursorGlow = (data, now) => {
      if (!evilCursorVisible) return;
      const { x: cx, y: cy } = cursorBufPos(now);
      const r = 3;
      for (let yy = -r; yy <= r; yy++) {
        for (let xx = -r; xx <= r; xx++) {
          const d2 = xx * xx + yy * yy;
          if (d2 > r * r) continue;
          const d = Math.sqrt(d2);
          const a = clampInt((1 - d / (r + 0.01)) * 120, 0, 120);
          // Warm pixel glow around the ember.
          addPixel(data, cx + xx, cy + yy, 255, 140, 60, a);
        }
      }
    };

    const step = (now) => {
      if (!fireRunning) return;

      const modeHell = theme === "dark-hell";
      const modeCandles = theme === "dark-candles";
      if (!modeHell && !modeCandles) {
        ctx.clearRect(0, 0, width, height);
        fireAnim = requestAnimationFrame(step);
        return;
      }

      const cool = modeHell ? 1 : 2;
      for (let i = 0; i < heatA.length; i++) {
        const v = heatA[i];
        heatA[i] = v > cool ? v - cool : 0;
      }

      let sigil = null;
      candleRects.length = 0;

      // Big fire theme: only the large fire (no candles/sigil).
      if (modeHell) {
        const y = height - 1;
        bottomTick++;
        const base = 210;
        for (let x = 0; x < width; x++) {
          // Low-frequency evolution => slower motion; neighbor blend => jagged, less "sinus".
          const l = bottomSeed[(x - 1 + width) % width];
          const r = bottomSeed[(x + 1) % width];
          let v = (bottomSeed[x] * 4 + l + r) / 6;
          // Slow drift + small jitter.
          v += (Math.random() * 9 - 4.5);
          // Rare dips create "breaks" / pauses.
          if (((bottomTick + x) & 31) === 0 && Math.random() < 0.55) v -= 95;
          bottomSeed[x] = clampInt(v, 0, 255);

          const gap = bottomSeed[x] < 135 && Math.random() < 0.55;
          const out = gap ? ((Math.random() * 18) | 0) : Math.max(base - 55, bottomSeed[x]) + ((Math.random() * 45) | 0);
          heatA[y * width + x] = out;
          // A little extra "lift" so the flames reach higher.
          const lift = clampInt(out * 0.62, 0, 255);
          heatA[(y - 1) * width + x] = Math.max(heatA[(y - 1) * width + x], lift);
        }
      }

      // Candles theme: candles + sigil, but no big bottom fire sheet.
      if (modeCandles) {
        sigil = computeSigil(now);
        for (const p of sigil.pts) {
          const s = 0.86 + p.depth * 0.3;
          const bw = Math.max(2, Math.round(3 * s));
          const bh = Math.max(7, Math.round(12 * s));
          const bx = Math.round(p.x);
          const by = Math.round(p.y);
          const topY = by - bh;
          candleRects.push({ x: bx, y: by, bw, bh, topY });
          seedBlob(heatA, bx, topY, 145, 95, 2);
        }
      }

      // Single "ember" under the cursor (only when hovering empty background).
      seedCursorFlame(now, heatA);

      const nx = (evilMouseX - 0.5) * 2;
      const wind = clampInt(nx * 1.1, -2, 2);
      for (let y = 0; y < height - 1; y++) {
        const y1 = (y + 1) * width;
        const y2 = Math.min(height - 1, y + 2) * width;
        const yo = y * width;
        for (let x = 0; x < width; x++) {
          const jitter = modeHell ? (((Math.random() * 3) | 0) - 1) : 0;
          const bx = (x + wind + jitter + width) % width;
          const below = y1 + bx;
          const left = y1 + ((bx - 1 + width) % width);
          const right = y1 + ((bx + 1) % width);
          const below2 = y2 + bx;
          let v = (heatA[below] + heatA[left] + heatA[right] + heatA[below2]) >> 2;
          const decay = (Math.random() * (modeHell ? 2 : 2)) | 0;
          v = v > decay ? v - decay : 0;
          heatB[yo + x] = v;
        }
      }
      const last = (height - 1) * width;
      for (let x = 0; x < width; x++) heatB[last + x] = heatA[last + x];

      const tmp = heatA;
      heatA = heatB;
      heatB = tmp;

      if (modeHell) {
        const y = height - 1;
        for (let x = 0; x < width; x++) heatA[y * width + x] = Math.max(heatA[y * width + x], 200);
      }
      if (modeCandles) {
        for (const c of candleRects) {
          seedBlob(heatA, c.x, c.topY, 140, 100, 2);
        }
      }

      const data = img.data;
      for (let i = 0; i < heatA.length; i++) {
        const v = Math.min(255, heatA[i]);
        const j = i * 4;
        const [r, g, b, a] = palette[v];
        data[j + 0] = r;
        data[j + 1] = g;
        data[j + 2] = b;
        data[j + 3] = a;
      }

      // Round out the cursor ember so it reads as a circular "ogni(k)" rather than a flat-cut seed.
      addCursorGlow(data, now);

      if (modeCandles && sigil) {
        const red = [255, 45, 45, 170];
        const redGlow = [255, 45, 45, 55];
        for (let i = 0; i < sigil.ring.length - 1; i++) {
          const a = sigil.ring[i];
          const b = sigil.ring[i + 1];
          drawLine(data, a.x, a.y, b.x, b.y, 1, red, "add");
        }
        const star = [0, 2, 4, 1, 3, 0];
        for (let i = 0; i < star.length - 1; i++) {
          const a = sigil.pts[star[i]];
          const b = sigil.pts[star[i + 1]];
          drawLine(data, a.x, a.y, b.x, b.y, 1, red, "add");
          drawLine(data, a.x, a.y, b.x, b.y, 3, redGlow, "add");
        }

        for (const c of candleRects) {
          const x0 = c.x - Math.floor(c.bw / 2);
          const y0 = c.y - c.bh;
          // Draw candle body "behind" the flame, but in front of the sigil:
          // - keep hot pixels (flame) by checking the heat field, not the rendered alpha
          //   (sigil is a post-process overlay and shouldn't punch holes in the candle body).
          const flameHeatKeep = 105;
          for (let yy = 0; yy < c.bh; yy++) {
            const py = y0 + yy;
            if (py < 0 || py >= height) continue;
            for (let xx = 0; xx < c.bw; xx++) {
              const px = x0 + xx;
              if (px < 0 || px >= width) continue;
              const idx = py * width + px;
              if (heatA[idx] > flameHeatKeep) continue;
              const j = idx * 4;
              data[j + 0] = 0;
              data[j + 1] = 0;
              data[j + 2] = 0;
              data[j + 3] = 255;
            }
          }
          addPixel(data, c.x, y0, 255, 110, 40, 70);
          addPixel(data, c.x, y0 - 1, 255, 180, 60, 50);
        }
      }

      ctx.putImageData(img, 0, 0);
      fireAnim = requestAnimationFrame(step);
    };

    if (fireOnResize) window.removeEventListener("resize", fireOnResize);
    fireOnResize = () => {
      if (!fireRunning) return;
      startEvilRenderer();
    };
    window.addEventListener("resize", fireOnResize, { passive: true });
    fireAnim = requestAnimationFrame(step);
  }

  function buildFirePalette() {
    const out = new Array(256);
    for (let i = 0; i < 256; i++) {
      // dark->red->orange->yellow->white
      const t = i / 255;
      const r = clampInt(40 + t * 255, 0, 255);
      const g = clampInt(t < 0.6 ? t * 140 : 84 + (t - 0.6) * 430, 0, 255);
      const b = clampInt(t < 0.8 ? 0 : (t - 0.8) * 700, 0, 255);
      const a = clampInt(i * 1.05, 0, 255);
      out[i] = [r, g, b, a];
    }
    return out;
  }

  function encodeRle(u8) {
    if (!u8 || u8.length === 0) return [];
    const out = [];
    let last = u8[0];
    let count = 1;
    for (let i = 1; i < u8.length; i++) {
      const v = u8[i];
      if (v === last && count < 65535) count++;
      else {
        out.push(count, last);
        last = v;
        count = 1;
      }
    }
    out.push(count, last);
    return out;
  }

  function decodeRle(rle, len, fill = TRANSPARENT) {
    const out = new Uint8Array(len).fill(fill);
    if (!Array.isArray(rle)) return out;
    let o = 0;
    for (let i = 0; i + 1 < rle.length; i += 2) {
      const count = clampInt(rle[i], 0, 65535);
      const value = clampInt(rle[i + 1], 0, 255);
      for (let k = 0; k < count && o < len; k++) out[o++] = value;
      if (o >= len) break;
    }
    return out;
  }

  function makeId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function setStatus(id, text) {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  }

  function slotName(s) {
    switch (s) {
      case "fg":
        return "FG";
      case "mc1":
        return "MC1";
      case "mc2":
        return "MC2";
      case "out":
        return "OUT";
      case "cheat":
        return "CH";
      default:
        return s;
    }
  }

  function toolName(t) {
    switch (t) {
      case "pen":
        return "Pen";
      case "eraser":
        return "Eraser";
      case "line":
        return "Line";
      case "fill":
        return "Fill";
      case "rect":
        return shapeFill ? "Rectangle (fill)" : "Rectangle";
      case "circle":
        return shapeFill ? "Circle (fill)" : "Circle";
      case "select":
        return pasteMode ? "Select (paste)" : "Select";
      default:
        return t;
    }
  }

  function savePng() {
    const out = document.createElement("canvas");
    out.width = gridW;
    out.height = gridH;
    const octx = out.getContext("2d", { alpha: true });
    const img = octx.createImageData(gridW, gridH);

    for (let i = 0; i < pixels.length; i++) {
      const p = pixels[i];
      const j = i * 4;
      if (p === TRANSPARENT) {
        img.data[j + 0] = 0;
        img.data[j + 1] = 0;
        img.data[j + 2] = 0;
        img.data[j + 3] = 0;
      } else {
        const [r, g, b] = C64[p].rgb;
        img.data[j + 0] = r;
        img.data[j + 1] = g;
        img.data[j + 2] = b;
        img.data[j + 3] = 255;
      }
    }

    octx.putImageData(img, 0, 0);
    out.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const now = new Date();
      const stamp = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(
        now.getMinutes(),
      )}${pad2(now.getSeconds())}`;
      a.download = `c64_${gridW}x${gridH}_${stamp}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, "image/png");
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function rgbaFromHex(hex, alpha) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex).trim());
    if (!m) return hex;
    const r = Number.parseInt(m[1], 16);
    const g = Number.parseInt(m[2], 16);
    const b = Number.parseInt(m[3], 16);
    const a = Math.max(0, Math.min(1, Number(alpha)));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function clampInt(v, min, max) {
    const n = Number.parseInt(String(v), 10);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function wrapIndex(n, mod) {
    return ((n % mod) + mod) % mod;
  }
})();
