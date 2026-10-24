function isGoogleDriveLink(str) {
  if (!str || typeof str !== 'string') return false;
  return /drive\.google\.com|docs\.google\.com/i.test(str) || /^gdrive:[a-zA-Z0-9_-]{20,}/i.test(str);
}
function extractGoogleDriveFileId(str) {
  if (!str || typeof str !== 'string') return null;
  const match = str.match(/(?:\/d\/|id=|file\/d\/|gdrive:)([a-zA-Z0-9_-]{20,})/i);
  return match ? match[1] : null;
}


/* ----- Enhanced Document Upload UI System ----- */
const DOC_CACHE = window._DOC_CACHE || (window._DOC_CACHE = {});

function renderDocSlotHtml(type, label, iconSvg, rawPath, appId = null) {
  const p = cleanFilePath(rawPath);
  const hasFile = p && p.toUpperCase() !== 'NA';
  const prefix = appId ? `p_${type}` : `af_${type}`;
  const key = type === 'resume' ? 'resume_path' : 'cover_letter_path';

  if (hasFile) {
    const isGdrive = isGoogleDriveLink(p);
    let fn = p.split(/[\\/]/).pop() || p;
    let badgeCls, badgeIcon;

    if (isGdrive) {
      if (DOC_CACHE[p] && DOC_CACHE[p].name) {
        fn = DOC_CACHE[p].name;
      } else {
        fn = `${label} (Google Drive Document)`;
      }
      badgeCls = 'gdrive';
      badgeIcon = ICON.gdrive;
    } else {
      const ext = (fn.split('.').pop() || '').toLowerCase();
      const isDoc = ext === 'doc' || ext === 'docx';
      const isPdf = ext === 'pdf';
      badgeCls = isPdf ? 'pdf' : (isDoc ? 'docx' : 'other');
      badgeIcon = isPdf ? ICON.filePdf : (isDoc ? ICON.fileWord : ICON.document);
    }

    return `
      <div class="doc-slot-container" id="${prefix}_slot">
        <div class="doc-card-box">
          <div class="doc-type-icon-badge ${badgeCls}" title="${isGdrive ? 'Google Drive Document' : label}">
            ${badgeIcon}
          </div>
          <div class="doc-card-details">
            <div class="doc-card-header-row">
              <span class="doc-type-pill">${label}</span>
              <span class="doc-status-pill ${isGdrive ? 'gdrive' : 'local'}">
                <span class="doc-status-dot"></span>
                <span>${isGdrive ? 'Google Drive' : 'Attached'}</span>
              </span>
            </div>
            <div class="doc-card-filename" id="${prefix}_filename" title="${esc(fn)}">${esc(fn)}</div>
            <div class="doc-card-meta">
              ${isGdrive ? `
                <span class="doc-meta-hint">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <span>Cloud Synced &bull; Click Open to view in Drive</span>
                </span>
              ` : (p && (p.startsWith('/tmp') || p.includes('documents/')) ? `
                <span class="doc-meta-hint" style="color:#f59e0b;" title="${esc(p)}">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
                  <span>Temporary storage &bull; Click "Link Drive" to connect</span>
                </span>
              ` : `
                <span class="doc-meta-hint" title="${esc(p)}">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                  <span>${esc(p)}</span>
                </span>
              `)}
            </div>
          </div>
          <div class="doc-card-actions">
            ${appId ? `
              <button type="button" class="btn sm doc-btn-open" id="${prefix}_btn_prev" title="Open document in Google Drive">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                <span>Open</span>
              </button>
            ` : ''}
            <button type="button" class="btn sm doc-btn-upload" id="${prefix}_btn_rep" title="Upload new ${label.toLowerCase()} to replace existing">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              <span>Upload</span>
            </button>
            <button type="button" class="btn sm doc-action-btn doc-action-delete" id="${prefix}_btn_rem" title="Delete ${label.toLowerCase()}">
              &times;
            </button>
          </div>
        </div>
        <input type="file" id="${prefix}_file_inp" accept=".pdf,.docx,.doc,.txt" style="display:none">
        <input type="hidden" ${appId ? `data-k="${key}"` : ''} id="${prefix}_hidden_path" value="${esc(p)}">
      </div>
    `;
  } else {
    return `
      <div class="doc-slot-container" id="${prefix}_slot">
        <div class="doc-modern-slot" id="${prefix}_dropzone">
          <div class="doc-modern-slot-left">
            <div class="doc-modern-icon-badge ${type}">
              ${iconSvg}
            </div>
            <div class="doc-modern-text">
              <div class="doc-modern-label-row">
                <span class="doc-modern-label">${label}</span>
                <span class="doc-empty-badge">Empty</span>
              </div>
              <div class="doc-modern-sub">Drop file here, or click to upload</div>
            </div>
          </div>
          <div class="doc-modern-action" onclick="event.stopPropagation();">
            <button type="button" class="btn sm doc-btn-upload-pick" id="${prefix}_btn_upload_pick_btn" title="Upload ${label.toLowerCase()}">
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              <span>Upload</span>
            </button>
          </div>
          <input type="file" id="${prefix}_file_inp" accept=".pdf,.docx,.doc,.txt" style="display:none">
          <input type="hidden" ${appId ? `data-k="${key}"` : ''} id="${prefix}_hidden_path" value="">
        </div>
      </div>
    `;
  }
}

function wireDocSlot(prefix, type, label, iconSvg, appId, getPath, setPath) {
  const slot = $(`#${prefix}_slot`);
  if (!slot) return;
  const fileInp = $(`#${prefix}_file_inp`);
  const dropzone = $(`#${prefix}_dropzone`);
  const btnPrev = $(`#${prefix}_btn_prev`);
  const btnRep = $(`#${prefix}_btn_rep`);
  const btnRem = $(`#${prefix}_btn_rem`);
  const btnUploadPick = $(`#${prefix}_btn_upload_pick_btn`);
  const key = type === 'resume' ? 'resume_path' : 'cover_letter_path';

  // Async name resolution for Google Drive links
  const curP = getPath();
  if (curP && isGoogleDriveLink(curP)) {
    if (DOC_CACHE[curP] && DOC_CACHE[curP].name) {
      const fnEl = $(`#${prefix}_filename`);
      if (fnEl) {
        fnEl.textContent = DOC_CACHE[curP].name;
        fnEl.title = DOC_CACHE[curP].name;
      }
    } else {
      fetch('/api/file-info', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: curP })
      }).then(r => r.json()).then(info => {
        if (info && info.name) {
          DOC_CACHE[curP] = info;
          const fnEl = $(`#${prefix}_filename`);
          if (fnEl) {
            fnEl.textContent = info.name;
            fnEl.title = info.name;
          }
        }
      }).catch(() => {});
    }
  }

  function readFileAsBase64(f) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(f);
    });
  }

  const uploadFile = async (file) => {
    if (!file) return;
    const currentSlot = $(`#${prefix}_slot`);
    if (currentSlot) {
      currentSlot.innerHTML = `
        <div class="doc-uploading-box">
          <span class="spinner-sm"></span>
          <span>Uploading <strong>${esc(file.name)}</strong>...</span>
        </div>
      `;
    }
    try {
      const docType = type === 'resume' ? 'resume' : 'cover_letter';
      const base64Data = await readFileAsBase64(file);
      const savedFolder = localStorage.getItem('user_gdrive_folder_id');

      const token = localStorage.getItem('auth_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      const resp = await fetch('/api/upload-document', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: file.name,
          data: base64Data,
          type: docType,
          appId: appId || undefined,
          folderId: savedFolder || undefined
        })
      });
      const res = await resp.json();
      if (res && res.ok) {
        const savedPath = res.fullPath || res.path;
        DOC_CACHE[savedPath] = { name: file.name, exists: true };
        setPath(savedPath);
        if (appId) {
          const app = (S.apps || []).find(x => x.id === Number(appId));
          if (app) {
            app[key] = savedPath;
            render();
          }
        }
        toast(`Upload completed: ${file.name}`);
        const liveSlot = $(`#${prefix}_slot`);
        if (liveSlot) {
          liveSlot.outerHTML = renderDocSlotHtml(type, label, iconSvg, savedPath, appId);
          wireDocSlot(prefix, type, label, iconSvg, appId, () => savedPath, setPath);
          $(`#${prefix}_slot .doc-card-box`)?.classList.add('doc-upload-success-anim');
        }
      } else {
        toast('Upload failed: ' + ((res && res.error) || 'Server error'), true);
        const liveSlot = $(`#${prefix}_slot`);
        if (liveSlot) {
          liveSlot.outerHTML = renderDocSlotHtml(type, label, iconSvg, getPath(), appId);
          wireDocSlot(prefix, type, label, iconSvg, appId, getPath, setPath);
        }
      }
    } catch (err) {
      toast('Upload failed: ' + err.message, true);
      const liveSlot = $(`#${prefix}_slot`);
      if (liveSlot) {
        liveSlot.outerHTML = renderDocSlotHtml(type, label, iconSvg, getPath(), appId);
        wireDocSlot(prefix, type, label, iconSvg, appId, getPath, setPath);
      }
    }
  };

  // Drag and drop or click on empty dropzone
  if (dropzone && fileInp) {
    dropzone.onclick = () => fileInp.click();
    fileInp.onchange = () => { uploadFile(fileInp.files?.[0]); fileInp.value = ''; };
    dropzone.ondragover = e => { e.preventDefault(); dropzone.classList.add('dragover'); };
    dropzone.ondragleave = () => dropzone.classList.remove('dragover');
    dropzone.ondrop = e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const f = e.dataTransfer?.files?.[0];
      if (f) uploadFile(f);
    };
  }

  // Upload button on empty slot
  if (btnUploadPick && fileInp) {
    btnUploadPick.onclick = (e) => {
      e.stopPropagation();
      fileInp.click();
    };
  }

  // Upload button on already attached slot: ASK confirmation to replace
  if (btnRep && fileInp) {
    btnRep.onclick = () => {
      showConfirmDialog({
        title: `Replace existing ${label}?`,
        text: `A ${label.toLowerCase()} is already attached to this application. Do you want to replace it with a new file?`,
        icon: `<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>`,
        confirmText: 'Replace',
        confirmCls: 'primary',
        cancelText: 'Cancel',
        onConfirm: () => {
          fileInp.click();
        }
      });
    };
    fileInp.onchange = () => { uploadFile(fileInp.files?.[0]); fileInp.value = ''; };
  }

  // Open button
  if (btnPrev && appId) {
    btnPrev.onclick = () => openDocPreviewForApp(appId, type);
  }

  // Delete button: ASK confirmation to delete, then delete from Google Drive
  if (btnRem) {
    btnRem.onclick = () => {
      const pathToDelete = getPath();
      showConfirmDialog({
        title: `Delete ${label}?`,
        text: `Are you sure you want to delete this ${label.toLowerCase()}? It will be permanently removed from Google Drive.`,
        icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
        confirmText: 'Yes, Delete',
        confirmCls: 'danger',
        cancelText: 'No, Cancel',
        onConfirm: async () => {
          toast(`Deleting ${label.toLowerCase()} from Drive...`);
          try {
            await api('POST', '/delete-document', {
              path: pathToDelete,
              appId: appId || null,
              type: type
            });
          } catch (delErr) {
            console.warn('Delete document error:', delErr);
          }
          setPath('');
          delete DOC_CACHE[pathToDelete];
          if (appId) {
            const app = (S.apps || []).find(x => x.id === Number(appId));
            if (app) {
              app[key] = '';
              render();
            }
          }
          toast(`Deleted ${label} from Google Drive`);
          const liveSlot = $(`#${prefix}_slot`);
          if (liveSlot) {
            liveSlot.outerHTML = renderDocSlotHtml(type, label, iconSvg, '', appId);
            wireDocSlot(prefix, type, label, iconSvg, appId, () => '', setPath);
          }
        }
      });
    };
  }
}


/* ---------------------------------------------------------------
   ?? Word Doc (.docx) & PDF Previewer Controller
   --------------------------------------------------------------- */
function cleanFilePath(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let p = raw.trim();
  p = p.replace(/^["'\s]+|["'\s]+$/g, '');
  if (p.startsWith('file:///')) p = decodeURIComponent(p.replace(/^file:\/\/\/?/, ''));
  p = p.replace(/^["'\s]+|["'\s]+$/g, '');
  return p;
}

window.openDoc = function(url) {
  if (!url || url.trim().toUpperCase() === 'NA') {
    toast('No document attached');
    return;
  }
  const cleanP = cleanFilePath(url);
  const driveId = extractGoogleDriveFileId(cleanP);
  if (driveId) {
    window.open(`https://drive.google.com/file/d/${driveId}/view`, '_blank');
    return;
  }
  if (/^https?:\/\//i.test(cleanP)) {
    window.open(cleanP, '_blank');
    return;
  }
  // Local or temporary server path (/tmp/..., documents/...) should route to file-content endpoint
  window.open(`/api/file-content?path=${encodeURIComponent(cleanP)}`, '_blank');
};

window.openDocPreviewForApp = function(appId, type) {
  const app = (S.apps || []).find(x => x.id === Number(appId));
  if (!app) return;
  const rawPath = type === 'resume' ? app.resume_path : app.cover_letter_path;
  openDoc(rawPath);
};

window.copyDocPathForApp = function(appId, type, el) {
  const app = (S.apps || []).find(x => x.id === Number(appId));
  if (!app) return;
  const rawPath = type === 'resume' ? app.resume_path : app.cover_letter_path;
  const cleanP = cleanFilePath(rawPath);
  if (!cleanP || cleanP.toUpperCase() === 'NA') {
    toast('No path to copy');
    return;
  }
  copyVal(cleanP, el);
};

async function handleDocumentUpload(file, key, appId, targetInputEl, triggerBtn) {
  if (!file) return;
  const originalBtnHtml = triggerBtn ? triggerBtn.innerHTML : null;
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = '<span class="spinner-sm"></span> Uploading...';
  }
  toast(`Uploading ${file.name}...`);
  try {
    const docType = key === 'cover_letter_path' ? 'cover_letter' : 'resume';
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
    const savedFolder2 = localStorage.getItem('user_gdrive_folder_id');

    const token2 = localStorage.getItem('auth_token');
    const headers2 = { 'Content-Type': 'application/json' };
    if (token2) headers2['Authorization'] = 'Bearer ' + token2;

    const resp = await fetch('/api/upload-document', {
      method: 'POST',
      headers: headers2,
      body: JSON.stringify({
        name: file.name,
        data: base64Data,
        type: docType,
        appId: appId || undefined,
        folderId: savedFolder2 || undefined
      })
    });
    const res = await resp.json();
    if (res && res.ok) {
      const savedPath = res.fullPath || res.path;
      if (targetInputEl) {
        targetInputEl.value = savedPath;
        targetInputEl.dispatchEvent(new Event('input'));
      }
      const panelInput = $(`#panel [data-k="${key}"]`);
      if (panelInput && panelInput !== targetInputEl) {
        panelInput.value = savedPath;
        panelInput.dispatchEvent(new Event('input'));
      }
      if (appId) {
        const app = (S.apps || []).find(x => x.id === Number(appId));
        if (app) {
          app[key] = savedPath;
          render();
        }
      }
      toast(`Attached: ${file.name}`);
    } else {
      toast('Upload failed: ' + ((res && res.error) || 'Server error'), true);
    }
  } catch (err) {
    toast('Upload failed: ' + err.message, true);
  } finally {
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.innerHTML = originalBtnHtml || 'Upload';
    }
  }
}


async function openDriveFilePicker(type, onSelect) {
  toast('Loading files from Google Drive...');
  try {
    const res = await api('GET', '/gdrive-files?type=' + encodeURIComponent(type));
    if (!res || !res.files || !res.files.length) {
      toast('No files found in your Google Drive ' + type + ' folder', true);
      return;
    }
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = `
      <div class="confirm-modal-box" style="max-width:540px;width:95%;">
        <div class="confirm-modal-header">
          <div class="confirm-modal-icon" style="background:#eff6ff;color:#2563eb;">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19 18H6a4 4 0 0 1-4-4 4 4 0 0 1 4-4 5.5 5.5 0 0 1 10.7-1.5A4 4 0 0 1 20 14a4 4 0 0 1-1 4z"/></svg>
          </div>
          <div>
            <h3 class="confirm-modal-title">Select ${type === 'cover' || type === 'cover_letter' ? 'Cover Letter' : 'Resume'} from Google Drive</h3>
            <p class="confirm-modal-text">Files in your job_kanban_board/${type} Drive folder</p>
          </div>
          <button type="button" class="btn icon-only" id="closeGdrivePicker">&times;</button>
        </div>
        <div style="max-height:360px;overflow-y:auto;margin:16px 0;display:flex;flex-direction:column;gap:8px;">
          ${res.files.map(f => `
            <div class="gdrive-file-item" data-url="${f.url}" data-name="${f.name}" style="padding:10px 14px;border:1px solid var(--bd);border-radius:8px;background:var(--surface);cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all 0.15s ease;">
              <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#2563eb"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                <span style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:320px;">${esc(f.name)}</span>
              </div>
              <button type="button" class="btn sm primary select-gdrive-btn">Select</button>
            </div>
          `).join('')}
        </div>
        <div class="confirm-modal-actions" style="justify-content:space-between;">
          <a href="https://drive.google.com/drive/folders/${res.folderId}" target="_blank" class="btn sm" style="text-decoration:none;">📂 Open Drive Folder</a>
          <button type="button" class="btn sm" id="cancelGdrivePicker">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => { overlay.remove(); };
    overlay.querySelector('#closeGdrivePicker').onclick = close;
    overlay.querySelector('#cancelGdrivePicker').onclick = close;
    overlay.onclick = e => { if (e.target === overlay) close(); };

    overlay.querySelectorAll('.gdrive-file-item').forEach(item => {
      item.onclick = () => {
        const u = item.dataset.url;
        const n = item.dataset.name;
        close();
        if (onSelect) onSelect(u, n);
      };
    });
  } catch (err) {
    toast('Error connecting to Google Drive: ' + err.message, true);
  }
}


