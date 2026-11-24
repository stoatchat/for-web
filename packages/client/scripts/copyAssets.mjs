/* eslint-disable no-undef */

import lnk from "lnk";
import { lstat, mkdir, readdir, rm, unlink } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Anchor every path to this file so the script behaves the same from any cwd.
const scriptsFolder = dirname(fileURLToPath(import.meta.url));
const packageFolder = resolve(scriptsFolder, "..");
const publicFolder = resolve(packageFolder, "public");
const assetsPath = resolve(publicFolder, "assets");
const brandAssets = resolve(packageFolder, "assets");
const fallbackAssets = resolve(scriptsFolder, "assets_fallback");

/**
 * Recursively list every node under an assets folder as a map of relative
 * path -> "file" | "dir". Hidden entries (the submodule .git link,
 * .DS_Store, ...) are skipped. Returns null when the folder is missing or
 * has no visible entries.
 */
async function walkTree(folder) {
  const nodes = new Map();
  const walk = async (dir, prefix) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const rel = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) {
        nodes.set(rel, "dir");
        await walk(join(dir, entry.name), rel);
      } else {
        nodes.set(rel, "file");
      }
    }
  };
  try {
    await walk(folder, "");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  return nodes.size > 0 ? nodes : null;
}

/**
 * Clear public/assets so the merged tree can be rebuilt from scratch.
 */
async function prepareAssetsFolder() {
  try {
    const stat = await lstat(assetsPath);
    if (stat.isSymbolicLink()) {
      await unlink(assetsPath);
    } else {
      await rm(assetsPath, { recursive: true });
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await mkdir(publicFolder, { recursive: true });
  await mkdir(assetsPath);
}

/**
 * Build public/assets as a per-node merge. For every file present in the
 * whitelabel fallback or the checked-out Stoat brand assets, a symlink is
 * created from the brand copy when both exist, otherwise from the fallback
 * copy. Directory nodes are created for real (never linked) so the merged
 * tree can never write through a source, and no fallback file is ever
 * shadowed by a folder-level choice.
 */
async function configureAssets() {
  const brandNodes = await walkTree(brandAssets);
  const fallbackNodes = await walkTree(fallbackAssets);

  if (fallbackNodes === null) {
    throw new Error(
      `Whitelabel fallback assets are missing: ${fallbackAssets}`,
    );
  }
  if (brandNodes === null) {
    console.warn(
      `Warning: Stoat brand assets are missing or empty at ${brandAssets}; using whitelabel assets only.`,
    );
  }

  // relPath -> source folder; brand wins over the fallback per node.
  const brandFiles = new Set(
    [...(brandNodes?.entries() ?? [])]
      .filter(([, type]) => type === "file")
      .map(([rel]) => rel),
  );
  // A brand file hides any fallback node nested beneath it.
  const hiddenByBrandFile = (rel) => {
    let prefix = rel;
    while (prefix.includes("/")) {
      prefix = prefix.slice(0, prefix.lastIndexOf("/"));
      if (brandFiles.has(prefix)) return true;
    }
    return false;
  };

  const sources = new Map();
  for (const rel of fallbackNodes.keys()) {
    if (!hiddenByBrandFile(rel)) sources.set(rel, fallbackAssets);
  }
  if (brandNodes !== null) {
    for (const rel of brandNodes.keys()) sources.set(rel, brandAssets);
  }

  const typeOf = (rel, source) =>
    source === brandAssets ? brandNodes?.get(rel) : fallbackNodes.get(rel);

  // Directory nodes first, so every symlink's parent already exists.
  for (const [rel, source] of sources) {
    if (typeOf(rel, source) === "dir") {
      await mkdir(join(assetsPath, rel), { recursive: true });
    }
  }

  let brandCount = 0;
  let fallbackCount = 0;
  for (const [rel, source] of sources) {
    if (typeOf(rel, source) !== "file") continue;
    if (source === brandAssets) brandCount += 1;
    else fallbackCount += 1;
    await lnk(join(source, rel), join(assetsPath, dirname(rel)), {
      rename: basename(rel),
      ...(process.platform === "win32" ? {} : { type: "symbolic" }),
    });
  }

  const overridden = [...brandFiles].filter(
    (rel) => fallbackNodes.get(rel) === "file",
  ).length;
  console.info(
    brandNodes !== null
      ? `Configured Stoat assets with whitelabel fallback: ${brandCount} brand, ${fallbackCount} whitelabel file(s)${overridden > 0 ? `, ${overridden} overridden by brand` : ""}.`
      : `Configured whitelabel fallback assets: ${fallbackCount} file(s).`,
  );
}

try {
  await prepareAssetsFolder();
  await configureAssets();
} catch (error) {
  console.error(error);
  process.exit(1);
}
