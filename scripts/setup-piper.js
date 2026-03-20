const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const basePath = path.join(__dirname, '..', 'resources', 'piper')
const voicesPath = path.join(basePath, 'voices')
const piperExe = path.join(basePath, 'piper.exe')
const voiceModel1 = path.join(voicesPath, 'es_ES-mls_10246-low.onnx')
const voiceModel2 = path.join(voicesPath, 'es_ES-carlfm-x_low.onnx')
const voiceConfig1 = path.join(voicesPath, 'es_ES-mls_10246-low.onnx.json')
const voiceConfig2 = path.join(voicesPath, 'es_ES-carlfm-x_low.onnx.json')

function exists(p) {
  return fs.existsSync(p)
}

function isValidJsonFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim()
    if (!raw.startsWith('{')) {
      return false
    }
    JSON.parse(raw)
    return true
  } catch {
    return false
  }
}

function installPiper() {
  console.log('Installing Piper TTS and voice assets. This may take a minute...')

  try {
    const psScript = `
      $ErrorActionPreference = 'Stop'
      New-Item -Path "resources/piper/voices" -ItemType Directory -Force | Out-Null
      if (Test-Path "piper") { Remove-Item -Path "piper" -Recurse -Force }

      Write-Host "Downloading Piper runtime..."
      curl.exe -L "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip" -o "piper.zip"

      Write-Host "Extracting Piper..."
      Expand-Archive -Path "piper.zip" -DestinationPath "." -Force
      Copy-Item -Path "piper/*" -Destination "resources/piper/" -Recurse -Force
      Remove-Item -Path "piper" -Recurse -Force
      Remove-Item -Path "piper.zip" -Force

      Write-Host "Downloading es_ES-mls_10246-low..."
      curl.exe -L "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx" -o "resources/piper/voices/es_ES-mls_10246-low.onnx"
      curl.exe -L "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json" -o "resources/piper/voices/es_ES-mls_10246-low.onnx.json"

      Write-Host "Downloading es_ES-carlfm-x_low..."
      curl.exe -L "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/carlfm/x_low/es_ES-carlfm-x_low.onnx" -o "resources/piper/voices/es_ES-carlfm-x_low.onnx"
      curl.exe -L "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/carlfm/x_low/es_ES-carlfm-x_low.onnx.json" -o "resources/piper/voices/es_ES-carlfm-x_low.onnx.json"
    `

    execSync(`powershell -ExecutionPolicy Bypass -Command "${psScript.replace(/\r?\n/g, '; ')}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })

    if (!isValidJsonFile(voiceConfig1) || !isValidJsonFile(voiceConfig2)) {
      throw new Error('Downloaded Piper voice metadata is invalid.')
    }

    console.log('Piper installed correctly.')
  } catch (err) {
    console.error('Error installing Piper:', err.message)
    process.exit(1)
  }
}

function ensurePiper() {
  if (
    !exists(piperExe) ||
    !exists(voiceModel1) ||
    !exists(voiceModel2) ||
    !exists(voiceConfig1) ||
    !exists(voiceConfig2) ||
    !isValidJsonFile(voiceConfig1) ||
    !isValidJsonFile(voiceConfig2)
  ) {
    installPiper()
  } else {
    console.log('Piper TTS pipeline verified and ready.')
  }
}

ensurePiper()
