import {
  readdirSync,
  copyFileSync,
  mkdirSync,
  statSync,
} from "fs";
import { extname, join, basename } from "path";
import * as argv from "argv";
import { ExifImage, Exif } from "exif";
import * as mkdirp from "mkdirp";

argv.option([{
	name: "src",
	short: "s",
	type: "string",
	description: "source path",
}, {
  name: "dst",
	short: "d",
	type: "string",
	description: "destination path",
}]);

const args = argv.run();
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
      if (extname(filePath).toLowerCase() === ".jpg") {
        dst.push(filePath);
      }
    } else {
      dst.push(...findPhotoRecursively(filePath));
    }
  });
  return dst;
}

async function createExif(filePath: string) {
  return new Promise<Exif>((ok, ng) => {
    new ExifImage({
      image: filePath
    }, (error, exifData) => {
      if (error) {
        return ng(error);
      }
      return ok(exifData);
    });
  });
}

function parseDate(date: string) {
  const regexed = /([\d]{4}):([\d]{2}):([\d]{2}) [\d]{2}:[\d]{2}:[\d]{2}/.exec(date);
  if (!regexed) {
    return "XXXX-YY-ZZ";
  }
  return `${regexed[1]}-${regexed[2]}-${regexed[3]}`;
}

async function mkdirpSync(path: string) {
  return new Promise(r => mkdirp(path, () => r()));
}

async function copy(path: string) {
  console.log(`copying... ${path}`);
  const exif = await createExif(path);
  const date = parseDate(exif.exif.CreateDate);
  await mkdirpSync(join(args.options.dst, date));
  copyFileSync(
    path,
    join(
      args.options.dst,
      date,
      basename(path),
    ),
  );
}

async function main() {
  const photos = findPhotos(args.options.src);
  for (const p of photos) {
    copy(p);
  }
}

main();