import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

export function loadEnv(): void {
  const cwd = process.cwd()
  const localPath = path.join(cwd, '.env.local')
  if (fs.existsSync(localPath)) {
    dotenv.config({ path: localPath })
    return
  }
  dotenv.config()
}


