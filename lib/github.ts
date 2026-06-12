import 'server-only'

const API = 'https://api.github.com'

interface GitHubConfig {
  token: string
  owner: string
  repo: string
}

function getConfig(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  if (!token || !owner || !repo) return null
  return { token, owner, repo }
}

function requireConfig(): GitHubConfig {
  const config = getConfig()
  if (!config) throw new Error('GitHub credentials not configured')
  return config
}

function jsonHeaders(token: string) {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  }
}

function contentUrl(c: GitHubConfig, filePath: string, branch?: string) {
  const ref = branch ? `?ref=${branch}` : ''
  return `${API}/repos/${c.owner}/${c.repo}/contents/${filePath}${ref}`
}

/** Fetch raw file content. Returns null if missing or credentials unset. */
export async function fetchRawFile(filePath: string, branch = 'main'): Promise<string | null> {
  const c = getConfig()
  if (!c) return null

  try {
    const res = await fetch(contentUrl(c, filePath, branch), {
      headers: {
        Authorization: `token ${c.token}`,
        Accept: 'application/vnd.github.v3.raw',
      },
      cache: 'no-store',
    })
    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error(`GitHub API error: ${res.status}`)
    }
    return await res.text()
  } catch (error) {
    console.error('GitHub fetch error:', error)
    return null
  }
}

/** List .mdx filenames in a directory. Returns [] if missing or credentials unset. */
export async function listMdxFiles(dirPath: string, branch = 'main'): Promise<string[]> {
  const c = getConfig()
  if (!c) return []

  try {
    const res = await fetch(contentUrl(c, dirPath, branch), {
      headers: jsonHeaders(c.token),
      cache: 'no-store',
    })
    if (!res.ok) {
      if (res.status === 404) return []
      throw new Error(`GitHub API error: ${res.status}`)
    }
    const files = await res.json()
    return files
      .filter((f: any) => f.type === 'file' && f.name.endsWith('.mdx'))
      .map((f: any) => f.name)
  } catch (error) {
    console.error('GitHub list error:', error)
    return []
  }
}

async function getFileSha(c: GitHubConfig, filePath: string, branch: string): Promise<string | undefined> {
  try {
    const res = await fetch(contentUrl(c, filePath, branch), {
      headers: jsonHeaders(c.token),
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      return data.sha
    }
  } catch {
    // File doesn't exist
  }
  return undefined
}

/** Create branch from main if it doesn't exist. */
export async function ensureBranch(branch: string): Promise<void> {
  const c = requireConfig()

  const checkRes = await fetch(`${API}/repos/${c.owner}/${c.repo}/git/refs/heads/${branch}`, {
    headers: jsonHeaders(c.token),
    cache: 'no-store',
  })
  if (checkRes.ok) return

  const mainRes = await fetch(`${API}/repos/${c.owner}/${c.repo}/git/refs/heads/main`, {
    headers: jsonHeaders(c.token),
    cache: 'no-store',
  })
  if (!mainRes.ok) throw new Error(`Failed to get main branch SHA: ${mainRes.status}`)
  const { object } = await mainRes.json()

  const createRes = await fetch(`${API}/repos/${c.owner}/${c.repo}/git/refs`, {
    method: 'POST',
    headers: { Authorization: `token ${c.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: object.sha }),
  })
  if (!createRes.ok) {
    const err = await createRes.text()
    throw new Error(`Failed to create branch ${branch}: ${createRes.status} - ${err}`)
  }
  console.log(`✅ Created branch: ${branch}`)
}

/** Create or update a file. Auto-creates non-main branches from main. */
export async function putFile(
  filePath: string,
  content: string | Buffer,
  message: string,
  branch = 'main'
): Promise<void> {
  const c = requireConfig()

  if (branch !== 'main') {
    await ensureBranch(branch)
  }

  const sha = await getFileSha(c, filePath, branch)
  const body: Record<string, string> = {
    message,
    content: (typeof content === 'string' ? Buffer.from(content) : content).toString('base64'),
    branch,
  }
  if (sha) body.sha = sha

  const res = await fetch(contentUrl(c, filePath), {
    method: 'PUT',
    headers: { Authorization: `token ${c.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub API error: ${res.status} - ${err}`)
  }
}

/** Delete a file. Returns true if deleted or already absent on the branch. */
export async function deleteFile(filePath: string, message: string, branch = 'main'): Promise<boolean> {
  const c = requireConfig()

  const sha = await getFileSha(c, filePath, branch)
  if (!sha) return true // already absent

  const res = await fetch(contentUrl(c, filePath), {
    method: 'DELETE',
    headers: { Authorization: `token ${c.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub API error: ${res.status} - ${err}`)
  }
  return true
}
