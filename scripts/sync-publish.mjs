import fs from "node:fs/promises"
import path from "node:path"
import yaml from "yaml"

const WIKI_DIR = path.resolve("D:/Workspace/Obsidian/Neural Chamber/02_Wiki")
const PUBLISH_DIR = path.resolve("D:/Workspace/Obsidian/Neural Chamber/Publish")

// Files in Publish that should NEVER be pruned or overwritten
const PROTECTED_FILES = new Set(["index.md"])

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
 * Parses frontmatter and body from a markdown file content
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) {
    return { frontmatter: {}, body: content, hasFrontmatter: false }
  }
  try {
    const data = yaml.parse(match[1]) || {}
    const body = content.slice(match[0].length)
    return { frontmatter: data, body, hasFrontmatter: true }
  } catch {
    return { frontmatter: {}, body: content, hasFrontmatter: false }
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

  const generatedPublishRelPaths = new Set()
  let updatedCount = 0
  let createdCount = 0
  let skippedCount = 0

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
        skippedCount++
      } else {
        const exists = publishFileMap.has(baseName)
        await fs.mkdir(path.dirname(targetFullPath), { recursive: true })
        await fs.writeFile(targetFullPath, transformed, "utf-8")
        if (exists) {
          console.log(`✏️  Đã cập nhật: ${targetRelPath}`)
          updatedCount++
        } else {
          console.log(`✨ Đã tạo mới: ${targetRelPath}`)
          createdCount++
        }
      }
    }
  }

  // Prune deleted/unpublished files
  let deletedCount = 0
  for (const file of existingPublishFiles) {
    const rel = path.relative(PUBLISH_DIR, file).replace(/\\/g, "/")
    if (PROTECTED_FILES.has(rel)) continue

    if (!generatedPublishRelPaths.has(rel)) {
      await fs.unlink(file)
      console.log(`🗑️  Đã gỡ bỏ: ${rel}`)
      deletedCount++
    }
  }

  // Clean empty folders in Publish
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
        const remaining = await fs.readdir(subDir)
        if (remaining.length === 0) {
          await fs.rmdir(subDir)
        }
      }
    }
  }
  await cleanEmptyDirs(PUBLISH_DIR)

  console.log("\n=================================")
  console.log(`🎉 Hoàn tất đồng bộ:`)
  console.log(`   - Tạo mới:   ${createdCount}`)
  console.log(`   - Cập nhật:  ${updatedCount}`)
  console.log(`   - Không đổi: ${skippedCount}`)
  console.log(`   - Gỡ bỏ:     ${deletedCount}`)
  console.log("=================================\n")
}

main().catch((err) => {
  console.error("❌ Lỗi đồng bộ:", err)
  process.exit(1)
})
