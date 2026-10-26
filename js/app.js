/**
 * Main Application Controller & UI Interaction Handler (Modular & Advanced)
 * NFC 15-100 Educational Residential Wiring Simulator
 * - Full Component Management: Add, delete, move (drag & drop), configure components
 * - Complete Wiring Customization: Dynamic color selection, live recoloring of selected wires, custom color picker
 * - Auto-Backup & History System: LocalStorage auto-save, JSON download/upload, instant state restore
 * - Schematics: Simple Allumage, Double Allumage (2 separate switches side-by-side, E1+E2 parallel),
 *   Va-et-vient (FR, DE, US), Télérupteur (3 push buttons)
 * - Strict Layering & Z-Index Guarantee: Bodies -> Selection -> Wires -> Terminals
 */

class SimulatorApp {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.cm = window.componentManager;
    this.wr = window.wireRouter;
    this.engine = window.circuitEngine;
    this.sound = window.soundEngine;
    this.backupManager = null;

    // Interaction states
    this.isConnecting = false;
    this.startPin = null;
    this.mousePos = { x: 0, y: 0 };
    this.hoveredPin = null;
    this.hoveredWire = null;

    // Component Dragging & Selection
    this.selectedComponentId = null;
    this.isDraggingComponent = false;
    this.draggedComponent = null;
    this.dragOffset = { x: 0, y: 0 };
    this.pointerDownPos = { x: 0, y: 0 };
    this.hasDraggedComponent = false;

    this.animationId = null;
    this.currentMode = 'DA';
    this.vvVariant = 'FR';
  }

  init() {
    this.canvas = document.getElementById('circuitCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');

    this.resizeCanvas();
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.wr.recomputeAllPaths(this.cm);
    });

    // Initialize Auto-Backup Manager
    if (window.BackupManager) {
      this.backupManager = new window.BackupManager(this);
      this.backupManager.init();
    }

    this.setCircuitMode('DA');
    this.setupEventListeners();
    this.startLoop();
    this.evaluateCircuit();
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = Math.max(640, rect.height) * dpr;

    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  setupEventListeners() {
    // Mode Switcher Tabs
    const tabButtons = document.querySelectorAll('[data-mode]');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.setCircuitMode(mode);
      });
    });

    // Va-et-vient Variant Switcher (FR, DE, US)
    const vvVariantButtons = document.querySelectorAll('[data-vv-variant]');
    vvVariantButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const variant = btn.getAttribute('data-vv-variant');
        this.setVvVariant(variant);
      });
    });

    // Color Selector Buttons
    const colorButtons = document.querySelectorAll('[data-color]');
    colorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-color');
        const wireType = btn.getAttribute('data-wire-type');
        this.setActiveColor(color, wireType, btn);

        // If a wire is currently selected, immediately recolor it!
        if (this.wr.selectedWireId) {
          this.wr.updateWireColor(this.wr.selectedWireId, color, wireType);
          this.evaluateCircuit();
          this.updateSelectionUI();
          this.showToast(`تم تغيير لون السلك إلى: ${wireType.toUpperCase()}`, 'info');
          if (this.backupManager) this.backupManager.scheduleAutoSave();
        }
      });
    });

    // Custom Color Picker input
    const customColorInput = document.getElementById('customColorPicker');
    if (customColorInput) {
      customColorInput.addEventListener('input', (e) => {
        const chosenColor = e.target.value;
        this.wr.setColor(chosenColor, 'retour');
        if (this.wr.selectedWireId) {
          this.wr.updateWireColor(this.wr.selectedWireId, chosenColor, 'retour');
          this.evaluateCircuit();
          this.updateSelectionUI();
          if (this.backupManager) this.backupManager.scheduleAutoSave();
        }
      });
    }

    // Component Palette Buttons (Add new components freely)
    const addCompButtons = document.querySelectorAll('[data-add-component]');
    addCompButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-add-component');
        const newComp = this.cm.createNewComponent(type);
        if (newComp) {
          this.selectedComponentId = newComp.id;
          this.wr.selectedWireId = null;
          this.updateSelectionUI();
          this.showToast(`تمت إضافة: ${newComp.labelAr} (${newComp.labelFr})`, 'success');
          if (this.sound) this.sound.playWireConnect();
          if (this.backupManager) this.backupManager.scheduleAutoSave();
          this.evaluateCircuit();
        }
      });
    });

    // Component Contextual Bar actions
    const btnRenameComp = document.getElementById('btnRenameComp');
    if (btnRenameComp) {
      btnRenameComp.addEventListener('click', () => this.openRenameModal());
    }

    const btnDuplicateComp = document.getElementById('btnDuplicateComp');
    if (btnDuplicateComp) {
      btnDuplicateComp.addEventListener('click', () => {
        if (this.selectedComponentId) {
          const clone = this.cm.duplicateComponent(this.selectedComponentId);
          if (clone) {
            this.selectedComponentId = clone.id;
            this.updateSelectionUI();
            this.showToast(`تم نسخ: ${clone.labelAr}`, 'success');
            if (this.backupManager) this.backupManager.scheduleAutoSave();
            this.evaluateCircuit();
          }
        }
      });
    }

    const btnDeleteComp = document.getElementById('btnDeleteComp');
    if (btnDeleteComp) {
      btnDeleteComp.addEventListener('click', () => this.deleteSelectedComponent());
    }

    const btnDeselectComp = document.getElementById('btnDeselectComp');
    if (btnDeselectComp) {
      btnDeselectComp.addEventListener('click', () => {
        this.selectedComponentId = null;
        this.updateSelectionUI();
      });
    }

    // Wire Contextual Bar actions
    const btnDeleteWire = document.getElementById('btnDeleteWire');
    if (btnDeleteWire) {
      btnDeleteWire.addEventListener('click', () => {
        if (this.wr.selectedWireId) {
          this.wr.removeWire(this.wr.selectedWireId);
          this.evaluateCircuit();
          this.updateSelectionUI();
          if (this.backupManager) this.backupManager.scheduleAutoSave();
        }
      });
    }

    const btnDeselectWire = document.getElementById('btnDeselectWire');
    if (btnDeselectWire) {
      btnDeselectWire.addEventListener('click', () => {
        this.wr.selectedWireId = null;
        this.updateSelectionUI();
      });
    }

    // Backup & History Header Buttons
    const btnCreateBackup = document.getElementById('btnCreateBackup');
    if (btnCreateBackup) {
      btnCreateBackup.addEventListener('click', () => {
        if (this.backupManager) {
          this.backupManager.saveBackup();
        }
      });
    }

    const btnHistoryModal = document.getElementById('btnHistoryModal');
    const modalHistory = document.getElementById('historyModal');
    const btnCloseHistoryModal = document.getElementById('btnCloseHistoryModal');
    if (btnHistoryModal && modalHistory) {
      btnHistoryModal.addEventListener('click', () => {
        if (this.backupManager) this.backupManager.renderHistoryList();
        modalHistory.classList.remove('hidden');
      });
    }
    if (btnCloseHistoryModal && modalHistory) {
      btnCloseHistoryModal.addEventListener('click', () => modalHistory.classList.add('hidden'));
    }
    if (modalHistory) {
      modalHistory.addEventListener('click', (e) => {
        if (e.target === modalHistory) modalHistory.classList.add('hidden');
      });
    }

    // Modal Action Buttons inside History Modal
    const btnManualBackupModal = document.getElementById('btnManualBackupModal');
    if (btnManualBackupModal) {
      btnManualBackupModal.addEventListener('click', () => {
        if (this.backupManager) {
          this.backupManager.saveBackup();
        }
      });
    }

    const btnExportJSONModal = document.getElementById('btnExportJSONModal');
    if (btnExportJSONModal) {
      btnExportJSONModal.addEventListener('click', () => {
        if (this.backupManager) {
          this.backupManager.exportCurrentJSON();
        }
      });
    }

    const btnImportJSONModal = document.getElementById('btnImportJSONModal');
    const jsonFileInput = document.getElementById('jsonFileInput');
    if (btnImportJSONModal && jsonFileInput) {
      btnImportJSONModal.addEventListener('click', () => {
        jsonFileInput.value = '';
        jsonFileInput.click();
      });
      jsonFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0] && this.backupManager) {
          this.backupManager.importJSONFile(e.target.files[0]);
          modalHistory.classList.add('hidden');
        }
      });
    }

    const btnClearHistoryModal = document.getElementById('btnClearHistoryModal');
    if (btnClearHistoryModal) {
      btnClearHistoryModal.addEventListener('click', () => {
        if (confirm('هل أنت متأكد من رغبتك في مسح سجل النسخ الاحتياطية بالكامل؟')) {
          if (this.backupManager) this.backupManager.clearAllBackups();
        }
      });
    }

    // Rename Modal Actions
    const modalRename = document.getElementById('renameModal');
    const btnCloseRenameModal = document.getElementById('btnCloseRenameModal');
    const btnCancelRename = document.getElementById('btnCancelRename');
    const btnSaveRename = document.getElementById('btnSaveRename');

    if (btnCloseRenameModal && modalRename) {
      btnCloseRenameModal.addEventListener('click', () => modalRename.classList.add('hidden'));
    }
    if (btnCancelRename && modalRename) {
      btnCancelRename.addEventListener('click', () => modalRename.classList.add('hidden'));
    }
    if (btnSaveRename && modalRename) {
      btnSaveRename.addEventListener('click', () => {
        const inputAr = document.getElementById('inputRenameAr');
        const inputFr = document.getElementById('inputRenameFr');
        if (this.selectedComponentId && inputAr && inputFr) {
          this.cm.renameComponent(this.selectedComponentId, inputAr.value.trim(), inputFr.value.trim());
          this.updateSelectionUI();
          modalRename.classList.add('hidden');
          this.showToast('تم تحديث اسم المكون بنجاح', 'success');
          if (this.backupManager) this.backupManager.scheduleAutoSave();
        }
      });
    }

    // Action Buttons: Test, Solution, Undo, Reset, Sound, Export Image
    const btnTest = document.getElementById('btnTestCircuit');
    if (btnTest) {
      btnTest.addEventListener('click', () => this.runFullAudit());
    }

    const btnSolution = document.getElementById('btnSolution');
    if (btnSolution) {
      btnSolution.addEventListener('click', () => {
        this.engine.generateSolution();
        this.evaluateCircuit();
        this.runFullAudit();
        if (this.backupManager) this.backupManager.scheduleAutoSave();
      });
    }

    const btnReset = document.getElementById('btnReset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.wr.clear();
        this.evaluateCircuit();
        this.updateSelectionUI();
        this.updateDiagnosticsUI({
          status: 'idle',
          generalMessageAr: 'تم تفريغ جميع الأسلاك. اختر لون السلك المناسب وابدأ بربط الأطراف بحرية.',
          generalMessageFr: 'Tous les câbles ont été supprimés.',
          checks: [],
          colorWarnings: []
        });
        if (this.backupManager) this.backupManager.scheduleAutoSave();
      });
    }

    const btnUndo = document.getElementById('btnUndo');
    if (btnUndo) {
      btnUndo.addEventListener('click', () => {
        this.wr.undo();
        this.evaluateCircuit();
        this.updateSelectionUI();
        if (this.backupManager) this.backupManager.scheduleAutoSave();
      });
    }

    const btnSound = document.getElementById('btnToggleSound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const isEnabled = this.sound.toggleSound();
        const icon = btnSound.querySelector('i');
        const text = btnSound.querySelector('span');
        if (icon) {
          icon.className = isEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        }
        if (text) {
          text.textContent = isEnabled ? 'صوت مفعّل' : 'صوت مكتوم';
        }
      });
    }

    const btnExport = document.getElementById('btnExport');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportCanvasImage());
    }

    // Schema Modal
    const btnSchema = document.getElementById('btnSchemaModal');
    const modalSchema = document.getElementById('schemaModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    if (btnSchema && modalSchema) {
      btnSchema.addEventListener('click', () => {
        this.updateSchemaModalContent();
        modalSchema.classList.remove('hidden');
      });
    }
    if (btnCloseModal && modalSchema) {
      btnCloseModal.addEventListener('click', () => modalSchema.classList.add('hidden'));
    }
    if (modalSchema) {
      modalSchema.addEventListener('click', (e) => {
        if (e.target === modalSchema) modalSchema.classList.add('hidden');
      });
    }

    // Keyboard Shortcuts (Delete, Undo, and Color number shortcuts 1-6)
    window.addEventListener('keydown', (e) => {
      // Don't intercept typing in modal inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.wr.selectedWireId) {
          this.wr.removeWire(this.wr.selectedWireId);
          this.evaluateCircuit();
          this.updateSelectionUI();
          if (this.backupManager) this.backupManager.scheduleAutoSave();
        } else if (this.selectedComponentId) {
          this.deleteSelectedComponent();
        }
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        this.wr.undo();
        this.evaluateCircuit();
        this.updateSelectionUI();
      } else if (e.key === '1') {
        this.triggerColorSelect('#dc2626', 'phase');
      } else if (e.key === '2') {
        this.triggerColorSelect('#2563eb', 'neutre');
      } else if (e.key === '3') {
        this.triggerColorSelect('#16a34a', 'terre');
      } else if (e.key === '4') {
        this.triggerColorSelect('#18181b', 'retour');
      } else if (e.key === '5') {
        this.triggerColorSelect('#78350f', 'retour');
      } else if (e.key === '6') {
        this.triggerColorSelect('#ea580c', 'navette');
      }
    });

    // Pointer Events for Canvas
    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
    window.addEventListener('mouseup', (e) => this.onPointerUp(e));

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onPointerDown(touch);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onPointerMove(touch);
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      this.onPointerUp(e);
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.isConnecting) {
        this.cancelConnecting();
        return;
      }
      const coords = this.getCanvasCoords(e);
      const wire = this.wr.getWireAt(coords.x, coords.y);
      if (wire) {
        this.wr.removeWire(wire.id);
        this.evaluateCircuit();
        this.updateSelectionUI();
        if (this.backupManager) this.backupManager.scheduleAutoSave();
      }
    });
  }

  triggerColorSelect(color, wireType) {
    const btn = document.querySelector(`[data-color="${color}"]`);
    if (btn) this.setActiveColor(color, wireType, btn);

    if (this.wr.selectedWireId) {
      this.wr.updateWireColor(this.wr.selectedWireId, color, wireType);
      this.evaluateCircuit();
      this.updateSelectionUI();
      if (this.backupManager) this.backupManager.scheduleAutoSave();
    }
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  onPointerDown(e) {
    const coords = this.getCanvasCoords(e);
    this.pointerDownPos = coords;

    // 1. Terminal Pin click (Multiple wires allowed on any pin for natural repiquage)
    const pin = this.cm.getTerminalAt(coords.x, coords.y);
    if (pin) {
      if (!this.isConnecting) {
        this.isConnecting = true;
        this.startPin = pin;
        this.mousePos = coords;
      } else {
        if (pin.id !== this.startPin.id) {
          this.wr.addWire(this.startPin, pin);
          this.evaluateCircuit();
          if (this.backupManager) this.backupManager.scheduleAutoSave();
        }
        this.cancelConnecting();
      }
      return;
    }

    if (this.isConnecting) {
      this.cancelConnecting();
      return;
    }

    // 2. Component click / drag start
    const comp = this.cm.getComponentAt(coords.x, coords.y);
    if (comp) {
      this.selectedComponentId = comp.id;
      this.draggedComponent = comp;
      this.isDraggingComponent = true;
      this.dragOffset = { x: coords.x - comp.x, y: coords.y - comp.y };
      this.hasDraggedComponent = false;

      this.wr.selectedWireId = null;
      this.updateSelectionUI();
      return;
    }

    // 3. Existing wire click
    const clickedWire = this.wr.getWireAt(coords.x, coords.y);
    if (clickedWire) {
      if (this.wr.selectedWireId === clickedWire.id) {
        this.wr.removeWire(clickedWire.id);
        this.evaluateCircuit();
        this.updateSelectionUI();
        if (this.backupManager) this.backupManager.scheduleAutoSave();
      } else {
        this.wr.selectedWireId = clickedWire.id;
        this.selectedComponentId = null;
        this.updateSelectionUI();
      }
      return;
    }

    // Clicked on empty canvas background -> clear selection
    this.selectedComponentId = null;
    this.wr.selectedWireId = null;
    this.updateSelectionUI();
  }

  onPointerMove(e) {
    const coords = this.getCanvasCoords(e);
    this.mousePos = coords;

    // A. Handle Component Dragging
    if (this.isDraggingComponent && this.draggedComponent) {
      const dx = coords.x - this.pointerDownPos.x;
      const dy = coords.y - this.pointerDownPos.y;
      if (Math.hypot(dx, dy) > 4) {
        this.hasDraggedComponent = true;
      }

      const canvasW = this.canvas.width / (window.devicePixelRatio || 1);
      const canvasH = this.canvas.height / (window.devicePixelRatio || 1);

      const newX = Math.max(10, Math.min(canvasW - this.draggedComponent.width - 10, coords.x - this.dragOffset.x));
      const newY = Math.max(10, Math.min(canvasH - this.draggedComponent.height - 10, coords.y - this.dragOffset.y));

      this.draggedComponent.x = newX;
      this.draggedComponent.y = newY;

      this.cm.rebuildTerminalsIndex();
      this.wr.recomputeAllPaths(this.cm);

      this.canvas.style.cursor = 'grabbing';
      this.updateHoverInfo(null, null);
      return;
    }

    // B. Handle Hover Testing
    const pin = this.cm.getTerminalAt(coords.x, coords.y);
    this.hoveredPin = pin;

    const wire = this.wr.getWireAt(coords.x, coords.y);
    this.hoveredWire = wire;
    this.wr.hoveredWireId = wire ? wire.id : null;

    const compUnderMouse = this.cm.getComponentAt(coords.x, coords.y);

    if (pin || wire) {
      this.canvas.style.cursor = 'pointer';
    } else if (compUnderMouse) {
      this.canvas.style.cursor = 'grab';
    } else {
      this.canvas.style.cursor = 'default';
    }

    this.updateHoverInfo(pin, wire);
  }

  onPointerUp(e) {
    const coords = this.getCanvasCoords(e);

    // If was connecting wire
    if (this.isConnecting && this.startPin) {
      const pin = this.cm.getTerminalAt(coords.x, coords.y);
      if (pin && pin.id !== this.startPin.id) {
        this.wr.addWire(this.startPin, pin);
        this.evaluateCircuit();
        this.cancelConnecting();
        if (this.backupManager) this.backupManager.scheduleAutoSave();
      }
    }

    // If was dragging component
    if (this.isDraggingComponent) {
      if (!this.hasDraggedComponent) {
        // It was a quick tap/click without moving! Check for switch/lever toggle
        const switchHandled = this.cm.handleClick(coords.x, coords.y);
        if (switchHandled) {
          this.evaluateCircuit();
        }
      } else {
        // Component was dragged and moved -> schedule auto backup
        if (this.backupManager) this.backupManager.scheduleAutoSave();
      }

      this.isDraggingComponent = false;
      this.draggedComponent = null;
      this.canvas.style.cursor = 'default';
    }
  }

  cancelConnecting() {
    this.isConnecting = false;
    this.startPin = null;
  }

  deleteSelectedComponent() {
    if (!this.selectedComponentId) return;
    const comp = this.cm.getComponentById(this.selectedComponentId);
    if (!comp) return;

    const compName = comp.labelAr || comp.labelFr;
    this.cm.removeComponent(this.selectedComponentId);
    this.selectedComponentId = null;
    this.updateSelectionUI();
    this.evaluateCircuit();
    this.showToast(`تم حذف ${compName} وجميع أسلاكه`, 'info');
    if (this.backupManager) this.backupManager.scheduleAutoSave();
  }

  openRenameModal() {
    if (!this.selectedComponentId) return;
    const comp = this.cm.getComponentById(this.selectedComponentId);
    if (!comp) return;

    const modal = document.getElementById('renameModal');
    const inputAr = document.getElementById('inputRenameAr');
    const inputFr = document.getElementById('inputRenameFr');

    if (modal && inputAr && inputFr) {
      inputAr.value = comp.labelAr || '';
      inputFr.value = comp.labelFr || '';
      modal.classList.remove('hidden');
      inputAr.focus();
    }
  }

  updateSelectionUI() {
    const compBar = document.getElementById('compSelectionBar');
    const wireBar = document.getElementById('wireSelectionBar');
    const compLabel = document.getElementById('selectedCompLabel');
    const wireLabel = document.getElementById('selectedWireLabel');

    if (this.selectedComponentId) {
      const comp = this.cm.getComponentById(this.selectedComponentId);
      if (comp && compBar && compLabel) {
        compLabel.textContent = `${comp.labelAr} (${comp.labelFr})`;
        compBar.classList.remove('hidden');
      } else if (compBar) {
        compBar.classList.add('hidden');
      }
    } else if (compBar) {
      compBar.classList.add('hidden');
    }

    if (this.wr.selectedWireId) {
      const wire = this.wr.wires.find(w => w.id === this.wr.selectedWireId);
      if (wire && wireBar && wireLabel) {
        wireLabel.textContent = `سلك ${wire.type.toUpperCase()}`;
        wireBar.classList.remove('hidden');
      } else if (wireBar) {
        wireBar.classList.add('hidden');
      }
    } else if (wireBar) {
      wireBar.classList.add('hidden');
    }
  }

  updateHoverInfo(pin, wire) {
    const infoEl = document.getElementById('terminalHoverInfo');
    if (!infoEl) return;

    if (pin) {
      infoEl.innerHTML = `
        <span class="inline-block w-2.5 h-2.5 rounded-full bg-slate-400 mr-1.5 border border-slate-600"></span>
        <span class="font-bold text-slate-100 font-mono-tech">${pin.name}</span>
        <span class="text-slate-500 mx-2">|</span>
        <span class="text-slate-400">انقر للربط (يمكن وصل عدة أسلاك على نفس الطرف للتسلسل)</span>
      `;
    } else if (wire) {
      infoEl.innerHTML = `
        <span class="text-amber-400 font-bold">⚡ سلك موصول:</span>
        <span class="text-slate-200 font-tech mr-1">${wire.type.toUpperCase()}</span>
        <span class="text-slate-500 mx-2">|</span>
        <span class="text-rose-400 font-semibold">انقر لتحديده أو اضغط Delete لحذف السلك</span>
      `;
    } else if (this.isConnecting) {
      infoEl.innerHTML = `
        <span class="text-emerald-400 font-bold animate-pulse">● جارِ التوصيل من:</span>
        <span class="text-white font-mono-tech mr-1">${this.startPin.name}</span>
        <span class="text-slate-400">-> انقر على طرف المكون الهدف لربط السلك</span>
      `;
    } else if (this.selectedComponentId) {
      const comp = this.cm.getComponentById(this.selectedComponentId);
      infoEl.innerHTML = `
        <span class="text-cyan-400 font-bold">✥ جهاز محدد:</span>
        <span class="text-white font-semibold mr-1">${comp ? comp.labelAr : ''}</span>
        <span class="text-slate-500 mx-2">|</span>
        <span class="text-slate-300">اسحب بالماوس لتحريكه أو اضغط Delete لحذفه</span>
      `;
    } else {
      infoEl.innerHTML = `<span class="text-slate-500">حرّك المؤشر فوق أي مأخذ (Borne) أو قاطعة للتفاعل معها، أو اسحب أي جهاز لنقله</span>`;
    }
  }

  setActiveColor(color, wireType, activeBtn) {
    this.wr.setColor(color, wireType);
    document.querySelectorAll('[data-color]').forEach(b => {
      b.classList.remove('ring-4', 'ring-white', 'shadow-lg');
    });
    if (activeBtn) {
      activeBtn.classList.add('ring-4', 'ring-white', 'shadow-lg');
    }
  }

  setCircuitMode(mode) {
    this.currentMode = mode;
    this.cm.setMode(mode, this.vvVariant);
    this.wr.clear();
    this.selectedComponentId = null;
    this.updateSelectionUI();

    document.querySelectorAll('[data-mode]').forEach(btn => {
      const btnMode = btn.getAttribute('data-mode');
      if (btnMode === mode) {
        btn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
        btn.classList.remove('bg-slate-800', 'text-slate-300', 'hover:bg-slate-700');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        btn.classList.add('bg-slate-800', 'text-slate-300', 'hover:bg-slate-700');
      }
    });

    const vvVariantsBar = document.getElementById('vvVariantsBar');
    if (vvVariantsBar) {
      if (mode === 'VV') {
        vvVariantsBar.classList.remove('hidden');
      } else {
        vvVariantsBar.classList.add('hidden');
      }
    }

    this.updateModeHeader(mode);
    this.evaluateCircuit();

    this.updateDiagnosticsUI({
      status: 'idle',
      generalMessageAr: 'تم تجهيز اللوحة بنمط التعلّم الذاتي. الأطراف واقعية دون تلميحات مسبقة. اختر لون السلك المناسب وابدأ التوصيل.',
      generalMessageFr: 'Mode Apprentissage Autonome actif.',
      checks: [],
      colorWarnings: []
    });
  }

  setVvVariant(variant) {
    this.vvVariant = variant;
    this.cm.setVvVariant(variant);
    this.wr.clear();
    this.selectedComponentId = null;
    this.updateSelectionUI();

    document.querySelectorAll('[data-vv-variant]').forEach(btn => {
      const bVar = btn.getAttribute('data-vv-variant');
      if (bVar === variant) {
        btn.classList.add('bg-amber-600', 'text-white', 'shadow');
        btn.classList.remove('bg-slate-800', 'text-slate-300');
      } else {
        btn.classList.remove('bg-amber-600', 'text-white', 'shadow');
        btn.classList.add('bg-slate-800', 'text-slate-300');
      }
    });

    this.updateModeHeader('VV');
    this.evaluateCircuit();
  }

  updateModeHeader(mode) {
    const titleEl = document.getElementById('currentCircuitTitle');
    const descEl = document.getElementById('currentCircuitDesc');
    if (!titleEl || !descEl) return;

    switch (mode) {
      case 'SA':
        titleEl.textContent = '1. الإنارة البسيطة (Simple Allumage - SA)';
        descEl.textContent = 'قاطع 10A يغذي قاطعة بسيطة واحدة للتحكم في مصباح منفرد E1 وفق معيار NFC 15-100.';
        break;
      case 'DA':
        titleEl.textContent = '2. الإنارة المزدوجة (Double Allumage - DA) [قاطعتان مستقلتان]';
        descEl.textContent = 'قاطعتان منفصلتان جنباً إلى جنب: القاطعة 1 تتحكم في مصباحين بالتوازي (E1 و E2)، والقاطعة 2 تتحكم في مصباح (E3)، مع ربط أسلاك متعددة على نفس الطرف للتوزيع المتسلسل (Repiquage).';
        break;
      case 'VV':
        if (this.vvVariant === 'FR') {
          titleEl.textContent = '3. الذهاب والإياب (Va-et-vient) - المعيار الفرنسي (NFC 15-100)';
          descEl.textContent = 'التركيب القياسي: طور إلى L في القاطعة 1، سلكا تبادل (Navettes) بين 1-1 و 2-2، وراجع المصباح من L في القاطعة 2.';
        } else if (this.vvVariant === 'DE') {
          titleEl.textContent = '3. الذهاب والإياب (Va-et-vient) - التركيب الاقتصادي الألماني (Sparwechselschaltung)';
          descEl.textContent = 'المعيار الألماني VDE: الطور موصول بالطرف 1 للمفتاحين، وراجع المصباح بالطرف 2 للمفتاحين، وسلك تبادل وحيد بين قطبي L.';
        } else if (this.vvVariant === 'US') {
          titleEl.textContent = '3. الذهاب والإياب (3-Way Switches) - المعيار الأمريكي (NEC)';
          descEl.textContent = 'المعيار الأمريكي: سلك الخط Hot Line إلى Common في المفتاح الأول، وسلكا المسار Travelers بين T1-T1 و T2-T2، والمخرج من Common في المفتاح الثاني.';
        }
        break;
      case 'TL':
        titleEl.textContent = '4. المرحل النبضي (Télérupteur 4 Fils) - 3 أزرار ضاغطة ومصابيح متوازية';
        descEl.textContent = 'التحكم بالإنارة من 3 مواضع عبر أزرار ضاغطة (BP1, BP2, BP3) موصولة على التوازي بالوشيعة A1-A2 مع مصابيح بالتسلسل.';
        break;
      default:
        titleEl.textContent = 'تركيب كهربائي مخصص (Circuit Personnalisé)';
        descEl.textContent = 'لوحة عمل حرة تمكنك من إضافة وتعديل وتحريك وحذف المكونات وتوصيلها بحرية تامة.';
        break;
    }
  }

  evaluateCircuit() {
    return this.engine.simulate();
  }

  handlePushButtonImpulse(bpId) {
    this.engine.triggerPushButtonImpulse(bpId);
    this.evaluateCircuit();
  }

  runFullAudit() {
    const report = this.engine.evaluateAudit();
    this.updateDiagnosticsUI(report);
  }

  updateDiagnosticsUI(report) {
    const badge = document.getElementById('auditStatusBadge');
    const summaryMsg = document.getElementById('auditSummaryMessage');
    const checklist = document.getElementById('auditChecklist');
    const warningsList = document.getElementById('auditWarningsList');

    if (!badge || !summaryMsg || !checklist) return;

    if (report.status === 'success') {
      badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      badge.textContent = '● دارة سليمة ومكتملة (Conforme)';
    } else if (report.status === 'error') {
      badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30';
      badge.textContent = '✕ أخطاء في التوصيل (Non conforme)';
    } else {
      badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30';
      badge.textContent = '○ بانتظار الفحص والتوصيل';
    }

    summaryMsg.textContent = report.generalMessageAr || '';

    checklist.innerHTML = '';
    if (report.checks && report.checks.length > 0) {
      report.checks.forEach(chk => {
        const li = document.createElement('li');
        li.className = `flex items-start gap-2 p-2 rounded-lg text-xs ${
          chk.pass ? 'bg-emerald-950/30 border border-emerald-800/40 text-emerald-200' : 'bg-slate-800/60 border border-slate-700 text-slate-300'
        }`;
        li.innerHTML = `
          <span class="text-sm ${chk.pass ? 'text-emerald-400' : 'text-slate-500'}">${chk.pass ? '✓' : '○'}</span>
          <div>
            <div class="font-bold">${chk.label}</div>
            <div class="text-[11px] text-slate-400">${chk.desc}</div>
          </div>
        `;
        checklist.appendChild(li);
      });
    }

    if (warningsList) {
      warningsList.innerHTML = '';
      if (report.colorWarnings && report.colorWarnings.length > 0) {
        report.colorWarnings.forEach(w => {
          const div = document.createElement('div');
          div.className = 'p-2 rounded bg-amber-950/40 border border-amber-700/50 text-amber-300 text-xs font-semibold';
          div.textContent = w;
          warningsList.appendChild(div);
        });
      }
    }
  }

  updateSchemaModalContent() {
    const title = document.getElementById('schemaModalTitle');
    const content = document.getElementById('schemaModalContent');
    if (!title || !content) return;

    const mode = this.currentMode;
    switch (mode) {
      case 'SA':
        title.textContent = 'المخطط النظري: الإنارة البسيطة (Simple Allumage)';
        content.innerHTML = `
          <div class="space-y-4 text-slate-300 text-sm">
            <div class="p-3 bg-slate-800 rounded-lg border border-slate-700">
              <h4 class="font-bold text-sky-400 mb-1">المبدأ الكهربائي (NFC 15-100):</h4>
              <p>تغذى القاطعة بسلك الطور (Phase - Rouge) وتخرج بسلك الراجع (Retour - Noir) نحو المصباح E1. يتصل المصباح مباشرة بالسلك المحايد (Neutre - Bleu) وسلك التأريض (Terre PE - Jaune/Vert).</p>
            </div>
          </div>
        `;
        break;

      case 'DA':
        title.textContent = 'المخطط النظري: الإنارة المزدوجة (Double Allumage)';
        content.innerHTML = `
          <div class="space-y-4 text-slate-300 text-sm">
            <div class="p-3 bg-blue-950/40 rounded-lg border border-blue-800">
              <h4 class="font-bold text-blue-300 mb-1">المواصفة المعتمدة للإنارة المزدوجة:</h4>
              <p>قاطعتان منفصلتان جنباً إلى جنب تشتركان في طور التغذية (L):</p>
              <ul class="list-disc list-inside mt-2 space-y-1 text-xs">
                <li><b class="text-white">القاطعة 1 (Interrupteur 1):</b> تتحكم في مصباحين على التوازي (Lampe E1 + Lampe E2).</li>
                <li><b class="text-white">القاطعة 2 (Interrupteur 2):</b> تتحكم في مصباح منفرد (Lampe E3).</li>
                <li><b class="text-white">التسلسل الواقعي (Repiquage):</b> يتم ربط سلكي المحايد والتأريض مباشرة على نفس الطرف اللولبي (N و PE) للمصابيح للتسلسل الطبيعي كما في العلب الحقيقية.</li>
              </ul>
            </div>
          </div>
        `;
        break;

      case 'VV':
        title.textContent = 'المخطط النظري: مقارنة معايير الذهاب والإياب الدولية (VV Standards)';
        content.innerHTML = `
          <div class="space-y-4 text-slate-300 text-sm">
            <div class="p-3 bg-slate-800 rounded-lg border border-slate-700">
              <h4 class="font-bold text-sky-400 mb-1">1. المعيار الفرنسي 🇫🇷 (NFC 15-100 Standard):</h4>
              <p class="text-xs">الطور يدخل إلى القطب المشترك L للقاطعة الأولى، وسلكا التبادل (Navettes) يربطان بين 1-1 و 2-2، والمشترك L للقاطعة الثانية يغذي راجع المصابيح.</p>
            </div>

            <div class="p-3 bg-amber-950/30 rounded-lg border border-amber-800/60">
              <h4 class="font-bold text-amber-300 mb-1">2. التركيب الاقتصادي الألماني 🇩🇪 (Sparwechselschaltung - VDE):</h4>
              <p class="text-xs">يتم ربط الطور بالطرف 1 في كلا المفتاحين، وراجع المصباح بالطرف 2 في كلا المفتاحين، بينما يربط سلك تبادل وحيد (Einzeldraht) بين قطبي L. يوفر هذا التركيب سلكاً كاملاً في الأنابيب مقارنة بالتركيب التقليدي.</p>
            </div>

            <div class="p-3 bg-indigo-950/30 rounded-lg border border-indigo-800/60">
              <h4 class="font-bold text-indigo-300 mb-1">3. المعيار الأمريكي 🇺🇸 (US 3-Way Switch - NEC):</h4>
              <p class="text-xs">يحتوي المفتاح الأمريكي ثلاثي المسار على برغي داكن (Common) وبرغيين نحاسيين (Travelers). سلك الخط Hot Line يدخل إلى Common في المفتاح الأول، ويسري عبر سلكي Travelers نحو المفتاح الثاني، ويخرج من Common للمصباح.</p>
            </div>
          </div>
        `;
        break;

      case 'TL':
        title.textContent = 'المخطط النظري: المرحل النبضي بـ 3 أزرار ضاغطة (Télérupteur 4 Fils)';
        content.innerHTML = `
          <div class="space-y-4 text-slate-300 text-sm">
            <div class="p-3 bg-slate-800 rounded-lg border border-slate-700">
              <h4 class="font-bold text-sky-400 mb-1">دارة المرحل النبضي 4 أسلاك بـ 3 أزرار ضاغطة:</h4>
              <p class="text-xs">تستخدم في المنشآت الحقيقية (الممرات، السلالم، المداخل) للتحكم من 3 مواضع أو أكثر (BP1: مدخل، BP2: ممر، BP3: درج). تتصل جميع الأزرار الضاغطة على التوازي بالطور وتغذي وشيعة المرحل A1 بنبضة إغلاق مؤقتة تغير حالة ملامس القدرة 1-2 لتشغيل أو إطفاء المصابيح المتوازية.</p>
            </div>
          </div>
        `;
        break;
    }
  }

  exportCanvasImage() {
    const link = document.createElement('a');
    link.download = `Schema_${this.currentMode}_NFC15-100.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const colorClasses = type === 'success'
      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600/50'
      : (type === 'error' ? 'bg-rose-950/90 text-rose-300 border-rose-600/50' : 'bg-slate-900/90 text-slate-200 border-slate-700');

    toast.className = `pointer-events-auto p-3 rounded-xl border shadow-xl flex items-center gap-2 text-xs font-semibold backdrop-blur transition-all duration-300 transform translate-y-2 opacity-0 ${colorClasses}`;
    toast.innerHTML = `
      <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-emerald-400' : (type === 'error' ? 'fa-triangle-exclamation text-rose-400' : 'fa-circle-info text-sky-400')}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ANIMATION LOOP: STRICT Z-INDEX WIRE LAYERING GUARANTEE
  // 1. Component Bodies -> 2. Selection Box -> 3. Wires (ON TOP!) -> 4. Terminal Screws
  startLoop() {
    const render = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Layer 1: Component Bodies
      this.cm.renderBodies(this.ctx);

      // Layer 2: Selection Outlines & Drag Handles
      this.cm.renderSelection(this.ctx, this.selectedComponentId);

      // Layer 3: Wires on Top of Component Bodies
      this.wr.render(this.ctx, this.startPin, this.mousePos);

      // Layer 4: Terminal Screws on Top of Wires
      this.cm.renderTerminals(this.ctx, this.hoveredPin, this.startPin);

      this.animationId = requestAnimationFrame(render);
    };

    render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new SimulatorApp();
  window.app.init();
});
