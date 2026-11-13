export const INFORMATION_COOKIE = 'bb_editor_info_version';
export function shouldShowInformation(cookie, version) {
  return !String(cookie || '').split(';').some(part=>part.trim()===`${INFORMATION_COOKIE}=${encodeURIComponent(version)}`);
}
export function informationCookie(version, path) {
  return `${INFORMATION_COOKIE}=${encodeURIComponent(version)}; Max-Age=31536000; Path=${path}; SameSite=Lax`;
}
