import type { Session, Context } from "koishi";
import fs from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { logger } from ".";

export class ImageManager {
  private _storeDir: string = "";
  private _ctx: Context = null;
  constructor({ path, ctx }: { path: string; ctx: Context }) {
    this._storeDir = path;
    this._ctx = ctx;
  }

  public getRandom() {
    const images = getFiles(this._storeDir);

    if (!images.length) return null;

    return images[Math.floor(Math.random() * images.length)];
  }

  public save(src: string, name: string) {
    return this._ctx.assets
      .upload(src, "")
      .catch(() => {
        logger.warn(
          "Request failed when trying to store image with assets service."
        );
        return null;
      })
      .then((url) => fileURLToPath(url))
      .then((filePath) => moveToDest(filePath, name, this._storeDir))
      .catch(() => {
        logger.error(`Failed to save image ${name}`);
      });
  }

  public delete(name: string) {
    const filePath = resolve(this._storeDir, name);
    deleteFile(filePath);
  }
}

function getFiles(dir: string) {
  const files = fs.readdirSync(dir);
  return files.filter((file) => {
    const filePath = resolve(dir, file);
    const stats = fs.statSync(filePath);
    return stats.isFile();
  });
}

function deleteFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  fs.unlinkSync(filePath);
}

function moveToDest(src: string, name: string, dest: string) {
  const ext = src.split(".").pop();
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const destPath = `${dest}/${name}.${ext}`;
  if (fs.existsSync(destPath)) return true;
  try {
    fs.renameSync(src, destPath);
  } catch (e) {
    return false;
  }
}
