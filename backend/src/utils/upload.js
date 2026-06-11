const MAX_PHOTOS = 10;
const MAX_DATA_URL_LENGTH = 8_000_000;

export function normalizePhotoList(input) {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).slice(0, MAX_PHOTOS);
}

export function validatePhotos(photos, label = 'photos') {
  const list = normalizePhotoList(photos);
  if (!list.length) {
    throw new Error(`At least one ${label} image is required`);
  }
  for (const photo of list) {
    if (typeof photo !== 'string') {
      throw new Error(`${label} must be URL or base64 data strings`);
    }
    if (photo.length > MAX_DATA_URL_LENGTH) {
      throw new Error(`${label} file is too large`);
    }
    const isDataUrl = photo.startsWith('data:image/');
    const isHttpUrl = /^https?:\/\//i.test(photo);
    if (!isDataUrl && !isHttpUrl) {
      throw new Error(`${label} must be a valid image URL or base64 data URL`);
    }
  }
  return list;
}
