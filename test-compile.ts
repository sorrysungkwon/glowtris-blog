import fs from 'fs'
import path from 'path'
import { compile } from '@mdx-js/mdx'
import { fixKoreanMarkdownBold } from './lib/utils'

async function run() {
  const koDir = path.join(process.cwd(), 'posts', 'ko')
  const files = fs.readdirSync(koDir).filter(f => f.endsWith('.mdx'))
  
  for (const file of files) {
    const raw = fs.readFileSync(path.join(koDir, file), 'utf8')
    const content = raw.replace(/^---[\s\S]*?---\n/, '')
    const fixed = fixKoreanMarkdownBold(content)
    try {
      await compile(fixed, { outputFormat: 'function-body' })
      console.log(`✅ ${file} compiled successfully`)
    } catch (e) {
      console.error(`❌ ${file} failed:`, (e as Error).message)
    }
  }
}
run()
