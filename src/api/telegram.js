/**
 * Telegram Notification Service
 *
 * Sends Telegram messages when an agent replies to an issue.
 * Uses localStorage for deduplication — each issue is only notified once.
 * Auto-splits long messages into multiple parts (Telegram limit: 4096 chars).
 * Uses Markdown (Legacy) parse mode for table support.
 *
 * Env vars:
 *   VITE_TELEGRAM_BOT_TOKEN — Bot token from @BotFather
 *   VITE_TELEGRAM_CHAT_ID  — Target chat/user ID
 */

const STORAGE_KEY = 'hermoso_tg_sent_issues'
const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || ''
const TG_MAX_LEN = 4096

// ─── Dedup helpers ────────────────────────────────────────────────────────────

/** Load the set of issue IDs already sent to Telegram */
function loadSentSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

/** Persist the sent set back to localStorage */
function saveSentSet(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

/**
 * Check if an issue has already been notified.
 * @param {string} issueId
 * @returns {boolean}
 */
export function wasIssueNotified(issueId) {
  return loadSentSet().has(issueId)
}

/**
 * Mark an issue as notified so it won't be sent again.
 * @param {string} issueId
 */
function markIssueNotified(issueId) {
  const set = loadSentSet()
  set.add(issueId)
  saveSentSet(set)
}

// ─── Telegram API ─────────────────────────────────────────────────────────────

/**
 * Send a text message to Telegram using Markdown (Legacy) parse mode.
 * @param {string} text — Markdown-formatted message body
 * @returns {Promise<object|null>} Telegram API response or null on failure
 */
async function sendTelegramMessage(text) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[telegram] Missing VITE_TELEGRAM_BOT_TOKEN or VITE_TELEGRAM_CHAT_ID')
    return null
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('[telegram] Send failed:', res.status, errText)
    return null
  }

  return res.json()
}

/**
 * Split a long text into chunks that fit within Telegram's 4096 char limit.
 * Tries to split on newline boundaries to keep content readable.
 *
 * @param {string} text — Full text to split
 * @param {number} maxLen — Max chars per message (default 4096)
 * @returns {string[]} Array of message chunks
 */
function splitMessage(text, maxLen = TG_MAX_LEN) {
  if (text.length <= maxLen) return [text]

  const chunks = []
  let remaining = text

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining)
      break
    }

    // Try to find a newline to split on, searching backwards from maxLen
    let splitAt = remaining.lastIndexOf('\n', maxLen)

    // If no newline found near the end, try space
    if (splitAt < maxLen * 0.5) {
      splitAt = remaining.lastIndexOf(' ', maxLen)
    }

    // If still no good split point, hard cut
    if (splitAt < maxLen * 0.5) {
      splitAt = maxLen
    }

    chunks.push(remaining.slice(0, splitAt))
    remaining = remaining.slice(splitAt).trimStart()
  }

  return chunks
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Notify Telegram about an agent's reply to an issue.
 * Deduplicated — will only send once per issue.
 * Auto-splits into multiple messages if content exceeds 4096 chars.
 *
 * @param {object} params
 * @param {string} params.issueId — Unique issue ID (used for dedup)
 * @param {string} params.issueTitle — Issue title
 * @param {string} params.agentName — Name of the agent that replied
 * @param {string} params.aiResponse — Full AI response text
 * @param {string} [params.identifier] — Issue identifier (e.g. #42)
 * @returns {Promise<boolean>} true if sent, false if skipped or failed
 */
export async function notifyAgentReply({ issueId, issueTitle, agentName, aiResponse, identifier }) {
  if (!issueId) return false

  // Dedup check — skip if already sent
  if (wasIssueNotified(issueId)) return false

  const safeTitle = escapeMd(issueTitle || 'Untitled')
  const safeAgent = escapeMd(agentName || 'Agent')
  const safeId = identifier ? '`' + escapeMd(identifier) + '`' : ''

  // Build the header part
  const header = [
    '🤖 *Agent Reply*',
    `${safeId} *${safeTitle}*`,
    `Agent: *${safeAgent}*`,
    '',
  ].join('\n')

  // Build the footer
  const footer = `\n_${new Date().toLocaleString()}_`

  // Calculate available space for content
  const headerLen = header.length
  const footerLen = footer.length
  const contentBudget = TG_MAX_LEN - headerLen - footerLen - 10 // 10 char safety margin

  // Split the AI response into chunks
  const responseChunks = splitMessage(aiResponse, contentBudget)

  let allSent = true

  for (let i = 0; i < responseChunks.length; i++) {
    const partNum = responseChunks.length > 1 ? ` (${i + 1}/${responseChunks.length})` : ''
    const chunkHeader = header + (i > 0 ? `🤖 *Agent Reply* (continued${partNum})\n\n` : '')
    const chunkFooter = i === responseChunks.length - 1 ? footer : ''

    const text = i === 0
      ? chunkHeader + '```\n' + responseChunks[i] + '\n```' + chunkFooter
      : '🤖 *Agent Reply* (continued' + partNum + ')\n\n```\n' + responseChunks[i] + '\n```' + chunkFooter

    const result = await sendTelegramMessage(text)
    if (!result) allSent = false

    // Small delay between messages to avoid rate limiting
    if (i < responseChunks.length - 1) {
      await new Promise((r) => setTimeout(r, 300))
    }
  }

  if (allSent) {
    markIssueNotified(issueId)
    return true
  }

  return false
}

/**
 * Clear the dedup history (e.g. for testing).
 */
export function clearTelegramHistory() {
  localStorage.removeItem(STORAGE_KEY)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Escape special Markdown characters for Telegram Markdown (Legacy) parse mode */
function escapeMd(str) {
  if (!str) return ''
  return str
    .replace(/\\/g, '\\\\')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/`/g, '\\`')
}
