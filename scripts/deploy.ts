#!/usr/bin/env node
import { execSync } from "child_process"
import readline from "readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const platforms = ["vercel", "netlify", "cloudflare"]

async function promptForPlatform(): Promise<string> {
  return new Promise((resolve) => {
    rl.question(
      `Select deployment platform:
1. Vercel
2. Netlify
3. Cloudflare Pages
Enter number (1-3): `,
      (answer) => {
        const num = Number.parseInt(answer.trim())
        if (num >= 1 && num <= 3) {
          resolve(platforms[num - 1])
        } else {
          console.log("Invalid selection. Defaulting to Vercel.")
          resolve("vercel")
        }
      },
    )
  })
}

async function promptForEnvironment(): Promise<string> {
  return new Promise((resolve) => {
    rl.question(
      `Select environment:
1. Production
2. Preview
Enter number (1-2): `,
      (answer) => {
        const num = Number.parseInt(answer.trim())
        if (num === 1) {
          resolve("production")
        } else if (num === 2) {
          resolve("preview")
        } else {
          console.log("Invalid selection. Defaulting to production.")
          resolve("production")
        }
      },
    )
  })
}

async function main() {
  console.log("🚀 OctoTask Deployment Script")
  console.log("-----------------------------")

  const platform = await promptForPlatform()
  const environment = await promptForEnvironment()

  console.log(`\nPreparing to deploy to ${platform} (${environment})...\n`)

  try {
    // Build the application
    console.log("Building application...")
    execSync("npm run build", { stdio: "inherit" })

    // Deploy based on selected platform
    switch (platform) {
      case "vercel":
        console.log("\nDeploying to Vercel...")
        execSync(`npx vercel ${environment === "production" ? "--prod" : ""}`, { stdio: "inherit" })
        break

      case "netlify":
        console.log("\nDeploying to Netlify...")
        execSync(`npx netlify deploy ${environment === "production" ? "--prod" : ""}`, { stdio: "inherit" })
        break

      case "cloudflare":
        console.log("\nDeploying to Cloudflare Pages...")
        execSync(
          `npx wrangler pages publish .next ${environment === "production" ? "--branch=main" : "--branch=preview"}`,
          { stdio: "inherit" },
        )
        break
    }

    console.log("\n✅ Deployment complete!")
  } catch (error) {
    console.error("\n❌ Deployment failed:", error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
