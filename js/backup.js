/**
 * Auto-Backup & History Management System
 * Conforms to NFC 15-100 Educational Simulator Standards
 * - Supports automatic backups to localStorage
 * - Manual snapshot creation ("💾 إنشاء نسخة احتياطية")
 * - JSON backup file export (download) and import (upload)
 * - Complete workspace state restoration
 */

class BackupManager {
  constructor(app) {
    this.app = app;
    this.STORAGE_KEY = 'nfc15_simulator_backups_v2';
    this.AUTO_INTERVAL_MS = 45000; // 45 seconds
    this.autoTimer = null;
    this.debounceTimer = null;
    this.maxBackups = 25; // Keep up to 25 snapshots
  }

  init() {
    this.startAutoBackupLoop();
    this.renderHistoryList();
  }

  startAutoBackupLoop() {
    if (this.autoTimer) clearInterval(this.autoTimer);
    this.autoTimer = setInterval(() => {
      // Auto save if there are components or wires
      if (this.app.cm && this.app.cm.components.length > 0) {
        this.saveBackup(null, true);
      }
    }, this.AUTO_INTERVAL_MS);
  }

  scheduleAutoSave() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (this.app.cm && this.app.cm.components.length > 0) {
        this.saveBackup(null, true);
      }
    }, 2000);
  }

  getAllBackups() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to read backups from localStorage:', e);
      return [];
    }
  }

  saveBackupsList(list) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      this.renderHistoryList();
    } catch (e) {
      console.error('Failed to write backups to localStorage:', e);
      if (this.app && this.app.showToast) {
        this.app.showToast('تعذر حفظ النسخة: مساحة التخزين ممتلئة', 'error');
      }
    }
  }

  saveBackup(customName = null, isAuto = false) {
    if (!this.app || !this.app.cm || !this.app.wr) return null;

    const list = this.getAllBackups();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });

    let defaultName = '';
    const mode = this.app.currentMode || 'CUSTOM';
    const compCount = this.app.cm.components.length;
    const wireCount = this.app.wr.wires.length;

    if (customName) {
      defaultName = customName;
    } else if (isAuto) {
      defaultName = `نسخة تلقائية (${mode}) - ${timeStr}`;
    } else {
      defaultName = `نسخة احتياطية (${mode}) - ${timeStr}`;
    }

    const backup = {
      id: 'bk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: defaultName,
      timestamp: Date.now(),
      dateStr: `${dateStr} ${timeStr}`,
      mode: mode,
      vvVariant: this.app.vvVariant || 'FR',
      isAuto: isAuto,
      componentCount: compCount,
      wireCount: wireCount,
      summary: `${compCount} أجهزة | ${wireCount} أسلاك`,
      components: JSON.parse(JSON.stringify(this.app.cm.components)),
      wires: JSON.parse(JSON.stringify(this.app.wr.wires))
    };

    // If auto backup, avoid saving duplicate states if nothing changed
    if (isAuto && list.length > 0) {
      const last = list[0];
      if (last.componentCount === compCount && last.wireCount === wireCount) {
        const lastCompJson = JSON.stringify(last.components);
        const currCompJson = JSON.stringify(backup.components);
        const lastWireJson = JSON.stringify(last.wires);
        const currWireJson = JSON.stringify(backup.wires);
        if (lastCompJson === currCompJson && lastWireJson === currWireJson) {
          // Exactly identical state, skip auto-duplication
          return last;
        }
      }
    }

    // Add to top of list
    list.unshift(backup);

    // Prune old backups if exceeding limit
    if (list.length > this.maxBackups) {
      list.splice(this.maxBackups);
    }

    this.saveBackupsList(list);

    if (!isAuto && this.app && this.app.showToast) {
      this.app.showToast(`💾 تم إنشاء النسخة الاحتياطية بنجاح: "${backup.name}"`, 'success');
      if (window.soundEngine) window.soundEngine.playWireConnect();
    }

    return backup;
  }

  restoreBackup(backupId) {
    const list = this.getAllBackups();
    const backup = list.find(b => b.id === backupId);
    if (!backup) {
      if (this.app && this.app.showToast) this.app.showToast('تعذر العثور على النسخة الاحتياطية', 'error');
      return false;
    }

    return this.applyState(backup);
  }

  applyState(state) {
    try {
      this.app.currentMode = state.mode || 'CUSTOM';
      this.app.vvVariant = state.vvVariant || 'FR';

      // Restore components
      this.app.cm.components = JSON.parse(JSON.stringify(state.components || []));
      this.app.cm.rebuildTerminalsIndex();

      // Restore wires
      this.app.wr.wires = JSON.parse(JSON.stringify(state.wires || []));
      this.app.wr.selectedWireId = null;
      this.app.wr.hoveredWireId = null;
      this.app.wr.recomputeAllPaths(this.app.cm);

      // Deselect any component
      if (this.app.selectedComponentId) {
        this.app.selectedComponentId = null;
      }

      // Update UI mode header and tabs
      this.app.updateModeHeader(this.app.currentMode);
      this.app.updateSelectionUI();

      // Run simulation & audit
      this.app.evaluateCircuit();

      if (this.app.showToast) {
        this.app.showToast(`✅ تمت استعادة الحالة بنجاح (${state.componentCount || state.components.length} مكونات)`, 'success');
      }
      if (window.soundEngine) window.soundEngine.playSuccessChime();

      return true;
    } catch (err) {
      console.error('Error applying state:', err);
      if (this.app && this.app.showToast) {
        this.app.showToast('حدث خطأ أثناء استعادة النسخة الاحتياطية', 'error');
      }
      return false;
    }
  }

  deleteBackup(backupId) {
    let list = this.getAllBackups();
    list = list.filter(b => b.id !== backupId);
    this.saveBackupsList(list);
    if (this.app && this.app.showToast) {
      this.app.showToast('تم حذف النسخة من السجل', 'info');
    }
  }

  clearAllBackups() {
    this.saveBackupsList([]);
    if (this.app && this.app.showToast) {
      this.app.showToast('تم تفريغ سجل النسخ الاحتياطية بالكامل', 'info');
    }
  }

  exportCurrentJSON() {
    const backup = {
      version: '2.0',
      system: 'NFC 15-100 Electrical Wiring Simulator',
      exportedAt: new Date().toISOString(),
      mode: this.app.currentMode || 'CUSTOM',
      vvVariant: this.app.vvVariant || 'FR',
      components: JSON.parse(JSON.stringify(this.app.cm.components)),
      wires: JSON.parse(JSON.stringify(this.app.wr.wires))
    };

    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const dateSlug = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.download = `schema_backup_${backup.mode}_${dateSlug}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    if (this.app && this.app.showToast) {
      this.app.showToast('📥 تم تصدير ملف النسخة الاحتياطية (JSON) بنجاح', 'success');
    }
  }

  importJSONFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data || !Array.isArray(data.components)) {
          throw new Error('الملف لا يحتوي على بنية دارة كهربائية صالحة');
        }

        this.applyState({
          mode: data.mode || 'CUSTOM',
          vvVariant: data.vvVariant || 'FR',
          components: data.components,
          wires: data.wires || [],
          componentCount: data.components.length,
          wireCount: (data.wires || []).length
        });

        // Also add to history as an imported backup
        this.saveBackup(`ملف مستورد: ${file.name.replace('.json', '')}`, false);

      } catch (err) {
        console.error('Failed to import JSON file:', err);
        if (this.app && this.app.showToast) {
          this.app.showToast(`خطأ في استيراد الملف: ${err.message}`, 'error');
        }
      }
    };
    reader.readAsText(file);
  }

  renderHistoryList() {
    const container = document.getElementById('historyItemsList');
    const emptyState = document.getElementById('historyEmptyState');
    if (!container) return;

    const backups = this.getAllBackups();
    if (backups.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    container.innerHTML = '';

    backups.forEach(b => {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition flex items-center justify-between gap-3';

      const typeBadge = b.isAuto
        ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">تلقائي Auto</span>'
        : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">يدوي Manuel</span>';

      const modeBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">${b.mode}</span>`;

      card.innerHTML = `
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-9 h-9 rounded-lg ${b.isAuto ? 'bg-sky-950/60 text-sky-400' : 'bg-emerald-950/60 text-emerald-400'} flex items-center justify-center shrink-0 border border-slate-700">
            <i class="fa-solid ${b.isAuto ? 'fa-clock-rotate-left' : 'fa-floppy-disk'}"></i>
          </div>
          <div class="overflow-hidden">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-xs text-white truncate">${b.name}</span>
              ${typeBadge}
              ${modeBadge}
            </div>
            <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
              <span><i class="fa-regular fa-clock ml-1 text-slate-500"></i>${b.dateStr}</span>
              <span><i class="fa-solid fa-microchip ml-1 text-slate-500"></i>${b.summary}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button data-restore-id="${b.id}" class="btn-action px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow flex items-center gap-1">
            <i class="fa-solid fa-rotate-left"></i>
            <span>استعادة</span>
          </button>
          <button data-delete-id="${b.id}" class="btn-action p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 hover:text-white text-xs" title="حذف من السجل">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;

      // Event listeners for card buttons
      const btnRestore = card.querySelector(`[data-restore-id="${b.id}"]`);
      if (btnRestore) {
        btnRestore.addEventListener('click', () => {
          this.restoreBackup(b.id);
          const modal = document.getElementById('historyModal');
          if (modal) modal.classList.add('hidden');
        });
      }

      const btnDelete = card.querySelector(`[data-delete-id="${b.id}"]`);
      if (btnDelete) {
        btnDelete.addEventListener('click', () => {
          this.deleteBackup(b.id);
        });
      }

      container.appendChild(card);
    });
  }
}

window.BackupManager = BackupManager;
