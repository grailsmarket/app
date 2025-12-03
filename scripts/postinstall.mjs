import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = dirname(__dirname)

async function main() {
  try {
    // Resolve chromium package location
    const chromiumResolvedPath = import.meta.resolve('@sparticuz/chromium-min')

    // Convert file:// URL to regular path
    const chromiumPath = chromiumResolvedPath.replace(/^file:\/\//, '')

    // Get the package root directory (goes up from build/esm/index.js to package root)
    const chromiumDir = dirname(dirname(dirname(chromiumPath)))
    const binDir = join(chromiumDir, 'bin')

    // Create tar archive in public folder
    const publicDir = join(projectRoot, 'public')
    const outputPath = join(publicDir, 'chromium-pack.tar')

    console.log('📦 Creating chromium tar archive at:', outputPath)

    // Tar the contents of bin/ directly (without bin prefix)
    execSync(`tar -cf "${outputPath}" -C "${binDir}" .`, {
      stdio: 'inherit',
      cwd: projectRoot,
    })

    console.log('✅ Archive created successfully!')
  } catch (error) {
    console.error('❌ Failed to create chromium archive:', error.message)
    process.exit(1)
  }
}

main()
