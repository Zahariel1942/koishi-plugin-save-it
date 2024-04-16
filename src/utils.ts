import type { Session } from "koishi";
import fs from "fs";

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

export function getImagesFromSession(session: Session) {
  return session.event.message.elements
    .filter((el) => el.type === "img")
    .map<string>((el) => el.attrs.src);
}

export function hasImages(session: Session) {
  return session.event.message.elements.some((el) => el.type === "img");
}

export function normalizeName(session: Session) {
  const name = session.event.user.name || "unknown";
  const pureName = name.replace(/[\\/:*?"<>|]/g, "_");
  const dateStr = getDateTimeString();
  return `${pureName}-${dateStr}`;
}
