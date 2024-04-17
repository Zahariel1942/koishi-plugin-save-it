import type { Session, Context } from "koishi";
import fs from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { logger } from ".";
import sharp from "sharp";

sharp.cache(false);

export class ImageManager {
  private _storeDir: string = "";
  private _thumbnailDir: string = "";
  private _ctx: Context = null;
  constructor({ path, ctx }: { path: string; ctx: Context }) {
    this._storeDir = path;
    this._thumbnailDir = path + "/thumbnails";
    this._ctx = ctx;

    mkdir(this._storeDir);
    mkdir(this._thumbnailDir);
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
      .then((filePath) => getThumbnail(filePath, this._thumbnailDir))
      .catch((e) => {
        logger.error(`Failed to save image ${name}`, e);
      });
  }

  public delete(name: string) {
    const filePath = resolve(this._storeDir, name);
    deleteFile(filePath);
  }
}

async function getThumbnail(filepath: string, thumbnailDir: string) {
  const filename = filepath.split("/").pop();
  const thumbnail = resolve(thumbnailDir, filename + "_thumbnail.jpg");
  if (fs.existsSync(thumbnail)) return thumbnail;
  return await sharp(filepath)
    .resize(160)
    .jpeg({ mozjpeg: true })
    .toFile(thumbnail)
    .then(() => thumbnail);
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
  const filepath = `${dest}/${name}.${ext}`;
  if (fs.existsSync(filepath)) return filepath;
  try {
    fs.renameSync(src, filepath);
  } catch (e) {
    return null;
  }
  return filepath;
}

function mkdir(path: string) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, {
      recursive: true,
    });
  }
}
