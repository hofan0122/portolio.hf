const STORAGE_KEY = 'yuanlin-portfolio-uploads';
const uploadInput = document.querySelector('#photo-input');
const dropZone = document.querySelector('#drop-zone');
const uploadGroup = document.querySelector('#upload-group');
const uploadStatus = document.querySelector('#upload-status');
const uploadLibrary = document.querySelector('#upload-library');
const emptyLibrary = document.querySelector('#empty-library');
const clearUploads = document.querySelector('#clear-uploads');

function getUploads() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUploads(uploads) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads));
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve({
        src: reader.result,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      image.onerror = () => reject(new Error(`無法讀取 ${file.name}`));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error(`無法讀取 ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function formatRatio(width, height) {
  return width >= height ? '3:2 · landscape' : '2:3 · portrait';
}

function renderLibrary() {
  const uploads = getUploads();
  uploadLibrary.replaceChildren();
  emptyLibrary.hidden = uploads.length > 0;
  clearUploads.disabled = uploads.length === 0;

  uploads.forEach((upload) => {
    const item = document.createElement('article');
    const image = document.createElement('img');
    const meta = document.createElement('div');
    const title = document.createElement('strong');
    const details = document.createElement('span');
    const remove = document.createElement('button');

    item.className = `upload-item ${upload.orientation}`;
    image.src = upload.src;
    image.alt = upload.name;
    title.textContent = upload.name;
    details.textContent = `${upload.year} · ${upload.ratio}`;
    remove.type = 'button';
    remove.className = 'remove-upload';
    remove.textContent = '移除';
    remove.addEventListener('click', () => {
      saveUploads(getUploads().filter((entry) => entry.id !== upload.id));
      renderLibrary();
      setStatus('照片已從管理清單移除。');
    });

    meta.append(title, details);
    item.append(image, meta, remove);
    uploadLibrary.append(item);
  });
}

function setStatus(message) {
  uploadStatus.textContent = message;
}

async function addPhotos(files) {
  const imageFiles = [...files].filter((file) => file.type.startsWith('image/'));
  if (!imageFiles.length) {
    setStatus('請選擇圖檔。');
    return;
  }

  const uploads = getUploads();
  let added = 0;
  try {
    for (const file of imageFiles) {
      const image = await readImage(file);
      const isLandscape = image.width >= image.height;
      uploads.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        year: uploadGroup.value,
        src: image.src,
        ratio: formatRatio(image.width, image.height),
        orientation: isLandscape ? 'is-landscape' : 'is-portrait',
      });
      added += 1;
    }
    saveUploads(uploads);
    renderLibrary();
    setStatus(`${added} 張照片已加入 ${uploadGroup.value} 分組。`);
  } catch (error) {
    setStatus(`${error.message} 儲存失敗，可能是瀏覽器儲存空間不足。`);
  }
  uploadInput.value = '';
}

uploadInput.addEventListener('change', (event) => addPhotos(event.target.files));
dropZone.addEventListener('click', () => uploadInput.click());
dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') uploadInput.click();
});
['dragenter', 'dragover'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropZone.classList.add('is-dragging');
}));
['dragleave', 'drop'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropZone.classList.remove('is-dragging');
}));
dropZone.addEventListener('drop', (event) => addPhotos(event.dataTransfer.files));
clearUploads.addEventListener('click', () => {
  if (!getUploads().length) return;
  if (window.confirm('確定要清除所有已上傳照片嗎？')) {
    localStorage.removeItem(STORAGE_KEY);
    renderLibrary();
    setStatus('所有上傳照片已清除。');
  }
});

renderLibrary();
