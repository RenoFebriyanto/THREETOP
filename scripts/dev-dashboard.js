const { spawn, exec } = require('child_process')
const os = require('os')
const path = require('path')

const opener = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open'
const nextBinary = path.join(__dirname, '..', 'node_modules', '.bin', process.platform === 'win32' ? 'next.cmd' : 'next')

let opened = false

const child = spawn(nextBinary, ['dev'], { stdio: ['inherit', 'pipe', 'pipe'] })

child.stdout.on('data', (chunk) => {
  const s = chunk.toString()
  process.stdout.write(s)

  if (!opened) {
    const m = s.match(/https?:\/\/[^\s]+/)
    if (m) {
      const url = m[0].replace(/\/+$/, '') + '/dashboard'
      opened = true
      // give a brief delay to ensure browser open succeeds
      setTimeout(() => {
        exec(`${opener} "${url}"`, (err) => {
          if (err) console.error('Failed to open browser:', err)
        })
      }, 300)
    }
  }
})

child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk.toString())
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code)
  }
})

process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
