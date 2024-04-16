export function getDateTimeString() {
  const date = new Date();
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(
    date.getDate()
  )}-${padZero(date.getHours())}-${padZero(date.getMinutes())}-${padZero(
    date.getSeconds()
  )}`;
}

export function formatTimestamp(ts: number | string) {
  const date = new Date(Number(ts));
  return `${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(
    date.getSeconds()
  )}`;
}

export function padZero(num: number | string, length: number = 2) {
  return String(num).padStart(length, "0");
}
