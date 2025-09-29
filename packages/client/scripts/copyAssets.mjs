import lnk from "lnk";
import { lstat, readdir, readlink, rmdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";

const publicFolder = resolve("public");
const path = resolve("public", "assets");
const revoltAssets = resolve("assets");
const fallbackAssets = resolve("scripts", "assets_fallback");

/**
 * Create the symlink
 */
async function createSymlink() {
  try {
    await lstat(revoltAssets);
    if ((await readdir(revoltAssets)).length === 0) throw "Empty Directory";
    await lnk(resolve(revoltAssets), resolve(publicFolder), {
      rename: "assets",
    });
    console.info(`Configured Stoat assets.`);
  } catch (error) {
    if (error === "Empty Directory" || error.code === "ENOENT") {
      await lnk(resolve(fallbackAssets), resolve(publicFolder), {
        rename: "assets",
      });
      console.info(`Configured fallback assets.`);
    } else {
      console.error(error);
      process.exit(-1);
    }
  }
}

try {
  await lstat(path);

  try {
    await readlink(path);
    await unlink(path);
  } catch (err) {
    await rmdir(path);
  }

  createSymlink();
} catch (error) {
  if (error.code === "ENOENT") {
    createSymlink();
  } else {
    console.error(error);
    process.exit(-1);
  }
}
