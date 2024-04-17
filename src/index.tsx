import { Context, Schema, Logger } from "koishi";
import { pathToFileURL } from "url";
import { resolve } from "path";
import {} from "@koishijs/assets";
import { Buffer } from "./buffer";
import { ImageManager } from "./imageManager";
import {
  formatTimestamp,
  hasImages,
  normalizeName,
  getImagesFromSession,
} from "./utils";

export const name = "save-it";
export const logger = new Logger("save-it");

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
  let buffer: Buffer;
  let imageManager: ImageManager;
  let lastPostFile: string;

  ctx.on("ready", () => {
    buffer = new Buffer(config.bufferLength);
    imageManager = new ImageManager({ path: config.path, ctx });
  });

  ctx.on("dispose", () => {
    buffer = null;
    imageManager = null;
    lastPostFile = null;
  });

  ctx.on("message", async (session) => {
    if (session.channelId !== config.groupId) return;

    if (hasImages(session)) {
      buffer.add(session);
    }
  });

  ctx
    .command("save-it <count:number>", "帮你保存色图")
    .alias("保存")
    .alias("save")
    .alias("kksk")
    .usage(`save - 保存最近的一张图片\r\nsave 3 - 保存最近的 3 张图片`)
    .action(async ({ session }, count = 1) => {
      const sessions = buffer.take(count);
      if (!sessions.length) return "没有图片";
      let result = [];
      for (const s of sessions) {
        const images = getImagesFromSession(s);
        const savedImages = await Promise.all(
          images.map((img, index) =>
            imageManager.save(img, `${normalizeName(s)}_${index}`)
          )
        );
        result.push({
          name: `${s.event.user.name}@${formatTimestamp(s.timestamp)}`,
          length: savedImages.length,
        });
      }

      return (
        <p>
          <text content="已保存图片："></text>
          <br />
          {result.map((s) => (
            <text
              content={`    ${s.name} ${s.length > 1 ? `x${s.length}` : ""}\r\n`}
            ></text>
          ))}
        </p>
      );
    });

  ctx.command("来张色图").action(async ({ session }) => {
    const imageName = imageManager.getRandom();

    if (!imageName) return "没有";

    const filepath = resolve(config.path, imageName);
    lastPostFile = filepath;

    return (
      <p>
        <text content={`${imageName}:\r\n`}></text>
        <img src={pathToFileURL(filepath).href} />
      </p>
    );
  });

  ctx.command("这个不行").action(async ({ session }) => {
    if (!lastPostFile) return;
    imageManager.delete(lastPostFile);
    lastPostFile = null;
    return "删了";
  });
}
