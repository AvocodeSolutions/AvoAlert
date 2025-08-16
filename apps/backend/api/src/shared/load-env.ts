import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

export function loadEnv(): void {
  // Try multiple paths for .env.local
  const possiblePaths = [
    path.join(process.cwd(), '.env.local'),                    // Current working directory
    path.join(__dirname, '../../.env.local'),                 // Relative to this file
    path.join(process.cwd(), 'apps/backend/api/.env.local'),  // From monorepo root
  ]
  
  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      console.log(`Loading environment from: ${envPath}`)
      dotenv.config({ path: envPath })
      return
    }
  }
  
  // Fallback to default .env
  dotenv.config()
  console.log('Using default .env or system environment variables')
}


