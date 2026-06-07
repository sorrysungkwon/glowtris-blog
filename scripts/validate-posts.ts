#!/usr/bin/env node
/**
 * Post validation script
 * Checks EN/KO synchronization, frontmatter integrity, and content validity
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDir = path.join(process.cwd(), 'posts')
const koPostsDir = path.join(postsDir, 'ko')

interface ValidationError {
  slug: string
  type: 'missing' | 'mismatch' | 'invalid' | 'empty'
  message: string
  severity: 'error' | 'warning'
}

const errors: ValidationError[] = []

// Get all EN posts
const enFiles = fs.readdirSync(postsDir)
  .filter(f => f.endsWith('.mdx') && f !== 'ko')
  .map(f => f.replace(/\.mdx$/, ''))

// Get all KO posts
const koFiles = fs.readdirSync(koPostsDir)
  .filter(f => f.endsWith('.mdx'))
  .map(f => f.replace(/\.mdx$/, ''))

console.log(`📊 Found ${enFiles.length} EN posts, ${koFiles.length} KO posts\n`)

// Check each EN post
for (const slug of enFiles) {
  const enFile = path.join(postsDir, `${slug}.mdx`)
  const koFile = path.join(koPostsDir, `${slug}.mdx`)

  // Read EN post
  const enContent = fs.readFileSync(enFile, 'utf8')
  const { data: enData, content: enBody } = matter(enContent)

  // Check EN validity
  if (!enData.title) {
    errors.push({
      slug,
      type: 'invalid',
      message: 'Missing title in EN post',
      severity: 'error'
    })
  }
  if (!enData.date) {
    errors.push({
      slug,
      type: 'invalid',
      message: 'Missing date in EN post',
      severity: 'error'
    })
  }
  if (!enBody || !enBody.trim()) {
    errors.push({
      slug,
      type: 'empty',
      message: 'EN post content is empty',
      severity: 'error'
    })
  }

  // Check KO synchronization
  if (!fs.existsSync(koFile)) {
    errors.push({
      slug,
      type: 'missing',
      message: 'Missing KO version',
      severity: 'warning'
    })
  } else {
    const koContent = fs.readFileSync(koFile, 'utf8')
    const { data: koData, content: koBody } = matter(koContent)

    // Check metadata sync
    if (enData.title !== koData.title) {
      errors.push({
        slug,
        type: 'mismatch',
        message: `EN title: "${enData.title}" vs KO title: "${koData.title}"`,
        severity: 'warning'
      })
    }
    if (enData.date !== koData.date) {
      errors.push({
        slug,
        type: 'mismatch',
        message: `EN date: "${enData.date}" vs KO date: "${koData.date}"`,
        severity: 'error'
      })
    }
    if (!koBody || !koBody.trim()) {
      errors.push({
        slug,
        type: 'empty',
        message: 'KO post content is empty',
        severity: 'error'
      })
    }
  }
}

// Check for orphaned KO posts
for (const slug of koFiles) {
  if (!enFiles.includes(slug)) {
    errors.push({
      slug,
      type: 'missing',
      message: 'KO post without EN version',
      severity: 'warning'
    })
  }
}

// Print results
if (errors.length === 0) {
  console.log('✅ All posts are valid and synchronized!\n')
  process.exit(0)
}

const errorCount = errors.filter(e => e.severity === 'error').length
const warningCount = errors.filter(e => e.severity === 'warning').length

console.log(`❌ Found ${errorCount} error(s) and ${warningCount} warning(s):\n`)

// Group by type
const byType = errors.reduce((acc, err) => {
  if (!acc[err.type]) acc[err.type] = []
  acc[err.type].push(err)
  return acc
}, {} as Record<string, ValidationError[]>)

for (const [type, items] of Object.entries(byType)) {
  console.log(`\n📌 ${type.toUpperCase()}:`)
  for (const item of items) {
    const icon = item.severity === 'error' ? '🔴' : '🟡'
    console.log(`  ${icon} [${item.slug}] ${item.message}`)
  }
}

console.log()
process.exit(errorCount > 0 ? 1 : 0)
