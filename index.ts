import {
  readdirSync,
  copyFile,
  mkdirSync,
  statSync,
  constants,
} from "fs";
import { extname, join, basename } from "path";
import * as argv from "argv";
import { ExifImage, Exif } from "exif";
import * as mkdirp from "mkdirp";
import * as ProgressBar from "progress";

argv.option([{
	name: "src",
	short: "s",
	type: "string",
  description: "source path",
  example: `'photo-loader -s /foo/bar'`,
}, {
  name: "dst",
	short: "d",
	type: "string",
  description: "destination path",
  example: `'photo-loader -d /foo/bar'`,
}, {
  name: "ext",
  short: "e",
  type: "string",
  description: "extension of copy file. joined by comma.",
  example: `'photo-loader -e jpg,mov,png'`,
}]);

const args = argv.run();
if (!args.options.src || !args.options.ext || !args.options.dst) {
  argv.help();
  process.exit();
}
const src = args.options.src;
const exts: string[] = args.options.ext.split(",").map((e: string) => `.${e.toLowerCase()}`);
const dst = args.options.dst;

function findPhotos(src: string) {
  const files = findPhotoRecursively(src);
  return files;
}

function findPhotoRecursively(src: string) {
  const list = readdirSync(src);
  const dst: string[] = [];
  list.forEach(l => {
    const filePath = join(src, l);
    const stat = statSync(filePath);
    if (stat.isFile()) {
      // this file created by FlashAir.
      if (src.includes("FA000001.JPG")) {
        return;
      }
      if (exts.includes(extname(filePath).toLowerCase())) {
        dst.push(filePath);
      }
    } else {
      dst.push(...findPhotoRecursively(filePath));
    }
  });
  return dst;
}

async function mkdirpSync(path: string) {
  return new Promise(r => mkdirp(path, () => r()));
}

function fill(x: number, length: number): string {
  return `000000000${x}`.substr(-length);
}

async function main() {
  const dates = new Set<string>();
  const photos = findPhotos(src).map(p => {
    const date = statSync(p).birthtime;
    const dateString = `${fill(date.getFullYear(), 4)}-${fill(date.getMonth() + 1, 2)}-${fill(date.getDate(), 2)}`;
    dates.add(dateString);
    return {
      src: p,
      dst: join(dst, dateString, basename(p)),
    };
  });

  const progress = new ProgressBar("copying [:bar] :current/:total :percent :etas", photos.length);
  async function copy(fileData: {
    src: string;
    dst: string;
  }) {
    return new Promise(r =>
      copyFile(
        fileData.src,
        fileData.dst,
        () => (progress.tick(), r()),
      ));
  }

  for (const date of dates) {
    await mkdirpSync(join(args.options.dst, date));
  }
  for (const p of photos) {
    copy(p);
  }
}

main();