import { Context, Schema, Session, Logger } from "koishi";
import fs from "fs";
import {} from "path";
import {} from "@koishijs/assets";
import { Buffer } from "./buffer";
import { formatTimestamp, getDateTimeString } from "./utils";

export const name = "save-it";
const logger = new Logger("save-it");

export const inject = {
  required: ["assets"],
};

export interface Config {
  groupId: string;
  bufferLength: number;
  path: string;
}

export const Config: Schema<Config> = Schema.object({
  groupId: Schema.string().description("关注的群号").default(""),
  bufferLength: Schema.number().description("缓存长度").default(25),
  path: Schema.string()
    .description("保存路径")
    .default("data/download/save-it"),
});

export function apply(ctx: Context, config: Config) {
  let buffer: Buffer | null;

  ctx.on("ready", () => {
    buffer = new Buffer(config.bufferLength);
  });

  ctx.on("dispose", () => {
    buffer = null;
  });

  ctx.on("message", async (session) => {
    if (!buffer) return;
    if (session.channelId !== config.groupId) return;

    if (hasImages(session)) {
      buffer.add(session);
    }
  });

  ctx
    .command("save-it <count:number>", "帮你保存色图")
    .alias("save")
    .alias("kksk")
    .usage(`save - 保存最近的一张图片\r\nsave 3 - 保存最近的 3 张图片`)
    .action(async ({ session }, count = 1) => {
      if (!buffer) return;

      const sessions = buffer.take(count);
      if (!sessions.length) return "没有图片";
      let result = "已保存图片：\r\n";
      for (const s of sessions) {
        const count = await saveSessionImage(ctx, s, config);
        result += `    `;
        result += `${s.event.user.name}@${formatTimestamp(s.timestamp)}`;
        result += `${count > 1 ? ` x${count}` : ""}`;
        result += `\r\n`;
      }

      return result;
    });
}

async function saveSessionImage(ctx: Context, s: Session, config: Config) {
  if (!hasImages(s)) return;
  const images = getImages(s);

  const filePaths = await Promise.all(
    images.map((img) => downloadImage(ctx, img))
  );

  filePaths.forEach((file) => {
    const fileName = normalizeName(s);
    moveImage(file, fileName, config.path);
  });
  return images.length;
}

async function downloadImage(ctx: Context, url: string) {
  const fileUrl = await ctx.assets.upload(url, "").catch(() => {
    logger.warn(
      "Request failed when trying to store image with assets service."
    );
    return null;
  });

  return fileUrl.replace("file:///", "");
}

function moveImage(src: string, name: string, dest: string) {
  const ext = src.split(".").pop();
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const destPath = `${dest}/${name}.${ext}`;
  if (fs.existsSync(destPath)) {
    logger.debug(`File ${destPath} already exists, skipping.`);
  }
  try {
    fs.renameSync(src, destPath);
    logger.debug(`Moved file ${src} to ${destPath}`);
  } catch (e) {
    logger.error(`Failed to move file ${src} to ${destPath}`, e);
  }
}

function getImages(session: Session) {
  return session.event.message.elements
    .filter((el) => el.type === "img")
    .map<string>((el) => el.attrs.src);
}

function hasImages(session: Session) {
  return session.event.message.elements.some((el) => el.type === "img");
}

function normalizeName(session: Session) {
  const name = session.event.user.name || "unknown";
  const pureName = name.replace(/[\\/:*?"<>|]/g, "_");
  const dateStr = getDateTimeString();
  return `${pureName}-${dateStr}`;
}
