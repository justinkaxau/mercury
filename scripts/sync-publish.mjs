import fs from "node:fs/promises"
import path from "node:path"
import yaml from "yaml"

const WIKI_DIR = path.resolve("D:/Workspace/Obsidian/Neural Chamber/02_Wiki")
const PUBLISH_DIR = path.resolve("D:/Workspace/Obsidian/Neural Chamber/Publish")
const PUBLISH_ASSETS_DIR = path.join(PUBLISH_DIR, "assets")

// Files in Publish that should NEVER be pruned or overwritten
const PROTECTED_FILES = new Set(["index.md", "assets/.gitkeep"])

// Supported asset extensions
const ASSET_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".ico",
  ".tiff",
  ".jxl",
  ".pdf",
  ".mp4",
  ".webm",
])

/**
 * Checks whether a filename has a supported asset extension
 */
function isAssetFile(filename) {
  const ext = path.extname(filename).toLowerCase()
  return ASSET_EXTENSIONS.has(ext)
}

/**
 * Recursively find all .md files in a directory
 */
async function getMarkdownFiles(dir) {
  const results = []
  async function scan(currentDir) {
    let entries
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await scan(fullPath)
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(fullPath)
      }
    }
  }
  await scan(dir)
  return results
}

/**
 * Recursively find all asset files in a directory
 */
async function getAssetFiles(dir) {
  const results = []
  async function scan(currentDir) {
    let entries
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await scan(fullPath)
      } else if (entry.isFile() && isAssetFile(entry.name)) {
        results.push(fullPath)
      }
    }
  }
  await scan(dir)
  return results
}

/**
 * Parses frontmatter and body from a markdown file content
 */
function parseFrontmatter(content) {
  const cleanContent = content.replace(/^\uFEFF/, "")
  const match = cleanContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) {
    return { frontmatter: {}, body: cleanContent, hasFrontmatter: false }
  }
  try {
    const data = yaml.parse(match[1]) || {}
    const body = cleanContent.slice(match[0].length)
    return { frontmatter: data, body, hasFrontmatter: true }
  } catch {
    return { frontmatter: {}, body: cleanContent, hasFrontmatter: false }
  }
}

/**
 * Formats date object or string into YYYY-MM-DD
 */
function formatDate(val) {
  if (!val) return null
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10)
  }
  const str = String(val).trim()
  const dateMatch = str.match(/^\d{4}-\d{2}-\d{2}/)
  return dateMatch ? dateMatch[0] : str
}

/**
 * Transforms wiki note content into clean public note content
 */
function transformContent(frontmatter, body) {
  // 1. Build clean frontmatter
  const cleanFrontmatter = {
    publish: true,
  }

  // Map date
  const resolvedDate = formatDate(frontmatter.date || frontmatter.date_ingested)
  if (resolvedDate) {
    cleanFrontmatter.date = resolvedDate
  }

  // Preserve title / description if explicitly set
  if (frontmatter.title) {
    cleanFrontmatter.title = frontmatter.title
  }
  if (frontmatter.description) {
    cleanFrontmatter.description = frontmatter.description
  }

  const yamlStr = yaml.stringify(cleanFrontmatter).trim()

  // 2. Clean body: Strip leading H1 title and immediate blank lines
  let cleanBody = body
  const h1Match = cleanBody.match(/^\s*#\s+[^\r\n]+(?:\r?\n)*/)
  if (h1Match) {
    cleanBody = cleanBody.slice(h1Match[0].length)
  }

  return `---\n${yamlStr}\n---\n\n${cleanBody.trimStart()}`
}

/**
 * Extracts asset references (wikilink embeds and markdown images) from body text
 */
function extractAssetReferences(body) {
  const refs = new Set()

  // 1. Wikilink embeds: ![[image.png]] or ![[image.png|500]] or ![[assets/image.png|alt|500]]
  const wikilinkRegex = /!\[\[([^\]|#\r\n]+)(?:[|#][^\]\r\n]*)?\]\]/g
  let match
  while ((match = wikilinkRegex.exec(body)) !== null) {
    const rawTarget = match[1].trim()
    if (isAssetFile(rawTarget)) {
      refs.add(rawTarget)
    }
  }

  // 2. Standard markdown images: ![alt](path/to/image.png)
  const mdImageRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g
  while ((match = mdImageRegex.exec(body)) !== null) {
    const rawTarget = match[2].trim()
    // Ignore external URLs or data URIs
    if (/^(https?:|\/\/|data:)/i.test(rawTarget)) continue
    if (isAssetFile(rawTarget)) {
      refs.add(rawTarget)
    }
  }

  return Array.from(refs)
}

/**
 * Copies an asset from source to destination if changed or missing
 * Returns true if copied, false if unchanged
 */
async function copyAssetIfChanged(srcFullPath, destFullPath) {
  try {
    const srcStat = await fs.stat(srcFullPath)
    const destStat = await fs.stat(destFullPath)
    if (srcStat.size === destStat.size) {
      const [srcBuf, destBuf] = await Promise.all([
        fs.readFile(srcFullPath),
        fs.readFile(destFullPath),
      ])
      if (srcBuf.equals(destBuf)) {
        return false
      }
    }
  } catch {
    // Destination does not exist
  }

  await fs.mkdir(path.dirname(destFullPath), { recursive: true })
  await fs.copyFile(srcFullPath, destFullPath)
  return true
}

async function main() {
  console.log("🚀 Bắt đầu đồng bộ từ 02_Wiki sang Publish...\n")

  const wikiFiles = await getMarkdownFiles(WIKI_DIR)
  const existingPublishFiles = await getMarkdownFiles(PUBLISH_DIR)

  // Map of filename -> existing relative path in Publish
  const publishFileMap = new Map()
  for (const file of existingPublishFiles) {
    const rel = path.relative(PUBLISH_DIR, file).replace(/\\/g, "/")
    const base = path.basename(file)
    publishFileMap.set(base, rel)
  }

  // Index all asset files in 02_Wiki for fast lookup
  const allWikiAssets = await getAssetFiles(WIKI_DIR)
  const wikiAssetMap = new Map()
  for (const assetPath of allWikiAssets) {
    const base = path.basename(assetPath)
    wikiAssetMap.set(base, assetPath)
  }

  const generatedPublishRelPaths = new Set()
  const usedAssetBaseNames = new Set()

  let noteUpdatedCount = 0
  let noteCreatedCount = 0
  let noteSkippedCount = 0

  let assetCopiedCount = 0
  let assetUnchangedCount = 0

  for (const wikiFile of wikiFiles) {
    const content = await fs.readFile(wikiFile, "utf-8")
    const { frontmatter, body } = parseFrontmatter(content)

    if (frontmatter.publish === true || String(frontmatter.publish).toLowerCase() === "true") {
      const baseName = path.basename(wikiFile)

      // Determine target relative path in Publish
      let targetRelPath
      if (publishFileMap.has(baseName)) {
        targetRelPath = publishFileMap.get(baseName)
      } else {
        const relWiki = path.relative(WIKI_DIR, wikiFile).replace(/\\/g, "/")
        // Strip top-level Personal/ or Work/ if present
        targetRelPath = relWiki.replace(/^(Personal|Work)\//, "")
      }

      generatedPublishRelPaths.add(targetRelPath)

      const targetFullPath = path.join(PUBLISH_DIR, targetRelPath)
      const transformed = transformContent(frontmatter, body)

      // Check if existing file has identical content
      let isSame = false
      try {
        const existingContent = await fs.readFile(targetFullPath, "utf-8")
        if (existingContent.replace(/\r\n/g, "\n") === transformed.replace(/\r\n/g, "\n")) {
          isSame = true
        }
      } catch {}

      if (isSame) {
        noteSkippedCount++
      } else {
        const exists = publishFileMap.has(baseName)
        await fs.mkdir(path.dirname(targetFullPath), { recursive: true })
        await fs.writeFile(targetFullPath, transformed, "utf-8")
        if (exists) {
          console.log(`✏️  Đã cập nhật note: ${targetRelPath}`)
          noteUpdatedCount++
        } else {
          console.log(`✨ Đã tạo mới note: ${targetRelPath}`)
          noteCreatedCount++
        }
      }

      // Extract and resolve images/assets used in this note
      const assetRefs = extractAssetReferences(body)
      for (const ref of assetRefs) {
        const assetBaseName = path.basename(ref)
        usedAssetBaseNames.add(assetBaseName)

        // Find source path in 02_Wiki
        let srcAssetPath = null
        // 1. Direct path relative to wikiFile or WIKI_DIR
        const candidate1 = path.resolve(path.dirname(wikiFile), ref)
        const candidate2 = path.resolve(WIKI_DIR, ref)
        try {
          await fs.access(candidate1)
          srcAssetPath = candidate1
        } catch {
          try {
            await fs.access(candidate2)
            srcAssetPath = candidate2
          } catch {
            // 2. Look up by basename in wiki assets index
            if (wikiAssetMap.has(assetBaseName)) {
              srcAssetPath = wikiAssetMap.get(assetBaseName)
            }
          }
        }

        if (srcAssetPath) {
          const destAssetPath = path.join(PUBLISH_ASSETS_DIR, assetBaseName)
          const copied = await copyAssetIfChanged(srcAssetPath, destAssetPath)
          if (copied) {
            console.log(`🖼️  Đã sao chép ảnh: assets/${assetBaseName}`)
            assetCopiedCount++
          } else {
            assetUnchangedCount++
          }
        } else {
          console.warn(`⚠️  Cảnh báo: Không tìm thấy ảnh "${ref}" được tham chiếu trong [${baseName}]`)
        }
      }
    }
  }

  // Prune unreferenced asset files in Publish/assets
  let assetDeletedCount = 0
  const existingPublishAssets = await getAssetFiles(PUBLISH_ASSETS_DIR)
  for (const assetFile of existingPublishAssets) {
    const base = path.basename(assetFile)
    const rel = path.relative(PUBLISH_DIR, assetFile).replace(/\\/g, "/")
    if (PROTECTED_FILES.has(rel)) continue

    if (!usedAssetBaseNames.has(base)) {
      await fs.unlink(assetFile)
      console.log(`🗑️  Đã gỡ bỏ ảnh không dùng: ${rel}`)
      assetDeletedCount++
    }
  }

  // Prune deleted/unpublished markdown files
  let noteDeletedCount = 0
  for (const file of existingPublishFiles) {
    const rel = path.relative(PUBLISH_DIR, file).replace(/\\/g, "/")
    if (PROTECTED_FILES.has(rel)) continue

    if (!generatedPublishRelPaths.has(rel)) {
      await fs.unlink(file)
      console.log(`🗑️  Đã gỡ bỏ note: ${rel}`)
      noteDeletedCount++
    }
  }

  // Clean empty folders in Publish (excluding assets if preserved)
  async function cleanEmptyDirs(dir) {
    let entries
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDir = path.join(dir, entry.name)
        await cleanEmptyDirs(subDir)
        try {
          const remaining = await fs.readdir(subDir)
          if (remaining.length === 0) {
            await fs.rmdir(subDir)
          }
        } catch {}
      }
    }
  }
  await cleanEmptyDirs(PUBLISH_DIR)

  console.log("\n=================================")
  console.log(`🎉 Hoàn tất đồng bộ:`)
  console.log(`   📝 Note:`)
  console.log(`      - Tạo mới:    ${noteCreatedCount}`)
  console.log(`      - Cập nhật:   ${noteUpdatedCount}`)
  console.log(`      - Không đổi:  ${noteSkippedCount}`)
  console.log(`      - Gỡ bỏ:      ${noteDeletedCount}`)
  console.log(`   🖼️  Hình ảnh & Tệp đính kèm:`)
  console.log(`      - Sao chép:   ${assetCopiedCount}`)
  console.log(`      - Không đổi:  ${assetUnchangedCount}`)
  console.log(`      - Gỡ bỏ:      ${assetDeletedCount}`)
  console.log("=================================\n")
}

main().catch((err) => {
  console.error("❌ Lỗi đồng bộ:", err)
  process.exit(1)
})
