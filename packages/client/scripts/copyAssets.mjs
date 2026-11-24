/* eslint-disable no-undef */

import lnk from "lnk";
import { lstat, mkdir, readdir, rm, unlink } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Anchor every path to this file so the script behaves the same from any cwd.
const scriptsFolder = dirname(fileURLToPath(import.meta.url));
const packageFolder = resolve(scriptsFolder, "..");
const publicFolder = resolve(packageFolder, "public");
const assetsPath = resolve(publicFolder, "assets");
const brandAssets = resolve(packageFolder, "assets");
const fallbackAssets = resolve(scriptsFolder, "assets_fallback");

/**
 * List the top-level entries of an assets directory.
 * Returns null when the directory is missing or empty.
 */
async function listEntries(folder) {
  let entries;
  try {
    entries = await readdir(folder);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  const visible = entries.filter((entry) => !entry.startsWith("."));
  return visible.length > 0 ? visible : null;
}

/**
 * Collect all files under an assets directory as paths relative to it.
 */
async function listFiles(folder) {
  const files = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else files.push(relative(folder, full));
    }
  };
  await walk(folder);
  return files;
}

/**
 * Clear public/assets so the merged layout can be rebuilt from scratch.
 * It is gitignored and this script is its only writer, so removing it
 * (symlink from older runs, or a leftover directory) is always safe.
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
 * Build public/assets as a merged view: whitelabel fallback entries as the
 * base, checked-out Stoat brand entries overriding on name collision.
 */
async function configureAssets() {
  const brandEntries = await listEntries(brandAssets);
  const fallbackEntries = await listEntries(fallbackAssets);

  if (fallbackEntries === null) {
    throw new Error(
      `Whitelabel fallback assets are missing: ${fallbackAssets}`,
    );
  }
  if (brandEntries === null) {
    console.warn(
      `Warning: Stoat brand assets are missing or empty at ${brandAssets}; using whitelabel assets only.`,
    );
  }

  // entry -> source folder; brand wins over fallback on collision
  const sources = new Map(
    fallbackEntries.map((entry) => [entry, fallbackAssets]),
  );
  if (brandEntries !== null) {
    for (const entry of brandEntries) {
      const collides = sources.has(entry);
      sources.set(entry, brandAssets);
      if (!collides) continue;
      // Warn when a brand entry hides fallback files the app may reference.
      const [fallbackFiles, brandFiles] = await Promise.all([
        listFiles(join(fallbackAssets, entry)),
        listFiles(join(brandAssets, entry)),
      ]);
      const shadowed = fallbackFiles.filter(
        (file) => !brandFiles.includes(file),
      );
      if (shadowed.length > 0) {
        console.warn(
          `Warning: brand assets/${entry} shadows fallback files: ${shadowed.join(", ")}`,
        );
      }
    }
  }

  for (const [entry, source] of sources) {
    const stat = await lstat(join(source, entry));
    // Directories use lnk's default type (symlink on POSIX, junction
    // fallback on Windows) exactly like the old single-link behavior;
    // files are plain symlinks.
    const type = stat.isDirectory() ? "default" : "symbolic";
    await lnk(join(source, entry), assetsPath, { rename: entry, type });
    console.info(
      `assets/${entry} -> ${relative(packageFolder, source)}/${entry}`,
    );
  }

  console.info(
    brandEntries !== null
      ? `Configured Stoat assets with whitelabel fallback (${sources.size} entries).`
      : `Configured whitelabel fallback assets (${sources.size} entries).`,
  );
}

try {
  await prepareAssetsFolder();
  await configureAssets();
} catch (error) {
  console.error(error);
  process.exit(1);
}
