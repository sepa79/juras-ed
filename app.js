(() => {
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
  const slotFgSwatch = el("slotFgSwatch");
  const slotMc1Swatch = el("slotMc1Swatch");
  const slotMc2Swatch = el("slotMc2Swatch");
  const slotOutSwatch = el("slotOutSwatch");

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
  const widePixelEl = el("widePixel");
  const shapeFillEl = el("shapeFill");
  const btnTransform = el("btnTransform");

  const btnSave = el("btnSave");
  const btnClear = el("btnClear");
  const btnUndo = el("btnUndo");
  const btnRedo = el("btnRedo");
  const btnTheme = el("btnTheme");
  const fireCanvas = el("fireCanvas");
  const btnHelp = el("btnHelp");
  const helpModal = el("helpModal");
  const btnHelpClose = el("btnHelpClose");
  const helpText = el("helpText");
  const helpContent = el("helpContent");
  const confirmModal = el("confirmModal");
  const confirmTitle = el("confirmTitle");
  const confirmMsg = el("confirmMsg");
  const btnConfirmClose = el("btnConfirmClose");
  const btnConfirmCancel = el("btnConfirmCancel");
  const btnConfirmOk = el("btnConfirmOk");

  const btnProjectExport = el("btnProjectExport");
  const btnProjectImport = el("btnProjectImport");
  const fileProject = el("fileProject");
  const btnImportSpritePng = el("btnImportSpritePng");
  const btnExportSpritePng = el("btnExportSpritePng");
  const fileSpritePng = el("fileSpritePng");
  const btnImportSwatchPng = el("btnImportSwatchPng");
  const fileSwatchPng = el("fileSwatchPng");

  const transformOverlayEl = el("transformOverlay");
  const btnRollUp = el("btnRollUp");
  const btnRollDown = el("btnRollDown");
  const btnRollLeft = el("btnRollLeft");
  const btnRollRight = el("btnRollRight");
  const btnMirrorX = el("btnMirrorX");
  const btnMirrorY = el("btnMirrorY");

  const btnAddSprite = el("btnAddSprite");
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
  let activeSlot = "fg"; // fg|mc1|mc2|out
  let tool = "pen"; // pen|eraser|line|fill|rect|circle|select

  let customRes = !!customResEl.checked;
  let spritesX = clampInt(spritesXEl.value, 1, 8);
  let spritesY = clampInt(spritesYEl.value, 1, 8);
  let customW = clampInt(customWEl.value, 1, MAX_SIZE);
  let customH = clampInt(customHEl.value, 1, MAX_SIZE);

  let zoom = clampInt(zoomEl.value, 4, 64);
  let bgColor = bgColorEl.value || "#203040";
  let showGrid = !!showGridEl.checked;
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

  let theme = "light"; // light|dark (dark is the easter egg)
  let fireRunning = false;
  let fireAnim = null;
  let fireOnResize = null;
  let helpOpen = false;
  let helpPrevFocus = null;
  let confirmOpen = false;
  let confirmPrevFocus = null;
  let confirmResolve = null;

  buildPalette();
  syncSlotUi();
  setActiveSlot("fg");
  setTool("pen");
  syncResUi();
  setInitialGrid();
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

  function wirePersistenceGuards() {
    // localStorage writes are debounced; flush immediately when leaving the page
    // so quick F5 / close doesn't lose the last changes.
    window.addEventListener("pagehide", () => saveState());
    window.addEventListener("beforeunload", () => saveState());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") saveState();
    });
  }

  function wireEvents() {
    spritesXEl.addEventListener("change", () => {
      const prev = spritesX;
      spritesX = clampInt(spritesXEl.value, 1, 8);
      spritesXEl.value = String(spritesX);
      if (!customRes) {
        const ok = setGridSize(SPRITE_W * spritesX, SPRITE_H * spritesY, { keep: true });
        if (!ok) {
          spritesX = prev;
          spritesXEl.value = String(prev);
        }
      }
    });
    spritesYEl.addEventListener("change", () => {
      const prev = spritesY;
      spritesY = clampInt(spritesYEl.value, 1, 8);
      spritesYEl.value = String(spritesY);
      if (!customRes) {
        const ok = setGridSize(SPRITE_W * spritesX, SPRITE_H * spritesY, { keep: true });
        if (!ok) {
          spritesY = prev;
          spritesYEl.value = String(prev);
        }
      }
    });
    customWEl.addEventListener("change", () => {
      const prev = customW;
      customW = clampInt(customWEl.value, 1, MAX_SIZE);
      customWEl.value = String(customW);
      if (customRes) {
        const ok = setGridSize(customW, customH, { keep: true });
        if (!ok) {
          customW = prev;
          customWEl.value = String(prev);
        }
      }
    });
    customHEl.addEventListener("change", () => {
      const prev = customH;
      customH = clampInt(customHEl.value, 1, MAX_SIZE);
      customHEl.value = String(customH);
      if (customRes) {
        const ok = setGridSize(customW, customH, { keep: true });
        if (!ok) {
          customH = prev;
          customHEl.value = String(prev);
        }
      }
    });
    customResEl.addEventListener("change", () => {
      const prev = customRes;
      customRes = !!customResEl.checked;
      syncResUi();
      const ok = customRes
        ? setGridSize(customW, customH, { keep: true })
        : setGridSize(SPRITE_W * spritesX, SPRITE_H * spritesY, { keep: true });
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
      render();
    });
    showGridEl.addEventListener("change", () => {
      showGrid = !!showGridEl.checked;
      scheduleSave();
      render();
    });
    widePixelEl.addEventListener("change", () => {
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
      theme = theme === "dark" ? "light" : "dark";
      applyTheme(theme);
      scheduleSave();
    });
    btnHelp.addEventListener("click", () => openHelp());
    btnProjectExport.addEventListener("click", () => exportProject());
    btnProjectImport.addEventListener("click", () => {
      fileProject.value = "";
      fileProject.click();
    });
    fileProject.addEventListener("change", async () => {
      const f = fileProject.files?.[0];
      if (!f) return;
      await importProjectFile(f);
    });

    btnImportSpritePng.addEventListener("click", () => {
      fileSpritePng.value = "";
      fileSpritePng.click();
    });
    fileSpritePng.addEventListener("change", async () => {
      const f = fileSpritePng.files?.[0];
      if (!f) return;
      await importPngAsSprite(f);
    });

    btnExportSpritePng.addEventListener("click", async () => {
      await exportActiveSpritePng();
    });

    btnImportSwatchPng.addEventListener("click", () => {
      fileSwatchPng.value = "";
      fileSwatchPng.click();
    });
    fileSwatchPng.addEventListener("change", async () => {
      const f = fileSwatchPng.files?.[0];
      if (!f) return;
      await importPngAsSwatch(f);
    });

    btnClear.addEventListener("click", async () => {
      const ok = await askConfirm("Wyczyścić całe płótno?", { title: "Wyczyść", okText: "Wyczyść" });
      if (!ok) return;
      pushUndo();
      pixels.fill(TRANSPARENT);
      syncActiveSpriteFromCanvas();
      updateHistoryButtons();
      render();
    });
    btnUndo.addEventListener("click", () => undo());
    btnRedo.addEventListener("click", () => redo());

    slotFgBtn.addEventListener("click", () => setActiveSlot("fg"));
    slotMc1Btn.addEventListener("click", () => setActiveSlot("mc1"));
    slotMc2Btn.addEventListener("click", () => setActiveSlot("mc2"));
    slotOutBtn.addEventListener("click", () => setActiveSlot("out"));

    toolButtons.pen.addEventListener("click", () => setTool("pen"));
    toolButtons.eraser.addEventListener("click", () => setTool("eraser"));
    toolButtons.line.addEventListener("click", () => setTool("line"));
    toolButtons.fill.addEventListener("click", () => setTool("fill"));
    toolButtons.rect.addEventListener("click", () => setTool("rect"));
    toolButtons.circle.addEventListener("click", () => setTool("circle"));
    toolButtons.select.addEventListener("click", () => setTool("select"));

    toolCopyBtn.addEventListener("click", () => {
      if (tool !== "select") return;
      if (hasSelection()) copySelection();
      updateToolButtons();
    });
    toolPasteBtn.addEventListener("click", () => {
      if (!copyBuffer) return;
      pasteMode = true;
      setTool("select");
      updateToolButtons();
      render();
    });

    btnAddSprite.addEventListener("click", () => addSprite());

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
          const slotKey = activeSlot;
          colorSlots[slotKey] = wrapIndex(colorSlots[slotKey] + dir, C64.length);
          syncSlotUi();
          syncPaletteSelection();
          scheduleSave();
          render();
          e.preventDefault();
          return;
        }
        if (e.shiftKey) {
          const dir = e.deltaY > 0 ? 1 : -1;
          const order = ["fg", "mc1", "mc2", "out"];
          const idx = order.indexOf(activeSlot);
          setActiveSlot(order[wrapIndex(idx + dir, order.length)]);
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
        if (copyBuffer) {
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
        setActiveSlot("fg");
        e.preventDefault();
        return;
      }
      if (e.key === "2") {
        setActiveSlot("mc1");
        e.preventDefault();
        return;
      }
      if (e.key === "3") {
        setActiveSlot("mc2");
        e.preventDefault();
        return;
      }
      if (e.key === "4") {
        setActiveSlot("out");
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

  function askConfirm(message, opts = {}) {
    const title = opts.title ?? "Potwierdź";
    const okText = opts.okText ?? "OK";
    const cancelText = opts.cancelText ?? "Anuluj";
    if (helpOpen) closeHelp();

    confirmTitle.textContent = title;
    confirmMsg.textContent = message;
    btnConfirmOk.textContent = okText;
    btnConfirmCancel.textContent = cancelText;

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
    if (typeof resolve === "function") resolve(!!result);

    const f = confirmPrevFocus;
    confirmPrevFocus = null;
    if (f && document.contains(f)) f.focus();
  }

  function setInitialGrid() {
    if (customRes) setGridSize(customW, customH, { keep: false, resetHistory: true });
    else setGridSize(SPRITE_W * spritesX, SPRITE_H * spritesY, { keep: false, resetHistory: true });
  }

  function syncResUi() {
    spriteControlsEl.hidden = customRes;
    customControlsEl.hidden = !customRes;
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
      b.setAttribute("aria-checked", idx === colorSlots[activeSlot] ? "true" : "false");
      b.title = `${idx}: ${c.name} (${c.hex})`;
      b.addEventListener("click", () => {
        colorSlots[activeSlot] = idx;
        syncSlotUi();
        syncPaletteSelection();
        render();
      });
      paletteEl.appendChild(b);
    });
  }

  function syncPaletteSelection() {
    const children = Array.from(paletteEl.children);
    const sel = colorSlots[activeSlot];
    children.forEach((node, i) => node.setAttribute("aria-checked", i === sel ? "true" : "false"));
  }

  function setActiveSlot(slot) {
    activeSlot = slot;
    slotFgBtn.setAttribute("aria-pressed", slot === "fg" ? "true" : "false");
    slotMc1Btn.setAttribute("aria-pressed", slot === "mc1" ? "true" : "false");
    slotMc2Btn.setAttribute("aria-pressed", slot === "mc2" ? "true" : "false");
    slotOutBtn.setAttribute("aria-pressed", slot === "out" ? "true" : "false");
    syncPaletteSelection();
    render();
  }

  function syncSlotUi() {
    slotFgSwatch.style.background = C64[colorSlots.fg].hex;
    slotMc1Swatch.style.background = C64[colorSlots.mc1].hex;
    slotMc2Swatch.style.background = C64[colorSlots.mc2].hex;
    slotOutSwatch.style.background = C64[colorSlots.out].hex;
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
    toolPasteBtn.disabled = !selectActive || !copyBuffer;
    toolPasteBtn.setAttribute("aria-pressed", pasteMode ? "true" : "false");
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

  function pushUndo() {
    undoStack.push(pixels.slice());
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack.length = 0;
    updateHistoryButtons();
  }

  function ensureUndo() {
    if (action.pushedUndo) return;
    pushUndo();
    action.pushedUndo = true;
  }

  function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(pixels.slice());
    pixels = undoStack.pop();
    syncActiveSpriteFromCanvas();
    updateHistoryButtons();
    render();
  }

  function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(pixels.slice());
    pixels = redoStack.pop();
    syncActiveSpriteFromCanvas();
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

  function setGridSize(w, h, opts = {}) {
    const keep = !!opts.keep;
    const reset = opts.resetHistory !== false;

    const nextW = clampInt(w, 1, MAX_SIZE);
    const nextH = clampInt(h, 1, MAX_SIZE);
    if (!canResizeWithoutDataLoss(nextW, nextH)) return false;
    const prevW = gridW;
    const prevH = gridH;
    const prev = pixels;

    gridW = nextW;
    gridH = nextH;
    pixels = new Uint8Array(gridW * gridH).fill(TRANSPARENT);
    if (keep && prev && prev.length) {
      const copyW = Math.min(prevW, gridW);
      const copyH = Math.min(prevH, gridH);
      for (let y = 0; y < copyH; y++) {
        for (let x = 0; x < copyW; x++) {
          pixels[y * gridW + x] = prev[y * prevW + x];
        }
      }
    }
    resizeCanvasOnly();
    if (reset) resetHistory();
    // Mirror axes stay centered automatically; nothing to update.
    syncActiveSpriteFromCanvas();
    render();
    return true;
  }

  function canResizeWithoutDataLoss(nextW, nextH) {
    if (nextW >= gridW && nextH >= gridH) return true;
    // Shrinking: check if any non-transparent pixels would be cropped.
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        if (x < nextW && y < nextH) continue;
        if (pixels[y * gridW + x] !== TRANSPARENT) {
          const ok = confirm("Zmniejszenie rozmiaru może uciąć piksele. Kontynuować?");
          return ok;
        }
      }
    }
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
      if (pasteMode && copyBuffer) {
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
      const value = action.button === 2 ? TRANSPARENT : colorSlots[activeSlot];
      if (fillWouldChange(pointer.x, pointer.y, value)) {
        ensureUndo();
        action.changed = floodFill(pointer.x, pointer.y, value) || action.changed;
      }
      return;
    }

    if (tool === "pen" || tool === "eraser") {
      const value = action.button === 2 || tool === "eraser" ? TRANSPARENT : colorSlots[activeSlot];
      if (wouldStampChange(pointer.x, pointer.y, value)) {
        ensureUndo();
        action.changed = stamp(pointer.x, pointer.y, value) || action.changed;
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
      const value = action.button === 2 || tool === "eraser" ? TRANSPARENT : colorSlots[activeSlot];
      if (wouldStampChange(pointer.x, pointer.y, value)) {
        ensureUndo();
        action.changed = stamp(pointer.x, pointer.y, value) || action.changed;
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
      const value = action.button === 2 ? TRANSPARENT : colorSlots[activeSlot];
      if (lineWouldChange(action.startX, action.startY, pointer.x, pointer.y, value)) {
        ensureUndo();
        action.changed = drawLine(action.startX, action.startY, pointer.x, pointer.y, value) || action.changed;
      }
      return;
    }
    if (tool === "rect") {
      const value = action.button === 2 ? TRANSPARENT : colorSlots[activeSlot];
      const willChange = rectWouldChange(action.startX, action.startY, pointer.x, pointer.y, value, { fill: shapeFill });
      if (willChange) {
        ensureUndo();
        action.changed =
          drawRect(action.startX, action.startY, pointer.x, pointer.y, value, { fill: shapeFill }) || action.changed;
      }
      return;
    }
    if (tool === "circle") {
      const value = action.button === 2 ? TRANSPARENT : colorSlots[activeSlot];
      const willChange = circleWouldChange(action.startX, action.startY, pointer.x, pointer.y, value, { fill: shapeFill });
      if (willChange) {
        ensureUndo();
        action.changed =
          drawCircle(action.startX, action.startY, pointer.x, pointer.y, value, { fill: shapeFill }) || action.changed;
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
    ctx.fillStyle =
      document.documentElement.dataset.theme === "dark" ? rgbaFromHex(bgColor, 0.22) : bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Pixels.
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const p = pixels[y * gridW + x];
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
      ctx.fillStyle = isErase ? "rgba(255,255,255,.35)" : C64[colorSlots[activeSlot]].hex;
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

    // Grid overlay.
    if (showGrid && zoom >= 10) {
      ctx.strokeStyle = "rgba(255,255,255,.10)";
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
      ctx.stroke();
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
    const modeLabel = widePixel ? "wide (2×)" : "normal";
    const canvasLabel = customRes ? `${gridW}×${gridH}px` : `${spritesX}×${spritesY} sprite (${gridW}×${gridH})`;
    const toolLabel = toolName(tool);
    const slotLabel = `${slotName(activeSlot)} (${C64[colorSlots[activeSlot]].name})`;

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
    const data = new Uint8Array(w * h).fill(TRANSPARENT);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        data[y * w + x] = pixels[(y0 + y) * gridW + (x0 + x)];
      }
    }
    addToLibrary({ w, h, data });
  }

  function pasteAt(x, y, opts = {}) {
    if (!copyBuffer) return false;
    const erase = !!opts.erase;
    let changed = false;
    for (let yy = 0; yy < copyBuffer.h; yy++) {
      for (let xx = 0; xx < copyBuffer.w; xx++) {
        const v = copyBuffer.data[yy * copyBuffer.w + xx];
        if (v === TRANSPARENT) continue;
        changed = setPixelRaw(x + xx, y + yy, erase ? TRANSPARENT : v) || changed;
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
    sprites.push({ id, name, w: it.w, h: it.h, pixels: it.data.slice() });
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
      empty.textContent = "Brak swatchy. Zaznacz fragment (Select/Q) i Ctrl+C.";
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
          const ok = await askConfirm("Usunąć ten swatch?", { title: "Usuń swatch", okText: "Usuń" });
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
    sprites.push({ id, name: "Sprite 1", w: gridW, h: gridH, pixels });
    activeSpriteId = id;
  }

  function addSprite() {
    const id = makeId("sprite");
    const name = `Sprite ${sprites.length + 1}`;
    const w = gridW;
    const h = gridH;
    const p = new Uint8Array(w * h).fill(TRANSPARENT);
    sprites.push({ id, name, w, h, pixels: p });
    scheduleSave();
    setActiveSprite(id);
  }

  function duplicateSprite(id) {
    const sp = sprites.find((s) => s.id === id);
    if (!sp) return;
    const nextId = makeId("sprite");
    const name = `${sp.name} copy`;
    sprites.push({ id: nextId, name, w: sp.w, h: sp.h, pixels: sp.pixels.slice() });
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
    pixels = sp.pixels;
    if (gridW % SPRITE_W === 0 && gridH % SPRITE_H === 0) {
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
    resetHistory();
    renderSprites();
    scheduleSave();
    render();
  }

  function syncActiveSpriteFromCanvas() {
    const sp = sprites.find((s) => s.id === activeSpriteId);
    if (!sp) return;
    sp.w = gridW;
    sp.h = gridH;
    sp.pixels = pixels;
    renderSprites();
    scheduleSave();
  }

  function renderSprites() {
    if (!spriteListEl) return;
    spriteListEl.innerHTML = "";
    if (sprites.length === 0) return;

    for (const sp of sprites) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "libItem";
      item.title = "Kliknij, aby edytować";
      item.setAttribute("aria-pressed", sp.id === activeSpriteId ? "true" : "false");
      if (sp.id === activeSpriteId) item.classList.add("libItem--active");
      item.addEventListener("click", () => {
        setActiveSprite(sp.id);
      });

      const thumb = document.createElement("div");
      thumb.className = "libThumb";
      const c = document.createElement("canvas");
      c.width = sp.w;
      c.height = sp.h;
      drawThumb(c, { w: sp.w, h: sp.h, data: sp.pixels });
      thumb.appendChild(c);

      const row = document.createElement("div");
      row.className = "libRow";
      const meta = document.createElement("div");
      meta.className = "libMeta";
      meta.textContent = sp.name;

      row.appendChild(meta);
      if (sp.id === activeSpriteId) {
        const actions = document.createElement("div");
        actions.className = "libActions";

        const toSwatch = document.createElement("button");
        toSwatch.type = "button";
        toSwatch.className = "iconBtn";
        toSwatch.title = "-> Swatch";
        toSwatch.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          addToLibrary({ w: sp.w, h: sp.h, data: sp.pixels.slice() });
        });
        toSwatch.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 7h14v14H7V7z"/><path fill="currentColor" d="M3 3h14v2H5v12H3V3z"/></svg>';

        const dup = document.createElement("button");
        dup.type = "button";
        dup.className = "iconBtn";
        dup.title = "Duplicate";
        dup.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          duplicateSprite(sp.id);
        });
        dup.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16h-9V7h9v14z"/></svg>';

        const del = document.createElement("button");
        del.type = "button";
        del.className = "iconBtn";
        del.title = "Delete (Shift: bez potwierdzenia)";
        del.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!e.shiftKey) {
            const ok = await askConfirm(`Usunąć ${sp.name}?`, { title: "Usuń sprite", okText: "Usuń" });
            if (!ok) return;
          }
          removeSprite(sp.id);
        });
        del.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"/></svg>';

        actions.appendChild(toSwatch);
        actions.appendChild(dup);
        actions.appendChild(del);
        row.appendChild(actions);
      }

      item.appendChild(thumb);
      item.appendChild(row);
      spriteListEl.appendChild(item);
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
      ui: uiState,
      settings: {
        theme,
        activeSlot,
        colorSlots,
        tool,
        zoom,
        bgColor,
        showGrid,
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
      sprites: sprites.map((s) => ({ id: s.id, name: s.name, w: s.w, h: s.h, rle: encodeRle(s.pixels) })),
      swatches: library.map((x) => ({ id: x.id, w: x.w, h: x.h, rle: encodeRle(x.data) })),
    };
  }

  function hydrateFromStateObject(state) {
    if (!state || state.v !== 1) return false;
    isHydrating = true;

    if (state.ui) {
      uiState.spritesCollapsed = !!state.ui.spritesCollapsed;
      uiState.swatchesCollapsed = !!state.ui.swatchesCollapsed;
    }

    const s = state.settings || {};
    if (typeof s.theme === "string") theme = s.theme;
    if (typeof s.activeSlot === "string") activeSlot = s.activeSlot;
    if (s.colorSlots && typeof s.colorSlots === "object") {
      colorSlots.fg = clampInt(s.colorSlots.fg, 0, 15);
      colorSlots.mc1 = clampInt(s.colorSlots.mc1, 0, 15);
      colorSlots.mc2 = clampInt(s.colorSlots.mc2, 0, 15);
      colorSlots.out = clampInt(s.colorSlots.out, 0, 15);
    }
    if (typeof s.tool === "string") tool = s.tool;
    zoom = clampInt(s.zoom, 4, 64);
    bgColor = typeof s.bgColor === "string" ? s.bgColor : bgColor;
    showGrid = s.showGrid !== undefined ? !!s.showGrid : showGrid;
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
        sprites.push({ id: sp.id, name: sp.name || "Sprite", w, h, pixels: pix });
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

  function exportProject() {
    const json = JSON.stringify(buildStateObject());
    downloadText(json, "jurased_project.json", "application/json");
  }

  async function importProjectFile(file) {
    try {
      const text = await file.text();
      const state = JSON.parse(text);
      const ok = hydrateFromStateObject(state);
      if (!ok) alert("Nieprawidłowy plik projektu.");
      else saveState();
    } catch {
      alert("Nie udało się zaimportować projektu.");
    }
  }

  async function importPngAsSprite(file) {
    const img = await loadImageFromFile(file);
    const w = clampInt(img.naturalWidth || img.width, 1, MAX_SIZE);
    const h = clampInt(img.naturalHeight || img.height, 1, MAX_SIZE);
    const data = imageToC64Pixels(img, w, h);
    const id = makeId("sprite");
    const name = `Sprite ${sprites.length + 1}`;
    sprites.push({ id, name, w, h, pixels: data });
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
    const blob = await pixelsToPngBlob(sp.pixels, sp.w, sp.h);
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

      for (let y = 0; y < sp.h; y++) {
        for (let x = 0; x < sp.w; x++) {
          const p = sp.pixels[y * sp.w + x];
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

  function applyTheme(next) {
    const root = document.documentElement;
    if (next === "dark") root.dataset.theme = "dark";
    else delete root.dataset.theme;
    btnTheme.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
    setFireEnabled(next === "dark");
  }

  function setFireEnabled(enabled) {
    if (!fireCanvas) return;
    if (enabled) {
      if (fireRunning) return;
      fireRunning = true;
      startFire();
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

  function startFire() {
    const ctx = fireCanvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const scale = 4;
    const width = Math.max(80, Math.floor(window.innerWidth / scale));
    const height = Math.max(120, Math.floor(window.innerHeight / scale));
    fireCanvas.width = width;
    fireCanvas.height = height;

    const heat = new Uint16Array(width * height);
    const img = ctx.createImageData(width, height);
    const palette = buildFirePalette();

    const step = () => {
      if (!fireRunning) return;
      // Seed bottom row.
      for (let x = 0; x < width; x++) {
        const v = 180 + ((Math.random() * 75) | 0);
        heat[(height - 1) * width + x] = v;
      }
      // Propagate up.
      for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width; x++) {
          const below = (y + 1) * width + x;
          const left = (y + 1) * width + ((x - 1 + width) % width);
          const right = (y + 1) * width + ((x + 1) % width);
          const below2 = Math.min(height - 1, y + 2) * width + x;
          let v = (heat[below] + heat[left] + heat[right] + heat[below2]) >> 2;
          const decay = (Math.random() * 3) | 0;
          v = v > decay ? v - decay : 0;
          heat[y * width + x] = v;
        }
      }

      // Render.
      for (let i = 0; i < heat.length; i++) {
        const v = Math.min(255, heat[i]);
        const j = i * 4;
        const [r, g, b, a] = palette[v];
        img.data[j + 0] = r;
        img.data[j + 1] = g;
        img.data[j + 2] = b;
        img.data[j + 3] = a;
      }
      ctx.putImageData(img, 0, 0);
      fireAnim = requestAnimationFrame(step);
    };

    if (fireOnResize) window.removeEventListener("resize", fireOnResize);
    fireOnResize = () => {
      if (!fireRunning) return;
      startFire();
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

  function decodeRle(rle, len) {
    const out = new Uint8Array(len).fill(TRANSPARENT);
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
