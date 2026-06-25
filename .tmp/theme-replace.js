const fs = require('fs')
const path = require('path')
const root = path.resolve(__dirname, '..')
const files = []
const subs = ['app/dashboard', 'app/admin', 'app/terms', 'app/privacy', 'components/admin']
for (const sub of subs) {
  const dir = path.join(root, sub)
  function walk(dir) {
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, name.name)
      if (name.isDirectory()) walk(p)
      else if (name.isFile() && (p.endsWith('.tsx') || p.endsWith('.ts'))) files.push(p)
    }
  }
  if (fs.existsSync(dir)) walk(dir)
}
const patterns = [
  [/text-\[\#e4f0f6\]/g, 'text-[var(--color-frost)]'],
  [/text-\[\#a8c4d4\]/g, 'text-[var(--color-muted)]'],
  [/text-\[\#5a8099\]/g, 'text-[var(--color-muted-strong)]'],
  [/text-\[\#3d5a73\]/g, 'text-[var(--color-muted-strong)]'],
  [/bg-\[\#111827\]\/80/g, 'bg-[var(--color-surface-dark)]'],
  [/bg-\[\#111827\]\/60/g, 'bg-[var(--color-surface-muted)]'],
  [/bg-\[\#111827\]\/40/g, 'bg-[var(--color-surface-muted)]'],
  [/bg-\[\#111827\]/g, 'bg-[var(--color-abyss)]'],
  [/border-\[\#1e2d4a\]\/50/g, 'border-[var(--color-border)]'],
  [/border-\[\#1e2d4a\]\/60/g, 'border-[var(--color-border)]'],
  [/border-\[\#1e2d4a\]\/40/g, 'border-[var(--color-border)]'],
  [/border-\[\#1e2d4a\]\/30/g, 'border-[var(--color-border)]'],
  [/border-\[\#1e2d4a\]/g, 'border-[var(--color-border)]'],
  [/border-\[\#243558\]\/30/g, 'border-[var(--color-border)]'],
  [/style=\{\s*\{\s*background:\s*'#[eE]4[fF]0[fF]6'\s*\}\s*\}/g, "style={{ background: 'var(--color-button-bg)' }}"],
  [/style=\{\s*\{\s*background:\s*'rgba\(10,15,30,0\.85\)'\s*\}\s*\}/g, "style={{ background: 'var(--color-surface-dark)' }}"],
  [/style=\{\s*\{\s*background:\s*'rgba\(10,16,32,0\.6\)'\s*\}\s*\}/g, "style={{ background: 'var(--color-surface-dark)' }}"],
  [/bg-slate-700/g, 'bg-[var(--color-surface-dark)]'],
  [/bg-slate-800/g, 'bg-[var(--color-surface-muted)]'],
  [/placeholder-slate-500/g, 'placeholder-[var(--color-muted-strong)]'],
  [/border-slate-600/g, 'border-[var(--color-border)]'],
  [/border-slate-800/g, 'border-[var(--color-border)]'],
]
for (const file of files) {
  let text = fs.readFileSync(file, 'utf8')
  let orig = text
  for (const [regex, replacement] of patterns) {
    text = text.replace(regex, replacement)
  }
  if (text !== orig) {
    fs.writeFileSync(file, text)
    console.log('UPDATED', path.relative(root, file))
  }
}
