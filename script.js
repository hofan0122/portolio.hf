const pageLinks = document.querySelectorAll('[data-page-link]');
const pages = document.querySelectorAll('[data-page]');
document.querySelectorAll('[data-current-year]').forEach((year) => {
  year.textContent = new Date().getFullYear();
});

function showPage(name) {
  pages.forEach((page) => { page.hidden = page.dataset.page !== name; });
  pageLinks.forEach((link) => link.classList.toggle('active', link.dataset.pageLink === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

pageLinks.forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  const name = link.dataset.pageLink;
  history.replaceState(null, '', `#${name}`);
  showPage(name);
}));

const filters = document.querySelectorAll('.filter');
const groups = document.querySelectorAll('.archive-group');
const savedUploadsKey = 'yuanlin-portfolio-uploads';

function renderSavedUploads() {
  let uploads = [];
  try {
    uploads = JSON.parse(localStorage.getItem(savedUploadsKey) || '[]');
  } catch {
    return;
  }

  uploads.forEach((upload) => {
    const group = document.querySelector(`[data-year-group="${upload.year}"]`);
    if (!group) return;
    const row = group.querySelector('.archive-row');
    const card = document.createElement('a');
    const image = document.createElement('img');
    const caption = document.createElement('span');

    card.className = `archive-card uploaded-card ${upload.orientation}`;
    card.dataset.year = upload.year;
    card.href = upload.src;
    card.target = '_blank';
    card.rel = 'noreferrer';
    image.src = upload.src;
    image.alt = upload.name;
    caption.textContent = `${String(row.querySelectorAll('.archive-card').length + 1).padStart(2, '0')} / ${upload.name}`;
    card.append(image, caption);
    row.append(card);

    const label = group.querySelector('.group-label span');
    const title = label.textContent.split(' · ')[0];
    label.textContent = `${title} · ${String(row.querySelectorAll('.archive-card').length).padStart(2, '0')} photographs`;
  });
}

renderSavedUploads();

function layoutArchiveRows() {
  const rowHeight = 8;
  document.querySelectorAll('.archive-row').forEach((row) => {
    const styles = getComputedStyle(row);
    const gap = parseFloat(styles.rowGap) || 20;
    row.querySelectorAll('.archive-card').forEach((card) => {
      const span = Math.ceil((card.getBoundingClientRect().height + gap) / (rowHeight + gap));
      card.style.gridRowEnd = `span ${span}`;
    });
  });
}

document.querySelectorAll('.archive-row img').forEach((image) => {
  image.addEventListener('load', layoutArchiveRows);
});
window.addEventListener('resize', layoutArchiveRows);
layoutArchiveRows();

filters.forEach((filter) => filter.addEventListener('click', () => {
  filters.forEach((item) => item.classList.remove('active'));
  filter.classList.add('active');
  const year = filter.dataset.filter;
  groups.forEach((group) => { group.hidden = year !== 'all' && group.dataset.yearGroup !== year; });
  document.querySelectorAll('.archive-card').forEach((card) => { card.hidden = false; });
}));

document.querySelectorAll('[data-filter-target]').forEach((card) => card.addEventListener('click', () => {
  showPage('work');
  const target = document.querySelector(`.archive-card[data-category="${card.dataset.filterTarget}"]`);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}));

const lightbox = document.querySelector('.photo-lightbox');
const lightboxImage = document.querySelector('.lightbox-image');
const lightboxCaption = document.querySelector('.lightbox-caption');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxCardSelector = '.work-page .feature-card, .work-page .archive-card';

function getLargeImageSrc(src) {
  try {
    const url = new URL(src);
    if (url.hostname.includes('images.unsplash.com')) {
      url.searchParams.set('w', '1800');
      url.searchParams.set('q', '90');
    }
    return url.toString();
  } catch {
    return src;
  }
}

function openLightbox(photo) {
  if (!lightbox || !lightboxImage || !lightboxCaption) return;
  const caption = photo.closest('a')?.querySelector('span')?.textContent || photo.alt;

  lightboxImage.src = getLargeImageSrc(photo.currentSrc || photo.src);
  lightboxImage.alt = photo.alt;
  lightboxCaption.textContent = caption;
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');
  lightboxClose?.focus();
}

function closeLightbox() {
  if (!lightbox || !lightboxImage) return;
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lightbox-open');
  lightboxImage.src = '';
}

function setupLightboxCards() {
  document.querySelectorAll(lightboxCardSelector).forEach((card) => {
    const photo = card.querySelector('img');
    if (!photo) return;
    card.href = getLargeImageSrc(photo.currentSrc || photo.src);
    card.removeAttribute('target');
    card.removeAttribute('rel');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `放大檢視 ${photo.alt || '照片'}`);
  });
}

document.addEventListener('click', (event) => {
  const card = event.target.closest(lightboxCardSelector);
  if (!card) return;
  const photo = card.querySelector('img');
  if (!photo) return;
  event.preventDefault();
  event.stopPropagation();
  openLightbox(photo);
}, true);

lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (event) => {
  if (!event.target.closest('.lightbox-image')) closeLightbox();
});
document.addEventListener('keydown', (event) => {
  const card = event.target.closest?.(lightboxCardSelector);
  const photo = card?.querySelector('img');
  if ((event.key === 'Enter' || event.key === ' ') && photo) {
    event.preventDefault();
    openLightbox(photo);
    return;
  }
  if (event.key === 'Escape' && lightbox?.classList.contains('is-open')) closeLightbox();
});
setupLightboxCards();

if (location.hash === '#about') showPage('about');
