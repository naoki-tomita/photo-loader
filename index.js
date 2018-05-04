"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const argv = require("argv");
const mkdirp = require("mkdirp");
const ProgressBar = require("progress");
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
const exts = args.options.ext.split(",").map((e) => `.${e.toLowerCase()}`);
const dst = args.options.dst;
function findPhotos(src) {
    const files = findPhotoRecursively(src);
    return files;
}
function findPhotoRecursively(src) {
    const list = fs_1.readdirSync(src);
    const dst = [];
    list.forEach(l => {
        const filePath = path_1.join(src, l);
        const stat = fs_1.statSync(filePath);
        if (stat.isFile()) {
            // this file created by FlashAir.
            if (src.includes("FA000001.JPG")) {
                return;
            }
            if (exts.includes(path_1.extname(filePath).toLowerCase())) {
                dst.push(filePath);
            }
        }
        else {
            dst.push(...findPhotoRecursively(filePath));
        }
    });
    return dst;
}
async function mkdirpSync(path) {
    return new Promise(r => mkdirp(path, () => r()));
}
function fill(x, length) {
    return `000000000${x}`.substr(-length);
}
async function main() {
    const dates = new Set();
    const photos = findPhotos(src).map(p => {
        const date = fs_1.statSync(p).birthtime;
        const dateString = `${fill(date.getFullYear(), 4)}-${fill(date.getMonth() + 1, 2)}-${fill(date.getDate(), 2)}`;
        dates.add(dateString);
        return {
            src: p,
            dst: path_1.join(dst, dateString, path_1.basename(p)),
        };
    });
    const progress = new ProgressBar("copying [:bar] :current/:total :percent :etas", photos.length);
    async function copy(fileData) {
        return new Promise(r => fs_1.copyFile(fileData.src, fileData.dst, () => (progress.tick(), r())));
    }
    for (const date of dates) {
        await mkdirpSync(path_1.join(args.options.dst, date));
    }
    for (const p of photos) {
        copy(p);
    }
}
main();
