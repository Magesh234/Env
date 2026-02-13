const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')

let mainWindow
let nextProcess

const PORT = 3000

function waitForNextJS() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log('Timeout reached, opening window anyway')
      resolve()
    }, 30000)

    const interval = setInterval(() => {
      http.get(`http://localhost:${PORT}`, (res) => {
        clearInterval(interval)
        clearTimeout(timeout)
        console.log('Next.js server is ready!')
        resolve()
      }).on('error', () => {
        // still waiting
      })
    }, 1000)
  })
}

function startNextServer() {
  const isDev = !app.isPackaged
  
  if (isDev) {
    console.log('Dev mode - Next.js should already be running')
    return
  }

  // In production, everything is in app.asar.unpacked
  const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked')
  
  // Path to Next.js CLI
  const nextCliPath = path.join(unpackedPath, 'node_modules', 'next', 'dist', 'bin', 'next')

  console.log('Unpacked path:', unpackedPath)
  console.log('Next.js CLI path:', nextCliPath)

  // Use node from Electron
  nextProcess = spawn(
    process.execPath,
    ['--no-deprecation', nextCliPath, 'start', '-p', String(PORT)],
    {
      cwd: unpackedPath,
      env: {
        ...process.env,
        PORT: String(PORT),
        NODE_ENV: 'production',
        ELECTRON_RUN_AS_NODE: '1'  // Critical: tells Electron to run as Node.js, not launch new Electron
      },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )

  nextProcess.stdout.on('data', (data) => {
    console.log(`[Next.js]: ${data.toString().trim()}`)
  })

  nextProcess.stderr.on('data', (data) => {
    const message = data.toString().trim()
    if (!message.includes('disk_cache') && !message.includes('gpu_disk_cache')) {
      console.error(`[Next.js ERROR]: ${message}`)
    }
  })

  nextProcess.on('error', (err) => {
    console.error('Failed to start Next.js process:', err)
  })

  nextProcess.on('exit', (code, signal) => {
    console.log(`Next.js process exited with code ${code} and signal ${signal}`)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  mainWindow.loadURL(`http://localhost:${PORT}`)

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  console.log('App is packaged:', app.isPackaged)
  console.log('Resources path:', process.resourcesPath)

  if (app.isPackaged) {
    console.log('Production mode — starting Next.js server...')
    startNextServer()
  } else {
    console.log('Dev mode — Next.js should be running on port 3000')
  }

  console.log('Waiting for Next.js to be ready...')
  await waitForNextJS()
  console.log('Opening window...')

  createWindow()
})

app.on('window-all-closed', () => {
  if (nextProcess) {
    nextProcess.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})