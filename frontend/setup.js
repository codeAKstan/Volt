const fs = require("fs")
const { execSync } = require("child_process")
const path = require("path")

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
}

console.log(`${colors.bright}${colors.cyan}
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   Volt Workspace Booking - Setup                       ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
${colors.reset}`)

// Create necessary directories
const directories = [
  "components/ui",
  "components/dashboard",
  "components/landing",
  "components/auth",
  "components/integrations",
  "components/video-conference",
  "app/dashboard/analytics",
  "app/dashboard/availability",
  "app/dashboard/bookings",
  "app/dashboard/bookings/new",
  "app/dashboard/chat",
  "app/dashboard/integrations",
  "app/dashboard/pricing",
  "app/dashboard/profile",
  "app/dashboard/settings",
  "app/dashboard/video-conference",
  "app/dashboard/workspaces",
  "app/dashboard/workspace-calendar",
  "app/login",
  "app/signup",
  "app/contact",
  "lib",
  "hooks",
  "public/images",
]

console.log(`${colors.yellow}Creating directory structure...${colors.reset}`)

directories.forEach((dir) => {
  const dirPath = path.join(process.cwd(), dir)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`Created directory: ${dir}`)
  }
})

// Install dependencies
console.log(`\n${colors.yellow}Installing dependencies...${colors.reset}`)
try {
  execSync("npm install", { stdio: "inherit" })
  console.log(`${colors.green}Dependencies installed successfully!${colors.reset}`)
} catch (error) {
  console.error(`${colors.red}Failed to install dependencies:${colors.reset}`, error)
  process.exit(1)
}

// Install shadcn/ui components
console.log(`\n${colors.yellow}Installing shadcn/ui components...${colors.reset}`)
try {
  execSync("npx shadcn@latest init --yes", { stdio: "inherit" })

  // Install specific components
  const components = [
    "button",
    "card",
    "dialog",
    "dropdown-menu",
    "input",
    "label",
    "popover",
    "select",
    "separator",
    "switch",
    "tabs",
    "toast",
    "tooltip",
    "avatar",
    "badge",
    "calendar",
    "checkbox",
    "accordion",
    "alert-dialog",
    "sidebar",
  ]

  components.forEach((component) => {
    console.log(`Installing ${component}...`)
    execSync(`npx shadcn@latest add ${component} --yes`, { stdio: "inherit" })
  })

  console.log(`${colors.green}shadcn/ui components installed successfully!${colors.reset}`)
} catch (error) {
  console.error(`${colors.red}Failed to install shadcn/ui components:${colors.reset}`, error)
  process.exit(1)
}

console.log(`\n${colors.bright}${colors.green}Setup completed successfully!${colors.reset}`)
console.log(`\n${colors.cyan}To start the development server, run:${colors.reset}`)
console.log(`${colors.bright}npm run dev${colors.reset}`)
console.log(`\n${colors.cyan}Then open http://localhost:3000 in your browser.${colors.reset}`)
