import { copy, exists } from "@std/fs";
import { resolve } from "@std/path";

const clientRoot = resolve(import.meta.dirname!, "..");
const publicFolder = resolve(clientRoot, "public");
const targetPath = resolve(publicFolder, "assets");
const stoatAssets = resolve(clientRoot, "assets");
const fallbackAssets = resolve(clientRoot, "scripts", "assets_fallback");

async function isNonEmptyDir(path: string): Promise<boolean> {
  try {
    const stat = await Deno.lstat(path);
    if (!stat.isDirectory) return false;
    for await (const _ of Deno.readDir(path)) {
      return true;
    }
    return false;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return false;
    throw err;
  }
}

async function removeExistingTarget() {
  try {
    const stat = await Deno.lstat(targetPath);
    if (stat.isSymlink) {
      await Deno.remove(targetPath);
    } else {
      await Deno.remove(targetPath, { recursive: true });
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) throw err;
  }
}

async function linkAssets(source: string, label: string) {
  try {
    await Deno.symlink(source, targetPath);
    console.info(`Configured ${label}.`);
  } catch (err) {
    if (err instanceof Deno.errors.PermissionDenied) {
      await copy(source, targetPath, { overwrite: true });
      console.info(`Configured ${label} (copied; symlink unavailable).`);
      return;
    }
    throw err;
  }
}

await removeExistingTarget();

if (!(await exists(publicFolder))) {
  await Deno.mkdir(publicFolder, { recursive: true });
}

if (await isNonEmptyDir(stoatAssets)) {
  await linkAssets(stoatAssets, "Stoat assets");
} else {
  await linkAssets(fallbackAssets, "fallback assets");
}
