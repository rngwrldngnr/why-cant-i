import * as fs from "fs";
import * as path from "path";
import { tmpdir } from "os";

import * as Jimp from "jimp";

import { DATA_DIR } from "./env";
import { randomInArray } from "./util/index";
import pluralize from "./util/pluralize";

const imgDir = path.join(DATA_DIR, "categories");
const limeguyPath = path.join(DATA_DIR, "limeguy.jpg");
const fontPathLarge = path.join(DATA_DIR, "impact.fnt");
const fontPathSmall = path.join(DATA_DIR, "impact_smaller.fnt");
const outDir = tmpdir();

let categories: string[] = [];
if (!fs.existsSync(imgDir)) {
  throw new Error(`Image source source directory '${imgDir}' not found!`);
} else {
  categories = fs.readdirSync(imgDir);
  if (categories.length === 0) {
    throw new Error(`No folders in image directory '${imgDir}'!`);
  }
}

async function getRandomImages(
  count: number
): Promise<{ item: string; images: Jimp[] }> {
  const folderName = randomInArray(categories);
  const item = folderName.replace(/_/g, " ");

  const fns = fs.readdirSync(path.join(imgDir, folderName));

  const images = [];
  while (count > 0) {
    const filename = randomInArray(fns);
    fns.splice(fns.indexOf(filename), 1);
    images.push(await Jimp.read(path.join(imgDir, folderName, filename)));
    count--;
  }

  return {
    item,
    images
  };
}

let filenameIndex = 0;

let originalLimeguy: Jimp;
let fontLarge: any;
let fontSmall: any;

// order matters! roughly background-to-foreground
const limeCoords = [
  [856, 1336],
  [700, 1324],
  [456, 1568],
  [436, 1312],
  [527, 1276],
  [468, 1856],
  [828, 1440]
];

export async function makeLimeguy(): Promise<{
  filename: string;
  item: string;
}> {
  if (!originalLimeguy) originalLimeguy = await Jimp.read(limeguyPath);
  if (!fontLarge) fontLarge = await (Jimp as any).loadFont(fontPathLarge);
  if (!fontSmall) fontSmall = await (Jimp as any).loadFont(fontPathSmall);

  const limeguy = originalLimeguy.clone();

  const { item, images } = await getRandomImages(limeCoords.length);

  for (let i = 0; i < limeCoords.length; i++) {
    limeguy.composite(
      images[i],
      limeCoords[i][0] - images[i].bitmap.width / 2,
      limeCoords[i][1] - images[i].bitmap.height / 2
    );
  }

  (limeguy as any).print(fontLarge, 334, 0, "why cant I,");

  (limeguy as any).print(
    fontSmall,
    0,
    limeguy.bitmap.height - 100 - 160,
    `hold all these ${pluralize(item)}?`
  );

  filenameIndex += 1;
  const filename = path.join(outDir, `whycanti_${filenameIndex}.jpg`);

  return new Promise<{ filename: string; item: string }>((res, rej) => {
    limeguy.write(filename, e => {
      if (e) {
        rej(e);
      } else {
        res({ filename, item });
      }
    });
  });
}
