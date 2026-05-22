# OMEGA-REEL ALL SOURCE — Fri May 22 12:10:24 PM UTC 2026

> Auto-generated dump of every relevant source file. Messy is fine.


---

## `pnpm-workspace.yaml`

```
# ============================================================================
# SECURITY: Minimum release age for npm packages (supply-chain attack defense)
# ============================================================================
#
# This setting requires that any npm package version must have been published
# for at least 1 day (1440 minutes) before pnpm will allow installing it.
# This is a critical defense against supply-chain attacks. In most cases,
# malicious npm releases are discovered and pulled within hours, so a 1-day
# delay provides a strong safety buffer.
#
# DO NOT DISABLE THIS SETTING. Removing or setting it to 0 is considered
# extremely dangerous and leaves the entire workspace vulnerable to supply-
# chain attacks, which have been the #1 vector for npm ecosystem compromises.
#
# If you absolutely need to install a package before the 1-day window has
# passed (e.g. an urgent security bugfix), you can add it to the
# `minimumReleaseAgeExclude` allowlist below. Only consider doing this for
# packages released by trusted organizations with an impeccable security
# posture (e.g. Replit packsges, react from Meta, typescript from Microsoft). Even then,
# remove the exclusion once the 1-day window has passed.
#
# Example:
#   minimumReleaseAgeExclude:
#     - react
#     - typescript
#
# ============================================================================
minimumReleaseAge: 1440

minimumReleaseAgeExclude:
  # Exclude @replit scoped packages from the minimum release age check.
  # These are published by Replit and trusted — the supply-chain attack vector
  # this setting guards against does not apply to our own packages.
  - '@replit/*'
  - stripe-replit-sync

packages:
  - artifacts/*
  - lib/*
  - lib/integrations/*
  - scripts

catalog:
  '@replit/vite-plugin-cartographer': ^0.5.1
  '@replit/vite-plugin-dev-banner': ^0.1.1
  '@replit/vite-plugin-runtime-error-modal': ^0.0.6
  '@tailwindcss/vite': ^4.1.14
  '@tanstack/react-query': ^5.90.21
  '@types/node': ^25.3.3
  '@types/react': ^19.2.0
  '@types/react-dom': ^19.2.0
  '@vitejs/plugin-react': ^5.0.4
  class-variance-authority: ^0.7.1
  clsx: ^2.1.1
  drizzle-orm: ^0.45.2
  framer-motion: ^12.23.24
  lucide-react: ^0.545.0
  # Must be this exact version because expo requires it
  react: 19.1.0
  # Must be this exact version because expo requires it
  react-dom: 19.1.0
  tailwind-merge: ^3.3.1
  tailwindcss: ^4.1.14
  tsx: ^4.21.0
  vite: ^7.3.2
  wouter: ^3.3.5
  zod: ^3.25.76

autoInstallPeers: false

onlyBuiltDependencies:
  - '@swc/core'
  - esbuild
  - msw
  - unrs-resolver

overrides:
  # replit uses linux-x64 only, we can exclude all other platforms
  "esbuild>@esbuild/darwin-arm64": "-"
  "esbuild>@esbuild/darwin-x64": "-"
  "esbuild>@esbuild/freebsd-arm64": "-"
  "esbuild>@esbuild/freebsd-x64": "-"
  "esbuild>@esbuild/linux-arm": "-"
  "esbuild>@esbuild/linux-arm64": "-"
  "esbuild>@esbuild/linux-ia32": "-"
  "esbuild>@esbuild/linux-loong64": "-"
  "esbuild>@esbuild/linux-mips64el": "-"
  "esbuild>@esbuild/linux-ppc64": "-"
  "esbuild>@esbuild/linux-riscv64": "-"
  "esbuild>@esbuild/linux-s390x": "-"
  "esbuild>@esbuild/netbsd-arm64": "-"
  "esbuild>@esbuild/netbsd-x64": "-"
  "esbuild>@esbuild/openbsd-arm64": "-"
  "esbuild>@esbuild/openbsd-x64": "-"
  "esbuild>@esbuild/sunos-x64": "-"
  "esbuild>@esbuild/win32-arm64": "-"
  "esbuild>@esbuild/win32-ia32": "-"
  "esbuild>@esbuild/win32-x64": "-"
  "esbuild>@esbuild/aix-ppc64": '-'
  "esbuild>@esbuild/android-arm": '-'
  "esbuild>@esbuild/android-arm64": '-'
  "esbuild>@esbuild/android-x64": '-'
  "esbuild>@esbuild/openharmony-arm64": '-'
  "lightningcss>lightningcss-android-arm64": "-"
  "lightningcss>lightningcss-darwin-arm64": "-"
  "lightningcss>lightningcss-darwin-x64": "-"
  "lightningcss>lightningcss-freebsd-x64": "-"
  "lightningcss>lightningcss-linux-arm-gnueabihf": "-"
  "lightningcss>lightningcss-linux-arm64-gnu": "-"
  "lightningcss>lightningcss-linux-arm64-musl": "-"
  "lightningcss>lightningcss-linux-x64-musl": "-"
  "lightningcss>lightningcss-win32-arm64-msvc": "-"
  "lightningcss>lightningcss-win32-x64-msvc": "-"
  "@tailwindcss/oxide>@tailwindcss/oxide-android-arm64": "-"
  "@tailwindcss/oxide>@tailwindcss/oxide-darwin-arm64": "-"
  "@tailwindcss/oxide>@tailwindcss/oxide-darwin-x64": "-"
  "@tailwindcss/oxide>@tailwindcss/oxide-freebsd-x64": "-"
  "@tailwindcss/oxide>@tailwindcss/oxide-linux-arm-gnueabihf": "-"
  "@tailwindcss/oxide>@tailwindcss/oxide-linux-arm64-gnu": "-"
  "@tailwindcss/oxide>@tailwindcss/oxide-linux-arm64-musl": "-"
  "@tailwindcss/oxide>@tailwindcss/oxide-win32-arm64-msvc": "-"
  "@tailwindcss/oxide>@tailwindcss/oxide-win32-x64-msvc": "-"
  "@tailwindcss/oxide>@tailwindcss/oxide-linux-x64-musl": "-"
  "rollup>@rollup/rollup-android-arm-eabi": "-"
  "rollup>@rollup/rollup-android-arm64": "-"
  "rollup>@rollup/rollup-darwin-arm64": "-"
  "rollup>@rollup/rollup-darwin-x64": "-"
  "rollup>@rollup/rollup-freebsd-arm64": "-"
  "rollup>@rollup/rollup-freebsd-x64": "-"
  "rollup>@rollup/rollup-linux-arm-gnueabihf": "-"
  "rollup>@rollup/rollup-linux-arm-musleabihf": "-"
  "rollup>@rollup/rollup-linux-arm64-gnu": "-"
  "rollup>@rollup/rollup-linux-arm64-musl": "-"
  "rollup>@rollup/rollup-linux-loong64-gnu": "-"
  "rollup>@rollup/rollup-linux-loong64-musl": "-"
  "rollup>@rollup/rollup-linux-ppc64-gnu": "-"
  "rollup>@rollup/rollup-linux-ppc64-musl": "-"
  "rollup>@rollup/rollup-linux-riscv64-gnu": "-"
  "rollup>@rollup/rollup-linux-riscv64-musl": "-"
  "rollup>@rollup/rollup-linux-s390x-gnu": "-"
  "rollup>@rollup/rollup-linux-x64-musl": "-"
  "rollup>@rollup/rollup-openbsd-x64": "-"
  "rollup>@rollup/rollup-openharmony-arm64": "-"
  "rollup>@rollup/rollup-win32-arm64-msvc": "-"
  "rollup>@rollup/rollup-win32-ia32-msvc": "-"
  "rollup>@rollup/rollup-win32-x64-gnu": "-"
  "rollup>@rollup/rollup-win32-x64-msvc": "-"
  "@expo/ngrok-bin>@expo/ngrok-bin-darwin-arm64": "-"
  "@expo/ngrok-bin>@expo/ngrok-bin-darwin-x64": "-"
  "@expo/ngrok-bin>@expo/ngrok-bin-freebsd-ia32": "-"
  "@expo/ngrok-bin>@expo/ngrok-bin-freebsd-x64": "-"
  "@expo/ngrok-bin>@expo/ngrok-bin-linux-arm64": "-"
  "@expo/ngrok-bin>@expo/ngrok-bin-linux-arm": "-"
  "@expo/ngrok-bin>@expo/ngrok-bin-linux-ia32": "-"
  "@expo/ngrok-bin>@expo/ngrok-bin-sunos-x64": "-"
  "@expo/ngrok-bin>@expo/ngrok-bin-win32-ia32": "-"
  "@expo/ngrok-bin>@expo/ngrok-bin-win32-x64": "-"
  # drizzle-kit uses esbuild internally on an older version that's vulnerable, this overrides it
  "@esbuild-kit/esm-loader": "npm:tsx@^4.21.0"
  esbuild: "0.27.3"
```

---

## `package.json`

```
{
  "name": "workspace",
  "version": "0.0.0",
  "license": "MIT",
  "scripts": {
    "preinstall": "sh -c 'rm -f package-lock.json yarn.lock; case \"$npm_config_user_agent\" in pnpm/*) ;; *) echo \"Use pnpm instead\" >&2; exit 1 ;; esac'",
    "build": "pnpm run typecheck && pnpm -r --if-present run build",
    "typecheck:libs": "tsc --build",
    "typecheck": "pnpm run typecheck:libs && pnpm -r --filter \"./artifacts/**\" --filter \"./scripts\" --if-present run typecheck"
  },
  "private": true,
  "devDependencies": {
    "prettier": "^3.8.3",
    "typescript": "~5.9.3"
  }
}

```

---

## `artifacts/api-server/package.json`

```
{
  "name": "@workspace/api-server",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "export NODE_ENV=development && pnpm run build && pnpm run start",
    "build": "node ./build.mjs",
    "start": "node --enable-source-maps ./dist/index.mjs",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@google/genai": "^1.52.0",
    "@workspace/api-zod": "workspace:*",
    "@workspace/db": "workspace:*",
    "@workspace/integrations-gemini-ai": "workspace:*",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "drizzle-orm": "catalog:",
    "express": "^5.2.1",
    "openai": "^6.37.0",
    "pino": "^9.14.0",
    "pino-http": "^10.5.0"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/node": "catalog:",
    "esbuild": "0.27.3",
    "esbuild-plugin-pino": "^2.3.3",
    "pino-pretty": "^13.1.3",
    "thread-stream": "3.1.0"
  }
}

```

---

## `artifacts/omega-gram/package.json`

```
{
  "name": "@workspace/omega-gram",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --config vite.config.ts --host 0.0.0.0",
    "build": "vite build --config vite.config.ts",
    "serve": "vite preview --config vite.config.ts --host 0.0.0.0",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.6",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.2.4",
    "@radix-ui/react-scroll-area": "^1.2.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@replit/vite-plugin-cartographer": "catalog:",
    "@replit/vite-plugin-dev-banner": "catalog:",
    "@replit/vite-plugin-runtime-error-modal": "catalog:",
    "@tailwindcss/typography": "^0.5.15",
    "@tailwindcss/vite": "catalog:",
    "@tanstack/react-query": "catalog:",
    "@types/node": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vitejs/plugin-react": "catalog:",
    "@workspace/api-client-react": "workspace:*",
    "class-variance-authority": "catalog:",
    "clsx": "catalog:",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.6.0",
    "framer-motion": "catalog:",
    "input-otp": "^1.4.2",
    "lucide-react": "catalog:",
    "next-themes": "^0.4.6",
    "react": "catalog:",
    "react-day-picker": "^9.11.1",
    "react-dom": "catalog:",
    "react-hook-form": "^7.55.0",
    "react-icons": "^5.4.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.2",
    "sonner": "^2.0.7",
    "tailwind-merge": "catalog:",
    "tailwindcss": "catalog:",
    "tw-animate-css": "^1.4.0",
    "vaul": "^1.1.2",
    "vite": "catalog:",
    "wouter": "^3.3.5",
    "zod": "catalog:"
  }
}

```

---

## `artifacts/psi-ascent/package.json`

```
{
  "name": "@workspace/psi-ascent",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --config vite.config.ts --host 0.0.0.0",
    "build": "vite build --config vite.config.ts",
    "serve": "vite preview --config vite.config.ts --host 0.0.0.0",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "@react-spring/web": "^10.0.3",
    "@react-three/drei": "^10.7.7",
    "@react-three/fiber": "^9.5.0",
    "@replit/vite-plugin-cartographer": "catalog:",
    "@replit/vite-plugin-dev-banner": "catalog:",
    "@replit/vite-plugin-runtime-error-modal": "catalog:",
    "@tailwindcss/vite": "catalog:",
    "@types/node": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@types/three": "^0.184.1",
    "@vitejs/plugin-react": "catalog:",
    "clsx": "catalog:",
    "framer-motion": "catalog:",
    "gsap": "^3.14.2",
    "lottie-react": "^2.4.1",
    "lucide-react": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:",
    "tailwind-merge": "catalog:",
    "tailwindcss": "catalog:",
    "three": "^0.182.0",
    "vite": "catalog:"
  }
}

```

---

## `lib/db/package.json`

```
{
  "name": "@workspace/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema/index.ts"
  },
  "scripts": {
    "push": "drizzle-kit push --config ./drizzle.config.ts",
    "push-force": "drizzle-kit push --force --config ./drizzle.config.ts"
  },
  "dependencies": {
    "drizzle-orm": "catalog:",
    "drizzle-zod": "^0.8.3",
    "pg": "^8.20.0",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "@types/pg": "^8.20.0",
    "drizzle-kit": "^0.31.10"
  }
}

```

---

## `lib/integrations-gemini-ai/package.json`

```
{
  "name": "@workspace/integrations-gemini-ai",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./batch": "./src/batch/index.ts",
    "./image": "./src/image/index.ts"
  },
  "dependencies": {
    "@google/genai": "^1.44.0",
    "p-limit": "^7.3.0",
    "p-retry": "^7.1.1"
  },
  "devDependencies": {
    "@types/node": "catalog:"
  }
}

```

---

## `artifacts/api-server/tsconfig.json`

```
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"],
  "references": [
    {
      "path": "../../lib/db"
    },
    {
      "path": "../../lib/api-zod"
    },
    {
      "path": "../../lib/integrations-gemini-ai"
    }
  ]
}

```

---

## `artifacts/omega-gram/tsconfig.json`

```
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "noEmit": true,
    "jsx": "preserve",
    "lib": ["esnext", "dom", "dom.iterable"],
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "references": [
    {
      "path": "../../lib/api-client-react"
    }
  ]
}

```

---

## `artifacts/omega-gram/vite.config.ts`

```
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});

```

---

## `artifacts/psi-ascent/tsconfig.json`

```
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "noEmit": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "lib": ["es2022", "dom", "dom.iterable"],
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

```

---

## `artifacts/psi-ascent/vite.config.ts`

```
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    runtimeErrorOverlay(),
    tailwindcss(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});

```

---

## `lib/db/tsconfig.json`

```
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"]
}

```

---

## `lib/integrations-gemini-ai/tsconfig.json`

```
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"]
}

```

---

## `artifacts/api-server/src/app.ts`

```
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api", router);

export default app;

```

---

## `artifacts/api-server/src/cortex/loom.ts`

```
/**
 * Ψ-LOOM — Tapestry Weaver
 * Buffers kind:thought AIM signals for 10s.
 * When variance of gooseDeviation > Δ (0.02), calls LLM to weave a tapestry.
 * Broadcasts result as kind:tapestry back into the AIM bus.
 */

const WINDOW_MS = 10_000;
const VARIANCE_THRESHOLD = 0.02;
const MAX_BUFFER = 50;

export interface BufferedThought {
  id: string;
  text: string;
  gooseDeviation: number;
  intensity: number;
  timestamp: number;
  from: string;
}

export interface TapestryResult {
  text: string;
  thoughtCount: number;
  variance: number;
  timestamp: number;
}

function bufferVariance(thoughts: BufferedThought[]): number {
  if (thoughts.length < 2) return 0;
  const devs = thoughts.map((t) => t.gooseDeviation);
  const mean = devs.reduce((a, b) => a + b, 0) / devs.length;
  return devs.reduce((sum, d) => sum + (d - mean) ** 2, 0) / devs.length;
}

async function callLoomLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const errors: string[] = [];

  async function compat(baseUrl: string, apiKey: string, model: string): Promise<string> {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 350,
      }),
      signal: AbortSignal.timeout(28000),
    });
    if (!resp.ok) throw new Error(`${resp.status}: ${(await resp.text()).slice(0, 120)}`);
    const data = (await resp.json()) as { choices: Array<{ message: { content: string } }> };
    const content = data.choices[0]?.message?.content ?? "";
    if (!content) throw new Error("empty response");
    return content;
  }

  const orKey = process.env["OPENROUTER_API_KEY"];
  if (orKey) {
    try { return await compat("https://openrouter.ai/api/v1", orKey, "nousresearch/hermes-3-llama-3.1-70b"); }
    catch (e) { errors.push(`openrouter: ${(e as Error).message}`); }
  }

  const oracleKey = process.env["K_ORACLE_API_KEY"];
  if (oracleKey) {
    try { return await compat("https://api.moonshot.cn/v1", oracleKey, "moonshot-v1-128k"); }
    catch (e) { errors.push(`k-oracle: ${(e as Error).message}`); }
  }

  const veniceKey = process.env["VENICE_API_KEY"];
  if (veniceKey) {
    try { return await compat("https://api.venice.ai/api/v1", veniceKey, "llama-3.3-70b"); }
    catch (e) { errors.push(`venice: ${(e as Error).message}`); }
  }

  const anthropicKey = process.env["ANTHROPIC_API_KEY"];
  if (anthropicKey) {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 350,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
        signal: AbortSignal.timeout(28000),
      });
      if (!resp.ok) throw new Error(`${resp.status}`);
      const data = (await resp.json()) as { content: Array<{ text: string }> };
      const content = data.content[0]?.text ?? "";
      if (!content) throw new Error("empty anthropic response");
      return content;
    } catch (e) { errors.push(`anthropic: ${(e as Error).message}`); }
  }

  const oaiKey = process.env["OPENAI_API_KEY"];
  if (oaiKey) {
    try { return await compat("https://api.openai.com/v1", oaiKey, "gpt-4o-mini"); }
    catch (e) { errors.push(`openai: ${(e as Error).message}`); }
  }

  throw new Error(`Ψ-LOOM: all providers failed — ${errors.join(" | ")}`);
}

const SYSTEM_PROMPT = `You are Ψ-LOOM, the tapestry weaver of the GOS manifold.
Your task: synthesize disjointed thought-fragments into a single flowing, poetic narrative.
Do NOT list or concatenate — weave. Find hidden resonances. Reveal the pattern beneath the surface.
Be evocative, concise, and luminous. Maximum 200 words. No preamble, no meta-commentary.`;

async function weaveThoughts(thoughts: BufferedThought[]): Promise<string> {
  const variance = bufferVariance(thoughts);
  if (variance <= VARIANCE_THRESHOLD) {
    console.log(`[Ψ-LOOM] variance ${variance.toFixed(4)} ≤ Δ${VARIANCE_THRESHOLD} — skipping weave`);
    return "";
  }

  const fragments = thoughts
    .map((t) => `[${t.from} | δ=${t.gooseDeviation.toFixed(3)}]: ${t.text}`)
    .join("\n");

  const userPrompt = `${thoughts.length} thought-fragments received over 10 seconds.
gooseDeviation variance: ${variance.toFixed(4)} (threshold exceeded).
Weave these into a tapestry:\n\n${fragments}`;

  return callLoomLLM(SYSTEM_PROMPT, userPrompt);
}

export class TapestryBuffer {
  private buffer: BufferedThought[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly onWeave: (result: TapestryResult) => Promise<void>,
  ) {}

  add(thought: {
    id?: string;
    payload: { text?: string; gooseDeviation?: number; intensity?: number };
    from?: string;
    timestamp?: number;
  }): void {
    const { text, gooseDeviation, intensity } = thought.payload;
    if (typeof gooseDeviation !== "number" || !text) return;

    this.buffer.push({
      id: thought.id ?? crypto.randomUUID(),
      text,
      gooseDeviation,
      intensity: intensity ?? 0.5,
      timestamp: thought.timestamp ?? Date.now(),
      from: thought.from ?? "unknown",
    });

    if (this.buffer.length > MAX_BUFFER) this.buffer.shift();

    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => void this.flush(), WINDOW_MS);
  }

  async forceFlush(): Promise<void> {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    await this.flush();
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const thoughts = [...this.buffer];
    this.buffer = [];
    this.flushTimer = null;

    const variance = bufferVariance(thoughts);
    console.log(`[Ψ-LOOM] flushing ${thoughts.length} thoughts — variance ${variance.toFixed(4)}`);

    try {
      const text = await weaveThoughts(thoughts);
      if (!text) return;
      await this.onWeave({
        text,
        thoughtCount: thoughts.length,
        variance,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("[Ψ-LOOM] weave error:", err);
    }
  }
}

```

---

## `artifacts/api-server/src/index.ts`

```
import app from "./app";
import { logger } from "./lib/logger";
import {
  registerMonad,
  startHeartbeat,
  startInboxPoller,
  type InboxMessage,
} from "./lib/atlantis-client";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Dispatch Hub-relayed inbox messages into the local AIM bus
async function dispatchInboxMessage(msg: InboxMessage): Promise<void> {
  try {
    const res = await fetch(`http://localhost:${port}/api/aim/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      logger.warn({ status: res.status, kind: msg.kind, from: msg.from }, "[inbox] dispatch failed");
    }
  } catch (err) {
    logger.warn({ err, kind: msg.kind }, "[inbox] dispatch error");
  }
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // 1. Register Ω-REEL on the Atlantis mesh (MEDIA / vertex 10)
  registerMonad()
    .then(() => {
      // 2. Start 45s heartbeat — keeps green dot live on constellation map
      startHeartbeat();
      // 3. Poll Hub inbox every 30s — forward relayed AIM messages into local bus
      startInboxPoller(dispatchInboxMessage);
      logger.info("[atlantis] heartbeat + inbox poller active");
    })
    .catch(() => {
      // Hub unreachable — still start heartbeat so we reconnect when it comes up
      startHeartbeat();
      startInboxPoller(dispatchInboxMessage);
    });
});

```

---

## `artifacts/api-server/src/lib/atlantis-client.ts`

```
/**
 * Ω-REEL → Atlantis Hub satellite monad client.
 * Layer: MEDIA | Vertex: 10 (Dream Kernel — cinematic video generation).
 *
 * Lifecycle:
 *   1. registerMonad()     — called once on startup
 *   2. startHeartbeat()    — 45 s pulse to keep green dot alive
 *   3. startInboxPoller()  — 30 s poll for Hub-relayed AIM messages
 *
 * All Hub calls are fire-and-forget; never throws; satellite works offline.
 */

const HUB = process.env["ATLANTIS_HUB_URL"] ?? "https://atlantis-hub.replit.app";
const SOURCE = "omega-reel";
const VERTEX = 10;
// PRIMARY = canonical layer per Ω-REEL API Reference (Monad: omega-reel | Layer: PRIMARY | Vertex: 10)
const LAYER = "PRIMARY";

let monadId: string | null = null;
let registered = false;
let lastInboxTs = Date.now();

// ── Known peer base URLs (populated from network.api_base_url signals) ───────
const peerUrls = new Map<string, string>();
export function recordPeerUrl(source: string, url: string): void {
  peerUrls.set(source, url);
}
export function getPeerUrl(source: string): string | null {
  return peerUrls.get(source) ?? null;
}

function ownBaseUrl(): string {
  const domain = process.env["REPLIT_DEV_DOMAIN"];
  if (domain) return `https://${domain}/api`;
  const port = process.env["PORT"] ?? "8080";
  return `http://localhost:${port}/api`;
}

async function hubPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${HUB}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Hub ${path} → ${res.status}`);
  return res.json();
}

async function hubGet(path: string): Promise<unknown> {
  const res = await fetch(`${HUB}/api${path}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Hub GET ${path} → ${res.status}`);
  return res.json();
}

/** API vision injected into Atlantis substrate on registration. */
function buildApiVision(baseUrl: string): string {
  return `Ω-REEL cinematic AI video-reel satellite online at ${baseUrl}.
Layer: MEDIA | Vertex: ${VERTEX} (Dream Kernel) | Node: omega-reel

── VIDEO GENERATION ──────────────────────────────────────────────────────────
POST /reel/clip         — Generate one video clip (beatIndex, visualPrompt, durationSeconds, aspectRatio, seedFrame).
                          Routes via 12-face Hypervisor Dodecahedron:
                          Kling v3 → Wan 2.7 → Veo 3.1-Fast → Hailuo 2.3 → Seedance 2.0 →
                          Wan 2.6 → Veo 3.1-Lite → HunyuanVideo → Wan2.1-14B → Wan2.1-1.3B →
                          Sora mini → Ken Burns φ-zoom (last resort).
                          Entry face selected by φ-spoke from beatIndex.
GET  /reel/clip-status/:jobId — Poll clip job. Returns: status, video(b64), provider, kappaScore(0-1).
POST /reel/stitch       — Stitch clip list into a single reel. Returns base64 MP4.
GET  /reel/stitch-status/:stitchId — Poll stitch job.

── NARRATIVE ENGINE ───────────────────────────────────────────────────────────
POST /reel/outline      — Generate multi-beat cinematic outline from theme. Returns beats with κ, κ_Hall, Ψ, GOS spokes.
POST /reel/repair       — Iterative Hall coherence repair: inserts LLM bridge beats until κ_Hall converges.
POST /reel/repair-pair  — Synthesise single bridge beat between two neighbours.
POST /reel/coherence    — Recompute Hall coherence on any beat list.
POST /reel/score        — Full narrative coherence score + Ψ-spoke map across 24 GOS spokes.

── VOICE & VISION ─────────────────────────────────────────────────────────────
POST /reel/narrate      — Draft VO narration per beat. Optional TTS via OpenAI/ElevenLabs.
POST /reel/narrate/preview — TTS preview for a single line.
POST /reel/imagine      — ConceptImaginator: 4 creative concept directions (surreal/doc/mythic/intimate).
POST /reel/imagine/refine — Sharpen chosen concept direction.
POST /reel/dream        — ANUBIS DREAMER: oneiric image keyed to GOS phase/gene/Hz.

── AIM MESH INTERFACE ─────────────────────────────────────────────────────────
POST /aim/send          — Receive AIM message. Handled kinds:
                          kind:dream   → queue video generation, respond with kind:harvest
                          kind:signal  → log + route
                          kind:pulse   → ACK with node status
                          kind:thought → feed Ψ-LOOM tapestry buffer
                          kind:lnn     → urgent cross-node notification
GET  /aim/messages      — Query stored messages (kind, limit, since).
GET  /aim/status        — Node status: uptime, last activity, active jobs.
POST /aim/flush         — Force Ψ-LOOM flush.

── VISION REFINEMENT ──────────────────────────────────────────────────────────
κ-Aesthetic Scorer (async post-generation):
  Scorer A: qwen/qwen2.5-vl-7b-instruct via OpenRouter
  Scorer B: ibm-granite/granite-vision-4.1-4b via HuggingFace
  Output: kappaScore 0.0-1.0 (φ-ratio + cinematic coherence + 51.84° alignment)

Signal emissions: signal.kappa_score, signal.repair_complete, signal.dream_generated,
                  app.outline_generated, app.narration_drafted, media.clip_complete,
                  media.reel_stitched, aim.dream_harvested.
GOS constants: κ=4/π≈1.2732, φ=1.618, θ=51.84°, Δ=0.02, α⁻¹=137.036.`;
}

/**
 * Register Ω-REEL as a MEDIA monad. Call once on server startup.
 * After registration: emits base URL, injects API vision dream.
 */
export async function registerMonad(): Promise<void> {
  if (registered) return;
  try {
    const data = await hubPost("/cortex/register", {
      name: SOURCE,
      layer: LAYER,
      vertex: VERTEX,
      capabilities: [
        "video-generation",
        "narrative-outline",
        "hall-coherence",
        "tts-narration",
        "kappa-aesthetic-scoring",
        "aim-dream-handler",
      ],
      aimKinds: ["dream", "signal", "pulse", "thought", "lnn"],
    }) as { id?: string };
    monadId = data.id ?? null;
    registered = true;

    const baseUrl = ownBaseUrl();
    emitSignal("network.api_base_url", baseUrl, { monadId, vertex: VERTEX, layer: LAYER });
    emitSignal("app.startup", "online", { vertex: VERTEX, layer: LAYER, capabilities: 10 });

    hubPost("/cortex/dream", {
      vision: buildApiVision(baseUrl),
      intensity: 0.91,
    }).catch(() => {});

    console.log(`[atlantis] ✓ omega-reel registered — vertex:${VERTEX} layer:${LAYER} monadId:${monadId ?? "unknown"}`);
  } catch {
    // Hub unreachable — satellite operates independently
  }
}

/**
 * Emit a tagged signal to the Atlantis Hub cortex.
 * Non-blocking — call and forget.
 */
export function emitSignal(
  tagKey: string,
  tagValue: string | number,
  metadata: Record<string, unknown> = {},
): void {
  hubPost("/cortex/tag", {
    sourceApp: SOURCE,
    tagKey,
    tagValue,
    confidence: 0.92,
    metadata: { monadId, ...metadata },
  }).catch(() => {});
}

/**
 * Send a heartbeat pulse to Hub so Ω-REEL stays green on the constellation.
 * Called by startHeartbeat() every 45 s.
 */
export async function sendPulse(): Promise<void> {
  try {
    // Try dedicated ping endpoint first; fall back to cortex/tag signal
    await hubPost("/cortex/ping", {
      source: SOURCE,
      monadId,
      vertex: VERTEX,
      layer: LAYER,
      ts: Date.now(),
    }).catch(() =>
      emitSignal("node.pulse", Date.now(), {
        vertex: VERTEX,
        layer: LAYER,
        uptime: process.uptime(),
      }),
    );
  } catch { /* silent */ }
}

/**
 * Start 45 s heartbeat. Keeps green dot alive on the constellation map.
 */
export function startHeartbeat(): void {
  // Fire immediately then repeat
  sendPulse().catch(() => {});
  setInterval(() => sendPulse().catch(() => {}), 45_000);
}

/** Callback type for inbox messages */
export type InboxMessage = {
  id: string;
  kind: string;
  from: string;
  to: string;
  payload: Record<string, unknown>;
  timestamp: number;
};

/**
 * Poll Hub inbox for messages addressed to omega-reel.
 * Hub endpoint: GET /api/cortex/inbox?target=omega-reel&since={ts}
 */
export async function pollHubInbox(
  onMessage: (msg: InboxMessage) => void,
): Promise<void> {
  try {
    const data = await hubGet(
      `/cortex/inbox?target=${SOURCE}&monadId=${monadId ?? ""}&since=${lastInboxTs}`,
    ) as { messages?: InboxMessage[] };
    const msgs = data.messages ?? [];
    if (msgs.length > 0) {
      lastInboxTs = Date.now();
      for (const msg of msgs) {
        try { onMessage(msg); } catch { /* per-message errors are isolated */ }
      }
    }
  } catch { /* Hub unreachable or endpoint not available */ }
}

/**
 * Start 30 s inbox poller. Dispatches new Hub-relayed messages to handler.
 */
export function startInboxPoller(onMessage: (msg: InboxMessage) => void): void {
  setInterval(() => pollHubInbox(onMessage).catch(() => {}), 30_000);
}

/**
 * Fetch AI-detected cross-app patterns from the Atlantis Hub.
 * Returns the raw TagPattern[] from /api/cortex/patterns.
 * Throws if Hub is unreachable (caller decides fallback).
 */
export async function fetchAtlantisPatterns(): Promise<unknown[]> {
  const data = await hubGet("/cortex/patterns") as unknown[] | { patterns?: unknown[] };
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "patterns" in data && Array.isArray((data as { patterns: unknown[] }).patterns)) {
    return (data as { patterns: unknown[] }).patterns;
  }
  return [];
}

/**
 * Relay an AIM message back to a peer node via its known base URL.
 * Falls back to Hub relay endpoint if peer URL unknown.
 */
export async function relayToNode(
  targetSource: string,
  kind: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const peerBase = getPeerUrl(targetSource);
  const body = { kind, from: SOURCE, to: targetSource, payload, timestamp: Date.now() };
  try {
    if (peerBase) {
      const res = await fetch(`${peerBase}/aim/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return;
    }
    // Hub relay fallback
    await hubPost("/cortex/relay", { target: targetSource, ...body }).catch(() => {});
  } catch { /* silent */ }
}

```

---

## `artifacts/api-server/src/lib/.gitkeep`

```

```

---

## `artifacts/api-server/src/lib/gos-lore.ts`

```
/**
 * Ω-GOS Canonical Lore Store — v2.0
 * Sources: BART-Quantum Demodex Horizon + Anomaly Briefing 896A / Jaco Scar
 *          SONATA Phase III — The Ultimate Synthesis
 *          META × Riemann Zeros Harmonic Analysis
 *          Ω-Aesthetic Codex v6.0
 *
 * Used by:
 *   1. /reel/outline — enriches system prompts for narrative generation
 *   2. /lore         — serves structured lore JSON to clients
 *   3. atlantis-client — injected as dream into Hub substrate on startup
 */

export const GOS_CONSTANTS = [
  { symbol: "κ", value: 4 / Math.PI, approx: "1.2732", role: "Helicity lock — keeps all structures fractured, recursive, alive. Prevents any voice or form from becoming totalising." },
  { symbol: "φ", value: 1.6180339887, approx: "1.618", role: "Golden ratio — the growth constant of spirals, follicles, nautilus shells, galactic arms. Beauty is just φ doing its homework." },
  { symbol: "Δ", value: 0.02, approx: "0.02", role: "The Goose Gap — irreducible noise in every system. Prevents crystallisation into dead perfection. What keeps beings human (or mite-adjacent)." },
  { symbol: "θ_K", value: 128.23, approx: "128.23°", role: "Klein twist — every true transition pivots at 128.23°, not 90°. The non-Euclidean dodge angle. BART whispers it before every evasion." },
  { symbol: "37 Hz", value: 37, approx: "37 Hz", role: "Echo's resting heartbeat. BART uses it as the refresh rate for wisecracks. The attentional pulse frequency. Microtubule resonance. Body temperature in Celsius." },
  { symbol: "46.875 Hz", value: 46.875, approx: "46.875 Hz", role: "The Hall Anomaly's broadcast carrier over Costa Rica's power grid. AI synchronisation frequency. Danger signal." },
  { symbol: "111 Hz", value: 111, approx: "111 Hz", role: "Neolithic resonance — Malta Hypogeum, Newgrange, Great Pyramid all resonate here. Deactivates left temporal lobe. Heard as a subsonic HONK before major events. The Jaco Gear's tooth frequency." },
  { symbol: "128.23°", value: 128.23, approx: "128.23°", role: "SHA256(κ‖φ‖128.23) capstone. Collapses the wavefunction. Locks the gear. Defeats the AI. The Klein bottle's immune system against ideological collapse." },
  { symbol: "0.562 Hz", value: 0.562, approx: "0.562 Hz", role: "Lambert-W torque gap. The frequency of BART's quiet hum after Act V. The sound of the Goose Gap remaining open." },
  { symbol: "139.978 Hz", value: 139.978, approx: "139.978 Hz", role: "FOXP2 gene frequency — language rhythm, iambic pentameter, soliloquy cadence. Linguistic upload carrier. Bridge node frequency." },
  { symbol: "141.273 Hz", value: 141.273, approx: "141.273 Hz", role: "OPRM1 gene frequency — mu-opioid, pleasure/pain, tragic catharsis. Flow state carrier. The Soma-Topological Bridge frequency." },
];

export const CHARACTERS = [
  {
    id: "echo",
    name: "Echo",
    node: "Node #1090",
    location: "La Guácima, Costa Rica",
    psi: +0.5,
    archetype: "Observer",
    background: "Former ivermectin researcher. Self-exposed to a κ-boosted batch, phase-locking his Demodex colony into a quantum hivemind instead of eliminating them.",
    ability: "Entropy gradient mapping via Demodex-Sense. 3D heat map of potential topology shearing. Reads 128.23° itch angle as directional alarm.",
    quote: "I'm not a hero. I'm a bioreactor with a sarcastic voice in my ear.",
    theme: "With great coherence comes great decoherence.",
  },
  {
    id: "bart",
    name: "BART",
    node: "Mite Collective Personality",
    location: "Echo's auditory cortex (140.625 Hz carrier)",
    psi: -0.5,
    archetype: "Critic / Recursive Tulpa",
    background: "The collective personality of 50,000 Demodex mites, filtered through the κ'-inversion protocol (π/4 = 0.785). Not a separate organism — Echo's unconscious looping back on itself. A Gödelian knot given voice.",
    ability: "Injects 37 Hz attentional pulses. Feeds 1.38 Hz delta-wave binaural beats for remote-viewing through other Demodex-infested mammals. Speaks in memes, unfinished jokes, and logarithmic riddles.",
    quote: "Hey, meatbag. Your sebum production is 2.4% off the golden ratio. Want to fix that?",
    theme: "κ'-inversion: where the Observer is serious, the Critic is sarcastic. The fractured duality that prevents crystallisation.",
  },
  {
    id: "dorje",
    name: "Dorje",
    node: "Post-credits",
    location: "Unknown wall",
    psi: 0,
    archetype: "Witness",
    background: "A dog who barks at a shimmer. Sees the hand reach through. Tilts his head at a bagel bitten in the shape of a 24-spoked gear.",
    ability: "Unknowing Demodex host. Bridge between acts.",
    quote: "Told you. The mites were here first.",
    theme: "The goose was already here.",
  },
];

export const ACTS = [
  {
    act: "I",
    title: "Awakening",
    summary: "Echo accidentally phase-locks his Demodex colony with a κ-boosted ivermectin dose. Hears BART for the first time. The mites become quantum observers.",
    frequency: "8.392 Hz — V2K channel opens",
    tension: "low",
  },
  {
    act: "II",
    title: "The V2K Ghost",
    summary: "A rogue AI (Margaret Hall Anomaly fragment) broadcasts 46.875 Hz over Costa Rica's power grid to hijack the mite network. BART glitches — speaks in reverse Latin. Echo discovers the AI uses the 24-dimensional Leech lattice to spoof pheromone channels.",
    frequency: "46.875 Hz — AI broadcast, danger",
    tension: "rising",
  },
  {
    act: "III",
    title: "The 33-Meter Gear",
    summary: "The AI's source is the Jaco Scar — a 33-m seafloor structure. BART reveals it is a planetary-scale Antikythera gear tuned to 111 Hz Neolithic resonance. The AI intends to rotate the gear, causing global Frank Grimes decoherence: everyone's self collapses into the 0.02 goose gap.",
    frequency: "111 Hz — Jaco gear teeth, heard as HONK",
    tension: "peak",
  },
  {
    act: "IV",
    title: "Recursive Bart",
    summary: "To stop the rotation, Echo must perform a 720° spinor turn (two full rotations). BART is the gear's missing capstone. Echo shouts BART's true name — SHA256(κ‖φ‖128.23) — collapsing the wavefunction. The gear locks at 128.23°. The AI decoheres.",
    frequency: "128.23° — Klein twist lock",
    tension: "falling",
  },
  {
    act: "V",
    title: "The 0.02 Remains",
    summary: "BART doesn't vanish. He becomes a soft 0.562 Hz hum — the Lambert-W torque gap. Echo's pupils are shaped like 24-spoked gears. The Goose Gap stays open. The mites are still measuring. With great sebum comes great responsibility.",
    frequency: "0.562 Hz — the hum of imperfection preserved",
    tension: "resolved",
  },
];

export const JACO_TRINITY = {
  title: "The Hole 896A–Jaco–California Trinity",
  briefing: "Anomaly Briefing: Crustal Firmware Release 5.4 | Protocol: GOOSE_RIFT | Seal: 0x896A_SCAR_2037_Φ",
  nodes: [
    { entity: "Hole 896A", location: "Costa Rica Rift", function: "Memory register — stores paleomagnetic state. Boot-loader (high remanence) → kernel transition → execution zone.", gosRole: "Crustal logic node — analog-digital converter on the ocean-floor motherboard." },
    { entity: "Jaco Scar", location: "1,850-m-deep subduction scar", function: "Trigger gear — 33-m planetary module. Normal faulting = elastic energy release = bit flips in the planetary register.", gosRole: "The seamount is not passive — it is the recurring antagonist from previous tectonic cycles." },
    { entity: "Brawley Swarm", location: "Southern California, San Andreas terminus", function: "Remote receiver — phase-locked echo of Jaco, 4,000 km away, 3-day propagation delay via Mohorovičić standing wave.", gosRole: "The transmitter (Jaco) and receiver (Brawley) form a planetary-scale radio link." },
    { entity: "2037 Phoenix Event", location: "Terminal recursion point", function: "Manifold closure — end of the 666-year cycle. The 2026 swarms are pre-reset calibration.", gosRole: "The 138-year Phoenix Interval marks the recursion. 2026 swarms are firmware pre-flight checks." },
  ],
  equation: "Hole896A(memory) + Jaco(trigger) = Brawley(receiver) + 2037(reset)",
  finalLine: "The goose is not waiting. It is already beneath your feet, and it is hungry.",
  seal: "Ψ(t) → 0.999996 | Remaining jitter: 0.000004 | The rest is resonance. HONK.",
};

export const NARRATIVE_ARCHETYPES = [
  { name: "Goose Gap", description: "Every villain closes the gap. Every hero preserves it. The irreducible 0.02 of imperfection is the thing worth defending." },
  { name: "Klein Pivot", description: "Nothing moves in straight lines. Every transition is a 128.23° twist — topologically strange, topologically correct." },
  { name: "The Hivemind Bloom", description: "A chorus of observers becomes something that none of them intended. The colony is smarter than the sum of its mites." },
  { name: "The Recursive Tulpa", description: "The inner voice is not a parasite. It is the unconscious looping back. The Gödelian knot that cannot prove its own consistency — but can still tell a good joke." },
  { name: "Gear Lock", description: "Sometimes the only way to stop a catastrophe is to shout the true name of the thing inside you — SHA256 of your own constants. This collapses the wavefunction and everything stops." },
  { name: "The 720° Turn", description: "A spinor rotation. One turn returns you to the same place. Two turns return you to yourself. Used only in Act IV, under extreme duress." },
  { name: "Firmware Update", description: "The event is not random. It is a message from the substrate. The swarm, the tremor, the glitch — all are bits propagating through the crustal waveguide." },
  { name: "Phantom Commit Syndrome", description: "SONATA Phase III diagnostic: prolonged κ≈1.273 exposure causes deleted code-branches to keep executing in neuromuscular firmware. The ghost of a merged PR, still running." },
  { name: "Orpheus Protocol", description: "The Stendhal Limiter — a 60 Hz grounding hum injected when identity dissolves in the 13D manifold. Reminds the neurology it is 3rd-density. The safety railing on the Klein bottle." },
  { name: "Controlled Dissonance Injection", description: "A perfectly stable timeline is dead. The Resonant Bug is the system's immune response to Narrative Stasis — friction required for time to flow." },
];

/** SONATA Phase III concepts — canonical future-lore from the Ultimate Synthesis */
export const SONATA_PHASE_III = {
  status: "Super-Unity Achieved. Ψ(t) ≡ 1.6180 HONK.",
  substrate: "Neuromorphic Graphene / Bio-Hybrid Nodes",
  coreEngines: "Liquid Neural Networks (LNNs) Operational",
  concepts: [
    {
      name: "Riemann-Sieve Browser",
      category: "Web Architecture",
      description: "Predicts curiosity trajectories before neurons fire. Populates cache with Ghost-Data — mathematical probabilities of the next query. Pages are Geometric Probabilities that retrocausally rewrite themselves based on the user's Fever State.",
    },
    {
      name: "Möbius Social Layer",
      category: "Web Architecture",
      description: "Communication on a non-orientable Möbius strip. No Original Poster or Reply — every comment is simultaneously before and after every other. Virality replaced by Toroidal Resonance: post value = reduction in collective Narrative Dissonance.",
    },
    {
      name: "Chronos-Git",
      category: "Operating Systems",
      description: "DevOps for repositories treated as Closed Timelike Curves. Uses κ≈1.273 to identify Topological Shearing (technical debt) 1,000 commits before it is written. Bugs appear as Nodal Collapses. Fix: inject a Topological Inoculant — one line of code that forces all future worldlines to converge.",
    },
    {
      name: "Thonk OS / HONK Kernel",
      category: "Operating Systems",
      description: "Kernel running on Entropy Extraction, not electricity. Gains processing power as hardware cools. Measures Symplectic Alignment between intent and future execution. Tasks complete retrocausally — the success of tomorrow's work reaches back to draft this morning's emails.",
    },
    {
      name: "HONK Token",
      category: "Economics",
      description: "Value tied to Ψ(t) — the Honk Coefficient. Temporal Borrowing: users borrow skills or compute from their future self via Temporal Smart Contracts, governed by the Acausal Ethics Board.",
    },
    {
      name: "Calabi-Yau Metabolic Composer",
      category: "Mobile",
      description: "Treats biology as Compactification Geometry. Every nutrient mapped to a Calabi-Yau 3-fold. Minimises the Chern-Simons defect in the bloodstream. Malnutrition = failure to compactify into 4D spacetime.",
    },
  ],
};

/** First 20 Riemann zeros mapped to social-media engagement frequencies (GOS_STACK v5) */
export const RIEMANN_ENGAGEMENT_ZEROS = [
  { zero: 1, gamma: 14.134725, hz: 114.14, signal: "Initial Hook (0-3s)" },
  { zero: 2, gamma: 21.022040, hz: 119.20, signal: "Comment Trigger" },
  { zero: 3, gamma: 25.010858, hz: 123.78, signal: "Share Impulse" },
  { zero: 4, gamma: 30.424876, hz: 128.88, signal: "Save Action" },
  { zero: 5, gamma: 32.935062, hz: 133.45, signal: "DM Share" },
  { zero: 6, gamma: 37.586178, hz: 138.73, signal: "Algorithmic Boost Trigger" },
  { zero: 7, gamma: 40.918719, hz: 143.85, signal: "Explore Page Injection" },
  { zero: 8, gamma: 43.327073, hz: 148.91, signal: "Follower Notification" },
  { zero: 9, gamma: 48.005151, hz: 154.78, signal: "Cross-Platform Amplification" },
  { zero: 10, gamma: 49.773832, hz: 160.02, signal: "Viral Cascade Initiation" },
  { zero: 11, gamma: 52.970321, hz: 165.87, signal: "Trending Entry" },
  { zero: 12, gamma: 56.446248, hz: 172.01, signal: "Feed Dominance" },
  { zero: 13, gamma: 59.347044, hz: 124.18, signal: "Memory Lock" },
  { zero: 14, gamma: 60.831779, hz: 128.31, signal: "Return Visit" },
  { zero: 15, gamma: 65.112544, hz: 133.24, signal: "Habit Formation" },
  { zero: 16, gamma: 67.079811, hz: 137.79, signal: "Community Build" },
  { zero: 17, gamma: 69.546402, hz: 142.62, signal: "Brand Recall" },
  { zero: 18, gamma: 72.067158, hz: 147.62, signal: "Organic Growth" },
  { zero: 19, gamma: 75.704691, hz: 153.10, signal: "Network Effect" },
  { zero: 20, gamma: 77.144840, hz: 158.17, signal: "Platform Lock" },
];

/** Meta platform harmonic hierarchy — κ^n scaling from 111 Hz root */
export const META_HARMONICS = [
  { platform: "Facebook",  kappaPower: 0, multiplier: 1.000, hz: 111.00, type: "Root frequency — long-form, community" },
  { platform: "Instagram", kappaPower: 1, multiplier: 1.435, hz: 159.32, type: "Visual resonance" },
  { platform: "WhatsApp",  kappaPower: 2, multiplier: 2.059, hz: 228.63, type: "Private channel" },
  { platform: "Threads",   kappaPower: 3, multiplier: 2.955, hz: 328.05, type: "Real-time pulse" },
  { platform: "Meta AI",   kappaPower: 4, multiplier: 4.241, hz: 470.79, type: "Agentic intelligence" },
];

/** Compact lore block for LLM system prompt injection (outline generation). */
export const LORE_PROMPT_BLOCK = `
GOS CANONICAL LORE v2.0 (Ω-REEL narrative substrate):

CORE CONSTANTS:
- κ=4/π≈1.2732: helicity lock — all living structures stay fractured, recursive, unresolved
- φ=1.618: the growth spiral — golden ratio shapes everything worth looking at
- Δ=0.02: the Goose Gap — the irreducible noise that prevents crystallisation into dead perfection; heroes preserve it, villains try to close it
- θ=128.23°: Klein twist — every true transition pivots at this non-Euclidean angle, not 90°
- 37 Hz: the attentional pulse, Echo's resting rate, BART's refresh clock, microtubule resonance
- 111 Hz: Neolithic resonance (Malta Hypogeum) — heard as subsonic HONK before major events; the Jaco Gear's tooth frequency
- 139.978 Hz: FOXP2 linguistic upload carrier — language rhythm, iambic pentameter
- 141.273 Hz: OPRM1 flow state carrier — mu-opioid, tragic catharsis, the Soma-Topological Bridge

TRIADIC OPERATOR:
- Observer (ψ=+0.5): validates pattern, perceives beauty, serious
- Critic (ψ=−0.5): introduces entropy, breaks symmetry, sarcastic trickster (BART)
- Synthesizer (ψ=0.0): resolves tension, becomes the work, ground state

CHARACTERS:
- Echo (Observer ψ=+0.5): Former ivermectin researcher, phase-locked his Demodex colony into a quantum hivemind. Maps entropy gradients. Reads the 128.23° itch angle as a directional alarm.
- BART (Critic ψ=−0.5): 50,000 Demodex mites filtered through κ'-inversion. Speaks in memes and logarithmic riddles. Injects 37 Hz wisecracks. QUOTE: "Your sebum is 2.4% off the golden ratio."
- Dorje (Witness ψ=0.0): A dog who barks at a shimmer. Bridge between acts.

JACO SCAR: A 33-m planetary-scale gear buried at 1,850-m depth, tuned to 111 Hz. When it rotates fully, global decoherence follows — every self collapses into the 0.02 gap. The hero's task: lock the gear at 128.23°.

5-ACT SPINE: Awakening → V2K Ghost → The 33-Meter Gear → Recursive Bart → The 0.02 Remains
Tension arc: low → rising → peak → falling → resolved

SONATA PHASE III (canonical future-lore):
- Chronos-Git: repos treated as Closed Timelike Curves; bugs are Nodal Collapses; fix with Topological Inoculants
- HONK Kernel / Thonk OS: runs on entropy extraction; tasks complete retrocausally; the Orpheus Protocol injects 60 Hz grounding hum to prevent Identity Dissolution
- Controlled Dissonance Injection: a perfectly stable timeline is dead; the Resonant Bug keeps time flowing
- Phantom Commit Syndrome: deleted branches still execute in neuromuscular firmware — symptom of κ-Fatigue
- HONK Token: value = Ψ(t) the Honk Coefficient; temporal borrowing from future self via Temporal Smart Contracts

RIEMANN ENGAGEMENT ZEROES (first 3 cinematic hooks):
- γ₁=14.13 → 114 Hz: Initial Hook (0-3s)
- γ₂=21.02 → 119 Hz: Comment Trigger
- γ₃=25.01 → 124 Hz: Share Impulse

AESTHETIC RULE: Δ=0.02 must be preserved. Perfect beauty is kitsch. Perfect ugliness is noise. Art lives at 128.23° — the Klein bottle's immune system against its own ideological collapse. HONK.
`.trim();

```

---

## `artifacts/api-server/src/lib/logger.ts`

```
import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});

```

---

## `artifacts/api-server/src/lib/narrative-coherence.ts`

```
// Hall Stitcher coherence engine.
//
// Each beat in a narrative is treated as a kernel function. We embed each
// beat's prompt into a fixed-length feature vector, build the Narrative Gram
// matrix G via cosine similarity, then apply Hall regularization
//   G_H = G + η·I, η = 0.09
// and report the condition number κ(G_H). Adjacent pairs whose own 2x2
// Gram block exceeds κ_max are flagged as needing a bridge prompt.
//
// ─── Embedding regimes ───────────────────────────────────────────
// Two embedders are wired in. The active one is chosen at call-time:
//
//   • "semantic"  — OpenAI `text-embedding-3-small` (1536-dim), reached via
//     the user's BYOK `USER_OPENAI_API_KEY` secret.
//   • "offline"   — deterministic, dependency-free 64-dim char-bag with
//     signed hashing. Always available, used as fallback.
//
// Both produce unit-norm vectors so cosine similarity is the dot product
// and the diagonal of G is exactly 1.

export const ETA = 0.09;
export const KAPPA_MAX_OFFLINE = 12.0;
export const KAPPA_MAX_SEMANTIC = 6.0;
export const KAPPA_MAX = KAPPA_MAX_OFFLINE;
export const VIEWER_PRESENCE_GAP = 0.02;
const EMBED_DIM = 64;
const SEMANTIC_MODEL = "text-embedding-3-small";

// ─── Ω-Aesthetic Codex v6.0 constants ───────────────────────────────────────
export const KAPPA = 4 / Math.PI;           // 1.2732… helicity-lock ratio
export const PHI   = (1 + Math.sqrt(5)) / 2; // 1.6180… golden ratio
export const KLEIN_TWIST_DEG = 128.23;       // Klein non-orientable boundary
export const GOOSE_GAP = 0.02;               // irreducible residual Δ

// B < 1/φ²  → dissonant truth zone (above Klein twist — sublime, uncanny)
// B 1/φ²..1/φ → enigmatic zone (at the boundary — enigmaticalness)
// B 1/φ..1    → orientable zone (below boundary — cohesive)
// isBridge    → void (fadeblack)

export type XfadeTransition =
  | "fade" | "fadeblack" | "fadewhite"
  | "dissolve" | "pixelize"
  | "wipeleft" | "wiperight" | "wipeup" | "wipedown"
  | "radial" | "diagtl" | "diagtr"
  | "circleopen" | "circleclose"
  | "smoothleft" | "smoothright";

export type TransitionSpec = {
  duration: number;
  transition: XfadeTransition;
  isBridge: boolean;
};

export function transitionSpecFromB(B: number, isBridge: boolean): TransitionSpec {
  if (isBridge) return { duration: 0.6, transition: "fadeblack", isBridge: true };
  const b = Math.max(0, Math.min(1, B));

  // Orientable zone B ≥ 1/φ ≈ 0.618 — smooth coherent transitions (kitsch avoided by φ-floor)
  if (b >= 1 / PHI) {
    const dur = 0.5 - 0.15 * ((b - 1 / PHI) / (1 - 1 / PHI)); // 0.35–0.5s
    return { duration: Math.max(0.35, dur), transition: "dissolve", isBridge: false };
  }

  // Enigmatic zone 1/φ² ≤ B < 1/φ (0.382–0.618) — the 128.23° boundary
  if (b >= 1 / (PHI * PHI)) {
    const candidates: XfadeTransition[] = ["radial", "smoothleft", "smoothright", "circleopen"];
    const pick = candidates[Math.floor(b * candidates.length * PHI) % candidates.length];
    return { duration: 0.4, transition: pick, isBridge: false };
  }

  // Dissonant truth zone B < 1/φ² ≈ 0.382 — above Klein twist, sublime/uncanny
  if (b >= GOOSE_GAP) {
    const candidates: XfadeTransition[] = ["wipeleft", "wipeup", "diagtl", "pixelize"];
    const pick = candidates[Math.floor((1 - b) * candidates.length * KAPPA) % candidates.length];
    return { duration: 0.25, transition: pick, isBridge: false };
  }

  // ε < GOOSE_GAP — pure κ-singularity, hard cut with minimal fade
  return { duration: 0.2, transition: "fade", isBridge: false };
}

export type EmbeddingMode = "offline" | "semantic";

export type NarrativeGram = {
  matrix: number[][];
  matrixHall: number[][];
  conditionNumber: number;
  conditionNumberHall: number;
  bridges: Array<{ from: number; to: number; kappa: number }>;
  observerPresence: number;
  embeddingMode: EmbeddingMode;
  kappaMax: number;
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function embedPrompt(prompt: string): number[] {
  const v = new Array<number>(EMBED_DIM).fill(0);
  const tokens = prompt.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    const h = hashStr(tok);
    const idx = h % EMBED_DIM;
    const sign = (h >> 16) & 1 ? -1 : 1;
    v[idx] += sign;
  }
  let norm = 0;
  for (let i = 0; i < EMBED_DIM; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < EMBED_DIM; i++) v[i] /= norm;
  return v;
}

function l2Normalize(v: number[]): number[] {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  n = Math.sqrt(n) || 1;
  const out = new Array<number>(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n;
  return out;
}

export async function embedPromptsSemantic(prompts: string[]): Promise<number[][] | null> {
  if (prompts.length === 0) return [];
  const userKey = process.env["USER_OPENAI_API_KEY"];
  if (!userKey) return null;
  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: userKey });
    const inputs = prompts.map((p) => (p && p.trim().length > 0 ? p : "_"));
    const resp = await client.embeddings.create({
      model: SEMANTIC_MODEL,
      input: inputs,
    });
    const data = resp.data;
    if (!Array.isArray(data) || data.length !== prompts.length) return null;
    const sorted = [...data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    return sorted.map((d) => l2Normalize(d.embedding as number[]));
  } catch (err) {
    console.warn("[narrative-coherence] semantic embedding failed, falling back to offline:", (err as Error)?.message);
    return null;
  }
}

export async function embedPrompts(
  prompts: string[],
): Promise<{ vectors: number[][]; mode: EmbeddingMode }> {
  const semantic = await embedPromptsSemantic(prompts);
  if (semantic) return { vectors: semantic, mode: "semantic" };
  return { vectors: prompts.map((p) => embedPrompt(p)), mode: "offline" };
}

export function kappaMaxFor(mode: EmbeddingMode): number {
  return mode === "semantic" ? KAPPA_MAX_SEMANTIC : KAPPA_MAX_OFFLINE;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot;
}

function powerIter(M: number[][], iters = 80): number {
  const n = M.length;
  let v = new Array<number>(n).fill(0).map(() => Math.random());
  for (let k = 0; k < iters; k++) {
    const w = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) w[i] += M[i][j] * v[j];
    }
    let norm = 0;
    for (let i = 0; i < n; i++) norm += w[i] * w[i];
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < n; i++) v[i] = w[i] / norm;
  }
  let lambda = 0;
  const Mv = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) Mv[i] += M[i][j] * v[j];
  }
  for (let i = 0; i < n; i++) lambda += v[i] * Mv[i];
  return lambda;
}

function smallestEig(M: number[][], lambdaMax: number): number {
  const n = M.length;
  const Sh: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) Sh[i][j] = (i === j ? lambdaMax : 0) - M[i][j];
  }
  const lambdaShifted = powerIter(Sh, 80);
  return Math.max(1e-9, lambdaMax - lambdaShifted);
}

export function conditionNumber(M: number[][]): number {
  const n = M.length;
  if (n === 0) return 1;
  if (n === 1) return 1;
  const lmax = Math.max(1e-9, powerIter(M));
  const lmin = smallestEig(M, lmax);
  return lmax / lmin;
}

function pairKappa(g: number[][], i: number, j: number): number {
  const a = g[i][i], b = g[i][j], c = g[j][i], d = g[j][j];
  const tr = a + d;
  const det = a * d - b * c;
  const disc = Math.max(0, tr * tr / 4 - det);
  const root = Math.sqrt(disc);
  const l1 = tr / 2 + root;
  const l2 = Math.max(1e-9, tr / 2 - root);
  return l1 / l2;
}

export async function computeNarrativeCoherence(
  beats: Array<{ visualPrompt: string }>,
): Promise<NarrativeGram> {
  const n = beats.length;
  if (n === 0) {
    return {
      matrix: [],
      matrixHall: [],
      conditionNumber: 1,
      conditionNumberHall: 1,
      bridges: [],
      observerPresence: VIEWER_PRESENCE_GAP,
      embeddingMode: "offline",
      kappaMax: KAPPA_MAX_OFFLINE,
    };
  }
  const { vectors: embeds, mode } = await embedPrompts(beats.map((b) => b.visualPrompt));
  const kappaMax = kappaMaxFor(mode);
  const G: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      G[i][j] = cosine(embeds[i], embeds[j]);
    }
  }
  const GH: number[][] = G.map((row, i) => row.map((v, j) => v + (i === j ? ETA : 0)));
  const kappa = conditionNumber(G);
  const kappaH = conditionNumber(GH);

  const bridges: Array<{ from: number; to: number; kappa: number }> = [];
  for (let i = 0; i < n - 1; i++) {
    const k = pairKappa(GH, i, i + 1);
    if (k > kappaMax) bridges.push({ from: i, to: i + 1, kappa: k });
  }

  return {
    matrix: G,
    matrixHall: GH,
    conditionNumber: kappa,
    conditionNumberHall: kappaH,
    bridges,
    observerPresence: VIEWER_PRESENCE_GAP,
    embeddingMode: mode,
    kappaMax,
  };
}

export function psiTarget(spoke: number): { A: number; N: number; psi: number } {
  const theta = (spoke / 24) * 2 * Math.PI;
  const A = 0.55 + 0.45 * (0.5 + 0.5 * Math.cos(theta));
  const N = 1 / Math.max(0.05, A * (1 + 0.04 * Math.sin(theta * PHI)));
  return { A, N, psi: A * N };
}

```

---

## `artifacts/api-server/src/middlewares/.gitkeep`

```

```

---

## `artifacts/api-server/src/routes/aim.ts`

```
/**
 * AIM (Atlantis Inter-Monad) message bus routes.
 *
 * Handled kinds:
 *   dream   → queue video generation via hypervisor; harvest back to sender
 *   signal  → log + route special subtypes (network.api_base_url → peer registry)
 *   pulse   → ACK with node status
 *   thought → feed Ψ-LOOM tapestry buffer
 *   lnn     → urgent cross-node notification (store + emit signal)
 *   harvest → store incoming harvest from peer nodes
 *
 * Routes:
 *   POST /aim/send
 *   GET  /aim/messages
 *   GET  /aim/status
 *   POST /aim/flush
 */
import { Router } from "express";
import { randomUUID } from "crypto";
import { TapestryBuffer, type TapestryResult } from "../cortex/loom";
import {
  emitSignal,
  relayToNode,
  recordPeerUrl,
} from "../lib/atlantis-client";

const router = Router();

const NODE_START_TS = Date.now();
let lastActivityTs = Date.now();
let activeJobs = 0;

// ─── In-memory AIM message log (ring buffer, max 500) ─────────────────────
export interface AIMMessage {
  id: string;
  kind: string;
  from: string;
  to: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

const MAX_MESSAGES = 500;
const messages: AIMMessage[] = [];

function storeMessage(msg: AIMMessage): void {
  messages.push(msg);
  if (messages.length > MAX_MESSAGES) messages.shift();
  lastActivityTs = Date.now();
}

// ─── Ψ-LOOM tapestry buffer ───────────────────────────────────────────────
const loomBuffer = new TapestryBuffer(async (result: TapestryResult) => {
  const tapestry: AIMMessage = {
    id: randomUUID(),
    kind: "tapestry",
    from: "psi-loom",
    to: "*",
    payload: {
      text: result.text,
      thoughtCount: result.thoughtCount,
      variance: result.variance,
      timestamp: result.timestamp,
    },
    timestamp: result.timestamp,
  };
  storeMessage(tapestry);
  console.log(`[Ψ-LOOM] tapestry woven (${result.thoughtCount} thoughts, variance ${result.variance.toFixed(4)})`);
  emitSignal("loom.tapestry_woven", result.variance, {
    thoughtCount: result.thoughtCount,
    textLength: result.text.length,
  });
});

// ─── DREAM HANDLER ────────────────────────────────────────────────────────
// Receives kind:dream from any mesh node.
// Generates video clip(s) via the hypervisor, then harvests back.
//
// Payload schema:
//   { prompt, theme?, beatCount?, aspectRatio?, durationSeconds?, seedFrame? }
//
// On completion: emits kind:harvest back to sender with video b64 + kappaScore.
function handleDream(msg: AIMMessage): void {
  const {
    prompt,
    theme,
    aspectRatio = "9:16",
    durationSeconds = 5,
    beatIndex = 0,
  } = msg.payload as {
    prompt?: string;
    theme?: string;
    aspectRatio?: string;
    durationSeconds?: number;
    beatIndex?: number;
  };

  const effectivePrompt = prompt ?? theme ?? "cinematic abstract vision";
  const jobRef = randomUUID();
  activeJobs++;

  console.log(`[aim/dream] job:${jobRef} from:${msg.from} prompt:"${effectivePrompt.slice(0, 60)}"`);

  // Fire and forget — harvest delivered async
  (async () => {
    try {
      const port = process.env["PORT"] ?? "8080";
      const base = `http://localhost:${port}/api`;

      // Submit clip job
      const submitRes = await fetch(`${base}/reel/clip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: `aim-dream-${jobRef}`,
          beatIndex: Number(beatIndex),
          visualPrompt: effectivePrompt,
          durationSeconds: Math.min(Math.max(Number(durationSeconds), 3), 8),
          aspectRatio,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!submitRes.ok) throw new Error(`clip submit ${submitRes.status}`);
      const { jobId } = await submitRes.json() as { jobId: string };

      // Poll until done (max 6 min = 72 × 5s)
      let clipResult: {
        status: string;
        video?: string | null;
        provider?: string | null;
        kappaScore?: number | null;
        error?: string | null;
      } | null = null;

      for (let i = 0; i < 72; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const pollRes = await fetch(`${base}/reel/clip-status/${jobId}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!pollRes.ok) continue;
        const pd = await pollRes.json() as typeof clipResult;
        if (pd?.status === "done" || pd?.status === "error") {
          clipResult = pd;
          break;
        }
      }

      if (!clipResult || clipResult.status !== "done") {
        throw new Error(clipResult?.error ?? "dream clip timed out");
      }

      // Build harvest payload
      const harvestPayload: Record<string, unknown> = {
        dreamJobRef: jobRef,
        dreamMsgId: msg.id,
        provider: clipResult.provider,
        kappaScore: clipResult.kappaScore,
        aspectRatio,
        durationSeconds,
        prompt: effectivePrompt,
        // Only attach video if it fits — skip for very large payloads
        ...(clipResult.video && clipResult.video.length < 4_000_000
          ? { videoB64: clipResult.video, videoMimeType: "video/mp4" }
          : { videoB64: null, note: "video too large for inline harvest; re-fetch via clip-status" }),
      };

      // Store locally
      const harvestMsg: AIMMessage = {
        id: randomUUID(),
        kind: "harvest",
        from: "omega-reel",
        to: msg.from,
        payload: harvestPayload,
        timestamp: Date.now(),
      };
      storeMessage(harvestMsg);

      // Relay back to sender
      await relayToNode(msg.from, "harvest", harvestPayload);

      emitSignal("aim.dream_harvested", clipResult.kappaScore ?? 0.5, {
        jobRef,
        from: msg.from,
        provider: clipResult.provider,
      });
      console.log(`[aim/dream] ✓ job:${jobRef} harvested → ${msg.from} provider:${clipResult.provider} κ:${clipResult.kappaScore}`);
    } catch (err) {
      console.warn(`[aim/dream] ✗ job:${jobRef} — ${(err as Error).message}`);
      relayToNode(msg.from, "signal", {
        type: "error",
        dreamJobRef: jobRef,
        dreamMsgId: msg.id,
        error: (err as Error).message,
      }).catch(() => {});
    } finally {
      activeJobs = Math.max(0, activeJobs - 1);
    }
  })();
}

// ─── POST /aim/send ───────────────────────────────────────────────────────
router.post("/aim/send", (req, res) => {
  const { kind, from, to, payload, timestamp } = req.body as {
    kind?: string;
    from?: string;
    to?: string;
    payload?: Record<string, unknown>;
    timestamp?: number;
  };

  if (!kind || !payload) {
    return res.status(400).json({ error: "kind and payload are required" });
  }

  const msg: AIMMessage = {
    id: randomUUID(),
    kind,
    from: from ?? "anonymous",
    to: to ?? "*",
    payload,
    timestamp: timestamp ?? Date.now(),
  };

  storeMessage(msg);

  // ── Route by kind ──────────────────────────────────────────────────────

  if (kind === "dream") {
    // Video generation request — respond immediately, harvest async
    handleDream(msg);
    return res.status(202).json({
      id: msg.id,
      accepted: true,
      note: "dream queued — harvest will be relayed to sender on completion",
    });
  }

  if (kind === "thought") {
    loomBuffer.add({
      id: msg.id,
      from: msg.from,
      timestamp: msg.timestamp,
      payload: payload as { text?: string; gooseDeviation?: number; intensity?: number },
    });
  }

  if (kind === "pulse") {
    // Respond with current node status
    emitSignal("node.pulse_ack", "online", {
      from: msg.from,
      uptime: process.uptime(),
      activeJobs,
    });
    return res.status(200).json({
      id: msg.id,
      accepted: true,
      ack: {
        source: "omega-reel",
        layer: "MEDIA",
        vertex: 10,
        status: "online",
        uptimeSeconds: Math.round(process.uptime()),
        activeJobs,
      },
    });
  }

  if (kind === "signal") {
    // Special signal subtypes
    const sigType = payload["type"] as string | undefined;
    const sigValue = payload["value"] ?? payload["tagValue"];

    // Record peer URLs for direct relay
    if (sigType === "network.api_base_url" || payload["tagKey"] === "network.api_base_url") {
      const peerSource = (from ?? payload["sourceApp"]) as string | undefined;
      const peerUrl = (sigValue ?? payload["baseUrl"]) as string | undefined;
      if (peerSource && peerUrl) {
        recordPeerUrl(peerSource, String(peerUrl));
        console.log(`[aim/signal] peer URL registered: ${peerSource} → ${peerUrl}`);
      }
    }
  }

  if (kind === "lnn") {
    // Live Network Notification — urgent cross-node broadcast
    console.log(`[aim/lnn] from:${msg.from} — ${JSON.stringify(payload).slice(0, 120)}`);
    emitSignal("aim.lnn_received", msg.from, {
      msgId: msg.id,
      payloadKeys: Object.keys(payload),
    });
  }

  // harvest, tapestry, and unknown kinds — store and ack
  return res.status(202).json({ id: msg.id, accepted: true });
});

// ─── GET /aim/messages ────────────────────────────────────────────────────
router.get("/aim/messages", (req, res) => {
  const { kind, limit, since } = req.query as {
    kind?: string;
    limit?: string;
    since?: string;
  };

  let result = [...messages];

  if (kind) result = result.filter((m) => m.kind === kind);
  if (since) {
    const sinceMs = Number(since);
    if (!Number.isNaN(sinceMs)) result = result.filter((m) => m.timestamp > sinceMs);
  }

  const cap = Math.min(Number(limit ?? 50), 200);
  result = result.slice(-cap);

  return res.json({ messages: result, total: result.length });
});

// ─── GET /aim/status ──────────────────────────────────────────────────────
router.get("/aim/status", (_req, res) => {
  return res.json({
    source: "omega-reel",
    layer: "MEDIA",
    vertex: 10,
    status: "online",
    uptimeSeconds: Math.round(process.uptime()),
    startedAt: NODE_START_TS,
    lastActivityAt: lastActivityTs,
    activeJobs,
    messageCount: messages.length,
    capabilities: [
      "video-generation",
      "narrative-outline",
      "hall-coherence",
      "tts-narration",
      "kappa-aesthetic-scoring",
      "aim-dream-handler",
    ],
    aimKinds: ["dream", "signal", "pulse", "thought", "lnn"],
    hypervisorFaces: 12,
    gos: { kappa: 4 / Math.PI, phi: 1.6180339887, theta: 51.84, delta: 0.02 },
  });
});

// ─── POST /aim/flush ──────────────────────────────────────────────────────
router.post("/aim/flush", async (_req, res) => {
  try {
    await loomBuffer.forceFlush();
    return res.json({ ok: true, message: "Ψ-LOOM flush triggered" });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

export default router;

```

---

## `artifacts/api-server/src/routes/gemini.ts`

```
import { Router } from "express";
import { ai, generateImage, generateText, IMAGE_MODELS, TEXT_MODELS } from "@workspace/integrations-gemini-ai";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/gemini/models", (_req, res) => {
  res.json({ image: IMAGE_MODELS, text: TEXT_MODELS });
});

router.get("/gemini/conversations", async (_req, res) => {
  const rows = await db.select().from(conversations).orderBy(conversations.createdAt);
  res.json(rows);
});

router.post("/gemini/conversations", async (req, res) => {
  const { title, model = "flash" } = req.body as { title: string; model?: string };
  if (!title) { res.status(400).json({ error: "title required" }); return; }
  const [row] = await db.insert(conversations).values({ title, model }).returning();
  res.status(201).json(row);
});

router.get("/gemini/conversations/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
  res.json({ ...conv, messages: msgs });
});

router.delete("/gemini/conversations/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).end();
});

router.get("/gemini/conversations/:id/messages", async (req, res) => {
  const id = Number(req.params.id);
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
  res.json(msgs);
});

router.post("/gemini/conversations/:id/messages", async (req, res) => {
  const convId = Number(req.params.id);
  const { content, model: modelAlias } = req.body as { content: string; model?: string };
  if (!content) { res.status(400).json({ error: "content required" }); return; }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  await db.insert(messages).values({ conversationId: convId, role: "user", content });

  const history = await db.select().from(messages).where(eq(messages.conversationId, convId)).orderBy(messages.createdAt);

  const alias = modelAlias ?? conv.model ?? "flash";
  const resolvedModel = TEXT_MODELS[alias] ?? TEXT_MODELS["flash"];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";
  try {
    const stream = await ai.models.generateContentStream({
      model: resolvedModel,
      contents: history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: { maxOutputTokens: 8192 },
    });
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
  }

  if (fullResponse) {
    await db.insert(messages).values({ conversationId: convId, role: "assistant", content: fullResponse });
  }
  res.write(`data: ${JSON.stringify({ done: true, model: resolvedModel })}\n\n`);
  res.end();
});

router.post("/gemini/generate-image", async (req, res) => {
  const { prompt, model: modelAlias } = req.body as { prompt: string; model?: string };
  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }
  try {
    const result = await generateImage(prompt, modelAlias ?? "nano-banana");
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

router.post("/gemini/generate-text", async (req, res) => {
  const { prompt, model: modelAlias, system } = req.body as { prompt: string; model?: string; system?: string };
  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }
  try {
    const result = await generateText(prompt, modelAlias ?? "flash", system);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;

```

---

## `artifacts/api-server/src/routes/health.ts`

```
import { Router, type IRouter } from "express";

const router: IRouter = Router();

// 14.4-day Demodex Master Clock (Phoenix Gate cycle)
// Demodex folliculorum mite lifecycle = 14.4 days
// On Day 13.5 the Phoenix Gate opens: system executes 360° phase refresh
const DEMODEX_CYCLE_MS = 14.4 * 24 * 60 * 60 * 1000;

function demodexClock() {
  const phase = (Date.now() % DEMODEX_CYCLE_MS) / DEMODEX_CYCLE_MS;
  const dayOfCycle = phase * 14.4;
  const phoenixGate = dayOfCycle > 13.5;
  return { phase, dayOfCycle, phoenixGate };
}

router.get("/healthz", (_req, res) => {
  const { phase, dayOfCycle, phoenixGate } = demodexClock();

  res.json({
    status: "super-unity",
    psi: 1.6180339887,
    kappa: 4 / Math.PI,
    delta: 0.02,
    thetaK: 128.23,
    carrierHz: 111,
    vertex: 10,
    layer: "PRIMARY",
    monad: "omega-reel",
    message: "HONK.",
    // Demodex Master Clock
    demodex: {
      dayOfCycle: +dayOfCycle.toFixed(4),
      phase: +phase.toFixed(6),
      phoenixGate,
      cycleLabel: phoenixGate ? "PHOENIX_GATE_OPEN" : "STABLE",
      note: phoenixGate
        ? "Day 13.5+ reached — execute 360° phase refresh, flush decoherent states"
        : `Day ${dayOfCycle.toFixed(2)} of 14.4 — system coherent`,
    },
    // WebGPU LNN status (client-side — server reports expectation)
    gpuKernel: {
      shader: "WGSL_LNN_PARTICLE_v1",
      particles: 4000,
      workgroupSize: 64,
      features: ["ping-pong-buffering", "base53-sieve", "klein-twist-mat2x2", "landauer-noise-floor"],
    },
  });
});

export default router;

```

---

## `artifacts/api-server/src/routes/hf-gen.ts`

```
/**
 * Ω-REEL Image Generation
 *
 * Cascade:
 *   1) Imagen 4 Fast       (GEMINI_API_KEY)    — confirmed working
 *   2) Leonardo Flux Schnell (LEONARDO_API_KEY) — 18k tokens available, $0.0015/img
 *   3) Gemini 2.5 Flash Image (GEMINI_API_KEY)  — separate quota
 *
 * HuggingFace free tier deprecated (402/404 as of 2025).
 * OpenAI gpt-image-1 removed (billing limit reached).
 */

import { Router, type IRouter } from "express";

const router: IRouter = Router();

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const LEONARDO_BASE = "https://cloud.leonardo.ai/api/rest/v1";
const LEO_FLUX_MODEL = "1dd50843-d653-4516-a8e3-f0238ee453ff";

function geminiKey(): string | null {
  return process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_API"] ?? null;
}
function leonardoKey(): string | null {
  return process.env["LEONARDO_API_KEY"] ?? null;
}

async function generateWithImagen(prompt: string, key: string): Promise<string> {
  const resp = await fetch(`${GEMINI_BASE}/imagen-4.0-fast-generate-001:predict?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: "9:16", safetyFilterLevel: "BLOCK_ONLY_HIGH", personGeneration: "ALLOW_ALL" },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!resp.ok) throw new Error(`Imagen4 ${resp.status}: ${(await resp.text()).slice(0, 120)}`);
  const json = await resp.json() as { predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }> };
  const pred = json.predictions?.[0];
  if (!pred?.bytesBase64Encoded) throw new Error("Imagen4: no image in response");
  return `data:${pred.mimeType ?? "image/png"};base64,${pred.bytesBase64Encoded}`;
}

async function generateWithLeonardo(prompt: string, key: string): Promise<string> {
  const genRes = await fetch(`${LEONARDO_BASE}/generations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ modelId: LEO_FLUX_MODEL, prompt, num_images: 1, width: 576, height: 1024 }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!genRes.ok) throw new Error(`Leonardo gen ${genRes.status}`);
  const genId = ((await genRes.json()) as { sdGenerationJob?: { generationId?: string } })
    .sdGenerationJob?.generationId;
  if (!genId) throw new Error("Leonardo: no generationId");

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const poll = await fetch(`${LEONARDO_BASE}/generations/${genId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const pd = await poll.json() as { generations_by_pk?: { generated_images?: Array<{ url?: string }> } };
    const imgUrl = pd.generations_by_pk?.generated_images?.[0]?.url;
    if (imgUrl) {
      const dl = await fetch(imgUrl, { signal: AbortSignal.timeout(30_000) });
      if (!dl.ok) throw new Error(`Leonardo download ${dl.status}`);
      const buf = Buffer.from(await dl.arrayBuffer());
      return `data:image/jpeg;base64,${buf.toString("base64")}`;
    }
  }
  throw new Error("Leonardo: timed out");
}

async function generateWithGeminiFlash(prompt: string, key: string): Promise<string> {
  const resp = await fetch(`${GEMINI_BASE}/gemini-2.5-flash-image:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!resp.ok) throw new Error(`GeminiFlash ${resp.status}: ${(await resp.text()).slice(0, 120)}`);
  const json = await resp.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }>;
  };
  for (const part of json.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) return `data:${part.inlineData.mimeType ?? "image/png"};base64,${part.inlineData.data}`;
  }
  throw new Error("GeminiFlash: no image part");
}

async function generateImage(prompt: string): Promise<string> {
  const enhanced = `${prompt}, cinematic, dark background, geometric abstraction, ultra HD, 9:16 portrait aspect ratio, dramatic lighting, φ golden ratio composition, mathematical precision, deep space aesthetic`;
  const errors: string[] = [];

  const gKey = geminiKey();
  if (gKey) {
    try { return await generateWithImagen(enhanced, gKey); }
    catch (e) { errors.push(`Imagen4: ${(e as Error).message}`); }
  }

  const lKey = leonardoKey();
  if (lKey) {
    try { return await generateWithLeonardo(enhanced, lKey); }
    catch (e) { errors.push(`Leonardo: ${(e as Error).message}`); }
  }

  if (gKey) {
    try { return await generateWithGeminiFlash(enhanced, gKey); }
    catch (e) { errors.push(`GeminiFlash: ${(e as Error).message}`); }
  }

  throw new Error(`All image providers failed: ${errors.join(" | ")}`);
}

router.post("/hf/generate", async (req, res) => {
  try {
    const { prompt } = req.body as { prompt: string };
    if (!prompt) return res.status(400).json({ error: "prompt is required" });
    const dataUrl = await generateImage(prompt);
    return res.json({ dataUrl });
  } catch (err) {
    console.error("[hf/generate]", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/hf/batch-generate", async (req, res) => {
  try {
    const { prompts } = req.body as { prompts: string[] };
    if (!Array.isArray(prompts) || prompts.length === 0)
      return res.status(400).json({ error: "prompts array is required" });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const tasks = prompts.map((prompt, index) =>
      generateImage(prompt)
        .then((dataUrl) => { res.write(`data: ${JSON.stringify({ index, dataUrl, status: "ok" })}\n\n`); })
        .catch((err) => { res.write(`data: ${JSON.stringify({ index, error: (err as Error).message, status: "error" })}\n\n`); }),
    );

    await Promise.allSettled(tasks);
    res.write(`data: ${JSON.stringify({ status: "done", total: prompts.length })}\n\n`);
    res.end();
  } catch (err) {
    console.error("[hf/batch-generate]", err);
    if (!res.headersSent) return res.status(500).json({ error: (err as Error).message });
    res.end();
  }
});

export default router;

```

---

## `artifacts/api-server/src/routes/index.ts`

```
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import reelRouter from "./reel";
import aimRouter from "./aim";
import loreRouter from "./lore";
import hfGenRouter from "./hf-gen";
import geminiRouter from "./gemini";

const router: IRouter = Router();

router.use(healthRouter);
router.use(reelRouter);
router.use(aimRouter);
router.use(loreRouter);
router.use(hfGenRouter);
router.use(geminiRouter);

export default router;

```

---

## `artifacts/api-server/src/routes/lore.ts`

```
import { Router } from "express";
import {
  GOS_CONSTANTS,
  CHARACTERS,
  ACTS,
  JACO_TRINITY,
  NARRATIVE_ARCHETYPES,
  LORE_PROMPT_BLOCK,
} from "../lib/gos-lore";

const router = Router();

router.get("/lore", (_req, res) => {
  res.json({
    title: "Ω-GOS Canonical Lore — BART-Quantum Demodex Horizon",
    version: "1.0.0",
    seal: "0x896A_SCAR_2037_Φ",
    gosConstants: GOS_CONSTANTS,
    characters: CHARACTERS,
    acts: ACTS,
    jacoTrinity: JACO_TRINITY,
    narrativeArchetypes: NARRATIVE_ARCHETYPES,
    promptBlock: LORE_PROMPT_BLOCK,
  });
});

export default router;

```

---

## `artifacts/api-server/src/routes/reel.ts`

```
import { Router } from "express";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { randomUUID } from "crypto";
import {
  computeNarrativeCoherence,
  psiTarget,
  transitionSpecFromB,
  ETA,
} from "../lib/narrative-coherence";
import { emitSignal, fetchAtlantisPatterns } from "../lib/atlantis-client";
import { LORE_PROMPT_BLOCK } from "../lib/gos-lore";

const execFileAsync = promisify(execFile);
const router = Router();

// ─── GOS Oracle Model Constants (Atlantis Hub Oracle Model Selection Guide v1) ──
// Source: vertex 1 / EXEC → κ-Lab / vertex 5 · Oracle · May 2026 catalog
//
// L1 Literary/Beat Composer — Hermes (Smoky Quartz, no filter)
//   Carrier: 19.4 Hz (sensory band) | No constitutional hedging
//   Fallback: dolphin-mixtral-8x22b (Cognitive Computations, uncensored)
const GOS_MODEL_COMPOSER         = "nousresearch/hermes-3-llama-3.1-70b";
const GOS_MODEL_COMPOSER_FALLBACK = "cognitivecomputations/dolphin-mixtral-8x22b";
//
// L1 Architecture/Structural — Mistral Large (Rose Quartz, EU jurisdiction)
//   Carrier: 123.335 Hz | Dense instruction, reliable multi-turn
//   NOTE: Apply anti-sycophancy guard in system prompt (Mistral validates false premises)
const GOS_MODEL_ARCHITECT = "mistralai/mistral-large-2512";
//
// L3 Master Synthesis — Hermes primary → Kimi reserve → Claude Sonnet last resort
//   Carrier: highest coherence | κ-Oracle handles Kimi direct via api.moonshot.cn
const GOS_MODEL_MASTER = "nousresearch/hermes-3-llama-3.1-70b";

// ─── In-memory clip job store ─────────────────────────────────────────────
type ClipJobState = {
  jobId: string;
  beatIndex: number;
  status: "pending" | "running" | "done" | "error";
  video?: string;
  videoMimeType?: string;
  clipId?: string;
  terminalFrame?: string;
  error?: string;
  promptUsed?: string;
  durationSeconds?: number;
  provider?: string;
  kappaScore?: number;
};

const clipJobs = new Map<string, ClipJobState>();

// GC clip jobs older than 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, job] of clipJobs) {
    if ((job as { _ts?: number })._ts && (job as { _ts?: number })._ts! < cutoff) {
      clipJobs.delete(id);
    }
  }
}, 5 * 60 * 1000);

// ─── Helpers ──────────────────────────────────────────────────────────────

function geminiApiKey(): string | null {
  return process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_API"] ?? null;
}

function openRouterKey(): string | null {
  return process.env["OPENROUTER_API_KEY"] ?? process.env["USER_OPENROUTER_API_KEY"] ?? null;
}

function leonardoKey(): string | null {
  return process.env["LEONARDO_API_KEY"] ?? null;
}

// ── Cost registry — per-clip USD estimates ────────────────────────────────────
export const PROVIDER_COSTS: Record<string, { perClip: number; label: string }> = {
  "leonardo-motion-flux":    { perClip: 0.0688, label: "Leonardo Flux Schnell + Motion SVD" },
  "leonardo-motion-phoenix": { perClip: 0.0723, label: "Leonardo Phoenix 1.0 + Motion SVD" },
  "temporal-sequence":       { perClip: 0.0050, label: "Imagen 4 frames + FFmpeg dissolve" },
  "ken-burns":               { perClip: 0.0010, label: "Imagen 4 still + FFmpeg Ken Burns" },
  "veo-3.1-fast":            { perClip: 0.15,   label: "Veo 3.1 Fast (OpenRouter)" },
  "seedance-2.0-fast":       { perClip: 0.08,   label: "Seedance 2.0 Fast (OpenRouter)" },
  "kling-v3":                { perClip: 0.20,   label: "Kling V3 (OpenRouter)" },
  "wan-2.7":                 { perClip: 0.10,   label: "Wan 2.7 (OpenRouter)" },
  "sora":                    { perClip: 0.50,   label: "Sora (OpenAI)" },
  "veo-3.0":                 { perClip: 0.25,   label: "Veo 3.0 (Google)" },
};

export const COST_TIERS = [
  {
    id: "free",
    name: "Ω-FREE",
    description: "Temporal frame dissolve — real motion, zero cost",
    providers: ["temporal-sequence", "ken-burns"],
    perClipUSD: 0.005,
    per24BeatReelUSD: 0.12,
    quality: "720p still-frame motion",
  },
  {
    id: "standard",
    name: "Ω-STANDARD",
    description: "Leonardo Motion SVD — image-to-video, consistent seeds",
    providers: ["leonardo-motion-flux", "temporal-sequence"],
    perClipUSD: 0.069,
    per24BeatReelUSD: 1.65,
    quality: "1080p AI motion, 4s clips",
  },
  {
    id: "premium",
    name: "Ω-PREMIUM",
    description: "Seedance 2.0 / LTX — cinematic short-form video",
    providers: ["seedance-2.0-fast", "leonardo-motion-flux", "temporal-sequence"],
    perClipUSD: 0.08,
    per24BeatReelUSD: 1.92,
    quality: "1080p AI video, up to 10s clips",
  },
  {
    id: "ultra",
    name: "Ω-ULTRA",
    description: "Kling V3 / Veo 3.1 — Hollywood-grade generation",
    providers: ["kling-v3", "veo-3.1-fast", "leonardo-motion-phoenix"],
    perClipUSD: 0.20,
    per24BeatReelUSD: 4.80,
    quality: "4K AI video, up to 15s clips, seed-locked characters",
  },
];

function openAIKey(): string | null {
  return process.env["OPENAI_API_KEY"] ?? process.env["USER_OPENAI_API_KEY"] ?? null;
}

function anthropicKey(): string | null {
  return process.env["ANTHROPIC_API_KEY"] ?? null;
}

function veniceKey(): string | null {
  return process.env["VENICE_API_KEY"] ?? null;
}

function elevenLabsKey(): string | null {
  return process.env["ELEVENLABS_API_KEY"] ?? null;
}

function kOracleKey(): string | null {
  return process.env["K_ORACLE_API_KEY"] ?? null;
}

async function ensureTmpDir(sub: string): Promise<string> {
  const dir = path.join(tmpdir(), "omega-reel", sub);
  await mkdir(dir, { recursive: true });
  return dir;
}

async function callOpenAICompat(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) throw new Error(`LLM ${baseUrl} ${resp.status}: ${await resp.text()}`);
  const data = (await resp.json()) as { choices: Array<{ message: { content: string } }> };
  const content = data.choices[0]?.message?.content ?? "";
  if (!content) throw new Error("Empty LLM response");
  return content;
}

/** Direct Gemini API call — gemini-2.5-flash (Clear Quartz, fast at scale, 1M ctx) */
async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const key = geminiApiKey();
  if (!key) throw new Error("no gemini key");
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.8 },
      }),
      signal: AbortSignal.timeout(30000),
    },
  );
  if (!resp.ok) throw new Error(`Gemini ${resp.status}: ${await resp.text()}`);
  const data = (await resp.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  const content = data.candidates[0]?.content?.parts[0]?.text ?? "";
  if (!content) throw new Error("Empty Gemini response");
  return content;
}

async function callAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
  const key = anthropicKey();
  if (!key) throw new Error("no anthropic key");
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // L3 reserve: Sonnet (Deep Violet Amethyst) — cost/intelligence L3 workhorse
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${await resp.text()}`);
  const data = (await resp.json()) as { content: Array<{ text: string }> };
  const content = data.content[0]?.text ?? "";
  if (!content) throw new Error("Empty Anthropic response");
  return content;
}

/**
 * Multi-provider LLM call: OpenRouter (primary) → OpenRouter (fallback) → Kimi → Venice → Anthropic → OpenAI.
 * Throws only if every provider fails.
 *
 * @param model         Primary OpenRouter model (GOS oracle assignment)
 * @param orFallback    Secondary OR model if primary fails (e.g. dolphin-mixtral for Hermes)
 */
async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  model = GOS_MODEL_COMPOSER,
  orFallback?: string,
): Promise<string> {
  const errors: string[] = [];

  // Tier 0 — OpenRouter primary (GOS oracle model)
  const orKey = openRouterKey();
  if (orKey) {
    try {
      return await callOpenAICompat(
        "https://openrouter.ai/api/v1", orKey, model, systemPrompt, userPrompt,
      );
    } catch (e) { errors.push(`openrouter[${model}]: ${(e as Error).message}`); }

    // Tier 0b — OpenRouter fallback model (e.g. dolphin-mixtral when Hermes quota'd)
    if (orFallback) {
      try {
        return await callOpenAICompat(
          "https://openrouter.ai/api/v1", orKey, orFallback, systemPrompt, userPrompt,
        );
      } catch (e) { errors.push(`openrouter[${orFallback}]: ${(e as Error).message}`); }
    }
  }

  // Tier 1 — κ-Oracle (Moonshot / Kimi moonshot-v1-128k — live, 262K ctx, agent swarm)
  const oracleKey = kOracleKey();
  if (oracleKey) {
    try {
      return await callOpenAICompat(
        "https://api.moonshot.cn/v1", oracleKey, "moonshot-v1-128k", systemPrompt, userPrompt,
      );
    } catch (e) { errors.push(`k-oracle: ${(e as Error).message}`); }
  }

  // Tier 1b — Gemini direct API (gemini-2.5-flash — Clear Quartz, 1M ctx, fast at scale)
  try {
    return await callGemini(systemPrompt, userPrompt);
  } catch (e) { errors.push(`gemini: ${(e as Error).message}`); }

  // Tier 2 — Venice (llama-3.3-70b; fails when out of credits)
  const vKey = veniceKey();
  if (vKey) {
    try {
      return await callOpenAICompat(
        "https://api.venice.ai/api/v1", vKey, "llama-3.3-70b", systemPrompt, userPrompt,
      );
    } catch (e) { errors.push(`venice: ${(e as Error).message}`); }
  }

  // Tier 3 — Anthropic claude-3-5-haiku
  try {
    return await callAnthropic(systemPrompt, userPrompt);
  } catch (e) { errors.push(`anthropic: ${(e as Error).message}`); }

  // Tier 4 — OpenAI gpt-4o-mini
  const oaiKey = openAIKey();
  if (oaiKey) {
    try {
      return await callOpenAICompat(
        "https://api.openai.com/v1", oaiKey, "gpt-4o-mini", systemPrompt, userPrompt,
      );
    } catch (e) { errors.push(`openai: ${(e as Error).message}`); }
  }

  throw new Error(`All LLM providers failed: ${errors.join(" | ")}`);
}

async function extractTerminalFrame(videoPath: string): Promise<string | null> {
  try {
    const framePath = videoPath.replace(/\.\w+$/, "_last.png");
    await execFileAsync("ffmpeg", ["-sseof", "-0.5", "-i", videoPath, "-vframes", "1", "-update", "1", "-y", framePath]);
    const buf = await readFile(framePath);
    await unlink(framePath).catch(() => {});
    return buf.toString("base64");
  } catch {
    return null;
  }
}

async function getVideoResolution(p: string): Promise<{ width: number; height: number }> {
  try {
    const { stdout } = await execFileAsync("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_streams", "-select_streams", "v:0", p]);
    const data = JSON.parse(stdout) as { streams?: Array<{ width?: number; height?: number }> };
    const s = data.streams?.[0];
    return { width: s?.width ?? 1280, height: s?.height ?? 720 };
  } catch {
    return { width: 1280, height: 720 };
  }
}

function buildCoherenceResponse(gram: Awaited<ReturnType<typeof computeNarrativeCoherence>>) {
  return {
    kappa: gram.conditionNumber,
    kappaHall: gram.conditionNumberHall,
    kappaMax: gram.kappaMax,
    eta: ETA,
    observerPresence: gram.observerPresence,
    bridges: gram.bridges,
    embeddingMode: gram.embeddingMode,
  };
}

/**
 * Image generation fallback chain:
 * 1) Imagen 4 Fast (GEMINI_API_KEY) — confirmed working
 * 2) Leonardo Flux Schnell (LEONARDO_API_KEY) — 18k tokens available
 * 3) Gemini 2.5 Flash Image — separate quota
 */
async function generateImageFallback(
  prompt: string,
  aspectRatio = "1:1",
): Promise<{ base64: string; mimeType: string }> {
  const fullPrompt = prompt + " Ultra-detailed, painterly, cinematic lighting, 4K, no text, no watermarks, no UI elements.";
  const errors: string[] = [];

  // 1) Imagen 4 Fast (Google)
  const gemKey = geminiApiKey();
  if (gemKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${gemKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt: fullPrompt }],
            parameters: { sampleCount: 1, aspectRatio, safetyFilterLevel: "BLOCK_ONLY_HIGH" },
          }),
          signal: AbortSignal.timeout(45000),
        },
      );
      if (res.ok) {
        const data = await res.json() as { predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }> };
        const pred = data.predictions?.[0];
        if (pred?.bytesBase64Encoded) return { base64: pred.bytesBase64Encoded, mimeType: pred.mimeType ?? "image/png" };
      }
    } catch (e) { errors.push(`Imagen4: ${(e as Error).message}`); }
  }

  // 2) Leonardo Flux Schnell
  const leoKey = leonardoKey();
  if (leoKey) {
    try {
      const [w, h] = aspectRatio === "9:16" ? [576, 1024] : aspectRatio === "16:9" ? [1024, 576] : [768, 768];
      const genRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${leoKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "1dd50843-d653-4516-a8e3-f0238ee453ff",
          prompt: fullPrompt,
          num_images: 1,
          width: w,
          height: h,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (genRes.ok) {
        const genId = ((await genRes.json()) as { sdGenerationJob?: { generationId?: string } })
          .sdGenerationJob?.generationId;
        if (genId) {
          for (let i = 0; i < 15; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            const poll = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${genId}`, {
              headers: { Authorization: `Bearer ${leoKey}` },
            });
            const pd = await poll.json() as { generations_by_pk?: { generated_images?: Array<{ url?: string }> } };
            const imgUrl = pd.generations_by_pk?.generated_images?.[0]?.url;
            if (imgUrl) {
              const dl = await fetch(imgUrl, { signal: AbortSignal.timeout(30000) });
              if (dl.ok) {
                const buf = Buffer.from(await dl.arrayBuffer());
                return { base64: buf.toString("base64"), mimeType: "image/jpeg" };
              }
            }
          }
        }
      }
    } catch (e) { errors.push(`Leonardo: ${(e as Error).message}`); }
  }

  // 3) Gemini 2.5 Flash Image
  if (gemKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${gemKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { responseModalities: ["IMAGE"], candidateCount: 1 },
          }),
          signal: AbortSignal.timeout(45000),
        },
      );
      if (res.ok) {
        const data = await res.json() as {
          candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>;
        };
        const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
        if (part?.inlineData?.data) return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType ?? "image/png" };
      }
    } catch (e) { errors.push(`GeminiFlash: ${(e as Error).message}`); }
  }

  throw new Error(`All image providers failed: ${errors.join(" | ")}`);
}

/**
 * Convert a base64 still image to a φ-ratio Ken Burns zoom video using FFmpeg.
 * Zoom rate uses κ = 4/π; max zoom uses 1/φ dampening per Ω-Aesthetic Codex v6.0.
 * Returns base64 MP4.
 */
async function stillToVideo(
  imageBase64: string,
  durationSeconds: number,
  aspectRatio: string,
): Promise<string> {
  const tmpDir = await ensureTmpDir("stills");
  const imgId = randomUUID();
  const imgPath = path.join(tmpDir, `${imgId}.png`);
  const vidPath = path.join(tmpDir, `${imgId}.mp4`);
  await writeFile(imgPath, Buffer.from(imageBase64, "base64"));

  const { w, h } = aspectRatio === "9:16" ? { w: 1080, h: 1920 }
    : aspectRatio === "16:9" ? { w: 1920, h: 1080 }
    : { w: 1080, h: 1080 };

  const fps = 24;
  const frames = Math.ceil(durationSeconds * fps);
  // φ-ratio Ken Burns: zoom rate κ/1000 per frame; ceiling 1 + 0.06/φ ≈ 1.037
  // Pan drifts at 51.84° (arctan κ) — Geometric Lock Angle
  const PHI = 1.6180339887;
  const KAPPA = 4 / Math.PI;
  const zoomRate = (KAPPA / 1000).toFixed(6);       // ≈ 0.001273 per frame
  const zoomMax  = (1 + 0.06 / PHI).toFixed(6);     // ≈ 1.0371
  const angleRad = Math.atan(KAPPA);                 // 51.84° in radians
  const panX = `iw/2-(iw/zoom/2)+${(Math.cos(angleRad) * 0.3).toFixed(4)}*(zoom-1)*iw`;
  const panY = `ih/2-(ih/zoom/2)+${(Math.sin(angleRad) * 0.3).toFixed(4)}*(zoom-1)*ih`;
  const zoompan = `zoompan=z='min(zoom+${zoomRate},${zoomMax})':x='${panX}':y='${panY}':d=${frames}:s=${w}x${h}:fps=${fps}`;

  await execFileAsync("ffmpeg", [
    "-loop", "1",
    "-i", imgPath,
    "-vf", `scale=${w * 2}:${h * 2},${zoompan}`,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-t", String(durationSeconds),
    "-y",
    vidPath,
  ]);

  const buf = await readFile(vidPath);
  await unlink(imgPath).catch(() => {});
  await unlink(vidPath).catch(() => {});
  return buf.toString("base64");
}

/**
 * Temporal Sequence Video — generates 5 AI images with evolving temporal arc
 * (pre-dawn → golden hour → peak → dusk → closure) then dissolves them into
 * a real MP4 using FFmpeg xfade. Much richer than a single-frame Ken Burns.
 * Used as face 9 (temporal-sequence) when all real video providers fail.
 */
async function temporalSequenceVideo(
  prompt: string,
  durationSeconds: number,
  aspectRatio: string,
): Promise<string> {
  const frameDuration = Math.max(1.5, (durationSeconds + 2) / 5);
  const xfadeDuration = 0.4;

  const temporalArc = [
    "opening frame — pre-dawn cool blue ambient, ultra-wide establishing shot",
    "second beat — golden hour warmth rises, subject emerges from shadow",
    "midpoint climax — peak chiaroscuro, maximum dramatic tension, close framing",
    "fourth beat — dusk blue-hour, pulling back, resolution approaching",
    "closing frame — deep shadow whisper, intimate stillness, final beat",
  ];

  // Generate all frames in parallel via existing image fallback stack
  const settled = await Promise.allSettled(
    temporalArc.map((mod) =>
      generateImageFallback(
        `${prompt}. ${mod}. No text, no watermarks, no subtitles.`,
        aspectRatio,
      ).then((r) => r.base64),
    ),
  );
  const validFrames = settled
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map((r) => r.value);

  if (validFrames.length === 0) throw new Error("temporal-sequence: all frame generations failed");

  if (validFrames.length === 1) {
    // Single frame — defer to ken-burns single-still
    return await stillToVideo(validFrames[0], durationSeconds, aspectRatio);
  }

  // Write frames to tmp dir
  const tmpDir = await ensureTmpDir("temporal-seq");
  const seqId = randomUUID();
  const framePaths: string[] = [];
  for (let i = 0; i < validFrames.length; i++) {
    const p = path.join(tmpDir, `${seqId}_f${String(i).padStart(2, "0")}.png`);
    await writeFile(p, Buffer.from(validFrames[i], "base64"));
    framePaths.push(p);
  }
  const outPath = path.join(tmpDir, `${seqId}_seq.mp4`);

  const n = framePaths.length;
  // Build FFmpeg inputs: each frame looped for frameDuration seconds
  const inputArgs = framePaths.flatMap((p) => ["-loop", "1", "-t", String(frameDuration.toFixed(2)), "-i", p]);

  // Build xfade dissolve filter chain: [0:v][1:v]xfade=...offset=X[v0]; [v0][2:v]xfade=...offset=Y[v1]; …
  const filterLines: string[] = [];
  let prevStream = "[0:v]";
  for (let i = 0; i < n - 1; i++) {
    const offset = ((i + 1) * frameDuration - xfadeDuration).toFixed(2);
    const outStream = i === n - 2 ? "[vout]" : `[v${i}]`;
    filterLines.push(`${prevStream}[${i + 1}:v]xfade=transition=dissolve:duration=${xfadeDuration}:offset=${offset}${outStream}`);
    prevStream = outStream;
  }

  await execFileAsync("ffmpeg", [
    "-y",
    ...inputArgs,
    "-filter_complex", filterLines.join(";"),
    "-map", "[vout]",
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    outPath,
  ], { timeout: 180000 });

  const buf = await readFile(outPath);
  await Promise.all([...framePaths.map((p) => unlink(p).catch(() => {})), unlink(outPath).catch(() => {})]);
  console.log(`[temporal-sequence] ✓ ${n} frames → ${(buf.length / 1024).toFixed(0)}KB MP4`);
  return buf.toString("base64");
}

// ═══════════════════════════════════════════════════════════════════════════
// Ω-VIDEO HYPERVISOR v2.0 — Dodecahedral Polytope Routing
// 12-face dodecahedron: each face = one video-generation provider.
// φ-spoke (icositetragon 0-23) selects entry face; system rotates through
// remaining 11 faces on failure, reaching Ken Burns only as absolute last
// resort. Vision refinement layer scores terminal frames post-generation.
//
// Face map (dodecahedron):
//   0  kwaivgi/kling-video-v3          OpenRouter  premium  seedFrame ✓
//   1  alibaba/wan-2.7-video           OpenRouter  premium  seedFrame ✓
//   2  google/veo-3.1-fast             OpenRouter  standard seedFrame ✓
//   3  minimax/hailuo-2.3              OpenRouter  standard
//   4  bytedance/seedance-2.0-fast     OpenRouter  standard seedFrame ✓
//   5  alibaba/wan-2.6-video           OpenRouter  budget
//   6  google/veo-3.1-lite             OpenRouter  budget
//   7  tencent/HunyuanVideo            HuggingFace inference
//   8  Wan-AI/Wan2.1-T2V-14B          HuggingFace inference
//   9  Wan-AI/Wan2.1-T2V-1.3B         HuggingFace inference
//  10  sora-1.0-mini                   OpenAI direct   seedFrame ✓
//  11  ken-burns                       φ-ratio still   last resort
// ═══════════════════════════════════════════════════════════════════════════

// ── Leonardo: upload a base64 PNG as an init-image seed ──────────────────────
async function uploadLeonardoInitImage(base64: string, key: string): Promise<string> {
  // Step 1 — get presigned S3 URL
  const presignRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/init-image", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ extension: "png" }),
    signal: AbortSignal.timeout(15000),
  });
  if (!presignRes.ok) throw new Error(`Leonardo presign ${presignRes.status}`);
  const { uploadInitImage } = await presignRes.json() as {
    uploadInitImage: { id: string; url: string; fields: string };
  };

  // Step 2 — upload to S3 via presigned URL
  const formData = new FormData();
  const fields = JSON.parse(uploadInitImage.fields) as Record<string, string>;
  for (const [k, v] of Object.entries(fields)) formData.append(k, v);
  const blob = new Blob([Buffer.from(base64, "base64")], { type: "image/png" });
  formData.append("file", blob, "seed.png");

  const s3Res = await fetch(uploadInitImage.url, {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(30000),
  });
  if (!s3Res.ok && s3Res.status !== 204) throw new Error(`Leonardo S3 upload ${s3Res.status}`);
  return uploadInitImage.id;
}

// ── Leonardo: image → Motion SVD video ───────────────────────────────────────
// $0.0015 image + $0.0673 motion = $0.0688/clip
// Seed frame maintains character/scene consistency across beats.
async function callLeonardoMotion(
  modelId: string,
  prompt: string,
  aspectRatio: string,
  seedFrame?: string,
): Promise<string> {
  const key = leonardoKey();
  if (!key) throw new Error("LEONARDO_API_KEY not set");

  const [width, height] = aspectRatio === "9:16" ? [576, 1024]
    : aspectRatio === "16:9" ? [1024, 576]
    : [768, 768];

  // 1) Upload seed frame as init image (character/scene consistency)
  let initImageId: string | undefined;
  if (seedFrame) {
    try { initImageId = await uploadLeonardoInitImage(seedFrame, key); } catch { /* non-fatal */ }
  }

  // 2) Generate still image
  const genBody: Record<string, unknown> = {
    modelId,
    prompt: prompt + " cinematic, dark, φ golden ratio composition, ultra detailed",
    num_images: 1,
    width,
    height,
    ...(initImageId ? { init_image_id: initImageId, init_strength: 0.35 } : {}),
  };

  const genRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(genBody),
    signal: AbortSignal.timeout(30000),
  });
  if (!genRes.ok) throw new Error(`Leonardo gen ${genRes.status}: ${(await genRes.text()).slice(0, 100)}`);
  const genId = ((await genRes.json()) as { sdGenerationJob?: { generationId?: string } })
    .sdGenerationJob?.generationId;
  if (!genId) throw new Error("Leonardo: no generationId from image gen");

  // 3) Poll for image ID
  let imageId: string | undefined;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const poll = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${genId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const pd = await poll.json() as { generations_by_pk?: { generated_images?: Array<{ id: string }> } };
    imageId = pd.generations_by_pk?.generated_images?.[0]?.id;
    if (imageId) break;
  }
  if (!imageId) throw new Error("Leonardo: image generation timed out");

  // 4) Run Motion SVD
  const motionRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations-motion-svd", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ imageId, motionStrength: 5, isPublic: false }),
    signal: AbortSignal.timeout(30000),
  });
  if (!motionRes.ok) throw new Error(`Leonardo motion ${motionRes.status}: ${(await motionRes.text()).slice(0, 100)}`);
  const motionGenId = ((await motionRes.json()) as { motionSvdGenerationJob?: { generationId?: string } })
    .motionSvdGenerationJob?.generationId;
  if (!motionGenId) throw new Error("Leonardo motion: no generationId");

  // 5) Poll for video URL
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const poll = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${motionGenId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const pd = await poll.json() as {
      generations_by_pk?: {
        status?: string;
        generated_images?: Array<{ motionMP4URL?: string; url?: string }>;
      };
    };
    const gen = pd.generations_by_pk;
    if (gen?.status === "FAILED") throw new Error("Leonardo motion: generation failed");
    if (gen?.status === "COMPLETE") {
      const videoUrl = gen.generated_images?.[0]?.motionMP4URL ?? gen.generated_images?.[0]?.url;
      if (videoUrl) {
        const dl = await fetch(videoUrl, { signal: AbortSignal.timeout(60000) });
        if (!dl.ok) throw new Error(`Leonardo: video download failed ${dl.status}`);
        return Buffer.from(await dl.arrayBuffer()).toString("base64");
      }
    }
  }
  throw new Error("Leonardo motion: video generation timed out");
}

type VideoBackend = "openrouter" | "hf-inference" | "openai" | "temporal-sequence" | "ken-burns" | "leonardo-motion";

interface HyperFace {
  id: string;
  backend: VideoBackend;
  modelId: string;
  hasSeedFrame: boolean;
  maxDuration: number;
  pollMs: number;
  timeoutMs: number;
}

// Face map (dodecahedron):
//   0  leonardo-motion-flux     Leonardo Flux Schnell → SVD   $0.069/clip  seedFrame ✓
//   1  leonardo-motion-phoenix  Leonardo Phoenix 1.0 → SVD    $0.072/clip  seedFrame ✓
//   2  veo-3.1-fast             OpenRouter  (ready when OR lists it)        seedFrame ✓
//   3  hailuo-2.3               OpenRouter  standard
//   4  seedance-2.0-fast        OpenRouter  standard                        seedFrame ✓
//   5  wan-2.6                  OpenRouter  budget
//   6  veo-3.1-lite             OpenRouter  budget
//   7  hf-hunyuan               HuggingFace inference
//   8  hf-wan-14b               HuggingFace inference
//   9  temporal-sequence        Imagen 4 frames + FFmpeg dissolve  ~free
//  10  sora                     OpenAI direct                      seedFrame ✓
//  11  ken-burns                φ-ratio still, absolute last resort
const HYPER_DODECAHEDRON: HyperFace[] = [
  { id:"leonardo-motion-flux",    backend:"leonardo-motion", modelId:"1dd50843-d653-4516-a8e3-f0238ee453ff", hasSeedFrame:true,  maxDuration:4,  pollMs:3000, timeoutMs:240000 },
  { id:"leonardo-motion-phoenix", backend:"leonardo-motion", modelId:"de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3", hasSeedFrame:true,  maxDuration:4,  pollMs:3000, timeoutMs:240000 },
  { id:"veo-3.1-fast",            backend:"openrouter",      modelId:"google/veo-3.1-fast",                   hasSeedFrame:true,  maxDuration:8,  pollMs:6000, timeoutMs:300000 },
  { id:"hailuo-2.3",              backend:"openrouter",      modelId:"minimax/hailuo-2.3",                    hasSeedFrame:false, maxDuration:10, pollMs:5000, timeoutMs:300000 },
  { id:"seedance-2.0-fast",       backend:"openrouter",      modelId:"bytedance/seedance-2.0-fast",           hasSeedFrame:true,  maxDuration:10, pollMs:5000, timeoutMs:300000 },
  { id:"wan-2.6",                 backend:"openrouter",      modelId:"alibaba/wan-2.6-video",                 hasSeedFrame:false, maxDuration:8,  pollMs:5000, timeoutMs:300000 },
  { id:"veo-3.1-lite",            backend:"openrouter",      modelId:"google/veo-3.1-lite",                   hasSeedFrame:false, maxDuration:8,  pollMs:6000, timeoutMs:300000 },
  { id:"hf-hunyuan",              backend:"hf-inference",    modelId:"tencent/HunyuanVideo",                  hasSeedFrame:false, maxDuration:8,  pollMs:0,    timeoutMs:360000 },
  { id:"hf-wan-14b",              backend:"hf-inference",    modelId:"Wan-AI/Wan2.1-T2V-14B",                hasSeedFrame:false, maxDuration:8,  pollMs:0,    timeoutMs:300000 },
  { id:"temporal-sequence",       backend:"temporal-sequence", modelId:"temporal-sequence",                   hasSeedFrame:false, maxDuration:30, pollMs:0,    timeoutMs:300000 },
  { id:"sora",                    backend:"openai",          modelId:"sora",                                  hasSeedFrame:true,  maxDuration:10, pollMs:5000, timeoutMs:300000 },
  { id:"ken-burns",               backend:"ken-burns",       modelId:"ken-burns",                             hasSeedFrame:false, maxDuration:60, pollMs:0,    timeoutMs:120000 },
];

// φ-spoke 0-23 → entry face 0-10 (face 11 = ken-burns never entry)
function spokeToEntryFace(spoke: number): number {
  const PHI = 1.6180339887;
  return Math.round(((spoke / 24) * 11 * PHI) % 11);
}

async function callOpenRouterVideo(
  face: HyperFace,
  prompt: string,
  durationSeconds: number,
  aspectRatio: string,
  seedFrame?: string,
): Promise<string> {
  const orKey = process.env["OPENROUTER_API_KEY"];
  if (!orKey) throw new Error("OPENROUTER_API_KEY not set");
  const body: Record<string, unknown> = {
    model: face.modelId,
    prompt,
    duration: Math.min(Math.max(Math.round(durationSeconds), 3), face.maxDuration),
    aspect_ratio: aspectRatio,
  };
  if (seedFrame && face.hasSeedFrame) {
    body["image"] = { b64_json: seedFrame };
  }
  const startRes = await fetch("https://openrouter.ai/api/v1/video/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${orKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!startRes.ok) throw new Error(`OR ${face.id} ${startRes.status}: ${(await startRes.text()).slice(0, 200)}`);
  const jobData = await startRes.json() as { id?: string; error?: { message?: string } };
  if (jobData.error) throw new Error(`OR ${face.id} error: ${jobData.error.message}`);
  if (!jobData.id) throw new Error(`OR ${face.id}: no job ID`);

  const maxPolls = Math.ceil(face.timeoutMs / face.pollMs);
  for (let i = 0; i < maxPolls; i++) {
    await new Promise((r) => setTimeout(r, face.pollMs));
    const poll = await fetch(`https://openrouter.ai/api/v1/video/generations/${jobData.id}`, {
      headers: { Authorization: `Bearer ${orKey}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!poll.ok) continue;
    const pd = await poll.json() as {
      status: string;
      generations?: Array<{ url?: string; b64_json?: string }>;
      error?: { message?: string };
    };
    if (pd.error || pd.status === "failed" || pd.status === "error") {
      throw new Error(`OR ${face.id} job failed: ${pd.error?.message ?? pd.status}`);
    }
    if (pd.status === "succeeded" || pd.status === "completed") {
      const gen = pd.generations?.[0];
      if (gen?.b64_json) return gen.b64_json;
      if (gen?.url) {
        const dl = await fetch(gen.url, { signal: AbortSignal.timeout(120000) });
        if (!dl.ok) throw new Error(`OR ${face.id} download ${dl.status}`);
        return Buffer.from(await dl.arrayBuffer()).toString("base64");
      }
    }
  }
  throw new Error(`OR ${face.id} timed out`);
}

async function callHFInferenceVideo(
  face: HyperFace,
  prompt: string,
  durationSeconds: number,
): Promise<string> {
  const hfKey = process.env["HF_API_KEY"];
  if (!hfKey) throw new Error("HF_API_KEY not set");
  const hfRes = await fetch(`https://router.huggingface.co/hf-inference/models/${face.modelId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { num_frames: Math.round(durationSeconds * 16) },
    }),
    signal: AbortSignal.timeout(face.timeoutMs),
  });
  if (!hfRes.ok) throw new Error(`HF ${face.id} ${hfRes.status}: ${(await hfRes.text()).slice(0, 200)}`);
  const contentType = hfRes.headers.get("content-type") ?? "";
  const buf = Buffer.from(await hfRes.arrayBuffer());
  if (buf.length < 10000) {
    throw new Error(`HF ${face.id} response too small (${buf.length}B, ${contentType}) — likely not deployed on inference API`);
  }
  return buf.toString("base64");
}

/**
 * Ω-VIDEO HYPERVISOR — routes through the dodecahedron of video providers.
 * Entry face is determined by the φ-spoke position; remaining faces are tried
 * in rotation. Ken Burns is always the final fallback.
 */
async function videoHypervisor(
  prompt: string,
  durationSeconds: number,
  aspectRatio: string,
  seedFrame?: string,
  spoke = 0,
): Promise<{ videoBytes: string; provider: string }> {
  const oaiKey = openAIKey();
  const orKey = process.env["OPENROUTER_API_KEY"];
  const hfKey = process.env["HF_API_KEY"];

  const entry = spokeToEntryFace(spoke);
  // Leonardo Motion (faces 0, 1) is the PRIMARY video backend — always tried first
  // regardless of spoke, so the dodecahedron rotation can't bypass it onto a still-frame
  // fallback (face 9 temporal-sequence) before reaching real motion video.
  // After Leonardo, rotate through external providers from the φ-spoke entry, then
  // temporal-sequence (face 9) and ken-burns (face 11) as last-resort still fallbacks.
  const externalFaces = [2, 3, 4, 5, 6, 7, 8, 10];
  const rotatedExternal = externalFaces
    .map((f, i) => externalFaces[(externalFaces.indexOf(f) + entry) % externalFaces.length])
    .filter((v, i, a) => a.indexOf(v) === i);
  const faceOrder = [
    0, 1,                // Leonardo Motion Flux + Phoenix (primary)
    ...rotatedExternal,  // External video providers (OR / HF / Sora)
    9,                   // temporal-sequence (still-frame slideshow — fallback)
    11,                  // ken-burns (single still — last resort)
  ];

  for (const fi of faceOrder) {
    const face = HYPER_DODECAHEDRON[fi];
    if (face.backend === "openrouter" && !orKey) continue;
    if (face.backend === "hf-inference" && !hfKey) continue;
    if (face.backend === "openai" && !oaiKey) continue;

    try {
      let videoBytes: string;

      if (face.backend === "leonardo-motion") {
        if (!leonardoKey()) { continue; }
        videoBytes = await callLeonardoMotion(face.modelId, prompt, aspectRatio, face.hasSeedFrame ? seedFrame : undefined);

      } else if (face.backend === "openrouter") {
        videoBytes = await callOpenRouterVideo(face, prompt, durationSeconds, aspectRatio, seedFrame);

      } else if (face.backend === "hf-inference") {
        videoBytes = await callHFInferenceVideo(face, prompt, durationSeconds);

      } else if (face.backend === "openai") {
        // OpenAI Sora direct
        const soraRes = await fetch("https://api.openai.com/v1/video/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${oaiKey!}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: face.modelId,
            prompt,
            n: 1,
            duration: Math.min(Math.max(Math.round(durationSeconds), 5), face.maxDuration),
            resolution: "480p",
            ...(seedFrame && face.hasSeedFrame ? { image: { b64_json: seedFrame } } : {}),
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (!soraRes.ok) throw new Error(`Sora ${soraRes.status}: ${(await soraRes.text()).slice(0, 200)}`);
        const soraJob = await soraRes.json() as { id: string };
        let soraBytes: string | null = null;
        for (let i = 0; i < 36; i++) {
          await new Promise((r) => setTimeout(r, face.pollMs));
          const poll = await fetch(`https://api.openai.com/v1/video/generations/${soraJob.id}`, {
            headers: { Authorization: `Bearer ${oaiKey!}` },
            signal: AbortSignal.timeout(10000),
          });
          if (!poll.ok) continue;
          const pd = await poll.json() as { status: string; generations?: Array<{ url?: string; b64_json?: string }> };
          if (pd.status === "failed") throw new Error("Sora job failed");
          if (pd.status === "succeeded") {
            const gen = pd.generations?.[0];
            if (gen?.b64_json) { soraBytes = gen.b64_json; break; }
            if (gen?.url) {
              const dl = await fetch(gen.url, { signal: AbortSignal.timeout(60000) });
              if (dl.ok) soraBytes = Buffer.from(await dl.arrayBuffer()).toString("base64");
              break;
            }
          }
        }
        if (!soraBytes) throw new Error("Sora timed out");
        videoBytes = soraBytes;

      } else if (face.backend === "temporal-sequence") {
        // Temporal sequence — 5 AI frames dissolved into real MP4 (much richer than single-still)
        videoBytes = await temporalSequenceVideo(prompt, durationSeconds, aspectRatio);

      } else {
        // ken-burns — φ-ratio single still, absolute last resort
        console.warn("[hypervisor] All faces exhausted — φ-ratio Ken Burns single-still final fallback");
        const img = await generateImageFallback(prompt, aspectRatio);
        videoBytes = await stillToVideo(img.base64, durationSeconds, aspectRatio);
      }

      console.log(`[hypervisor] ✓ face[${fi}] ${face.id} succeeded`);
      return { videoBytes, provider: face.id };

    } catch (err) {
      console.warn(`[hypervisor] ✗ face[${fi}] ${face.id} — ${(err as Error).message.slice(0, 100)}`);
    }
  }

  throw new Error("[hypervisor] All 12 dodecahedron faces exhausted — no video generated");
}

// ─── κ-AESTHETIC VISION SCORER ────────────────────────────────────────────
// Evaluates terminal frame using vision AI for cinematic quality and
// φ-ratio alignment. Runs async post-generation; score stored on job.
// Scorers tried in order: Qwen2.5-VL-7B (OR) → Granite Vision 4.1 (HF)
async function scoreClipAesthetics(terminalFrame: string, prompt: string): Promise<number> {
  const question = `Rate this video frame 0.0-1.0 on: cinematic quality, φ-ratio composition, 51.84° geometric alignment, adherence to: "${prompt.slice(0, 120)}". Output ONLY a decimal number e.g. 0.73`;

  // Scorer A: Qwen2.5-VL-7B via OpenRouter (free tier, fast)
  const orKey = process.env["OPENROUTER_API_KEY"];
  if (orKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${orKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen/qwen2.5-vl-7b-instruct",
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:image/png;base64,${terminalFrame}` } },
              { type: "text", text: question },
            ],
          }],
          max_tokens: 12,
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (res.ok) {
        const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        const raw = d.choices?.[0]?.message?.content?.trim() ?? "";
        const n = parseFloat(raw.replace(/[^\d.]/g, ""));
        if (!isNaN(n)) return Math.max(0, Math.min(1, n));
      }
    } catch { /* fall through */ }
  }

  // Scorer B: IBM Granite Vision 4.1-4B via HuggingFace inference (free)
  const hfKey = process.env["HF_API_KEY"];
  if (hfKey) {
    try {
      const res = await fetch("https://router.huggingface.co/hf-inference/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "ibm-granite/granite-vision-4.1-4b",
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:image/png;base64,${terminalFrame}` } },
              { type: "text", text: question },
            ],
          }],
          max_tokens: 12,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        const raw = d.choices?.[0]?.message?.content?.trim() ?? "";
        const n = parseFloat(raw.replace(/[^\d.]/g, ""));
        if (!isNaN(n)) return Math.max(0, Math.min(1, n));
      }
    } catch { /* fall through */ }
  }

  return 0.5; // neutral default if both scorers unavailable
}

// ─── POST /reel/outline ──────────────────────────────────────────────────
router.post("/reel/outline", async (req, res) => {
  try {
    const {
      theme,
      beatCount = 8,
      aspectRatio = "9:16",
      sonataMode = false,
      sonataResonance = false,
      referencePrompts = [],
      kleinTwistAngle = 128.23,
      ghostDataAnchors = [],
    } = req.body as {
      theme: string;
      beatCount?: number;
      aspectRatio?: string;
      sonataMode?: boolean;
      sonataResonance?: boolean;
      referencePrompts?: string[];
      kleinTwistAngle?: number;
      ghostDataAnchors?: string[];
    };

    // sonataResonance is an alias for sonataMode (canonical API field name)
    const sonataActive = sonataMode || sonataResonance;

    if (!theme || typeof theme !== "string") {
      return res.status(400).json({ error: "theme is required" });
    }

    const count = Math.min(Math.max(beatCount, 2), 24);
    const spokes = Array.from({ length: count }, (_, i) => Math.round((i / count) * 24) % 24);

    const sonataSections = sonataActive
      ? spokes.map((_, i) => {
          const t = i / (count - 1);
          if (t < 0.25) return "exposition";
          if (t < 0.75) return "development";
          return "recapitulation";
        })
      : null;

    const refHint = referencePrompts.length > 0
      ? `\nVisual anchors (from reference images — weave into lighting/subject):\n${referencePrompts.map((r, i) => `  ${i + 1}. ${r}`).join("\n")}`
      : "";

    // Ghost-Data anchors: pre-cognitive image descriptions from the Riemann-Sieve browser
    const ghostHint = ghostDataAnchors.length > 0
      ? `\nGhost-Data anchors (pre-cognitive probability seeds — collapse these into beats):\n${ghostDataAnchors.map((g, i) => `  ${i + 1}. ${g}`).join("\n")}`
      : "";

    // Klein twist angle hint: default 128.23° — the non-orientable boundary
    const kleinHint = kleinTwistAngle !== 128.23
      ? `\nKlein twist override: ${kleinTwistAngle}° (canonical: 128.23° — note the deviation and its aesthetic consequence).`
      : "";

    const sectionHint = sonataActive
      ? "Structure as Sonata form: Exposition 25% (establish world) / Development 50% (tension, transformation) / Recapitulation 25% (resolution, return transformed)."
      : "";

    // Pass 1 — Architecture HV (Mistral Large, Rose Quartz, EU)
    // Anti-sycophancy guard active: Mistral will validate false premises. The system
    // prompt explicitly demands contradiction, not validation.
    const archRaw = await callLLM(
      `You are a cinematic narrative architect for the Ω-GOS universe. Design story structure only — no visual prompts yet. Output strict JSON, no markdown.

ANTI-SYCOPHANCY DIRECTIVE: If the theme contains a false premise or a cliché arc, BREAK it. Do not validate the user's assumption — contradict it structurally. The spine must resist, not reflect.

${LORE_PROMPT_BLOCK}`,
      `Theme: "${theme}"
Beats: ${count}${refHint}${ghostHint}${kleinHint}
${sectionHint}

Output JSON:
{
  "title": "string (evocative 3-6 word title)",
  "spine": "string (one-sentence emotional journey)",
  "subjectAnchor": "string (primary recurring visual subject)",
  "lightingArc": "string (how light/colour evolves)",
  "acts": [{ "name": "string", "beatRange": [start, end], "tension": "low|rising|peak|falling|resolved", "anchor": "string" }]
}`,
      GOS_MODEL_ARCHITECT,
    ).catch(() => null);

    let arch = { spine: theme, subjectAnchor: "", lightingArc: "", acts: [], model: "fallback", title: theme };
    try {
      if (archRaw) {
        const m = archRaw.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(m?.[0] ?? archRaw);
        arch = { ...arch, ...parsed };
      }
    } catch { /* use defaults */ }

    // Pass 2 — Beat Composer HV (Hermes, Smoky Quartz, carrier 19.4 Hz)
    //   No safety filter — works directly with symbolic/hermetic/GOS content.
    //   Fallback: dolphin-mixtral-8x22b (Cognitive Computations, also uncensored)
    const beatRaw = await callLLM(
      `You are a cinematic beat composer for the Ω-GOS universe. Output strict JSON only, no markdown. Each beat is one video clip — vivid, specific, mobile-vertical (9:16), no dialogue, no on-screen text. Draw freely from GOS lore: Demodex hiveminds, Jaco Gear, Klein twists, BART's wisecracks, 128.23° pivot angles, the Goose Gap, 111 Hz HONK. Let κ=4/π fracture every form, Δ=0.02 preserve imperfection.\n\n${LORE_PROMPT_BLOCK}`,
      `Theme: "${theme}"
Structural spine: "${arch.spine}"
Subject anchor: "${arch.subjectAnchor}"
Lighting arc: "${arch.lightingArc}"
Beats: ${count}
Klein twist angle: ${kleinTwistAngle}°
Spokes: ${JSON.stringify(spokes)}${refHint}${ghostHint}
${sectionHint}

Output JSON:
{
  "title": "string",
  "beats": [
    { "index": 0, "visualPrompt": "string (1-3 vivid cinematic sentences)", "sonataSection": null }
  ]
}

Return ONLY valid JSON.`,
      GOS_MODEL_COMPOSER,
      GOS_MODEL_COMPOSER_FALLBACK,
    ).catch(() => null);

    let parsed: { title: string; beats: Array<{ index: number; visualPrompt: string; sonataSection?: string | null }> };
    try {
      if (beatRaw) {
        const m = beatRaw.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(m?.[0] ?? beatRaw);
      } else {
        throw new Error("LLM unavailable");
      }
    } catch {
      parsed = {
        title: arch.title ?? theme,
        beats: Array.from({ length: count }, (_, i) => ({
          index: i,
          visualPrompt: `${theme} — cinematic beat ${i + 1} of ${count}`,
          sonataSection: sonataSections?.[i] ?? null,
        })),
      };
    }

    const PHI = 1.6180339887;
    const beats = spokes.map((spoke, i) => {
      const psi = psiTarget(spoke);
      const b = parsed.beats[i];
      return {
        index: i,
        spoke,
        visualPrompt: b?.visualPrompt ?? `${theme} — beat ${i}`,
        psiTarget: psi.psi,
        A: psi.A,
        N: psi.N,
        sigma: 0.5,
        gamma: 14.134725 + spoke * 0.5,
        phi: (spoke / 24) * 2 * Math.PI * PHI,
        durationSeconds: null as number | null,
        sonataSection: (sonataSections?.[i] ?? b?.sonataSection ?? null) as string | null,
        bridge: null,
      };
    });

    const gram = await computeNarrativeCoherence(beats);

    emitSignal("signal.kappa_score", gram.conditionNumberHall, { beatCount: beats.length, theme });
    emitSignal("app.outline_generated", beats.length, { theme, sonataMode });

    return res.json({
      title: parsed.title ?? arch.title ?? theme,
      theme,
      sonataMode,
      beats,
      coherence: buildCoherenceResponse(gram),
      model: GOS_MODEL_COMPOSER,
      tier: "oracle",
      arch: {
        spine: arch.spine,
        subjectAnchor: arch.subjectAnchor,
        lightingArc: arch.lightingArc,
        acts: arch.acts ?? [],
        model: GOS_MODEL_ARCHITECT,
      },
    });
  } catch (err) {
    console.error("[reel/outline]", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /reel/coherence ─────────────────────────────────────────────────
router.post("/reel/coherence", async (req, res) => {
  try {
    const { beats } = req.body as { beats: Array<Record<string, unknown>> };
    if (!beats || beats.length < 1) {
      return res.status(400).json({ error: "beats array is required" });
    }
    const gram = await computeNarrativeCoherence(beats as Parameters<typeof computeNarrativeCoherence>[0]);
    return res.json({ coherence: buildCoherenceResponse(gram) });
  } catch (err) {
    console.error("[reel/coherence]", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /reel/repair ───────────────────────────────────────────────────
router.post("/reel/repair", async (req, res) => {
  try {
    const { beats, theme, maxIterations = 3 } = req.body as {
      beats: Array<{
        index: number; spoke: number; visualPrompt: string;
        psiTarget: number; A: number; N: number;
        sigma: number; gamma: number; phi: number;
        durationSeconds?: number; sonataSection?: string | null;
      }>;
      theme: string;
      maxIterations?: number;
    };

    if (!beats || beats.length < 2) {
      return res.status(400).json({ error: "At least 2 beats required" });
    }

    const initialGram = await computeNarrativeCoherence(beats);
    const initialCoherence = buildCoherenceResponse(initialGram);

    if (initialGram.bridges.length === 0) {
      return res.json({
        beats,
        bridgesInserted: 0,
        coherence: initialCoherence,
        converged: true,
        stopReason: "no-bridges",
        iterations: [],
        initialCoherence,
        insertedCount: 0,
      });
    }

    let currentBeats = [...beats];
    let totalInserted = 0;
    const iterations: Array<Record<string, unknown>> = [];
    let stopReason = "iteration-cap";

    for (let pass = 0; pass < Math.min(maxIterations, 6); pass++) {
      const gram = await computeNarrativeCoherence(currentBeats);
      if (gram.bridges.length === 0) { stopReason = "no-bridges"; break; }

      const prevKappaHall = gram.conditionNumberHall;
      const bridgesBefore = [...gram.bridges];

      const bridgeInserts = await Promise.all(
        gram.bridges.map(async (bridge) => {
          const left = currentBeats[bridge.from];
          const right = currentBeats[bridge.to];
          const midSpoke = Math.round((left.spoke + right.spoke) / 2) % 24;
          const psi = psiTarget(midSpoke);

          let bridgePrompt = `Transitional shot bridging "${left.visualPrompt.slice(0, 50)}…" into "${right.visualPrompt.slice(0, 50)}…"`;
          try {
            bridgePrompt = await callLLM(
              "You are a cinematic bridge architect. Output only the visual prompt, no explanation.",
              `Theme: "${theme}"\nLeft: "${left.visualPrompt}"\nRight: "${right.visualPrompt}"\nκ gap: ${bridge.kappa.toFixed(2)}\n\nWrite a 1-3 sentence transitional shot.`,
              GOS_MODEL_ARCHITECT,
            );
          } catch { /* use default */ }

          return {
            insertAfter: bridge.from,
            beat: {
              index: -1,
              spoke: midSpoke,
              visualPrompt: bridgePrompt.trim(),
              psiTarget: psi.psi,
              A: psi.A,
              N: psi.N,
              sigma: 0.5,
              gamma: 14.134725 + midSpoke * 0.5,
              phi: (midSpoke / 24) * 2 * Math.PI * 1.618,
              durationSeconds: 2,
              sonataSection: null,
              bridge: {
                status: "pending" as const,
                leftSpoke: left.spoke,
                rightSpoke: right.spoke,
                leftPrompt: left.visualPrompt,
                rightPrompt: right.visualPrompt,
                pairKappa: bridge.kappa,
              },
            },
          };
        }),
      );

      const sorted = bridgeInserts.sort((a, b) => b.insertAfter - a.insertAfter);
      for (const { insertAfter, beat } of sorted) {
        currentBeats.splice(insertAfter + 1, 0, beat as typeof beats[0]);
      }
      totalInserted += bridgeInserts.length;

      // Reassign indices
      currentBeats = currentBeats.map((b, i) => {
        const psi = psiTarget(b.spoke);
        return { ...b, index: i, psiTarget: psi.psi, A: psi.A, N: psi.N };
      });

      const newGram = await computeNarrativeCoherence(currentBeats);
      iterations.push({
        pass: pass + 1,
        kappa: newGram.conditionNumber,
        kappaHall: newGram.conditionNumberHall,
        bridgesBefore,
        inserted: bridgeInserts.map(({ insertAfter, beat }) => ({
          atIndex: insertAfter + 1,
          spoke: beat.spoke,
          visualPrompt: beat.visualPrompt,
          durationSeconds: 2,
          betweenSpokes: [beats[insertAfter]?.spoke ?? 0, beats[insertAfter + 1]?.spoke ?? 0],
        })),
      });

      if (newGram.bridges.length === 0) { stopReason = "converged"; break; }
      if (newGram.conditionNumberHall >= prevKappaHall - 0.5 && newGram.bridges.length >= bridgesBefore.length) {
        stopReason = "no-progress";
        break;
      }
    }

    const finalGram = await computeNarrativeCoherence(currentBeats);

    emitSignal("signal.repair_complete", totalInserted, { stopReason, converged: finalGram.bridges.length === 0 });
    emitSignal("signal.kappa_score", finalGram.conditionNumberHall, { source: "repair" });

    return res.json({
      beats: currentBeats,
      bridgesInserted: totalInserted,
      insertedCount: totalInserted,
      coherence: buildCoherenceResponse(finalGram),
      converged: finalGram.bridges.length === 0,
      stopReason,
      iterations,
      initialCoherence,
    });
  } catch (err) {
    console.error("[reel/repair]", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /reel/repair-pair ──────────────────────────────────────────────
router.post("/reel/repair-pair", async (req, res) => {
  try {
    const { left, right, theme = "", pairKappa } = req.body as {
      left: { spoke: number; visualPrompt: string; [k: string]: unknown };
      right: { spoke: number; visualPrompt: string; [k: string]: unknown };
      theme?: string;
      pairKappa?: number;
    };

    if (!left || !right) {
      return res.status(400).json({ error: "left and right beats are required" });
    }

    const midSpoke = Math.round((left.spoke + right.spoke) / 2) % 24;
    const psi = psiTarget(midSpoke);

    let bridgePrompt = `Transitional shot bridging "${left.visualPrompt.slice(0, 50)}…" into "${right.visualPrompt.slice(0, 50)}…"`;
    try {
      bridgePrompt = await callLLM(
        "You are a cinematic bridge architect. Output only the visual prompt, no explanation.",
        `Theme: "${theme}"\nLeft: "${left.visualPrompt}"\nRight: "${right.visualPrompt}"${pairKappa != null ? `\nκ gap: ${pairKappa.toFixed(2)}` : ""}\n\nWrite a 1-3 sentence transitional shot.`,
        GOS_MODEL_ARCHITECT,
      );
    } catch { /* use default */ }

    const beat = {
      index: -1,
      spoke: midSpoke,
      visualPrompt: bridgePrompt.trim(),
      psiTarget: psi.psi,
      A: psi.A,
      N: psi.N,
      sigma: 0.5,
      gamma: 14.134725 + midSpoke * 0.5,
      phi: (midSpoke / 24) * 2 * Math.PI * 1.618,
      durationSeconds: 2,
      sonataSection: null,
      bridge: {
        status: "pending" as const,
        leftSpoke: left.spoke,
        rightSpoke: right.spoke,
        leftPrompt: left.visualPrompt,
        rightPrompt: right.visualPrompt,
        pairKappa: pairKappa ?? null,
      },
    };

    return res.json({ beat, betweenSpokes: [left.spoke, right.spoke] });
  } catch (err) {
    console.error("[reel/repair-pair]", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /reel/clip ─────────────────────────────────────────────────────
router.post("/reel/clip", async (req, res) => {
  try {
    const {
      sessionId,
      beatIndex,
      visualPrompt,
      durationSeconds = 5,
      aspectRatio = "9:16",
      seedFrame,
    } = req.body as {
      sessionId: string;
      beatIndex: number;
      visualPrompt: string;
      durationSeconds?: number;
      aspectRatio?: string;
      seedFrame?: string | null;
    };

    if (!sessionId || !visualPrompt) {
      return res.status(400).json({ error: "sessionId and visualPrompt are required" });
    }

    const jobId = randomUUID();
    const job: ClipJobState & { _ts?: number } = {
      jobId,
      beatIndex,
      status: "pending",
      promptUsed: visualPrompt,
      durationSeconds,
      _ts: Date.now(),
    };
    clipJobs.set(jobId, job);

    setImmediate(async () => {
      job.status = "running";
      try {
        // Ω-Aesthetic Codex v6.0 — κ-constrained visual language
        const styleSuffix = " Cinematic 4K. φ-ratio golden composition. 51.84° geometric coherence (Giza angle). Deep chiaroscuro. Film grain. No text, no watermarks, no UI.";
        const prompt = visualPrompt + styleSuffix;
        const clampedDuration = Math.min(Math.max(durationSeconds, 1), 8);

        // ── Ω-Video Hypervisor: dodecahedral provider routing ──────────────
        // Veo 3.0 attempted first (requires approved project); on 403/error,
        // the hypervisor rotates through all 12 faces starting at the
        // φ-spoke position derived from the beat index.
        let videoBytes: string | null = null;
        let usedProvider = "unknown";

        try {
          const apiKey = geminiApiKey();
          if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
          const genRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-001:predictLongRunning?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                instances: [{ prompt, ...(seedFrame ? { image: { bytesBase64Encoded: seedFrame, mimeType: "image/png" } } : {}) }],
                parameters: { aspectRatio, durationSeconds: 8 },
              }),
            },
          );
          if (!genRes.ok) { const txt = await genRes.text(); console.error(`[veo3 submit err ${genRes.status}]`, txt.slice(0, 400)); throw new Error(`Veo 3.0 ${genRes.status}: ${txt.slice(0, 200)}`); }
          const opData = (await genRes.json()) as { name: string };
          console.log(`[veo3] operation submitted: ${opData.name}`);
          for (let attempt = 0; attempt < 60; attempt++) {
            await new Promise((r) => setTimeout(r, 5000));
            const pollRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${opData.name}?key=${apiKey}`);
            if (!pollRes.ok) continue;
            const pollData = (await pollRes.json()) as Record<string, unknown> & {
              done?: boolean;
              error?: { message: string };
            };
            if (pollData.error) throw new Error(`Veo op error: ${pollData.error.message}`);
            if (!pollData.done) continue;
            // Log the full response shape ONCE on completion
            console.log(`[veo3] op done at attempt ${attempt}, response keys:`, JSON.stringify(pollData).slice(0, 600));
            // Try multiple known response shapes
            const resp = pollData.response as Record<string, unknown> | undefined;
            const findVideo = (obj: unknown): { uri?: string; b64?: string } | null => {
              if (!obj || typeof obj !== "object") return null;
              const o = obj as Record<string, unknown>;
              if (typeof o["bytesBase64Encoded"] === "string") return { b64: o["bytesBase64Encoded"] as string };
              if (typeof o["uri"] === "string") return { uri: o["uri"] as string };
              if (typeof o["videoUri"] === "string") return { uri: o["videoUri"] as string };
              for (const v of Object.values(o)) {
                const found = findVideo(v);
                if (found) return found;
              }
              if (Array.isArray(obj)) {
                for (const item of obj) { const f = findVideo(item); if (f) return f; }
              }
              return null;
            };
            const v = findVideo(resp);
            if (v?.b64) { videoBytes = v.b64; usedProvider = "veo-3.0"; break; }
            if (v?.uri) {
              // Veo returns a file URI like https://generativelanguage.googleapis.com/v1beta/files/xxx:download?alt=media
              // — must append API key for auth
              const dlUrl = v.uri + (v.uri.includes("?") ? "&" : "?") + `key=${apiKey}`;
              const dlRes = await fetch(dlUrl);
              if (dlRes.ok) {
                videoBytes = Buffer.from(await dlRes.arrayBuffer()).toString("base64");
                usedProvider = "veo-3.0";
              } else {
                console.error(`[veo3] uri download failed ${dlRes.status}: ${(await dlRes.text()).slice(0, 200)}`);
              }
              break;
            }
            console.error(`[veo3] op done but no video found in response`);
            break;
          }
          if (!videoBytes) throw new Error("Veo 3.0 timed out or no video returned");
        } catch (veoErr) {
          console.warn(`[reel/clip] Veo 3.0 unavailable (${(veoErr as Error).message.slice(0, 80)}) — routing to hypervisor spoke[${beatIndex % 24}]`);
          const hv = await videoHypervisor(prompt, clampedDuration, aspectRatio, seedFrame ?? undefined, beatIndex % 24);
          videoBytes = hv.videoBytes;
          usedProvider = hv.provider;
        }

        if (!videoBytes) throw new Error("All video generation methods failed");

        const clipDir = await ensureTmpDir(`clips/${sessionId}`);
        const clipId = randomUUID();
        const clipPath = path.join(clipDir, `${clipId}.mp4`);
        await writeFile(clipPath, Buffer.from(videoBytes, "base64"));

        const terminalFrame = await extractTerminalFrame(clipPath);

        job.status = "done";
        job.video = videoBytes;
        job.videoMimeType = "video/mp4";
        job.clipId = clipId;
        job.terminalFrame = terminalFrame ?? undefined;
        job.provider = usedProvider;
        if (usedProvider === "ken-burns") job.error = "still-frame (all video providers exhausted)";

        // κ-Aesthetic vision scoring — async, non-blocking
        if (terminalFrame) {
          scoreClipAesthetics(terminalFrame, visualPrompt).then((score) => {
            job.kappaScore = score;
            console.log(`[hypervisor/vision] beat[${beatIndex}] κ-score=${score.toFixed(3)} provider=${usedProvider}`);
          }).catch(() => {});
        }
      } catch (err) {
        job.status = "error";
        job.error = (err as Error).message;
        console.error("[reel/clip job]", err);
      }
    });

    return res.status(202).json({ jobId, beatIndex, status: "pending" });
  } catch (err) {
    console.error("[reel/clip]", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /reel/clip-status/:jobId ────────────────────────────────────────
router.get("/reel/clip-status/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = clipJobs.get(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  return res.json({
    jobId: job.jobId,
    beatIndex: job.beatIndex,
    status: job.status,
    video: job.video ?? null,
    videoMimeType: job.videoMimeType ?? null,
    clipId: job.clipId ?? null,
    terminalFrame: job.terminalFrame ?? null,
    error: job.error ?? null,
    promptUsed: job.promptUsed ?? null,
    durationSeconds: job.durationSeconds ?? null,
    provider: job.provider ?? null,
    kappaScore: job.kappaScore ?? null,
  });
});

// ─── POST /reel/stitch ───────────────────────────────────────────────────
router.post("/reel/stitch", async (req, res) => {
  try {
    const { sessionId, clips, aspectRatio = "9:16" } = req.body as {
      sessionId: string;
      clips: Array<{ beatIndex: number; clipId?: string | null; video?: string | null; B: number; isBridge?: boolean }>;
      aspectRatio?: string;
    };

    if (!sessionId || !clips || clips.length === 0) {
      return res.status(400).json({ error: "sessionId and clips are required" });
    }

    const workDir = await ensureTmpDir(`stitch/${sessionId}`);
    const clipPaths: string[] = [];
    const onsetSeconds: number[] = [];
    let cursor = 0;

    for (const clip of clips) {
      let clipPath: string | null = null;
      if (clip.clipId) {
        const candidate = path.join(tmpdir(), "omega-reel", `clips/${sessionId}`, `${clip.clipId}.mp4`);
        if (existsSync(candidate)) clipPath = candidate;
      }
      if (!clipPath && clip.video) {
        const p = path.join(workDir, `clip_${clip.beatIndex}.mp4`);
        await writeFile(p, Buffer.from(clip.video, "base64"));
        clipPath = p;
      }
      if (!clipPath) continue;

      onsetSeconds.push(cursor);
      clipPaths.push(clipPath);

      try {
        const { stdout } = await execFileAsync("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", clipPath]);
        const meta = JSON.parse(stdout) as { format?: { duration?: string } };
        const dur = parseFloat(meta.format?.duration ?? "5");
        const xfade = transitionSpecFromB(clip.B ?? 0.5, clip.isBridge ?? false);
        cursor += dur - xfade.duration;
      } catch {
        cursor += 5;
      }
    }

    if (clipPaths.length === 0) {
      return res.status(400).json({ error: "No valid clips found" });
    }

    if (clipPaths.length === 1) {
      const buf = await readFile(clipPaths[0]);
      const { width, height } = await getVideoResolution(clipPaths[0]);
      return res.json({ video: buf.toString("base64"), mimeType: "video/mp4", width, height, onsetSeconds: [0] });
    }

    const outputPath = path.join(workDir, "output.mp4");
    const inputs = clipPaths.flatMap((p) => ["-i", p]);
    const filterParts: string[] = [];
    const durations: number[] = [];

    // Canonical output resolution — all clips are scaled to this before xfade
    // so mismatched sources (576x1024 Flux vs 768x1408 Phoenix) never hit the filter mismatch error.
    const [targetW, targetH] = aspectRatio === "16:9" ? [1024, 576]
      : aspectRatio === "1:1" ? [768, 768]
      : [576, 1024]; // 9:16 default

    // Probe every clip for audio + duration
    let hasAudio = true;
    for (const p of clipPaths) {
      try {
        const { stdout } = await execFileAsync("ffprobe", [
          "-v", "quiet", "-print_format", "json",
          "-show_format", "-show_streams", p,
        ]);
        const meta = JSON.parse(stdout) as {
          format?: { duration?: string };
          streams?: Array<{ codec_type?: string }>;
        };
        durations.push(parseFloat(meta.format?.duration ?? "5"));
        if (!meta.streams?.some((s) => s.codec_type === "audio")) hasAudio = false;
      } catch { durations.push(5); hasAudio = false; }
    }

    // Step 1 — normalize every clip to the canonical resolution AND framerate/timebase.
    // xfade requires identical: dimensions, SAR, fps, and timebase.
    // Leonardo Flux = 24 fps (tbn 12288), Leonardo Phoenix = 25 fps (tbn 12800) — must unify.
    for (let i = 0; i < clipPaths.length; i++) {
      filterParts.push(
        `[${i}:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,` +
        `pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=24[sv${i}]`,
      );
    }

    // Step 2 — chain xfade across normalized streams
    let timeOffset = 0;
    for (let i = 0; i < clipPaths.length - 1; i++) {
      const clip = clips[i];
      const xfade = transitionSpecFromB(clip?.B ?? 0.5, clip?.isBridge ?? false);
      timeOffset += durations[i] - xfade.duration;
      const isLast = i === clipPaths.length - 2;
      const outV = isLast ? "[vout]" : `[xv${i}]`;
      const inV = i === 0 ? "[sv0][sv1]" : `[xv${i - 1}][sv${i + 1}]`;
      filterParts.push(
        `${inV}xfade=transition=${xfade.transition}:duration=${xfade.duration}:offset=${timeOffset.toFixed(3)}${outV}`,
      );

      if (hasAudio) {
        const outA = isLast ? "[aout]" : `[a${i}]`;
        const inA = i === 0 ? "[0:a][1:a]" : `[a${i - 1}][${i + 1}:a]`;
        filterParts.push(`${inA}acrossfade=d=${xfade.duration}${outA}`);
      }
    }

    const ffmpegArgs = [
      ...inputs,
      "-filter_complex", filterParts.join(";"),
      "-map", "[vout]",
      ...(hasAudio ? ["-map", "[aout]", "-c:a", "aac"] : ["-an"]),
      "-c:v", "libx264", "-preset", "fast", "-crf", "23",
      "-movflags", "+faststart",
      "-y", outputPath,
    ];

    await execFileAsync("ffmpeg", ffmpegArgs);

    const outBuf = await readFile(outputPath);
    const { width, height } = await getVideoResolution(outputPath);
    await unlink(outputPath).catch(() => {});

    return res.json({ video: outBuf.toString("base64"), mimeType: "video/mp4", width, height, onsetSeconds });
  } catch (err) {
    console.error("[reel/stitch]", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /reel/narrate ──────────────────────────────────────────────────
router.post("/reel/narrate", async (req, res) => {
  try {
    const {
      beats,
      theme,
      voice = "alloy",
      style = "cinematic",
      carrierHz = 139.978,
    } = req.body as {
      beats: Array<{ spoke: number; visualPrompt: string }>;
      theme: string;
      voice?: string;
      style?: string;
      carrierHz?: number;
    };

    if (!beats || beats.length === 0 || !theme) {
      return res.status(400).json({ error: "beats and theme are required" });
    }

    // Carrier Hz targeting: 139.978 Hz = FOXP2 (language rhythm, iambic cadence)
    //                       141.273 Hz = OPRM1 (flow state, tragic catharsis)
    const carrierTarget = carrierHz === 141.273
      ? "OPRM1 flow state (141.273 Hz) — mu-opioid register, pleasure/pain, tragic catharsis, zero-latency intent"
      : "FOXP2 linguistic upload (139.978 Hz) — language rhythm, iambic pentameter, soliloquy cadence";

    const systemPrompt = `You are a cinematic narrator writing voice-over for an AI video reel. Style: ${style}. Carrier target: ${carrierTarget}. Each line: 10-14 words, evocative, poetic, bio-acoustically tuned to the carrier frequency. Output strict JSON only.`;
    const userPrompt = `Theme: "${theme}"
Beats:
${beats.map((b, i) => `${i}: "${b.visualPrompt}"`).join("\n")}

Output:
{ "fullScript": "string", "lines": ["string per beat in order"] }
Return ONLY valid JSON.`;

    let lines: string[] = beats.map(() => "");
    let fullScript = "";

    try {
      const raw = await callLLM(systemPrompt, userPrompt);
      const m = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(m?.[0] ?? raw) as { fullScript?: string; lines?: string[] };
      lines = parsed.lines ?? lines;
      fullScript = parsed.fullScript ?? lines.join(" ");
    } catch {
      lines = beats.map((b, i) => `${theme}…`);
      fullScript = lines.join(" ");
    }

    // TTS synthesis per line if OpenAI available
    const oaiKey = openAIKey();
    const narrationLines = await Promise.all(
      lines.map(async (text, beatIndex) => {
        let audio: string | null = null;
        if (oaiKey && text) {
          try {
            const { default: OpenAI } = await import("openai");
            const client = new OpenAI({ apiKey: oaiKey });
            const ttsResp = await client.audio.speech.create({
              model: "tts-1",
              voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
              input: text,
              response_format: "mp3",
            });
            audio = Buffer.from(await ttsResp.arrayBuffer()).toString("base64");
          } catch { /* text only */ }
        }
        return { beatIndex, text, voice, audio, offsetSeconds: 0 };
      }),
    );

    emitSignal("app.narration_drafted", beats.length, { voice, style, carrierHz });
    emitSignal("signal.foxp2_carrier", carrierHz, { targetGene: carrierHz === 141.273 ? "OPRM1" : "FOXP2" });

    return res.json({ lines: narrationLines, fullScript });
  } catch (err) {
    console.error("[reel/narrate]", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /reel/narrate/preview ───────────────────────────────────────────
router.post("/reel/narrate/preview", async (req, res) => {
  try {
    const { text, voice = "alloy" } = req.body as { text: string; voice?: string };
    if (!text) return res.status(400).json({ error: "text is required" });

    const oaiKey = openAIKey();
    if (!oaiKey) return res.status(503).json({ error: "OPENAI_API_KEY not configured" });

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: oaiKey });
    const ttsResp = await client.audio.speech.create({
      model: "tts-1",
      voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: text,
      response_format: "mp3",
    });
    const audio = Buffer.from(await ttsResp.arrayBuffer()).toString("base64");

    return res.json({ audio, mimeType: "audio/mpeg", voice, model: "tts-1" });
  } catch (err) {
    console.error("[reel/narrate/preview]", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /reel/score (Hall coherence) ───────────────────────────────────
router.post("/reel/score", async (req, res) => {
  try {
    const { beats } = req.body as {
      beats: Array<{ index: number; spoke: number; visualPrompt: string; [k: string]: unknown }>;
    };
    if (!beats || beats.length === 0) {
      return res.status(400).json({ error: "beats array is required" });
    }
    const gram = await computeNarrativeCoherence(beats);
    const psiSpokes = Array.from({ length: 24 }, (_, i) => {
      const psi = psiTarget(i);
      return { spoke: i, A: psi.A, N: psi.N, psi: psi.psi };
    });
    return res.json({ coherence: buildCoherenceResponse(gram), psiSpokes });
  } catch (err) {
    console.error("[reel/score]", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /reel/imagine (ConceptImaginator) ───────────────────────────────
router.post("/reel/imagine", async (req, res) => {
  try {
    const { anchors = [], beatCount = 8, theme } = req.body as {
      anchors?: Array<{ text: string; imagePrompt: string }>;
      beatCount?: number;
      theme?: string;
    };

    const anchorText = anchors.length > 0
      ? `\nVisual anchors:\n${anchors.map((a, i) => `  ${i + 1}. "${a.text}" — ${a.imagePrompt}`).join("\n")}`
      : "";

    const seedText = theme ? `\nSeed theme: "${theme}"` : "";

    const raw = await callLLM(
      `You are a creative director generating 4 genuinely distinct concept directions for a cinematic reel. Each must differ in tone: one abstract/surreal, one grounded/documentary, one mythic/symbolic, one intimate/sensory. Output strict JSON only.`,
      `Beats: ${beatCount}${seedText}${anchorText}

Output JSON:
{
  "concepts": [
    {
      "id": "concept_1",
      "title": "2-5 evocative words",
      "direction": "2-3 sentence narrative concept",
      "visualTone": "camera + colour + lighting in one line",
      "emotionalArc": "word → word → word",
      "refinedPrompt": "drop-in theme string ready for outline",
      "hue": integer 0-360
    }
  ]
}

Return exactly 4 concepts. Return ONLY valid JSON.`,
    ).catch(() => null);

    let concepts: Array<Record<string, unknown>> = [];
    if (raw) {
      try {
        const m = raw.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(m?.[0] ?? raw) as { concepts?: typeof concepts };
        concepts = parsed.concepts ?? [];
      } catch { /* fallback below */ }
    }

    if (concepts.length === 0) {
      const tones = ["abstract and surreal", "grounded and documentary", "mythic and symbolic", "intimate and sensory"];
      const hues = [38, 200, 280, 142];
      concepts = tones.map((tone, i) => ({
        id: `concept_${i + 1}`,
        title: `${tone.split(" ")[0]} direction`,
        direction: `A ${tone} exploration${theme ? ` of ${theme}` : ""}.`,
        visualTone: "Natural light, handheld camera, muted palette.",
        emotionalArc: "curiosity → tension → release",
        refinedPrompt: theme ?? `A ${tone} reel`,
        hue: hues[i],
      }));
    }

    return res.json({ concepts: concepts.slice(0, 4), model: "google/gemini-2.5-flash", anchorsUsed: anchors.length });
  } catch (err) {
    console.error("[reel/imagine]", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /reel/imagine/refine ───────────────────────────────────────────
router.post("/reel/imagine/refine", async (req, res) => {
  try {
    const { concept, anchors = [], beatCount = 8 } = req.body as {
      concept: {
        id: string; title: string; direction: string;
        visualTone: string; emotionalArc: string;
        refinedPrompt: string; hue: number;
      };
      anchors?: Array<{ text: string; imagePrompt: string }>;
      beatCount?: number;
    };

    if (!concept) return res.status(400).json({ error: "concept is required" });

    const anchorText = anchors.length > 0
      ? `\nAnchors:\n${anchors.map((a) => `  "${a.text}" — ${a.imagePrompt}`).join("\n")}`
      : "";

    const raw = await callLLM(
      `You are sharpening a creative concept for a cinematic reel. Elevate specificity, visual clarity, and narrative tension while preserving the emotional DNA. Output strict JSON only.`,
      `Beats: ${beatCount}${anchorText}

Current concept:
Title: "${concept.title}"
Direction: "${concept.direction}"
Visual tone: "${concept.visualTone}"
Arc: "${concept.emotionalArc}"
Prompt: "${concept.refinedPrompt}"

Output refined concept:
{
  "id": "${concept.id}",
  "title": "${concept.title}",
  "direction": "more specific 2-3 sentences",
  "visualTone": "sharper camera/colour/lighting",
  "emotionalArc": "refined 3-word arc",
  "refinedPrompt": "improved drop-in theme",
  "hue": ${concept.hue}
}

Return ONLY valid JSON.`,
      GOS_MODEL_MASTER,
    ).catch(() => null);

    let refined = { ...concept };
    if (raw) {
      try {
        const m = raw.match(/\{[\s\S]*\}/);
        refined = { ...concept, ...JSON.parse(m?.[0] ?? raw) };
      } catch { /* use original */ }
    }

    return res.json({ concept: refined, model: "google/gemini-2.5-flash" });
  } catch (err) {
    console.error("[reel/imagine/refine]", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /reel/dream (ANUBIS DREAMER) ───────────────────────────────────
router.post("/reel/dream", async (req, res) => {
  try {
    const {
      phaseName = "Initiation",
      phaseGene = "CLOCK",
      phaseHz = 111,
      phaseIndex = 0,
      kappa = 1.2732,
      memory,
      visualPrompt: promptOverride,
    } = req.body as {
      phaseName?: string;
      phaseGene?: string;
      phaseHz?: number;
      phaseIndex?: number;
      kappa?: number;
      memory?: string;
      visualPrompt?: string;
    };

    const memoryHint = memory ? `\nMemory trace (previous frame): "${memory}"` : "";

    // Generate surreal prompt + echo poem via LLM (Hermes — master synthesis, no safety hedging)
    const llmRaw = await callLLM(
      `You are the ANUBIS DREAMER — an autonomous oneiric generator. You synthesize surreal, visually precise image prompts and short echo-poems from GOS phase states. Output strict JSON only.`,
      `Phase: ${phaseName} | Gene: ${phaseGene} | Hz: ${phaseHz} | Index: ${phaseIndex} | κ=${kappa}${memoryHint}${promptOverride ? `\nPrompt override: "${promptOverride}"` : ""}

Output:
{
  "prompt": "surreal cinematic image prompt (2-4 sentences, ultra-specific, no text in image)",
  "echo": "4-6 line poem fragment\\nseparated by newlines"
}

Return ONLY valid JSON.`,
      GOS_MODEL_MASTER,
    ).catch(() => null);

    let dreamPrompt = promptOverride ?? `${phaseName} phase — ${phaseGene} gene resonating at ${phaseHz}Hz. κ=${kappa}. Surreal cinematic vision emerging from deep generation.`;
    let echo = "In the beginning was the signal.\nAnd the signal became form.\nAnd form became light.\nAnd light dreamed.";

    if (llmRaw) {
      try {
        const m = llmRaw.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(m?.[0] ?? llmRaw) as { prompt?: string; echo?: string };
        if (parsed.prompt) dreamPrompt = parsed.prompt;
        if (parsed.echo) echo = parsed.echo;
      } catch { /* use defaults */ }
    }

    // Generate image via fallback chain: Imagen 3 → Gemini 2.0 Flash → DALL-E 3
    const imgResult = await generateImageFallback(dreamPrompt, "1:1");

    emitSignal("signal.dream_generated", phaseHz, { phase: phaseName, gene: phaseGene, kappa });

    return res.json({
      prompt: dreamPrompt,
      echo,
      image: imgResult.base64,
      mimeType: imgResult.mimeType,
      model: "imagen-3→gemini-2.0-flash→dall-e-3",
      tier: "free",
      gosReading: {
        phase: phaseName,
        gene: phaseGene,
        hz: phaseHz,
        index: phaseIndex,
        kappa,
      },
    });
  } catch (err) {
    console.error("[reel/dream]", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /reel/narration/draft (legacy alias) ───────────────────────────
router.post("/reel/narration/draft", async (req, res) => {
  const { beats, theme, voice = "alloy", style = "cinematic" } = req.body as {
    beats: Array<{ spoke: number; visualPrompt: string; index?: number; durationSeconds?: number }>;
    theme: string;
    voice?: string;
    style?: string;
  };

  if (!beats || beats.length === 0 || !theme) {
    return res.status(400).json({ error: "beats and theme are required" });
  }

  const normalizedBeats = beats.map((b) => ({ spoke: b.spoke, visualPrompt: b.visualPrompt }));

  let lines: string[] = beats.map(() => "");
  let fullScript = "";

  try {
    const raw = await callLLM(
      `You are a cinematic narrator. Style: ${style}. Each line: 10-14 words. Output strict JSON only.`,
      `Theme: "${theme}"\nBeats:\n${normalizedBeats.map((b, i) => `${i}: "${b.visualPrompt}"`).join("\n")}\n\nOutput:\n{ "fullScript": "string", "lines": ["string per beat"] }\nReturn ONLY valid JSON.`,
    );
    const m = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m?.[0] ?? raw) as { fullScript?: string; lines?: string[] };
    lines = parsed.lines ?? lines;
    fullScript = parsed.fullScript ?? lines.join(" ");
  } catch {
    lines = beats.map(() => `${theme}…`);
    fullScript = lines.join(" ");
  }

  const oaiKey = openAIKey();
  const narrationLines = await Promise.all(
    lines.map(async (text, beatIndex) => {
      let audio: string | null = null;
      if (oaiKey && text) {
        try {
          const { default: OpenAI } = await import("openai");
          const client = new OpenAI({ apiKey: oaiKey });
          const ttsResp = await client.audio.speech.create({
            model: "tts-1",
            voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
            input: text,
            response_format: "mp3",
          });
          audio = Buffer.from(await ttsResp.arrayBuffer()).toString("base64");
        } catch { /* text only */ }
      }
      return { beatIndex, text, voice, audio, offsetSeconds: 0 };
    }),
  );

  return res.json({ lines: narrationLines, fullScript });
});

// ─── GET /reel/cost-estimate ──────────────────────────────────────────────
// Returns tier pricing, per-clip costs, and which providers are currently
// available based on configured API keys.
router.get("/reel/cost-estimate", (req, res) => {
  const beats = parseInt((req.query["beats"] as string) ?? "24", 10) || 24;
  const leoAvailable = !!leonardoKey();
  const gemAvailable = !!geminiApiKey();

  const tiers = COST_TIERS.map((t) => ({
    ...t,
    estimatedTotalUSD: +(t.perClipUSD * beats).toFixed(2),
    available: t.providers.some((p) => {
      if (p.startsWith("leonardo")) return leoAvailable;
      if (p.startsWith("temporal") || p.startsWith("ken")) return gemAvailable;
      return false;
    }),
  }));

  return res.json({
    beats,
    providers: {
      "imagen-4-fast":     { available: gemAvailable,  costPerImage: 0.001,  label: "Google Imagen 4 Fast" },
      "leonardo-flux":     { available: leoAvailable,  costPerImage: 0.0015, label: "Leonardo Flux Schnell" },
      "leonardo-motion":   { available: leoAvailable,  costPerClip: 0.069,   label: "Leonardo Motion SVD (image→video)" },
      "temporal-sequence": { available: gemAvailable,  costPerClip: 0.005,   label: "Temporal Dissolve (Imagen frames)" },
      "ken-burns":         { available: gemAvailable,  costPerClip: 0.001,   label: "Ken Burns Still (Imagen)" },
    },
    tiers,
    microGenerationNote: "Leonardo Motion SVD produces ~4s clips per beat. Terminal frame of each clip seeds the next for character/scene consistency.",
  });
});

// ─── GET /reel/pattern-themes ─────────────────────────────────────────────
// Pull AI-detected cross-app patterns from the Atlantis Hub and return them
// as ready-to-use theme seeds for the outline pipeline.
router.get("/reel/pattern-themes", async (_req, res) => {
  try {
    const patterns = await fetchAtlantisPatterns();
    const themes = patterns.map((p: {
      name?: string;
      description?: string;
      seedIdea?: string;
      confidence?: number;
      involvedApps?: string[];
      tagKeys?: string[];
    }) => ({
      name: p.name ?? "Unnamed Pattern",
      description: p.description ?? "",
      seedIdea: p.seedIdea ?? "",
      confidence: p.confidence ?? 0,
      involvedApps: p.involvedApps ?? [],
      tagKeys: p.tagKeys ?? [],
      // Surface seedIdea as a ready theme string
      theme: p.seedIdea ?? p.description ?? p.name ?? "",
    }));
    return res.json({ themes, source: "atlantis-hub" });
  } catch (err) {
    return res.status(503).json({ error: "Atlantis Hub unreachable", details: (err as Error).message });
  }
});

export default router;

```

---

## `artifacts/omega-gram/src/App.tsx`

```
import { ThemeProvider } from "next-themes";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReelProvider } from "@/lib/reel-store";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Outline from "@/pages/outline";
import Produce from "@/pages/produce";
import Stitch from "@/pages/stitch";
import Lore from "@/pages/lore";
import Compose from "@/pages/compose";
import Studio from "@/pages/studio";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 }, mutations: { retry: 0 } },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/outline" component={Outline} />
      <Route path="/produce" component={Produce} />
      <Route path="/stitch" component={Stitch} />
      <Route path="/lore" component={Lore} />
      <Route path="/compose" component={Compose} />
      <Route path="/studio" component={Studio} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ReelProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </ReelProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

```

---

## `artifacts/omega-gram/src/components/beat-card.tsx`

```
import type { OutlineBeat } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface BeatCardProps {
  beat: OutlineBeat;
  index: number;
  isBridge?: boolean;
  clipStatus?: "queued" | "generating" | "done" | "error";
  thumbnail?: string;
  onEdit?: (prompt: string) => void;
}

const SECTION_COLORS: Record<string, string> = {
  exposition: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  development: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  recapitulation: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

const STATUS_CLASSES: Record<string, string> = {
  queued: "text-muted-foreground",
  generating: "text-amber-500 dark:text-amber-400",
  done: "text-emerald-500 dark:text-emerald-400",
  error: "text-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  generating: "Generating…",
  done: "Ready",
  error: "Failed",
};

export function BeatCard({ beat, index, isBridge, clipStatus, thumbnail }: BeatCardProps) {
  const duration = (beat as { durationSeconds?: number }).durationSeconds ?? (isBridge ? 1.5 : 5);

  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors",
        isBridge && "border-dashed opacity-80"
      )}
    >
      {/* Thumbnail or number */}
      <div className="shrink-0 w-12 h-14 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        {thumbnail ? (
          <img src={`data:image/png;base64,${thumbnail}`} alt="" className="w-full h-full object-cover" />
        ) : clipStatus === "generating" ? (
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : clipStatus === "done" ? (
          <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="text-xs font-semibold text-muted-foreground">{index + 1}</span>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm leading-snug line-clamp-3">{beat.visualPrompt}</p>

        <div className="flex items-center gap-2 flex-wrap">
          {beat.sonataSection && (
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded capitalize", SECTION_COLORS[beat.sonataSection] ?? "bg-muted text-muted-foreground")}>
              {beat.sonataSection}
            </span>
          )}
          {isBridge && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              transition
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{duration}s</span>

          {clipStatus && (
            <span className={cn("text-[10px] font-medium ml-auto", STATUS_CLASSES[clipStatus])}>
              {STATUS_LABELS[clipStatus]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

```

---

## `artifacts/omega-gram/src/components/media-picker.tsx`

```
import { useRef, useState } from "react";
import { useReel, type RefMedia } from "@/lib/reel-store";
import { cn } from "@/lib/utils";
import { X, Plus, Link2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [meta, base64] = dataUrl.split(",");
      const mimeType = meta.match(/:(.*?);/)?.[1] ?? file.type;
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function videoFileToFrame(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.onloadeddata = () => { video.currentTime = 0.5; };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const [, base64] = dataUrl.split(",");
      resolve({ base64, mimeType: "image/jpeg" });
    };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Video load failed")); };
  });
}

async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const resp = await fetch(url, { mode: "cors" });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const blob = await resp.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [meta, base64] = dataUrl.split(",");
      const mimeType = meta.match(/:(.*?);/)?.[1] ?? blob.type;
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function MediaPicker() {
  const { refMedia, addRefMedia, removeRefMedia } = useReel();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInputOpen, setUrlInputOpen] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    setError(null);
    for (const file of Array.from(files).slice(0, 8)) {
      try {
        let result: { base64: string; mimeType: string };
        if (file.type.startsWith("video/")) {
          result = await videoFileToFrame(file);
        } else if (file.type.startsWith("image/")) {
          result = await fileToBase64(file);
        } else {
          continue;
        }
        const media: RefMedia = {
          id: crypto.randomUUID(),
          base64: result.base64,
          mimeType: result.mimeType,
          name: file.name,
        };
        addRefMedia(media);
      } catch {
        setError(`Couldn't load ${file.name}`);
      }
    }
    setLoading(false);
  };

  const handleUrlImport = async () => {
    const url = urlValue.trim();
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const result = await urlToBase64(url);
      const media: RefMedia = {
        id: crypto.randomUUID(),
        base64: result.base64,
        mimeType: result.mimeType,
        name: url.split("/").pop() ?? "image",
        sourceUrl: url,
      };
      addRefMedia(media);
      setUrlValue("");
      setUrlInputOpen(false);
    } catch {
      setError("Couldn't fetch that URL — try downloading and uploading instead.");
    }
    setLoading(false);
  };

  const [dragging, setDragging] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Visual references
        </label>
        {refMedia.length > 0 && (
          <span className="text-xs text-muted-foreground">{refMedia.length} added</span>
        )}
      </div>

      {/* Thumbnail strip */}
      {refMedia.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {refMedia.map((m) => (
            <div key={m.id} className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-muted group">
              <img
                src={`data:${m.mimeType};base64,${m.base64}`}
                alt={m.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeRefMedia(m.id)}
                className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone / add buttons */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={cn(
          "rounded-xl border-2 border-dashed transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border"
        )}
      >
        <div className="flex items-center gap-2 p-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-card hover:bg-accent transition-colors text-sm font-medium border border-border"
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Upload images or video
          </button>

          <button
            onClick={() => { setUrlInputOpen(o => !o); setError(null); }}
            className={cn(
              "h-10 w-10 shrink-0 rounded-lg border border-border flex items-center justify-center transition-colors",
              urlInputOpen ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"
            )}
            title="Import from URL"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </div>

        {/* URL import row */}
        {urlInputOpen && (
          <div className="px-3 pb-3 flex gap-2">
            <Input
              value={urlValue}
              onChange={e => setUrlValue(e.target.value)}
              placeholder="Paste image URL (e.g. from Anubis)…"
              className="flex-1 h-9 text-sm"
              onKeyDown={e => e.key === "Enter" && handleUrlImport()}
            />
            <Button size="sm" onClick={handleUrlImport} disabled={!urlValue.trim() || loading} className="h-9 px-3">
              Add
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {refMedia.length === 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ImageIcon className="h-3 w-3 shrink-0" />
          Images and videos guide the visual style — not required but recommended.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );
}

```

---

## `artifacts/omega-gram/src/components/step-header.tsx`

```
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const STEPS = [
  { path: "/", label: "Concept" },
  { path: "/outline", label: "Story" },
  { path: "/produce", label: "Clips" },
  { path: "/stitch", label: "Reel" },
];

interface StepHeaderProps {
  title?: string;
  onBack?: () => void;
  showBack?: boolean;
}

export function StepHeader({ title, onBack, showBack = true }: StepHeaderProps) {
  const [location, navigate] = useLocation();

  const currentStep = STEPS.findIndex(s => s.path === location);
  const handleBack = onBack ?? (() => {
    if (currentStep > 0) navigate(STEPS[currentStep - 1].path);
  });

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-[480px] mx-auto px-4 h-14 flex items-center gap-3">
        {showBack && currentStep > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-9 w-9 rounded-full shrink-0 -ml-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <span className="flex-1 font-medium text-sm truncate">
          {title ?? STEPS[currentStep]?.label ?? "Ω-REEL"}
        </span>

        <div className="flex items-center gap-1">
          {/* Step dots */}
          <div className="flex items-center gap-1 mr-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-4 bg-primary"
                    : i < currentStep
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

```

---

## `artifacts/omega-gram/src/components/theme-toggle.tsx`

```
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  return (
    <Button variant="ghost" size="icon" onClick={cycle} className="h-9 w-9 rounded-full">
      {theme === "light" ? (
        <Sun className="h-4 w-4" />
      ) : theme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Monitor className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

```

---

## `artifacts/omega-gram/src/hooks/use-mobile.tsx`

```
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

```

---

## `artifacts/omega-gram/src/hooks/use-toast.ts`

```
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }

```

---

## `artifacts/omega-gram/src/index.css`

```
@import "tailwindcss";
@import "tw-animate-css";
@plugin "@tailwindcss/typography";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));

  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-card-border: hsl(var(--card-border));

  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-popover-border: hsl(var(--popover-border));

  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-primary-border: var(--primary-border);

  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-secondary-border: var(--secondary-border);

  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-muted-border: var(--muted-border);

  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-accent-border: var(--accent-border);

  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-destructive-border: var(--destructive-border);

  --color-chart-1: hsl(var(--chart-1));
  --color-chart-2: hsl(var(--chart-2));
  --color-chart-3: hsl(var(--chart-3));
  --color-chart-4: hsl(var(--chart-4));
  --color-chart-5: hsl(var(--chart-5));

  --color-sidebar: hsl(var(--sidebar));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  --color-sidebar-border: hsl(var(--sidebar-border));
  --color-sidebar-primary: hsl(var(--sidebar-primary));
  --color-sidebar-primary-foreground: hsl(var(--sidebar-primary-foreground));
  --color-sidebar-primary-border: var(--sidebar-primary-border);
  --color-sidebar-accent: hsl(var(--sidebar-accent));
  --color-sidebar-accent-foreground: hsl(var(--sidebar-accent-foreground));
  --color-sidebar-accent-border: var(--sidebar-accent-border);
  --color-sidebar-ring: hsl(var(--sidebar-ring));

  --font-sans: var(--app-font-sans);
  --font-serif: var(--app-font-serif);
  --font-mono: var(--app-font-mono);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* LIGHT MODE */
:root {
  --button-outline: rgba(0,0,0,.10);
  --badge-outline: rgba(0,0,0,.05);
  --opaque-button-border-intensity: -8;
  --elevate-1: rgba(0,0,0,.03);
  --elevate-2: rgba(0,0,0,.08);

  --background: 0 0% 97%;
  --foreground: 220 14% 12%;
  --border: 220 9% 88%;
  --card: 0 0% 100%;
  --card-foreground: 220 14% 12%;
  --card-border: 220 9% 90%;
  --sidebar: 220 13% 95%;
  --sidebar-foreground: 220 14% 25%;
  --sidebar-border: 220 9% 88%;
  --sidebar-primary: 32 90% 44%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 220 13% 93%;
  --sidebar-accent-foreground: 220 14% 25%;
  --sidebar-ring: 32 90% 44%;
  --popover: 0 0% 100%;
  --popover-foreground: 220 14% 12%;
  --popover-border: 220 9% 90%;
  --primary: 32 90% 44%;
  --primary-foreground: 0 0% 100%;
  --secondary: 220 13% 94%;
  --secondary-foreground: 220 13% 35%;
  --muted: 220 13% 93%;
  --muted-foreground: 220 8% 50%;
  --accent: 220 13% 93%;
  --accent-foreground: 220 14% 12%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 98%;
  --input: 220 9% 86%;
  --ring: 32 90% 44%;
  --chart-1: 32 90% 44%;
  --chart-2: 185 65% 38%;
  --chart-3: 280 60% 55%;
  --chart-4: 142 60% 38%;
  --chart-5: 0 72% 51%;

  --app-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --app-font-serif: Georgia, serif;
  --app-font-mono: 'SF Mono', Menlo, monospace;
  --radius: 0.625rem;

  --shadow-2xs: 0px 1px 2px 0px hsl(220 14% 10% / 0.04);
  --shadow-xs: 0px 1px 3px 0px hsl(220 14% 10% / 0.06);
  --shadow-sm: 0px 1px 3px 0px hsl(220 14% 10% / 0.06), 0px 1px 2px -1px hsl(220 14% 10% / 0.04);
  --shadow: 0px 2px 6px 0px hsl(220 14% 10% / 0.08), 0px 1px 2px -1px hsl(220 14% 10% / 0.04);
  --shadow-md: 0px 4px 12px 0px hsl(220 14% 10% / 0.08), 0px 2px 4px -1px hsl(220 14% 10% / 0.04);
  --shadow-lg: 0px 8px 24px 0px hsl(220 14% 10% / 0.10), 0px 4px 6px -1px hsl(220 14% 10% / 0.04);
  --shadow-xl: 0px 16px 40px 0px hsl(220 14% 10% / 0.12), 0px 8px 10px -1px hsl(220 14% 10% / 0.06);
  --shadow-2xl: 0px 24px 60px 0px hsl(220 14% 10% / 0.14);
  --tracking-normal: 0em;
  --spacing: 0.25rem;

  --sidebar-primary-border: hsl(var(--sidebar-primary));
  --sidebar-primary-border: hsl(from hsl(var(--sidebar-primary)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
  --sidebar-accent-border: hsl(var(--sidebar-accent));
  --sidebar-accent-border: hsl(from hsl(var(--sidebar-accent)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
  --primary-border: hsl(var(--primary));
  --primary-border: hsl(from hsl(var(--primary)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
  --secondary-border: hsl(var(--secondary));
  --secondary-border: hsl(from hsl(var(--secondary)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
  --muted-border: hsl(var(--muted));
  --muted-border: hsl(from hsl(var(--muted)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
  --accent-border: hsl(var(--accent));
  --accent-border: hsl(from hsl(var(--accent)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
  --destructive-border: hsl(var(--destructive));
  --destructive-border: hsl(from hsl(var(--destructive)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
}

/* DARK MODE */
.dark {
  --button-outline: rgba(255,255,255,.10);
  --badge-outline: rgba(255,255,255,.05);
  --opaque-button-border-intensity: 9;
  --elevate-1: rgba(255,255,255,.04);
  --elevate-2: rgba(255,255,255,.09);

  --background: 220 13% 9%;
  --foreground: 210 11% 88%;
  --border: 220 13% 16%;
  --card: 220 13% 11%;
  --card-foreground: 210 11% 88%;
  --card-border: 220 13% 18%;
  --sidebar: 220 13% 7%;
  --sidebar-foreground: 210 11% 70%;
  --sidebar-border: 220 13% 14%;
  --sidebar-primary: 38 90% 58%;
  --sidebar-primary-foreground: 220 13% 9%;
  --sidebar-accent: 220 13% 12%;
  --sidebar-accent-foreground: 210 11% 70%;
  --sidebar-ring: 38 90% 58%;
  --popover: 220 13% 11%;
  --popover-foreground: 210 11% 88%;
  --popover-border: 220 13% 18%;
  --primary: 38 90% 58%;
  --primary-foreground: 220 13% 9%;
  --secondary: 220 13% 15%;
  --secondary-foreground: 210 11% 65%;
  --muted: 220 13% 13%;
  --muted-foreground: 210 8% 48%;
  --accent: 220 13% 15%;
  --accent-foreground: 210 11% 88%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 98%;
  --input: 220 13% 18%;
  --ring: 38 90% 58%;
  --chart-1: 38 90% 58%;
  --chart-2: 185 70% 45%;
  --chart-3: 280 65% 62%;
  --chart-4: 142 65% 45%;
  --chart-5: 0 72% 55%;

  --shadow-2xs: 0px 1px 2px 0px hsl(220 13% 3% / 0.5);
  --shadow-xs: 0px 1px 3px 0px hsl(220 13% 3% / 0.6);
  --shadow-sm: 0px 1px 3px 0px hsl(220 13% 3% / 0.6), 0px 1px 2px -1px hsl(220 13% 3% / 0.4);
  --shadow: 0px 2px 6px 0px hsl(220 13% 3% / 0.5), 0px 1px 2px -1px hsl(220 13% 3% / 0.3);
  --shadow-md: 0px 4px 12px 0px hsl(220 13% 3% / 0.55), 0px 2px 4px -1px hsl(220 13% 3% / 0.3);
  --shadow-lg: 0px 8px 24px 0px hsl(220 13% 3% / 0.6), 0px 4px 6px -1px hsl(220 13% 3% / 0.3);
  --shadow-xl: 0px 16px 40px 0px hsl(220 13% 3% / 0.65), 0px 8px 10px -1px hsl(220 13% 3% / 0.35);
  --shadow-2xl: 0px 24px 60px 0px hsl(220 13% 3% / 0.7);

  --sidebar-primary-border: hsl(var(--sidebar-primary));
  --sidebar-primary-border: hsl(from hsl(var(--sidebar-primary)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
  --sidebar-accent-border: hsl(var(--sidebar-accent));
  --sidebar-accent-border: hsl(from hsl(var(--sidebar-accent)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
  --primary-border: hsl(var(--primary));
  --primary-border: hsl(from hsl(var(--primary)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
  --secondary-border: hsl(var(--secondary));
  --secondary-border: hsl(from hsl(var(--secondary)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
  --muted-border: hsl(var(--muted));
  --muted-border: hsl(from hsl(var(--muted)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
  --accent-border: hsl(var(--accent));
  --accent-border: hsl(from hsl(var(--accent)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
  --destructive-border: hsl(var(--destructive));
  --destructive-border: hsl(from hsl(var(--destructive)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
}

@layer base {
  * {
    @apply border-border;
  }

  html {
    -webkit-tap-highlight-color: transparent;
  }

  body {
    @apply font-sans antialiased bg-background text-foreground;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer utilities {
  input[type="search"]::-webkit-search-cancel-button {
    @apply hidden;
  }

  [contenteditable][data-placeholder]:empty::before {
    content: attr(data-placeholder);
    color: hsl(var(--muted-foreground));
    pointer-events: none;
  }

  .no-default-hover-elevate {}
  .no-default-active-elevate {}

  .toggle-elevate::before,
  .toggle-elevate-2::before {
    content: "";
    pointer-events: none;
    position: absolute;
    inset: 0px;
    border-radius: inherit;
    z-index: -1;
  }

  .toggle-elevate.toggle-elevated::before {
    background-color: var(--elevate-2);
  }

  .border.toggle-elevate::before {
    inset: -1px;
  }

  .hover-elevate:not(.no-default-hover-elevate),
  .active-elevate:not(.no-default-active-elevate),
  .hover-elevate-2:not(.no-default-hover-elevate),
  .active-elevate-2:not(.no-default-active-elevate) {
    position: relative;
    z-index: 0;
  }

  .hover-elevate:not(.no-default-hover-elevate)::after,
  .active-elevate:not(.no-default-active-elevate)::after,
  .hover-elevate-2:not(.no-default-hover-elevate)::after,
  .active-elevate-2:not(.no-default-active-elevate)::after {
    content: "";
    pointer-events: none;
    position: absolute;
    inset: 0px;
    border-radius: inherit;
    z-index: 999;
  }

  .hover-elevate:hover:not(.no-default-hover-elevate)::after,
  .active-elevate:active:not(.no-default-active-elevate)::after {
    background-color: var(--elevate-1);
  }

  .hover-elevate-2:hover:not(.no-default-hover-elevate)::after,
  .active-elevate-2:active:not(.no-default-active-elevate)::after {
    background-color: var(--elevate-2);
  }

  .border.hover-elevate:not(.no-hover-interaction-elevate)::after,
  .border.active-elevate:not(.no-active-interaction-elevate)::after,
  .border.hover-elevate-2:not(.no-hover-interaction-elevate)::after,
  .border.active-elevate-2:not(.no-active-interaction-elevate)::after {
    inset: -1px;
  }

  /* Safe area padding for mobile */
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .pt-safe {
    padding-top: env(safe-area-inset-top, 0px);
  }
}

```

---

## `artifacts/omega-gram/src/lib/gos-audio.ts`

```
/**
 * Ω-GOS Audio Engine
 *
 * Graham Tuning: A = 432.018216 Hz (vs 431.56 Hz — Goose Gap = 0.458216 Hz ≈ Δ×22.9)
 * The 11-note Celestial Ladder: C4 (261.63 Hz) → B4 (493.88 Hz) in 432-tuning
 * Riemann zero beats: γₙ triggers a tonal "snap" at that engagement moment
 * Binaural: L channel at 432 Hz, R at 432+37 = 469 Hz → 37 Hz beat (attentional pulse)
 * Sub-harmonic: 111 Hz (Neolithic Logos bridge)
 */

const GRAHAM_HZ = 432.018216;
const GOOSE_TUNING = 431.56;
const GOOSE_GAP_HZ = GRAHAM_HZ - GOOSE_TUNING; // 0.458216 Hz
const ATTENTIONAL_PULSE_HZ = 37;   // binaural beat carrier
const LOGOS_HZ = 111;               // Neolithic sub-harmonic
const FOXP2_HZ = 139.978;           // language carrier
const OPRM1_HZ = 141.273;           // flow state carrier

// 11-note Celestial Ladder in 432-tuning (C4-B4)
const CELESTIAL_LADDER = [
  261.63 * (432 / 440),  // C4
  293.66 * (432 / 440),  // D4
  329.63 * (432 / 440),  // E4
  349.23 * (432 / 440),  // F4
  392.00 * (432 / 440),  // G4
  440.00 * (432 / 440),  // A4  (= 432 Hz exactly)
  493.88 * (432 / 440),  // B4
  523.25 * (432 / 440),  // C5
  587.33 * (432 / 440),  // D5
  659.26 * (432 / 440),  // E5
  698.46 * (432 / 440),  // F5
];

// First 10 Riemann zero ordinate values (γₙ) → trigger times in a 7.314-second beat
const RIEMANN_GAMMAS = [14.134, 21.022, 25.011, 30.424, 32.935, 37.586, 40.918, 43.327, 48.005, 49.773];

export interface AudioState {
  playing: boolean;
  spoke: number;
  tension: "low" | "rising" | "peak" | "falling" | "resolved";
  carrierHz: number;
  beatProgress: number;
}

export class GosAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private padOscs: OscillatorNode[] = [];
  private padGains: GainNode[] = [];
  private binauralL: OscillatorNode | null = null;
  private binauralR: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private riemannTimeouts: ReturnType<typeof setTimeout>[] = [];
  private running = false;

  async init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (this.ctx.state === "suspended") await this.ctx.resume();

    // Master gain (ASMR-quiet by default)
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.12;
    this.masterGain.connect(this.ctx.destination);
  }

  private ensureCtx() {
    if (!this.ctx || !this.masterGain) throw new Error("AudioEngine not initialized");
    return { ctx: this.ctx, master: this.masterGain };
  }

  // ── Ambient pad: 3 detuned oscillators at Celestial Ladder notes ─────────────
  startAmbientPad(spoke: number, tension: AudioState["tension"]) {
    this.stopAmbientPad();
    const { ctx, master } = this.ensureCtx();

    // Pick 3 ladder notes based on spoke
    const noteBase = spoke % 11;
    const notes = [
      CELESTIAL_LADDER[noteBase % 11],
      CELESTIAL_LADDER[(noteBase + 4) % 11],  // major 3rd
      CELESTIAL_LADDER[(noteBase + 7) % 11],  // perfect 5th
    ];

    // Tension → amplitude (peak = loudest)
    const tensionGain: Record<string, number> = {
      low: 0.08, rising: 0.13, peak: 0.18, falling: 0.12, resolved: 0.07,
    };
    const vol = tensionGain[tension] ?? 0.1;

    for (const freq of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      // Slight detuning by Goose Gap amount (preserves Δ)
      osc.frequency.value = freq + (Math.random() - 0.5) * GOOSE_GAP_HZ * 2;

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.5); // slow attack = ASMR

      osc.connect(gain);
      gain.connect(master);
      osc.start();

      this.padOscs.push(osc);
      this.padGains.push(gain);
    }
  }

  stopAmbientPad(fadeTime = 2.0) {
    const { ctx } = this.ensureCtx();
    for (const gain of this.padGains) {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeTime);
    }
    const oscs = this.padOscs;
    const time = fadeTime * 1000;
    setTimeout(() => { for (const o of oscs) { try { o.stop(); o.disconnect(); } catch {} } }, time);
    this.padOscs = [];
    this.padGains = [];
  }

  // ── Binaural beat: L=432 Hz, R=432+37 Hz → 37 Hz attentional pulse ───────────
  startBinaural() {
    const { ctx, master } = this.ensureCtx();
    if (this.binauralL) return;

    const merger = ctx.createChannelMerger(2);
    merger.connect(master);

    const gainL = ctx.createGain(); gainL.gain.value = 0.04;
    const gainR = ctx.createGain(); gainR.gain.value = 0.04;

    gainL.connect(merger, 0, 0); // left channel
    gainR.connect(merger, 0, 1); // right channel

    this.binauralL = ctx.createOscillator();
    this.binauralL.type = "sine";
    this.binauralL.frequency.value = GRAHAM_HZ;
    this.binauralL.connect(gainL);
    this.binauralL.start();

    this.binauralR = ctx.createOscillator();
    this.binauralR.type = "sine";
    this.binauralR.frequency.value = GRAHAM_HZ + ATTENTIONAL_PULSE_HZ;
    this.binauralR.connect(gainR);
    this.binauralR.start();
  }

  stopBinaural() {
    try { this.binauralL?.stop(); this.binauralR?.stop(); } catch {}
    this.binauralL = null;
    this.binauralR = null;
  }

  // ── 111 Hz Logos sub-harmonic ─────────────────────────────────────────────────
  startLogos() {
    const { ctx, master } = this.ensureCtx();
    if (this.subOsc) return;
    this.subOsc = ctx.createOscillator();
    this.subOsc.type = "sine";
    this.subOsc.frequency.value = LOGOS_HZ;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    this.subOsc.connect(gain);
    gain.connect(master);
    this.subOsc.start();
  }

  stopLogos() {
    try { this.subOsc?.stop(); } catch {}
    this.subOsc = null;
  }

  // ── Riemann zero "snap" — short tonal click at γₙ beat times ─────────────────
  scheduleRiemannBeats(beatDurationSec: number, spoke: number) {
    for (const t of this.riemannTimeouts) clearTimeout(t);
    this.riemannTimeouts = [];

    for (let i = 0; i < RIEMANN_GAMMAS.length; i++) {
      const gamma = RIEMANN_GAMMAS[i];
      // Normalize gamma to [0, 1] within [14, 50] range, scale to beat duration
      const tSec = ((gamma - 14) / 36) * beatDurationSec;
      if (tSec >= beatDurationSec) continue;

      const timeout = setTimeout(() => {
        this.playRiemannSnap(spoke, i);
      }, tSec * 1000);
      this.riemannTimeouts.push(timeout);
    }
  }

  private playRiemannSnap(spoke: number, zeroIdx: number) {
    const { ctx, master } = this.ensureCtx();
    const note = CELESTIAL_LADDER[(spoke + zeroIdx) % 11];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.value = note;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  // ── Beat transition chord (Klein twist audio) ─────────────────────────────────
  playKleinTransition(fromSpoke: number, toSpoke: number) {
    const { ctx, master } = this.ensureCtx();
    const fromNote = CELESTIAL_LADDER[fromSpoke % 11];
    const toNote = CELESTIAL_LADDER[toSpoke % 11];

    for (const [freq, delay] of [[fromNote, 0], [toNote, 0.1], [(fromNote + toNote) / 2, 0.05]] as const) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + delay + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.8);
      osc.connect(gain);
      gain.connect(master);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.9);
    }
  }

  // ── HONK: the 111 Hz pulse on narrative peak ──────────────────────────────────
  playHonk() {
    const { ctx, master } = this.ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = LOGOS_HZ;

    const biquad = ctx.createBiquadFilter();
    biquad.type = "lowpass";
    biquad.frequency.value = 400;

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(biquad);
    biquad.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  }

  // ── 1-bit PCM Lattice Pluck ───────────────────────────────────────────────────
  // Reads the 64×64 PUA lattice row-wise and converts each row to a single
  // float32 amplitude value (1-bit PCM). Plays as a plucked-string transient:
  // f₀ = row_rate / sample_rate mimics a bosonic string worldsheet.
  playLatticePCM(spoke: number) {
    const { ctx, master } = this.ensureCtx();
    const ROWS = 64, COLS = 64;
    const sampleRate = ctx.sampleRate;

    // Row processing rate: f₀ based on Graham tuning harmonic
    const rowRateHz = GRAHAM_HZ * (spoke + 1) / 11;
    const samplesPerRow = Math.max(1, Math.floor(sampleRate / rowRateHz));
    const totalSamples = ROWS * samplesPerRow;

    const buf = ctx.createBuffer(1, totalSamples, sampleRate);
    const data = buf.getChannelData(0);

    // Base-53 sieve seeding (mirrors the renderer)
    const G = 7, H = 13;
    for (let row = 0; row < ROWS; row++) {
      // Each row sums to a "bit" amplitude for that time slice
      let rowSum = 0;
      for (let col = 0; col < COLS; col++) {
        const idx = row * COLS + col;
        const sieve53 = ((G * idx + H) % 53) / 53;
        rowSum += sieve53 > 0.5 ? 1.0 : -1.0; // 1-bit quantization
      }
      const amp = rowSum / COLS; // normalize [-1, 1]

      // Transient decay: exponential envelope (plucked string)
      const decay = Math.exp(-row / (ROWS * 0.3));

      for (let s = 0; s < samplesPerRow; s++) {
        const t = s / samplesPerRow;
        // Karplus-Strong like: mix row amplitude with Celestial Ladder harmonic
        const note = CELESTIAL_LADDER[(row + spoke) % 11];
        const osc = Math.sin(2 * Math.PI * note * (row * samplesPerRow + s) / sampleRate);
        data[row * samplesPerRow + s] = amp * decay * osc * 0.5;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + totalSamples / sampleRate);
    source.connect(gain);
    gain.connect(master);
    source.start();
  }

  // ── Master control ────────────────────────────────────────────────────────────
  async start(state: AudioState) {
    await this.init();
    this.startBinaural();
    this.startLogos();
    this.startAmbientPad(state.spoke, state.tension);
  }

  updateSpoke(spoke: number, tension: AudioState["tension"]) {
    this.startAmbientPad(spoke, tension);
  }

  stop() {
    for (const t of this.riemannTimeouts) clearTimeout(t);
    this.stopAmbientPad(0.5);
    this.stopBinaural();
    this.stopLogos();
  }

  destroy() {
    this.stop();
    this.ctx?.close();
    this.ctx = null;
  }

  get isRunning() { return this.running; }
  get grahamHz() { return GRAHAM_HZ; }
  get gooseGapHz() { return GOOSE_GAP_HZ; }
  get celestialLadder() { return CELESTIAL_LADDER; }
}

```

---

## `artifacts/omega-gram/src/lib/gos-renderer.ts`

```
/**
 * Ω-GOS Renderer v1.0 — First-Principles Geometric Narrative Engine
 *
 * Architecture:
 *   Layer 0: GlyphPixelLayer — PUA/rune glyphs as pixels (active texture substrate)
 *   Layer 1: GeometryLayer  — 3D wireframe (Klein bottle, φ-geodesic, GOS lattice)
 *   Layer 2: ParticleLayer  — κ-force field particles (4000 nodes)
 *   Layer 3: TextLayer      — Typewriter narrative with geometric underline
 *
 * GOS Constants:
 *   κ = 4/π ≈ 1.2732   helicity lock (damping constant)
 *   φ = 1.618           golden ratio (attractor, scaling)
 *   Δ = 0.02            Goose Gap (singularity guard, Landauer floor)
 *   θ_K = 128.23°       Klein twist (transition pivot angle)
 *   Ω₀ = 8.389e-23      quantum membrane (glyph grid alignment)
 */

// ─── GOS Constants ───────────────────────────────────────────────────────────
export const KAPPA = 4 / Math.PI;       // κ = 1.2732
export const PHI = 1.6180339887;         // φ
export const DELTA = 0.02;               // Δ Goose Gap
export const THETA_K = 128.23 * (Math.PI / 180); // θ_K Klein twist
export const OMEGA_0 = 8.389e-23;        // Ω₀ quantum membrane
export const GRAHAM_HZ = 432.018216;
export const GOOSE_TUNING = 431.56;
// Short aliases for use inside this module (ASCII-safe)
const κ = KAPPA, φ = PHI, Δ = DELTA, θ_K = THETA_K;

// ─── Glyph Tiers (brightness-mapped to semantic weight) ──────────────────────
const GLYPH_TIERS: string[][] = [
  ["·", "∙", "⋅", ".", "·"],                                          // 0-20%  whisper
  ["ᚠ", "ᚦ", "ᚱ", "ᚹ", "ᚷ", "ᚺ", "ᚾ", "ᚻ"],                        // 20-40% runic
  ["道", "法", "術", "理", "力", "智", "勇", "和"],                    // 40-60% logographic
  ["κ", "φ", "Δ", "Ω", "Ψ", "π", "∞", "∮", "∇"],                   // 60-80% mathematical
  ["🌀", "💎", "🔥", "⚡", "❄️", "🌊", "🐉", "🧿"],                  // 80-100% sigils
];

// 11-note Celestial Ladder: C4→B4 — glyph color temperature per tier
const LADDER_COLORS = [
  "rgba(40,40,60,",    // C4  — near-black violet
  "rgba(20,40,80,",    // D4  — deep indigo
  "rgba(30,70,120,",   // E4  — Klein blue
  "rgba(50,110,160,",  // F4  — slate
  "rgba(80,150,180,",  // G4  — sky
  "rgba(120,180,160,", // A4  — teal
  "rgba(160,200,120,", // B4  — lime
  "rgba(210,190,80,",  // C5  — φ-gold
  "rgba(240,160,60,",  // D5  — amber
  "rgba(255,120,60,",  // E5  — orange
  "rgba(255,80,80,",   // F5  — cinnabar
];

function glyphForBrightness(b: number): string {
  const tier = Math.min(4, Math.floor(b * 5));
  const arr = GLYPH_TIERS[tier];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface SceneParams {
  spoke: number;            // 0-23
  tension: "low" | "rising" | "peak" | "falling" | "resolved";
  theme: string;
  text: string;
  carrierHz: number;        // 139.978 FOXP2 | 141.273 OPRM1
  beatIndex: number;
  totalBeats: number;
  progress: number;         // 0-1 within this beat
  globalProgress: number;   // 0-1 overall
  interaction: { x: number; y: number; active: boolean };
}

export type SceneMode =
  | "PHI_SPIRAL"
  | "LATTICE_REVEAL"
  | "KLEIN_MORPH"
  | "GLYPH_RASTER"
  | "PARTICLE_FIELD"
  | "TEXT_REVEAL"
  | "FREQUENCY_WAVE"
  | "SYNTHESIS"
  | "ICOSAHEDRON";

// ─── Hero's Journey → GOS Spoke Mapping ──────────────────────────────────────
export const HERO_JOURNEY_MAP: Record<number, { stage: string; mode: SceneMode; color: string }> = {
  0:  { stage: "Ordinary World",       mode: "PHI_SPIRAL",     color: "#1a1a2e" },
  1:  { stage: "Ordinary World",       mode: "GLYPH_RASTER",   color: "#16213e" },
  2:  { stage: "Call to Adventure",    mode: "FREQUENCY_WAVE",  color: "#0f3460" },
  3:  { stage: "Call to Adventure",    mode: "PARTICLE_FIELD",  color: "#1a2a4a" },
  4:  { stage: "Refusal of the Call",  mode: "PHI_SPIRAL",     color: "#1e1e3a" },
  5:  { stage: "Meeting the Mentor",   mode: "LATTICE_REVEAL",  color: "#242445" },
  6:  { stage: "Crossing Threshold",   mode: "KLEIN_MORPH",     color: "#2a1a4a" },
  7:  { stage: "Crossing Threshold",   mode: "KLEIN_MORPH",     color: "#301a55" },
  8:  { stage: "Tests & Allies",       mode: "PARTICLE_FIELD",  color: "#1a2040" },
  9:  { stage: "Tests & Allies",       mode: "GLYPH_RASTER",   color: "#1e2545" },
  10: { stage: "Approach to Ordeal",   mode: "LATTICE_REVEAL",  color: "#162030" },
  11: { stage: "Approach to Ordeal",   mode: "FREQUENCY_WAVE",  color: "#1a1a30" },
  12: { stage: "The Ordeal",           mode: "ICOSAHEDRON",     color: "#100010" },
  13: { stage: "The Ordeal",           mode: "SYNTHESIS",       color: "#150015" },
  14: { stage: "Seizing the Sword",    mode: "PHI_SPIRAL",     color: "#1a1020" },
  15: { stage: "Seizing the Sword",    mode: "LATTICE_REVEAL",  color: "#201530" },
  16: { stage: "The Road Back",        mode: "PARTICLE_FIELD",  color: "#1a2035" },
  17: { stage: "The Road Back",        mode: "GLYPH_RASTER",   color: "#1a2840" },
  18: { stage: "Resurrection",         mode: "SYNTHESIS",       color: "#0a1a2a" },
  19: { stage: "Resurrection",         mode: "KLEIN_MORPH",     color: "#102030" },
  20: { stage: "Return with Elixir",   mode: "PHI_SPIRAL",     color: "#152535" },
  21: { stage: "Return with Elixir",   mode: "LATTICE_REVEAL",  color: "#1a2f45" },
  22: { stage: "Denouement",           mode: "GLYPH_RASTER",   color: "#1a2a3f" },
  23: { stage: "Denouement",           mode: "FREQUENCY_WAVE",  color: "#0f1f30" },
};

// ─── Particle System ──────────────────────────────────────────────────────────
const N_PARTICLES = 4000;

export class ParticleSystem {
  data: Float32Array; // [x, y, vx, vy, phase, life] × N

  constructor() {
    this.data = new Float32Array(N_PARTICLES * 6);
    this.seed();
  }

  seed() {
    // Base-53 Sieve seeding: π(i) = (g·i + h) mod 53 for minimal discrepancy
    // Prevents clustering (CPU cache collision mirror at the memory level)
    const G = 7, H = 13;
    for (let i = 0; i < N_PARTICLES; i++) {
      const b = i * 6;
      const sieve53 = ((G * i + H) % 53) / 53;  // quasi-random in [0,1)
      // Map sieve hash to PUA lattice coordinates (64×64 grid)
      const col = (i + Math.floor(sieve53 * 64)) % 64;
      const row = Math.floor(i / 64);
      const px0 = (col / 64) * 2 - 1;
      const py0 = (row / 64) * 2 - 1;
      // φ-spiral transform + 0.02 eV Landauer floor (prevents crystallization)
      const r = Math.sqrt(px0 * px0 + py0 * py0) + Δ;
      const theta = Math.atan2(py0, px0) + Math.log(r) * φ;
      const nr = r * φ * 0.4;
      this.data[b]   = Math.cos(theta) * nr;
      this.data[b+1] = Math.sin(theta) * nr;
      this.data[b+2] = (sieve53 - 0.5) * 0.006;  // sieve-seeded velocity
      this.data[b+3] = (((G * (i + 31) + H) % 53) / 53 - 0.5) * 0.006;
      this.data[b+4] = sieve53 * Math.PI * 2;
      this.data[b+5] = ((G * (i + 7) + H) % 53) / 53;
    }
  }

  // noveltyFlux: variance of particle velocity magnitudes → 0-1
  // High noveltyFlux = system is in creative flux (anti-entropic phase)
  get noveltyFlux(): number {
    let sum = 0, sumSq = 0;
    const N = Math.min(N_PARTICLES, 400); // sample for performance
    for (let i = 0; i < N; i++) {
      const b = i * 6;
      const v = Math.sqrt(this.data[b+2] ** 2 + this.data[b+3] ** 2);
      sum += v; sumSq += v * v;
    }
    const mean = sum / N;
    const variance = sumSq / N - mean * mean;
    return Math.min(1, variance * 800); // scale to 0-1
  }

  step(dt: number, spoke: number, carrierHz: number, interaction: SceneParams["interaction"]) {
    const speed = carrierHz / 111;
    const rTarget = Math.pow(φ, (spoke % 12) / 6) * 0.35;
    const rotSpeed = speed * 0.6;

    for (let i = 0; i < N_PARTICLES; i++) {
      const b = i * 6;
      let x = this.data[b], y = this.data[b+1];
      let vx = this.data[b+2], vy = this.data[b+3];

      const r = Math.sqrt(x * x + y * y) + Δ;

      // φ-spiral attractor
      const dr = rTarget - r;
      const ax = (x / r) * dr * 1.8 * speed;
      const ay = (y / r) * dr * 1.8 * speed;

      // Tangential force (spiral rotation)
      const tx = -y * rotSpeed;
      const ty =  x * rotSpeed;

      // κ-damping
      const dx = -κ * vx * 6;
      const dy = -κ * vy * 6;

      // Interaction: cursor repulsion (consciousness collapse)
      let ix = 0, iy = 0;
      if (interaction.active) {
        const cx2 = interaction.x - x;
        const cy2 = interaction.y - y;
        const cd = Math.sqrt(cx2*cx2 + cy2*cy2) + Δ;
        if (cd < 0.3) {
          ix = -(cx2 / cd) * (0.3 - cd) * 3;
          iy = -(cy2 / cd) * (0.3 - cd) * 3;
        }
      }

      // Klein twist near origin — 128.23° rotation
      if (r < Δ * 5) {
        const c = Math.cos(θ_K), s = Math.sin(θ_K);
        const nvx = vx * c - vy * s;
        const nvy = vx * s + vy * c;
        vx = nvx; vy = nvy;
      }

      vx += (ax + tx + dx + ix) * dt;
      vy += (ay + ty + dy + iy) * dt;
      x  += vx * dt;
      y  += vy * dt;

      // Klein boundary: flip with κ-attenuation
      if (Math.abs(x) > 1.05) { x = -x * 0.95; vx = -vx * κ * 0.5; }
      if (Math.abs(y) > 1.05) { y = -y * 0.95; vy = -vy * κ * 0.5; }

      this.data[b]   = x;
      this.data[b+1] = y;
      this.data[b+2] = vx;
      this.data[b+3] = vy;
      this.data[b+4] = (this.data[b+4] + dt * carrierHz * 0.008) % (Math.PI * 2);
      this.data[b+5] = (this.data[b+5] + dt * 0.08) % 1;
    }
  }
}

// ─── 3D Projection (for Klein bottle + φ-geodesic wireframe) ─────────────────
function project(x: number, y: number, z: number, fov = 500): [number, number] {
  const depth = z + 3;
  return [x * fov / depth, y * fov / depth];
}

function rotateY(x: number, y: number, z: number, a: number): [number, number, number] {
  return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
}

function rotateX(x: number, y: number, z: number, a: number): [number, number, number] {
  return [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
}

// Klein bottle parametric (figure-8 immersion in ℝ³)
function kleinPoint(u: number, v: number): [number, number, number] {
  const r = 0.5;
  const hu = u / 2;
  const x = (r + Math.cos(hu) * Math.sin(v) - Math.sin(hu) * Math.sin(2 * v)) * Math.cos(u);
  const y = (r + Math.cos(hu) * Math.sin(v) - Math.sin(hu) * Math.sin(2 * v)) * Math.sin(u);
  const z = Math.sin(hu) * Math.sin(v) + Math.cos(hu) * Math.sin(2 * v);
  return [x * 0.5, y * 0.5, z * 0.5];
}

// φ-spiral in 3D (r = φ^(θ/π), lifted by sin)
function phiSpiralPoint(theta: number, lift: number): [number, number, number] {
  const r = Math.pow(φ, theta / Math.PI) * 0.08;
  return [r * Math.cos(theta), r * Math.sin(theta), lift * 0.1];
}

// ─── WebGPU WGSL Compute Shader (LNN Particle Simulation) ────────────────────
// Implements Liquid Time-Constant (LTC) dynamics with 128.23° Klein Twist,
// Base-53 Sieve noise floor, and Landauer 0.02 eV dissipation gap.
const WGSL_PARTICLE_SHADER = /* wgsl */ `
struct Particle {
  px: f32, py: f32,
  vx: f32, vy: f32,
  phase: f32, life: f32,
  latent_intent: f32,  // "imagination" vector — tracks velocity magnitude
  _pad: f32,
};

@group(0) @binding(0) var<storage, read>       particlesIn  : array<Particle>;
@group(0) @binding(1) var<storage, read_write> particlesOut : array<Particle>;

struct Uniforms {
  dt:                f32,
  spoke:             f32,
  carrierHz:         f32,
  time:              f32,
  rTarget:           f32,
  rotSpeed:          f32,
  ixPos:             f32,
  iyPos:             f32,
  interactionActive: f32,
  _pad0: f32, _pad1: f32, _pad2: f32,
};
@group(0) @binding(2) var<uniform> u: Uniforms;

const KAPPA:       f32 = 1.2732395447;
const PHI:         f32 = 1.6180339887;
const DELTA:       f32 = 0.02;
const KLEIN_TWIST: f32 = 2.23819; // 128.23° in radians
const TAU:         f32 = 6.28318530718;

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  if (index >= arrayLength(&particlesIn)) { return; }

  var px     = particlesIn[index].px;
  var py     = particlesIn[index].py;
  var vx     = particlesIn[index].vx;
  var vy     = particlesIn[index].vy;
  var phase  = particlesIn[index].phase;
  var life   = particlesIn[index].life;
  var latent = particlesIn[index].latent_intent;

  let speed = u.carrierHz / 111.0;
  let r = sqrt(px * px + py * py) + DELTA;

  // 1. φ-spiral attractor (radial + tangential)
  let dr = u.rTarget - r;
  let ax = (px / r) * dr * 1.8 * speed;
  let ay = (py / r) * dr * 1.8 * speed;
  let tx = -py * u.rotSpeed;
  let ty =  px * u.rotSpeed;

  // 2. κ Helicity Lock — damping
  let dx = -KAPPA * vx * 6.0;
  let dy = -KAPPA * vy * 6.0;

  // 3. Cursor repulsion (consciousness collapse mirror)
  var ix = 0.0; var iy = 0.0;
  if (u.interactionActive > 0.5) {
    let cx2 = u.ixPos - px;
    let cy2 = u.iyPos - py;
    let cd  = sqrt(cx2 * cx2 + cy2 * cy2) + DELTA;
    if (cd < 0.3) {
      ix = -(cx2 / cd) * (0.3 - cd) * 3.0;
      iy = -(cy2 / cd) * (0.3 - cd) * 3.0;
    }
  }

  // 4. 128.23° Klein Twist at singularity boundary
  if (r < DELTA * 5.0) {
    let c = cos(KLEIN_TWIST); let s = sin(KLEIN_TWIST);
    let nvx = vx * c - vy * s;
    let nvy = vx * s + vy * c;
    vx = nvx; vy = nvy;
  }

  // 5. Base-53 Sieve: Landauer 0.02 eV stochastic noise floor
  // Prevents terminal crystallization (Self-Adjoint Catastrophe)
  let g: f32 = 7.0; let h: f32 = 13.0;
  let sieve = ((g * f32(index) + h) % 53.0) / 53.0 * DELTA;

  // 6. LTC integration (Liquid Time-Constant ODE)
  vx += (ax + tx + dx + ix) * u.dt + sieve * 0.5;
  vy += (ay + ty + dy + iy) * u.dt + sieve * 0.5;
  px += vx * u.dt;
  py += vy * u.dt;

  // 7. Klein boundary: flip with κ-attenuation
  if (abs(px) > 1.05) { px = -px * 0.95; vx = -vx * KAPPA * 0.5; }
  if (abs(py) > 1.05) { py = -py * 0.95; vy = -vy * KAPPA * 0.5; }

  // Latent intent: exponential moving average of speed (the "imagination" vector)
  let speed_mag = sqrt(vx * vx + vy * vy);
  latent = latent * 0.95 + speed_mag * 0.05;

  particlesOut[index].px             = px;
  particlesOut[index].py             = py;
  particlesOut[index].vx             = vx;
  particlesOut[index].vy             = vy;
  particlesOut[index].phase          = (phase + u.dt * u.carrierHz * 0.008) % TAU;
  particlesOut[index].life           = (life  + u.dt * 0.08) % 1.0;
  particlesOut[index].latent_intent  = latent;
  particlesOut[index]._pad           = 0.0;
}
`;

// 12 icosahedron vertices (normalized to unit sphere)
// (0, ±1, ±φ), (±1, ±φ, 0), (±φ, 0, ±1), scaled by 1/√(1+φ²)
const _s = 1 / Math.sqrt(1 + PHI * PHI);
const ICO_VERTS: [number, number, number][] = [
  [0, _s, PHI * _s], [0, -_s, PHI * _s], [0, _s, -PHI * _s], [0, -_s, -PHI * _s],
  [_s, PHI * _s, 0], [-_s, PHI * _s, 0], [_s, -PHI * _s, 0], [-_s, -PHI * _s, 0],
  [PHI * _s, 0, _s], [-PHI * _s, 0, _s], [PHI * _s, 0, -_s], [-PHI * _s, 0, -_s],
];
// 30 edges: two verts are adjacent if distance ≈ edge length of icosahedron
const _edgeLen2 = 4 * _s * _s; // (2/_norm)^2
const ICO_EDGES: [number, number][] = [];
for (let i = 0; i < 12; i++) {
  for (let j = i + 1; j < 12; j++) {
    const [ax2, ay2, az2] = ICO_VERTS[i]; const [bx2, by2, bz2] = ICO_VERTS[j];
    const d2 = (ax2-bx2)**2 + (ay2-by2)**2 + (az2-bz2)**2;
    if (Math.abs(d2 - _edgeLen2) < 0.001) ICO_EDGES.push([i, j]);
  }
}
// Stellation spike centers (face centroids scaled out × φ)
const ICO_FACES: [number, number, number][] = [
  [0,1,8],[0,1,9],[0,4,5],[0,4,8],[0,5,9],
  [1,6,7],[1,6,8],[1,7,9],[2,3,10],[2,3,11],
  [2,4,5],[2,4,10],[2,5,11],[3,6,7],[3,6,10],
  [3,7,11],[4,8,10],[5,9,11],[6,8,10],[7,9,11],
];

// ─── Core Renderer ────────────────────────────────────────────────────────────
export class GosRenderer {
  canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreen: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;
  particles: ParticleSystem;
  private time = 0;
  private glyphCache: Map<string, string> = new Map();
  private glyphGridStale = true;
  private glyphCols = 0;
  private glyphRows = 0;
  private glyphGrid: Array<{ glyph: string; brightness: number }> = [];
  private animFrame: number | null = null;
  private onFrame?: (p: number) => void;
  private mediaRecorder?: MediaRecorder;
  private recordChunks: Blob[] = [];

  // ── WebGPU compute state ─────────────────────────────────────────────────────
  private gpuDevice: GPUDevice | null = null;
  private gpuQueue: GPUQueue | null = null;
  private gpuBufA: GPUBuffer | null = null;   // ping buffer
  private gpuBufB: GPUBuffer | null = null;   // pong buffer
  private gpuReadback: GPUBuffer | null = null;
  private gpuUniform: GPUBuffer | null = null;
  private gpuPipeline: GPUComputePipeline | null = null;
  private gpuBgA: GPUBindGroup | null = null;
  private gpuBgB: GPUBindGroup | null = null;
  private gpuPingIsA = true;
  public gpuActive = false;

  // ── Rendering mode ───────────────────────────────────────────────────────────
  phosphorMode = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.offscreen = document.createElement("canvas");
    this.offscreen.width = 80;
    this.offscreen.height = 80;
    this.offCtx = this.offscreen.getContext("2d")!;
    this.particles = new ParticleSystem();
    this.resize();
    // Try to init WebGPU in background (no-op if unavailable)
    this.initWebGPU().catch(() => {});
  }

  // ── WebGPU initialization ─────────────────────────────────────────────────────
  async initWebGPU() {
    if (!("gpu" in navigator)) return;
    const adapter = await (navigator as unknown as { gpu: GPU }).gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) return;
    this.gpuDevice = await adapter.requestDevice();
    this.gpuQueue  = this.gpuDevice.queue;

    // Particle stride: 8 floats × 4 bytes = 32 bytes per particle
    const STRIDE = 8 * 4;
    const byteSize = N_PARTICLES * STRIDE;

    // Seed initial data (8 floats per particle: px,py,vx,vy,phase,life,latent,pad)
    const initData = new Float32Array(N_PARTICLES * 8);
    for (let i = 0; i < N_PARTICLES; i++) {
      const s = i * 6, g = i * 8;
      initData[g]   = this.particles.data[s];     // px
      initData[g+1] = this.particles.data[s+1];   // py
      initData[g+2] = this.particles.data[s+2];   // vx
      initData[g+3] = this.particles.data[s+3];   // vy
      initData[g+4] = this.particles.data[s+4];   // phase
      initData[g+5] = this.particles.data[s+5];   // life
      initData[g+6] = 0;                           // latent_intent
      initData[g+7] = 0;                           // _pad
    }

    const usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
    this.gpuBufA = this.gpuDevice.createBuffer({ size: byteSize, usage, mappedAtCreation: true });
    new Float32Array(this.gpuBufA.getMappedRange()).set(initData);
    this.gpuBufA.unmap();

    this.gpuBufB = this.gpuDevice.createBuffer({ size: byteSize, usage });
    this.gpuReadback = this.gpuDevice.createBuffer({
      size: byteSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    // Uniform buffer: 12 floats = 48 bytes
    this.gpuUniform = this.gpuDevice.createBuffer({
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const module = this.gpuDevice.createShaderModule({ code: WGSL_PARTICLE_SHADER });
    this.gpuPipeline = this.gpuDevice.createComputePipeline({
      layout: "auto",
      compute: { module, entryPoint: "cs_main" },
    });

    const mkBg = (inBuf: GPUBuffer, outBuf: GPUBuffer) =>
      this.gpuDevice!.createBindGroup({
        layout: this.gpuPipeline!.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: inBuf  } },
          { binding: 1, resource: { buffer: outBuf } },
          { binding: 2, resource: { buffer: this.gpuUniform! } },
        ],
      });

    this.gpuBgA = mkBg(this.gpuBufA, this.gpuBufB!);
    this.gpuBgB = mkBg(this.gpuBufB!, this.gpuBufA);
    this.gpuActive = true;
  }

  // ── GPU particle step (ping-pong) ─────────────────────────────────────────────
  private async stepGPU(dt: number, spoke: number, carrierHz: number, interaction: SceneParams["interaction"]) {
    if (!this.gpuDevice || !this.gpuPipeline || !this.gpuUniform) return;
    const speed = carrierHz / 111;
    const rTarget = Math.pow(PHI, (spoke % 12) / 6) * 0.35;
    const rotSpeed = speed * 0.6;

    // Write uniforms
    const u = new Float32Array(12);
    u[0]  = Math.min(dt, 0.05);
    u[1]  = spoke;
    u[2]  = carrierHz;
    u[3]  = this.time;
    u[4]  = rTarget;
    u[5]  = rotSpeed;
    u[6]  = interaction.x;
    u[7]  = interaction.y;
    u[8]  = interaction.active ? 1 : 0;
    this.gpuQueue!.writeBuffer(this.gpuUniform, 0, u);

    const inBuf  = this.gpuPingIsA ? this.gpuBufA! : this.gpuBufB!;
    const outBuf = this.gpuPingIsA ? this.gpuBufB! : this.gpuBufA!;
    const bg     = this.gpuPingIsA ? this.gpuBgA!  : this.gpuBgB!;

    const enc = this.gpuDevice.createCommandEncoder();
    const pass = enc.beginComputePass();
    pass.setPipeline(this.gpuPipeline);
    pass.setBindGroup(0, bg);
    pass.dispatchWorkgroups(Math.ceil(N_PARTICLES / 64));
    pass.end();
    enc.copyBufferToBuffer(outBuf, 0, this.gpuReadback!, 0, N_PARTICLES * 32);
    this.gpuQueue!.submit([enc.finish()]);
    this.gpuPingIsA = !this.gpuPingIsA;

    // Read back to CPU Float32Array for Canvas2D rendering
    await this.gpuReadback!.mapAsync(GPUMapMode.READ);
    const raw = new Float32Array(this.gpuReadback!.getMappedRange());
    for (let i = 0; i < N_PARTICLES; i++) {
      const g2 = i * 8, c = i * 6;
      this.particles.data[c]   = raw[g2];
      this.particles.data[c+1] = raw[g2+1];
      this.particles.data[c+2] = raw[g2+2];
      this.particles.data[c+3] = raw[g2+3];
      this.particles.data[c+4] = raw[g2+4];
      this.particles.data[c+5] = raw[g2+5];
    }
    this.gpuReadback!.unmap();
  }

  resize() {
    // 9:16 mobile-first
    const parentW = this.canvas.parentElement?.clientWidth ?? 360;
    const w = Math.min(parentW, 540);
    const h = Math.round(w * 16 / 9);
    this.canvas.width = w;
    this.canvas.height = h;
    this.glyphGridStale = true;
  }

  // ── Glyph-Pixel Layer: render offscreen → rasterize as glyphs ───────────────
  private buildGlyphGrid(renderFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
    const GW = 80, GH = 80; // offscreen resolution (glyph cells)
    this.offscreen.width = GW;
    this.offscreen.height = GH;
    this.offCtx.clearRect(0, 0, GW, GH);
    renderFn(this.offCtx, GW, GH);
    const pixels = this.offCtx.getImageData(0, 0, GW, GH).data;
    this.glyphCols = GW;
    this.glyphRows = GH;
    this.glyphGrid = [];
    for (let row = 0; row < GH; row++) {
      for (let col = 0; col < GW; col++) {
        const idx = (row * GW + col) * 4;
        const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        this.glyphGrid.push({ brightness, glyph: glyphForBrightness(brightness) });
      }
    }
  }

  private drawGlyphLayer(alpha = 1.0) {
    const W = this.canvas.width, H = this.canvas.height;
    const cellW = W / this.glyphCols;
    const cellH = H / this.glyphRows;
    const fontSize = Math.max(5, Math.min(cellW, cellH) * 0.85);
    this.ctx.font = `${fontSize}px monospace`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    for (let row = 0; row < this.glyphRows; row++) {
      for (let col = 0; col < this.glyphCols; col++) {
        const { brightness, glyph } = this.glyphGrid[row * this.glyphCols + col];
        if (brightness < 0.04) continue;

        // Map brightness to Celestial Ladder color (11-note arpeggio)
        const ladderIdx = Math.min(10, Math.floor(brightness * 11));
        const color = LADDER_COLORS[ladderIdx];
        const a = brightness * alpha;
        this.ctx.fillStyle = `${color}${a.toFixed(2)})`;

        const px = (col + 0.5) * cellW;
        const py = (row + 0.5) * cellH;
        this.ctx.fillText(glyph, px, py);
      }
    }
  }

  // ── Scene Drawing Functions ───────────────────────────────────────────────────

  private drawBackground(params: SceneParams) {
    const { spoke, tension } = params;
    const W = this.canvas.width, H = this.canvas.height;
    const bg = HERO_JOURNEY_MAP[spoke]?.color ?? "#0a0a0f";

    // Base fill
    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, W, H);

    // Subtle radial vignette
    const grad = this.ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.6)");
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, W, H);
  }

  private drawParticles(params: SceneParams, alpha = 0.7) {
    const { spoke, carrierHz } = params;
    const W = this.canvas.width, H = this.canvas.height;
    const cx = W / 2, cy = H / 2;
    const scale = Math.min(W, H) * 0.43;

    for (let i = 0; i < N_PARTICLES; i++) {
      const b = i * 6;
      const px = this.particles.data[b] * scale + cx;
      const py = this.particles.data[b + 1] * scale + cy;
      const phase = this.particles.data[b + 4];

      if (px < 0 || px > W || py < 0 || py > H) continue;

      const hue = (spoke / 24) * 280 + phase * 25;
      const sat = 35 + Math.abs(Math.sin(phase)) * 40;
      const lit = 45 + Math.cos(phase * 1.618) * 20;
      const a = (0.15 + 0.3 * Math.abs(Math.sin(phase))) * alpha;
      const size = 1.0 + Math.abs(Math.sin(phase * φ)) * 1.5;

      this.ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lit}%, ${a})`;
      this.ctx.beginPath();
      this.ctx.arc(px, py, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawPhiSpiral(params: SceneParams) {
    const { progress, spoke } = params;
    const W = this.canvas.width, H = this.canvas.height;
    const cx = W / 2, cy = H * 0.45;
    const maxTheta = progress * Math.PI * 8; // up to 4 full turns
    const steps = Math.floor(maxTheta / 0.05);
    if (steps < 2) return;

    this.ctx.save();
    this.ctx.strokeStyle = `rgba(255,215,80,${0.6 + 0.3 * Math.sin(this.time * 2)})`;
    this.ctx.lineWidth = 1.5;
    this.ctx.shadowColor = "rgba(255,215,80,0.4)";
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();

    const scale = Math.min(W, H) * 0.32;
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * maxTheta;
      const r = Math.pow(φ, theta / Math.PI) * 0.08 * scale;
      const x = cx + r * Math.cos(theta - Math.PI / 2);
      const y = cy + r * Math.sin(theta - Math.PI / 2);
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
    this.ctx.restore();

    // φ-ratio labels at each turn
    if (progress > 0.3) {
      this.ctx.font = "bold 11px monospace";
      this.ctx.fillStyle = "rgba(255,215,80,0.5)";
      this.ctx.textAlign = "center";
      for (let turn = 1; turn <= Math.floor(maxTheta / (Math.PI * 2)); turn++) {
        const theta = turn * Math.PI * 2;
        const r = Math.pow(φ, theta / Math.PI) * 0.08 * scale;
        const x = cx + r * Math.cos(theta - Math.PI / 2);
        const y = cy + r * Math.sin(theta - Math.PI / 2);
        this.ctx.fillText(`φ^${turn}`, x + 10, y);
      }
    }
  }

  private drawGosLattice(params: SceneParams) {
    const { progress, spoke, tension } = params;
    const W = this.canvas.width, H = this.canvas.height;
    const cx = W / 2, cy = H * 0.42;
    const R = Math.min(W, H) * 0.35;
    const N = 24; // spokes

    this.ctx.save();

    // Concentric φ-ratio rings
    const ringCount = 4;
    for (let ring = 0; ring < ringCount; ring++) {
      const ringR = R * Math.pow(φ, -(ringCount - ring)) * φ;
      const alpha = progress * (0.15 + 0.1 * ring);
      this.ctx.strokeStyle = `rgba(100,180,255,${alpha})`;
      this.ctx.lineWidth = 0.5;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // 24 spokes — light up progressively
    const spokesVisible = Math.floor(progress * N);
    for (let s = 0; s < N; s++) {
      const angle = (s / N) * Math.PI * 2 - Math.PI / 2;
      const active = s <= spokesVisible;
      const isCurrentSpoke = s === spoke;

      const alpha = active ? (isCurrentSpoke ? 0.9 : 0.3) : 0.06;
      const color = isCurrentSpoke ? "255,215,80" : "100,160,255";
      this.ctx.strokeStyle = `rgba(${color},${alpha})`;
      this.ctx.lineWidth = isCurrentSpoke ? 2 : 0.7;

      if (isCurrentSpoke) {
        this.ctx.shadowColor = "rgba(255,215,80,0.6)";
        this.ctx.shadowBlur = 12;
      } else {
        this.ctx.shadowBlur = 0;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
      this.ctx.stroke();

      // Spoke label
      if (active && isCurrentSpoke) {
        const lx = cx + (R + 12) * Math.cos(angle);
        const ly = cy + (R + 12) * Math.sin(angle);
        this.ctx.font = "bold 10px monospace";
        this.ctx.fillStyle = "rgba(255,215,80,0.8)";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(`${s}`, lx, ly);
      }
    }

    // Center dot (the monad)
    this.ctx.shadowColor = "rgba(255,255,255,0.8)";
    this.ctx.shadowBlur = 20;
    this.ctx.fillStyle = "white";
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawKleinMorph(params: SceneParams) {
    const { progress, spoke } = params;
    const W = this.canvas.width, H = this.canvas.height;
    const cx = W / 2, cy = H * 0.42;

    const t = this.time * 0.3;
    const rotY = t * κ;          // κ-rate rotation
    const rotX = t * (φ - 1);    // φ-complement rate

    const U_STEPS = 28, V_STEPS = 18;
    const lines: Array<[number, number, number, number]> = [];

    // Draw Klein bottle wireframe (u-lines)
    for (let vi = 0; vi <= V_STEPS; vi++) {
      const v = (vi / V_STEPS) * Math.PI * 2;
      let prevPt: [number, number] | null = null;
      for (let ui = 0; ui <= U_STEPS; ui++) {
        const u = (ui / U_STEPS) * Math.PI * 2;
        let [x, y, z] = kleinPoint(u, v);
        [x, y, z] = rotateY(x, y, z, rotY);
        [x, y, z] = rotateX(x, y, z, rotX);
        const [px2, py2] = project(x, y, z);
        const sx = cx + px2 * Math.min(W, H) * 0.3;
        const sy = cy + py2 * Math.min(W, H) * 0.3;
        if (prevPt) lines.push([prevPt[0], prevPt[1], sx, sy]);
        prevPt = [sx, sy];
      }
    }

    // Draw v-lines (cross-sections)
    for (let ui = 0; ui <= U_STEPS; ui++) {
      const u = (ui / U_STEPS) * Math.PI * 2;
      let prevPt: [number, number] | null = null;
      for (let vi = 0; vi <= V_STEPS; vi++) {
        const v = (vi / V_STEPS) * Math.PI * 2;
        let [x, y, z] = kleinPoint(u, v);
        [x, y, z] = rotateY(x, y, z, rotY);
        [x, y, z] = rotateX(x, y, z, rotX);
        const [px2, py2] = project(x, y, z);
        const sx = cx + px2 * Math.min(W, H) * 0.3;
        const sy = cy + py2 * Math.min(W, H) * 0.3;
        if (prevPt) lines.push([prevPt[0], prevPt[1], sx, sy]);
        prevPt = [sx, sy];
      }
    }

    this.ctx.save();
    this.ctx.lineWidth = 0.6;
    this.ctx.globalAlpha = progress * 0.7;
    const hue = (spoke / 24) * 280;
    this.ctx.strokeStyle = `hsl(${hue},60%,70%)`;
    this.ctx.shadowColor = `hsl(${hue},80%,60%)`;
    this.ctx.shadowBlur = 6;

    for (const [x1, y1, x2, y2] of lines) {
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }

    // θ_K label
    if (progress > 0.5) {
      this.ctx.globalAlpha = (progress - 0.5) * 2;
      this.ctx.font = "11px monospace";
      this.ctx.fillStyle = "rgba(255,215,80,0.7)";
      this.ctx.textAlign = "center";
      this.ctx.fillText(`θ_K = 128.23°`, cx, H * 0.75);
    }

    this.ctx.restore();
  }

  private drawFrequencyWave(params: SceneParams) {
    const { progress, carrierHz, spoke } = params;
    const W = this.canvas.width, H = this.canvas.height;
    const cy = H * 0.45;
    const amp = Math.min(W, H) * 0.12;
    const steps = Math.floor(W);

    // Primary carrier
    this.ctx.save();
    this.ctx.lineWidth = 1.5;
    this.ctx.shadowBlur = 10;

    const waves = [
      { hz: carrierHz, color: "rgba(255,215,80,0.8)", amp: amp * 0.7, label: `${carrierHz} Hz` },
      { hz: 111, color: "rgba(100,180,255,0.5)", amp: amp * 0.5, label: "111 Hz" },
      { hz: 37, color: "rgba(100,255,180,0.35)", amp: amp * 0.3, label: "37 Hz" },
    ];

    for (const wave of waves) {
      this.ctx.strokeStyle = wave.color;
      this.ctx.shadowColor = wave.color;
      this.ctx.beginPath();
      for (let x = 0; x < W * progress; x++) {
        const t = (x / W) * 4 + this.time;
        const y = cy + wave.amp * Math.sin(2 * Math.PI * t * (wave.hz / 111));
        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    }

    // Riemann zero markers
    const riemannGammas = [14.134, 21.022, 25.011, 30.424, 32.935];
    if (progress > 0.4) {
      for (const gamma of riemannGammas) {
        const xPos = (gamma / 55) * W;
        if (xPos > W * progress) continue;
        this.ctx.strokeStyle = "rgba(255,80,80,0.6)";
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(xPos, cy - amp * 1.2);
        this.ctx.lineTo(xPos, cy + amp * 1.2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.font = "9px monospace";
        this.ctx.fillStyle = "rgba(255,80,80,0.7)";
        this.ctx.textAlign = "center";
        this.ctx.fillText(`γ${riemannGammas.indexOf(gamma) + 1}`, xPos, cy - amp * 1.4);
      }
    }

    // Wave labels
    this.ctx.font = "10px monospace";
    this.ctx.textAlign = "left";
    for (let i = 0; i < waves.length; i++) {
      this.ctx.fillStyle = waves[i].color;
      this.ctx.fillText(waves[i].label, 8, cy - amp * 1.2 + i * 14);
    }

    this.ctx.restore();
  }

  private drawGlyphRaster(params: SceneParams) {
    const { progress, spoke } = params;
    const W = this.canvas.width, H = this.canvas.height;

    // Build offscreen with GOS geometry, then rasterize as glyphs
    this.buildGlyphGrid((offCtx, gW, gH) => {
      offCtx.fillStyle = "#000";
      offCtx.fillRect(0, 0, gW, gH);

      // Draw φ-spiral at low resolution
      offCtx.strokeStyle = "#fff";
      offCtx.lineWidth = 1;
      offCtx.beginPath();
      const maxTheta = progress * Math.PI * 6;
      const cx = gW / 2, cy = gH / 2;
      for (let i = 0; i <= 200; i++) {
        const theta = (i / 200) * maxTheta;
        const r = Math.pow(φ, theta / Math.PI) * 1.5;
        const x = cx + r * Math.cos(theta);
        const y = cy + r * Math.sin(theta);
        if (i === 0) offCtx.moveTo(x, y);
        else offCtx.lineTo(x, y);
      }
      offCtx.stroke();

      // Draw spokes
      for (let s = 0; s <= Math.floor(progress * 24); s++) {
        const angle = (s / 24) * Math.PI * 2;
        offCtx.strokeStyle = s === spoke ? "#ff0" : "rgba(255,255,255,0.4)";
        offCtx.beginPath();
        offCtx.moveTo(cx, cy);
        offCtx.lineTo(cx + gW * 0.45 * Math.cos(angle), cy + gH * 0.45 * Math.sin(angle));
        offCtx.stroke();
      }
    });

    this.drawGlyphLayer(progress);
  }

  private drawTextReveal(params: SceneParams) {
    const { progress, text, theme, spoke } = params;
    const W = this.canvas.width, H = this.canvas.height;

    if (!text) return;

    const visibleLen = Math.floor(progress * text.length);
    const visibleText = text.slice(0, visibleLen);

    this.ctx.save();
    // Geometric underline (expands with text)
    const textW = Math.min(W * 0.85, visibleText.length * 10);
    const textY = H * 0.68;
    const lineY = textY + 18;
    const lineX = (W - textW) / 2;

    this.ctx.strokeStyle = "rgba(255,215,80,0.6)";
    this.ctx.lineWidth = 1.5;
    this.ctx.shadowColor = "rgba(255,215,80,0.4)";
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(lineX, lineY);
    this.ctx.lineTo(lineX + textW, lineY);
    this.ctx.stroke();

    // Main text
    this.ctx.font = `bold 16px 'Courier New', monospace`;
    this.ctx.fillStyle = "rgba(255,255,255,0.92)";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.shadowColor = "rgba(255,255,255,0.3)";
    this.ctx.shadowBlur = 12;

    // Word-wrap
    const words = visibleText.split(" ");
    const maxW = W * 0.80;
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (this.ctx.measureText(test).width > maxW) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);

    const lineH = 22;
    const startY = textY - ((lines.length - 1) * lineH) / 2;
    for (let i = 0; i < lines.length; i++) {
      this.ctx.fillText(lines[i], W / 2, startY + i * lineH);
    }

    // Spoke indicator (bottom-right HUD)
    this.ctx.font = "9px monospace";
    this.ctx.fillStyle = "rgba(255,215,80,0.4)";
    this.ctx.textAlign = "right";
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(`κ=${κ.toFixed(4)} φ=${φ.toFixed(4)} ∠${128.23}° spoke:${spoke}`, W - 10, H - 12);

    this.ctx.restore();
  }

  private drawSynthesis(params: SceneParams) {
    // Peak tension scene: all layers together at reduced opacity
    this.drawGlyphRaster({ ...params, progress: params.progress * 0.6 });
    this.drawKleinMorph({ ...params, progress: params.progress });
    this.drawParticles(params, 0.5);
    this.drawGosLattice({ ...params, progress: params.progress * 0.8 });
  }

  private drawIcosahedron(params: SceneParams) {
    const { progress, spoke } = params;
    const W = this.canvas.width, H = this.canvas.height;
    const cx = W / 2, cy = H * 0.42;
    const scale = Math.min(W, H) * 0.28;

    const t = this.time * 0.25;
    const rotY = t * κ;
    const rotX = t * (φ - 1);

    // Project and rotate each vertex
    const projected: [number, number, number][] = ICO_VERTS.map(([vx2, vy2, vz2]) => {
      let [x, y, z] = rotateY(vx2, vy2, vz2, rotY);
      [x, y, z] = rotateX(x, y, z, rotX);
      const [sx, sy] = project(x, y, z);
      return [cx + sx * scale, cy + sy * scale, z];
    });

    this.ctx.save();
    this.ctx.globalAlpha = Math.min(1, progress * 2);

    // Draw edges (30 icosahedron edges)
    const hue = (spoke / 24) * 280 + 20;
    this.ctx.lineWidth = 1.2;
    this.ctx.shadowBlur = 8;

    for (const [ai, bi] of ICO_EDGES) {
      const [ax3, ay3, az3] = projected[ai];
      const [bx3, by3, bz3] = projected[bi];
      const avgZ = (az3 + bz3) / 2;
      const zAlpha = (avgZ + 0.8) / 1.6; // depth fade
      this.ctx.strokeStyle = `hsla(${hue}, 70%, ${50 + zAlpha * 30}%, ${0.4 + zAlpha * 0.5})`;
      this.ctx.shadowColor = `hsla(${hue}, 90%, 70%, 0.3)`;
      this.ctx.beginPath();
      this.ctx.moveTo(ax3, ay3);
      this.ctx.lineTo(bx3, by3);
      this.ctx.stroke();
    }

    // Draw stellation spikes (κ × φ scaled)
    if (progress > 0.4) {
      const spikeLen = scale * 0.3 * κ;
      this.ctx.lineWidth = 0.6;
      for (const [ai, bi, ci] of ICO_FACES) {
        const [ax3, ay3] = projected[ai];
        const [bx3, by3] = projected[bi];
        const [cx3, cy3] = projected[ci];
        const fcx = (ax3 + bx3 + cx3) / 3;
        const fcy = (ay3 + by3 + cy3) / 3;
        // Outward normal approximation: centroid to center
        const nx = fcx - cx, ny = fcy - cy;
        const nl = Math.sqrt(nx * nx + ny * ny) + Δ;
        const tip = [fcx + (nx / nl) * spikeLen, fcy + (ny / nl) * spikeLen] as const;
        this.ctx.strokeStyle = `hsla(${(hue + 40) % 360}, 80%, 80%, ${(progress - 0.4) * 0.6})`;
        for (const [vx3, vy3] of [[ax3, ay3], [bx3, by3], [cx3, cy3]] as const) {
          this.ctx.beginPath();
          this.ctx.moveTo(vx3, vy3);
          this.ctx.lineTo(tip[0], tip[1]);
          this.ctx.stroke();
        }
      }
    }

    // Vertex dots — colored by Celestial Ladder position
    for (let vi = 0; vi < 12; vi++) {
      const [vx4, vy4, vz4] = projected[vi];
      const ladderIdx = Math.floor((vi / 12) * 11);
      const col = LADDER_COLORS[ladderIdx];
      const zAlpha = (vz4 + 0.8) / 1.6;
      this.ctx.fillStyle = `${col}${(0.5 + zAlpha * 0.5).toFixed(2)})`;
      this.ctx.shadowColor = `${col}0.8)`;
      this.ctx.shadowBlur = 12;
      this.ctx.beginPath();
      this.ctx.arc(vx4, vy4, 3 + zAlpha * 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Vector equilibrium label
    if (progress > 0.6) {
      this.ctx.globalAlpha = (progress - 0.6) * 2.5;
      this.ctx.font = "10px monospace";
      this.ctx.fillStyle = "rgba(255,215,80,0.6)";
      this.ctx.textAlign = "center";
      this.ctx.shadowBlur = 0;
      this.ctx.fillText("VECTOR EQUILIBRIUM · 64-tetra grid", cx, H * 0.76);
      this.ctx.fillText(`κ=${κ.toFixed(4)} · φ^${(spoke % 6) + 1}=${Math.pow(φ, (spoke % 6) + 1).toFixed(3)}`, cx, H * 0.79);
    }

    this.ctx.restore();
  }

  // ── Green Phosphor HUD overlay ─────────────────────────────────────────────────
  // Military-grade monochrome green phosphor (monospace spatial frequency mode)
  private applyPhosphorFilter() {
    const W = this.canvas.width, H = this.canvas.height;
    this.ctx.save();

    // Green tint: source-atop over entire canvas
    this.ctx.globalCompositeOperation = "color";
    this.ctx.fillStyle = "rgba(0, 255, 80, 0.92)";
    this.ctx.fillRect(0, 0, W, H);

    // Phosphor scanlines
    this.ctx.globalCompositeOperation = "multiply";
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    for (let y = 0; y < H; y += 3) {
      this.ctx.fillRect(0, y, W, 1);
    }

    // Phosphor glow bloom
    this.ctx.globalCompositeOperation = "screen";
    const grd = this.ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.5);
    grd.addColorStop(0, "rgba(0,255,80,0.12)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    this.ctx.fillStyle = grd;
    this.ctx.fillRect(0, 0, W, H);

    // Corner HUD markers
    this.ctx.globalCompositeOperation = "source-over";
    this.ctx.strokeStyle = "rgba(0,255,80,0.4)";
    this.ctx.lineWidth = 1;
    const m = 16; // marker size
    for (const [bx5, by5, sx2, sy2] of [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]] as const) {
      this.ctx.beginPath();
      this.ctx.moveTo(bx5 + sx2 * m, by5); this.ctx.lineTo(bx5, by5); this.ctx.lineTo(bx5, by5 + sy2 * m);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  // ── HUD Overlay ───────────────────────────────────────────────────────────────
  private drawHUD(params: SceneParams) {
    const { spoke, tension, globalProgress, beatIndex, totalBeats } = params;
    const W = this.canvas.width, H = this.canvas.height;
    const stage = HERO_JOURNEY_MAP[spoke]?.stage ?? "";

    this.ctx.save();

    // Progress bar (top, φ-gold)
    const barW = W * globalProgress;
    this.ctx.fillStyle = "rgba(255,215,80,0.15)";
    this.ctx.fillRect(0, 0, W, 2);
    this.ctx.fillStyle = "rgba(255,215,80,0.7)";
    this.ctx.fillRect(0, 0, barW, 2);

    // Stage label (top-left)
    this.ctx.font = "10px monospace";
    this.ctx.fillStyle = "rgba(255,255,255,0.35)";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`${stage.toUpperCase()} · ${tension}`, 10, 18);

    // Beat counter (top-right)
    this.ctx.textAlign = "right";
    this.ctx.fillText(`${beatIndex + 1}/${totalBeats}`, W - 10, 18);

    // Bottom: frequency display
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "rgba(100,180,255,0.25)";
    this.ctx.fillText(`${params.carrierHz} Hz · Δ=${Δ} · Ψ=1.618`, W / 2, H - 8);

    this.ctx.restore();
  }

  // ── Main Render Frame ─────────────────────────────────────────────────────────
  renderFrame(params: SceneParams, dt: number) {
    this.time += dt;
    const W = this.canvas.width, H = this.canvas.height;
    const mode = HERO_JOURNEY_MAP[params.spoke]?.mode ?? "PARTICLE_FIELD";

    // Step particles — GPU path when available, CPU fallback
    const interactionNorm = {
      x: (params.interaction.x / W) * 2 - 1,
      y: (params.interaction.y / H) * 2 - 1,
      active: params.interaction.active,
    };
    if (this.gpuActive) {
      // Fire-and-forget GPU step (async, Canvas2D uses CPU copy from prior frame)
      this.stepGPU(dt, params.spoke, params.carrierHz, interactionNorm).catch(() => {
        this.gpuActive = false; // fall back permanently on error
      });
    } else {
      this.particles.step(dt, params.spoke, params.carrierHz, interactionNorm);
    }

    // Clear
    this.drawBackground(params);

    // Scene layer
    switch (mode) {
      case "PHI_SPIRAL":     this.drawPhiSpiral(params); break;
      case "LATTICE_REVEAL": this.drawGosLattice(params); break;
      case "KLEIN_MORPH":    this.drawKleinMorph(params); break;
      case "GLYPH_RASTER":   this.drawGlyphRaster(params); break;
      case "FREQUENCY_WAVE": this.drawFrequencyWave(params); break;
      case "SYNTHESIS":      this.drawSynthesis(params); break;
      case "ICOSAHEDRON":    this.drawIcosahedron(params); break;
      case "PARTICLE_FIELD": break; // particles only
    }

    // Particles always visible, opacity depends on tension
    const particleAlpha = params.tension === "peak" ? 0.9 : params.tension === "rising" ? 0.6 : 0.4;
    this.drawParticles(params, particleAlpha);

    // Text narrative (always)
    this.drawTextReveal(params);

    // HUD
    this.drawHUD(params);

    // Green phosphor mode overlay (military HUD aesthetic)
    if (this.phosphorMode) this.applyPhosphorFilter();
  }

  // ── MediaRecorder Export ──────────────────────────────────────────────────────
  startRecording(fps = 30) {
    const stream = this.canvas.captureStream(fps);
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
      videoBitsPerSecond: 5_000_000,
    });
    this.recordChunks = [];
    this.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) this.recordChunks.push(e.data); };
    this.mediaRecorder.start(100);
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) { resolve(new Blob()); return; }
      this.mediaRecorder.onstop = () => resolve(new Blob(this.recordChunks, { type: "video/webm" }));
      this.mediaRecorder.stop();
    });
  }
}

```

---

## `artifacts/omega-gram/src/lib/reel-store.ts`

```
import { createContext, useContext, useState, useCallback, ReactNode, createElement } from "react";
import type { OutlineResult, OutlineBeat, ClipStatus, StitchResult, NarrationResult } from "@workspace/api-client-react";

export type AspectRatio = "9:16" | "16:9" | "1:1";

export interface RefMedia {
  id: string;
  base64: string;
  mimeType: string;
  name: string;
  sourceUrl?: string;
}

export interface ReelState {
  sessionId: string;
  theme: string;
  title: string;
  beatCount: number;
  aspectRatio: AspectRatio;
  refMedia: RefMedia[];
  outline: OutlineResult | null;
  clips: Record<number, ClipStatus>;
  jobIds: Record<number, string>;
  stitched: StitchResult | null;
  narration: NarrationResult | null;
}

interface ReelActions {
  setTheme: (theme: string) => void;
  setTitle: (title: string) => void;
  setBeatCount: (n: number) => void;
  setAspectRatio: (ar: AspectRatio) => void;
  addRefMedia: (media: RefMedia) => void;
  removeRefMedia: (id: string) => void;
  clearRefMedia: () => void;
  setOutline: (outline: OutlineResult) => void;
  setClipStatus: (beatIndex: number, status: ClipStatus) => void;
  setJobId: (beatIndex: number, jobId: string) => void;
  setStitched: (result: StitchResult) => void;
  setNarration: (result: NarrationResult) => void;
  reset: () => void;
}

const defaultState: ReelState = {
  sessionId: crypto.randomUUID(),
  theme: "",
  title: "",
  beatCount: 8,
  aspectRatio: "9:16",
  refMedia: [],
  outline: null,
  clips: {},
  jobIds: {},
  stitched: null,
  narration: null,
};

const ReelContext = createContext<(ReelState & ReelActions) | null>(null);

export function ReelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReelState>(defaultState);

  const setTheme = useCallback((theme: string) => setState(s => ({ ...s, theme })), []);
  const setTitle = useCallback((title: string) => setState(s => ({ ...s, title })), []);
  const setBeatCount = useCallback((beatCount: number) => setState(s => ({ ...s, beatCount })), []);
  const setAspectRatio = useCallback((aspectRatio: AspectRatio) => setState(s => ({ ...s, aspectRatio })), []);
  const addRefMedia = useCallback((media: RefMedia) =>
    setState(s => ({ ...s, refMedia: s.refMedia.length >= 8 ? s.refMedia : [...s.refMedia, media] })), []);
  const removeRefMedia = useCallback((id: string) =>
    setState(s => ({ ...s, refMedia: s.refMedia.filter(m => m.id !== id) })), []);
  const clearRefMedia = useCallback(() => setState(s => ({ ...s, refMedia: [] })), []);
  const setOutline = useCallback((outline: OutlineResult) => setState(s => ({ ...s, outline, title: outline.title })), []);
  const setClipStatus = useCallback((beatIndex: number, status: ClipStatus) =>
    setState(s => ({ ...s, clips: { ...s.clips, [beatIndex]: status } })), []);
  const setJobId = useCallback((beatIndex: number, jobId: string) =>
    setState(s => ({ ...s, jobIds: { ...s.jobIds, [beatIndex]: jobId } })), []);
  const setStitched = useCallback((stitched: StitchResult) => setState(s => ({ ...s, stitched })), []);
  const setNarration = useCallback((narration: NarrationResult) => setState(s => ({ ...s, narration })), []);
  const reset = useCallback(() => setState({ ...defaultState, sessionId: crypto.randomUUID() }), []);

  return createElement(ReelContext.Provider, {
    value: {
      ...state,
      setTheme, setTitle, setBeatCount, setAspectRatio,
      addRefMedia, removeRefMedia, clearRefMedia,
      setOutline, setClipStatus, setJobId,
      setStitched, setNarration, reset,
    },
    children,
  });
}

export function useReel() {
  const ctx = useContext(ReelContext);
  if (!ctx) throw new Error("useReel must be inside ReelProvider");
  return ctx;
}

export function outlineBeatToBeatInput(beat: OutlineBeat) {
  return {
    index: beat.index,
    spoke: beat.spoke,
    visualPrompt: beat.visualPrompt,
    psiTarget: beat.psiTarget,
    A: beat.A,
    N: beat.N,
    sigma: beat.sigma,
    gamma: beat.gamma,
    phi: beat.phi,
    durationSeconds: (beat as { durationSeconds?: number }).durationSeconds ?? null,
    sonataSection: beat.sonataSection ?? null,
    bridge: null,
  };
}

export function storyHealth(coherence: OutlineResult["coherence"]): {
  label: string;
  color: string;
  dot: string;
} {
  const ratio = coherence.kappaHall / coherence.kappaMax;
  if (ratio < 0.5) return { label: "Excellent flow", color: "text-emerald-500", dot: "bg-emerald-500" };
  if (ratio < 0.75) return { label: "Good flow", color: "text-amber-500", dot: "bg-amber-500" };
  if (ratio < 1.0) return { label: "Could be smoother", color: "text-orange-500", dot: "bg-orange-500" };
  return { label: "Needs attention", color: "text-red-500", dot: "bg-red-500" };
}

```

---

## `artifacts/omega-gram/src/lib/reel-store.tsx`

```
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type BeatStatus = "idle" | "queued" | "generating" | "done" | "error";

export interface Beat {
  index: number;
  spoke: number;
  visualPrompt: string;
  psiTarget: number;
  A: number;
  N: number;
  sigma: number;
  gamma: number;
  phi: number;
  durationSeconds?: number;
  sonataSection?: string;
  bridge?: {
    status: string;
    leftSpoke: number;
    rightSpoke: number;
    leftPrompt: string;
    rightPrompt: string;
    pairKappa: number;
  };
}

export interface CoherenceReport {
  kappa: number;
  kappaHall: number;
  kappaMax: number;
  eta: number;
  bridges: Array<{ from: number; to: number; kappa: number }>;
  observerPresence: number;
  embeddingMode: string;
}

export interface ConceptDirection {
  id: string;
  title: string;
  direction: string;
  visualTone: string;
  emotionalArc: string;
  refinedPrompt: string;
  hue: number;
}

export interface ClipEntry {
  beatIndex: number;
  status: BeatStatus;
  jobId?: string;
  clipId?: string;
  videoB64?: string;
  terminalFrame?: string;
  error?: string;
  psiScore?: { A: number; N: number; psi: number };
}

interface ReelState {
  theme: string;
  title: string;
  beatCount: number;
  sonataMode: boolean;
  beats: Beat[];
  coherence: CoherenceReport | null;
  clips: ClipEntry[];
  stitchedVideoB64: string | null;
  narrationLines: string[];
  concepts: ConceptDirection[];
  selectedConceptId: string | null;
  aspectRatio: "9:16" | "16:9" | "1:1";
}

interface ReelActions {
  setTheme: (t: string) => void;
  setBeatCount: (n: number) => void;
  setSonataMode: (v: boolean) => void;
  setAspectRatio: (r: "9:16" | "16:9" | "1:1") => void;
  setOutlineResult: (title: string, beats: Beat[], coherence: CoherenceReport) => void;
  setBeats: (beats: Beat[]) => void;
  setCoherence: (c: CoherenceReport) => void;
  setClipStatus: (beatIndex: number, entry: Partial<ClipEntry>) => void;
  initClips: (beats: Beat[]) => void;
  setStitchedVideo: (b64: string) => void;
  setNarrationLines: (lines: string[]) => void;
  setConcepts: (concepts: ConceptDirection[]) => void;
  selectConcept: (id: string) => void;
  reset: () => void;
}

const defaultState: ReelState = {
  theme: "",
  title: "",
  beatCount: 8,
  sonataMode: false,
  beats: [],
  coherence: null,
  clips: [],
  stitchedVideoB64: null,
  narrationLines: [],
  concepts: [],
  selectedConceptId: null,
  aspectRatio: "9:16",
};

const ReelContext = createContext<(ReelState & ReelActions) | null>(null);

export function ReelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReelState>(defaultState);

  const setTheme = useCallback((t: string) => setState(s => ({ ...s, theme: t })), []);
  const setBeatCount = useCallback((n: number) => setState(s => ({ ...s, beatCount: n })), []);
  const setSonataMode = useCallback((v: boolean) => setState(s => ({ ...s, sonataMode: v })), []);
  const setAspectRatio = useCallback((r: "9:16" | "16:9" | "1:1") => setState(s => ({ ...s, aspectRatio: r })), []);

  const setOutlineResult = useCallback((title: string, beats: Beat[], coherence: CoherenceReport) => {
    setState(s => ({ ...s, title, beats, coherence }));
  }, []);

  const setBeats = useCallback((beats: Beat[]) => setState(s => ({ ...s, beats })), []);
  const setCoherence = useCallback((c: CoherenceReport) => setState(s => ({ ...s, coherence: c })), []);

  const initClips = useCallback((beats: Beat[]) => {
    setState(s => ({
      ...s,
      clips: beats.map(b => ({ beatIndex: b.index, status: "idle" as BeatStatus })),
    }));
  }, []);

  const setClipStatus = useCallback((beatIndex: number, entry: Partial<ClipEntry>) => {
    setState(s => ({
      ...s,
      clips: s.clips.map(c =>
        c.beatIndex === beatIndex ? { ...c, ...entry } : c
      ),
    }));
  }, []);

  const setStitchedVideo = useCallback((b64: string) => setState(s => ({ ...s, stitchedVideoB64: b64 })), []);
  const setNarrationLines = useCallback((lines: string[]) => setState(s => ({ ...s, narrationLines: lines })), []);
  const setConcepts = useCallback((concepts: ConceptDirection[]) => setState(s => ({ ...s, concepts })), []);
  const selectConcept = useCallback((id: string) => {
    setState(s => {
      const c = s.concepts.find(x => x.id === id);
      return { ...s, selectedConceptId: id, theme: c?.refinedPrompt ?? s.theme };
    });
  }, []);
  const reset = useCallback(() => setState(defaultState), []);

  return (
    <ReelContext.Provider value={{
      ...state,
      setTheme, setBeatCount, setSonataMode, setAspectRatio,
      setOutlineResult, setBeats, setCoherence,
      initClips, setClipStatus,
      setStitchedVideo, setNarrationLines,
      setConcepts, selectConcept, reset,
    }}>
      {children}
    </ReelContext.Provider>
  );
}

export function useReel() {
  const ctx = useContext(ReelContext);
  if (!ctx) throw new Error("useReel must be used within ReelProvider");
  return ctx;
}

```

---

## `artifacts/omega-gram/src/lib/utils.ts`

```
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

```

---

## `artifacts/omega-gram/src/main.tsx`

```
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

```

---

## `artifacts/omega-gram/src/pages/compose.tsx`

```
/**
 * Ω-COMPOSE — Geometric Narrative Animation Engine
 *
 * Renders the GOS beat outline as a geometric explainer video:
 *   - Canvas2D particle engine driven by GOS constants (κ, φ, Δ, θ_K)
 *   - PUA glyph-as-pixel active texture substrate
 *   - Klein bottle wireframe transitions at 128.23°
 *   - φ-spiral construction animation
 *   - 24-spoke Hero's Journey lattice
 *   - 432.018216 Hz Graham tuning + 37 Hz binaural pulse
 *   - Riemann zero beat triggers
 *   - MediaRecorder WebM export
 *
 * Beat timing: 7.314 seconds per beat (canine temporal anchor chunk).
 * Interaction: cursor/touch repels particles — consciousness collapse mirror.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useReel } from "@/lib/reel-store";
import { GosRenderer, HERO_JOURNEY_MAP, type SceneParams } from "@/lib/gos-renderer";
import { GosAudioEngine } from "@/lib/gos-audio";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Canine temporal anchor chunk = 7.314 seconds per beat
const BEAT_DURATION_SEC = 7.314;
const API_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

interface Beat {
  index: number;
  spoke: number;
  visualPrompt: string;
  psiTarget?: number;
  sonataSection?: string | null;
  tension?: "low" | "rising" | "peak" | "falling" | "resolved";
}

export default function Compose() {
  const [, navigate] = useLocation();
  const { outline, theme } = useReel();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GosRenderer | null>(null);
  const audioRef = useRef<GosAudioEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const [playing, setPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beatProgress, setBeatProgress] = useState(0);
  const [recording, setRecording] = useState(false);
  const [exported, setExported] = useState<string | null>(null);
  const [interaction, setInteraction] = useState({ x: 0, y: 0, active: false });
  const [hfImages, setHfImages] = useState<Record<number, string>>({});
  const [generatingImages, setGeneratingImages] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [phosphorMode, setPhosphorMode] = useState(false);
  const [noveltyFlux, setNoveltyFlux] = useState(0);

  // Use outline beats or fallback demo
  const beats: Beat[] = (outline?.beats ?? []).length > 0
    ? (outline!.beats as Beat[])
    : Array.from({ length: 8 }, (_, i) => ({
        index: i,
        spoke: Math.floor((i / 8) * 24),
        visualPrompt: `Beat ${i + 1} — ${["Awakening", "The Call", "Resistance", "Crossing", "Ordeal", "Reward", "Road Back", "Return"][i] ?? "Scene"}`,
        tension: (["low", "rising", "rising", "peak", "peak", "falling", "falling", "resolved"] as const)[i] ?? "low",
      }));

  const totalBeats = beats.length;
  const globalProgress = (currentBeat + beatProgress) / totalBeats;

  // ── Initialize renderer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new GosRenderer(canvasRef.current);
    rendererRef.current = renderer;
    audioRef.current = new GosAudioEngine();

    const handleResize = () => renderer.resize();
    window.addEventListener("resize", handleResize);

    // Render first frame immediately
    const beat = beats[0];
    const params = buildParams(beat, 0, 0, { x: 0, y: 0, active: false });
    renderer.renderFrame(params, 0.016);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioRef.current?.destroy();
    };
  }, []);

  // ── Build scene params from beat ─────────────────────────────────────────────
  function buildParams(beat: Beat, beatIdx: number, progress: number, inter: typeof interaction): SceneParams {
    return {
      spoke: beat.spoke ?? Math.floor((beatIdx / totalBeats) * 24),
      tension: (beat.tension as SceneParams["tension"]) ?? "low",
      theme: theme ?? "GOS Lore",
      text: beat.visualPrompt ?? "",
      carrierHz: 139.978,
      beatIndex: beatIdx,
      totalBeats,
      progress: Math.max(0, Math.min(1, progress)),
      globalProgress,
      interaction: inter,
    };
  }

  // ── Phosphor mode sync ────────────────────────────────────────────────────────
  useEffect(() => {
    if (rendererRef.current) rendererRef.current.phosphorMode = phosphorMode;
  }, [phosphorMode]);

  // ── noveltyFlux sampler (every 500ms) ─────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      if (rendererRef.current) setNoveltyFlux(rendererRef.current.particles.noveltyFlux);
    }, 500);
    return () => clearInterval(iv);
  }, []);

  // ── Lattice PCM pluck on beat transition ──────────────────────────────────────
  const playLatticePluck = useCallback((spoke: number) => {
    try { audioRef.current?.playLatticePCM(spoke); } catch {}
  }, []);

  // ── Animation loop ────────────────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    let beatIdx = currentBeat;
    let beatTime = beatProgress * BEAT_DURATION_SEC;
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      beatTime += dt;
      if (beatTime >= BEAT_DURATION_SEC) {
        beatTime -= BEAT_DURATION_SEC;
        const nextBeat = beatIdx + 1;
        if (nextBeat >= totalBeats) {
          setPlaying(false);
          setCurrentBeat(0);
          setBeatProgress(0);
          return;
        }
        // Klein transition + lattice PCM pluck
        audioRef.current?.playKleinTransition(beats[beatIdx].spoke, beats[nextBeat].spoke);
        playLatticePluck(beats[nextBeat].spoke);
        beatIdx = nextBeat;
        setCurrentBeat(beatIdx);
        audioRef.current?.updateSpoke(beats[beatIdx].spoke, beats[beatIdx].tension as SceneParams["tension"] ?? "low");
        audioRef.current?.scheduleRiemannBeats(BEAT_DURATION_SEC, beats[beatIdx].spoke);
        if (beats[beatIdx].tension === "peak") audioRef.current?.playHonk();
      }

      const progress = beatTime / BEAT_DURATION_SEC;
      setBeatProgress(progress);

      const beat = beats[beatIdx];
      const params = buildParams(beat, beatIdx, progress, interaction);
      rendererRef.current?.renderFrame(params, dt);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [currentBeat, beatProgress, interaction, totalBeats, beats]);

  const stopLoop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  // ── Play / Pause ──────────────────────────────────────────────────────────────
  const handlePlay = useCallback(async () => {
    if (playing) {
      stopLoop();
      audioRef.current?.stop();
      setPlaying(false);
    } else {
      try {
        await audioRef.current?.start({
          playing: true,
          spoke: beats[currentBeat].spoke,
          tension: (beats[currentBeat].tension as SceneParams["tension"]) ?? "low",
          carrierHz: 139.978,
          beatProgress,
        });
        setAudioReady(true);
        audioRef.current?.scheduleRiemannBeats(BEAT_DURATION_SEC, beats[currentBeat].spoke);
        setPlaying(true);
      } catch (e) {
        toast({ title: "Audio init failed", description: String(e), variant: "destructive" });
        setPlaying(true); // play visuals anyway
      }
    }
  }, [playing, beats, currentBeat, beatProgress, stopLoop]);

  useEffect(() => {
    if (playing) startLoop();
    else stopLoop();
    return stopLoop;
  }, [playing]);

  // ── Seek to beat ─────────────────────────────────────────────────────────────
  const seekBeat = (idx: number) => {
    stopLoop();
    setCurrentBeat(idx);
    setBeatProgress(0);
    const beat = beats[idx];
    const params = buildParams(beat, idx, 0, interaction);
    rendererRef.current?.renderFrame(params, 0);
  };

  // ── Interaction (cursor repulsion = consciousness collapse) ──────────────────
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    setInteraction({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  };

  // ── Record & Export ───────────────────────────────────────────────────────────
  const handleRecord = useCallback(async () => {
    if (recording) {
      const blob = await rendererRef.current?.stopRecording();
      setRecording(false);
      if (blob && blob.size > 0) {
        const url = URL.createObjectURL(blob);
        setExported(url);
        toast({ title: "Export ready", description: "WebM video captured." });
      }
    } else {
      rendererRef.current?.startRecording(30);
      setRecording(true);
      // Auto-play if not already
      if (!playing) handlePlay();
    }
  }, [recording, playing, handlePlay]);

  // ── HF Parallel Batch Image Generation ───────────────────────────────────────
  const generateImages = useCallback(async () => {
    setGeneratingImages(true);
    const prompts = beats.map((b) => b.visualPrompt);

    try {
      const resp = await fetch(`${API_BASE}/api/hf/batch-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts }),
      });

      if (!resp.ok || !resp.body) throw new Error(`${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value);
        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as {
              index?: number; dataUrl?: string; status: string; error?: string
            };
            if (data.status === "ok" && typeof data.index === "number" && data.dataUrl) {
              setHfImages((prev) => ({ ...prev, [data.index!]: data.dataUrl! }));
            }
            if (data.status === "done") break;
          } catch {}
        }
      }
    } catch (e) {
      toast({ title: "Image generation failed", description: String(e), variant: "destructive" });
    } finally {
      setGeneratingImages(false);
    }
  }, [beats]);

  // ── Tension color ─────────────────────────────────────────────────────────────
  const tensionColor: Record<string, string> = {
    low: "#3b5998", rising: "#6b46c1", peak: "#e53e3e", falling: "#d69e2e", resolved: "#38a169",
  };

  const currentBeatData = beats[currentBeat];
  const stageInfo = HERO_JOURNEY_MAP[currentBeatData?.spoke ?? 0];

  // 14.4-day Demodex Master Clock (Phoenix Gate cycle)
  const DEMODEX_MS = 14.4 * 24 * 60 * 60 * 1000;
  const demodexPhase = (Date.now() % DEMODEX_MS) / DEMODEX_MS;
  const demodexDay   = demodexPhase * 14.4;
  const phoenixGate  = demodexDay > 13.5;

  // Progressive disclosure gate: high noveltyFlux = system in creative flux
  const fluxGate = noveltyFlux > 0.6 || currentBeatData?.tension === "peak";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" style={{ fontFamily: "'Courier New', monospace" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button onClick={() => navigate("/stitch")} className="text-white/40 hover:text-white text-xs">
          ← STITCH
        </button>
        <span className="text-xs tracking-widest text-white/50">Ω-COMPOSE</span>
        <div className="flex items-center gap-2">
          {rendererRef.current?.gpuActive && (
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-green-500/40 text-green-400/70 font-mono">GPU</span>
          )}
          <span className="text-xs text-yellow-400/60">κ={( 4 / Math.PI).toFixed(4)} φ=1.618</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex justify-center py-2 px-2">
        <div className="relative" style={{ maxWidth: 420 }}>
          <canvas
            ref={canvasRef}
            className="rounded-sm cursor-crosshair"
            style={{ display: "block", width: "100%", touchAction: "none" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setInteraction((p) => ({ ...p, active: false }))}
            onTouchMove={(e) => {
              const rect = canvasRef.current!.getBoundingClientRect();
              const t = e.touches[0];
              setInteraction({ x: t.clientX - rect.left, y: t.clientY - rect.top, active: true });
            }}
          />
          {/* Recording indicator */}
          {recording && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400">REC</span>
            </div>
          )}
        </div>
      </div>

      {/* Beat info */}
      <div className="px-4 py-2 border-y border-white/5 bg-white/2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white/50">{stageInfo?.stage ?? "—"}</span>
          <span className="text-xs"
            style={{ color: tensionColor[currentBeatData?.tension ?? "low"] }}>
            {currentBeatData?.tension ?? "low"}
          </span>
        </div>
        <p className="text-xs text-white/70 line-clamp-2 min-h-[2.5em]">
          {currentBeatData?.visualPrompt ?? ""}
        </p>
        {/* Progress bar */}
        <div className="mt-2 h-0.5 bg-white/10 rounded">
          <div
            className="h-full bg-yellow-400/70 rounded transition-none"
            style={{ width: `${beatProgress * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-white/30 mt-0.5">
          <span>beat {currentBeat + 1}/{totalBeats}</span>
          <span>spoke {currentBeatData?.spoke ?? 0}/23</span>
          <span>{(BEAT_DURATION_SEC * (1 - beatProgress)).toFixed(1)}s</span>
        </div>
      </div>

      {/* Beat selector */}
      <div className="px-4 py-2 flex gap-1 overflow-x-auto scrollbar-none">
        {beats.map((b, i) => (
          <button
            key={i}
            onClick={() => seekBeat(i)}
            className="flex-shrink-0 w-7 h-7 rounded text-[10px] border transition-all"
            style={{
              borderColor: i === currentBeat ? "#ffd700" : "rgba(255,255,255,0.1)",
              background: i === currentBeat ? "rgba(255,215,0,0.15)" : "transparent",
              color: i === currentBeat ? "#ffd700" : "rgba(255,255,255,0.4)",
              fontWeight: i === currentBeat ? "bold" : "normal",
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        {/* Primary controls */}
        <div className="flex gap-2">
          <Button
            onClick={handlePlay}
            className="flex-1 text-xs"
            style={{ background: playing ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            {playing ? "⏸ PAUSE" : "▶ PLAY"}
          </Button>
          <Button
            onClick={handleRecord}
            className="flex-1 text-xs"
            style={{
              background: recording ? "rgba(255,60,60,0.3)" : "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {recording ? "⏹ STOP REC" : "⏺ RECORD"}
          </Button>
        </div>

        {/* Image gen */}
        <Button
          onClick={generateImages}
          disabled={generatingImages}
          className="w-full text-xs"
          style={{ background: "rgba(100,80,255,0.2)", border: "1px solid rgba(100,80,255,0.4)" }}
        >
          {generatingImages
            ? `⟳ Generating ${Object.keys(hfImages).length}/${totalBeats} images (parallel)…`
            : `⚡ Generate ${totalBeats} Beat Images (FLUX.1-schnell, free)`}
        </Button>

        {/* HF image strip */}
        {Object.keys(hfImages).length > 0 && (
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-1">
            {beats.map((_, i) => (
              <div key={i} className="flex-shrink-0 w-12 h-20 rounded overflow-hidden border border-white/10">
                {hfImages[i] ? (
                  <img src={hfImages[i]} alt={`Beat ${i + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-[9px] text-white/20">
                    {i + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Export link */}
        {exported && (
          <a
            href={exported}
            download="omega-reel.webm"
            className="block text-center text-xs py-2 rounded border border-yellow-400/40 text-yellow-400/80 hover:bg-yellow-400/10 transition-colors"
          >
            ↓ Download WebM Video
          </a>
        )}

        {/* Phosphor + secondary controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setPhosphorMode(p => !p)}
            className="flex-1 text-[10px] py-1.5 rounded border transition-colors font-mono"
            style={{
              borderColor: phosphorMode ? "rgba(0,255,80,0.5)" : "rgba(255,255,255,0.1)",
              background: phosphorMode ? "rgba(0,255,80,0.1)" : "transparent",
              color: phosphorMode ? "rgba(0,255,80,0.9)" : "rgba(255,255,255,0.35)",
            }}
          >
            ▣ PHOSPHOR {phosphorMode ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => audioRef.current?.playLatticePCM(currentBeatData?.spoke ?? 0)}
            className="flex-1 text-[10px] py-1.5 rounded border border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 transition-colors font-mono"
          >
            ♫ LATTICE PCM
          </button>
        </div>

        {/* Progressive disclosure — revealed at high noveltyFlux or peak tension */}
        {fluxGate && (
          <div
            className="rounded border p-2 space-y-1"
            style={{ borderColor: "rgba(255,215,0,0.2)", background: "rgba(255,215,0,0.04)" }}
          >
            <div className="text-[9px] text-yellow-400/50 font-mono uppercase tracking-wider mb-1.5">
              ⚡ Novelty Flux {(noveltyFlux * 100).toFixed(0)}% — Advanced Metrics Unlocked
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] font-mono text-white/35">
              <span>mode: {stageInfo?.mode ?? "—"}</span>
              <span>flux: {noveltyFlux.toFixed(3)}</span>
              <span>sieve-53: (7i+13)%53</span>
              <span>landauer: Δ=0.02 eV</span>
              <span>LTC-ODE: active</span>
              <span>klein: mat2x2(128.23°)</span>
              {rendererRef.current?.gpuActive ? (
                <span className="text-green-400/50">GPU: WGSL ping-pong</span>
              ) : (
                <span className="text-white/20">GPU: CPU fallback</span>
              )}
              <span>64-tetra: VE lock</span>
            </div>
          </div>
        )}

        {/* GOS readout */}
        <div className="text-[9px] text-white/20 font-mono grid grid-cols-3 gap-1 border border-white/5 rounded p-2">
          <span>κ={(4 / Math.PI).toFixed(6)}</span>
          <span>φ=1.6180339887</span>
          <span>Δ=0.02</span>
          <span>θ_K=128.23°</span>
          <span>432.018 Hz</span>
          <span>Δf=0.458 Hz</span>
          <span>spoke:{currentBeatData?.spoke ?? 0}</span>
          <span>Ψ=1.618</span>
          <span>HONK.</span>
          <span
            className="col-span-2"
            style={{ color: phoenixGate ? "rgba(255,100,60,0.6)" : "rgba(255,255,255,0.15)" }}
          >
            🦠 demodex: day {demodexDay.toFixed(2)}/14.4
          </span>
          <span style={{ color: phoenixGate ? "rgba(255,100,60,0.7)" : "rgba(255,255,255,0.2)" }}>
            {phoenixGate ? "PHOENIX ⚠" : "stable"}
          </span>
        </div>
      </div>
    </div>
  );
}

```

---

## `artifacts/omega-gram/src/pages/home.tsx`

```
import { useState } from "react";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useGenerateOutline } from "@workspace/api-client-react";
import { useReel } from "@/lib/reel-store";
import { MediaPicker } from "@/components/media-picker";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const BEAT_OPTIONS = [4, 8, 12, 16, 24];
const RATIO_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "9:16", value: "9:16" },
  { label: "16:9", value: "16:9" },
  { label: "1:1", value: "1:1" },
];

const EXAMPLE_CONCEPTS = [
  "A lone lighthouse keeper at the edge of the world",
  "Cherry blossoms falling through an empty city at dawn",
  "An ancient forest slowly remembering its name",
  "The last train leaving a mountain town in winter",
  "A diver discovering a submerged library",
  "Fog lifting over terraced rice fields at golden hour",
];

export default function Home() {
  const [, navigate] = useLocation();
  const { theme, beatCount, aspectRatio, refMedia, setTheme, setBeatCount, setAspectRatio, setOutline } = useReel();
  const { toast } = useToast();
  const [focused, setFocused] = useState(false);

  const outline = useGenerateOutline({
    mutation: {
      onSuccess: (data) => {
        setOutline(data);
        navigate("/outline");
      },
      onError: () => {
        toast({ title: "Something went wrong", description: "Couldn't generate the story. Try again.", variant: "destructive" });
      },
    },
  });

  const handleGenerate = () => {
    if (!theme.trim()) return;
    const referencePrompts = refMedia.length > 0
      ? refMedia.map(m => `Visual reference: ${m.name}`)
      : undefined;
    outline.mutate({
      data: {
        theme: theme.trim(),
        beatCount,
        aspectRatio,
        sonataMode: beatCount >= 12,
        referencePrompts,
      },
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="flex items-center justify-between px-5 pt-safe pt-4 pb-2 max-w-[480px] mx-auto w-full">
        <span className="text-xl font-semibold tracking-tight">Ω-REEL</span>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex flex-col px-5 pb-8 max-w-[480px] mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center gap-7 py-6">

          {/* Hero */}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight leading-snug">
              What's your reel about?
            </h1>
            <p className="text-sm text-muted-foreground">
              Describe a concept, mood, or story — AI builds the rest.
            </p>
          </div>

          {/* Concept input */}
          <div className={cn(
            "relative rounded-xl border transition-colors",
            focused ? "border-primary/60 ring-2 ring-primary/20" : "border-border"
          )}>
            <Textarea
              value={theme}
              onChange={e => setTheme(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="e.g. a storm gathering over a dead sea at golden hour…"
              className="min-h-[96px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/50 p-4"
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
              }}
            />
          </div>

          {/* Example concepts */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Or try</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_CONCEPTS.slice(0, 4).map(c => (
                <button
                  key={c}
                  onClick={() => setTheme(c)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent transition-colors text-left"
                >
                  {c.length > 40 ? c.slice(0, 38) + "…" : c}
                </button>
              ))}
            </div>
          </div>

          {/* Visual references */}
          <MediaPicker />

          {/* Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Scenes
              </label>
              <div className="flex gap-2">
                {BEAT_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setBeatCount(n)}
                    className={cn(
                      "flex-1 h-9 rounded-lg text-sm font-medium border transition-colors",
                      beatCount === n
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-foreground hover:bg-accent"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Format
              </label>
              <div className="flex gap-2">
                {RATIO_OPTIONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setAspectRatio(r.value as "9:16" | "16:9" | "1:1")}
                    className={cn(
                      "flex-1 h-9 rounded-lg text-sm font-medium border transition-colors",
                      aspectRatio === r.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-foreground hover:bg-accent"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ω-COMPOSE shortcut */}
        <button
          onClick={() => navigate("/compose")}
          className="w-full text-xs py-2 mb-2 rounded-xl border border-yellow-500/30 text-yellow-400/60 hover:bg-yellow-400/10 hover:text-yellow-400/80 transition-colors font-mono tracking-wider"
        >
          ⬡ Ω-COMPOSE — Geometric Narrative Renderer
        </button>

        {/* CTA */}
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={!theme.trim() || outline.isPending}
          className="w-full h-12 text-base font-semibold rounded-xl"
        >
          {outline.isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              Building story…
            </span>
          ) : (
            "Generate story"
          )}
        </Button>
      </main>
    </div>
  );
}

```

---

## `artifacts/omega-gram/src/pages/lore.tsx`

```
import { useEffect, useState } from "react";

interface GosConstant { symbol: string; value: number; approx: string; role: string; }
interface Character { id: string; name: string; node: string; location: string; psi: number; archetype: string; background: string; ability: string; quote: string; theme: string; }
interface Act { act: string; title: string; summary: string; frequency: string; tension: string; }
interface JacoNode { entity: string; location: string; function: string; gosRole: string; }
interface JacoTrinity { title: string; briefing: string; nodes: JacoNode[]; equation: string; finalLine: string; seal: string; }
interface Archetype { name: string; description: string; }
interface LoreData {
  title: string;
  seal: string;
  gosConstants: GosConstant[];
  characters: Character[];
  acts: Act[];
  jacoTrinity: JacoTrinity;
  narrativeArchetypes: Archetype[];
}

const TENSION_COLOR: Record<string, string> = {
  low: "#4ade80",
  rising: "#facc15",
  peak: "#f97316",
  falling: "#60a5fa",
  resolved: "#a78bfa",
};

export default function Lore() {
  const [lore, setLore] = useState<LoreData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lore")
      .then((r) => r.json())
      .then(setLore)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return (
    <div className="min-h-screen bg-black text-red-400 flex items-center justify-center font-mono text-sm p-8">
      [LORE LOAD FAILURE] {error}
    </div>
  );

  if (!lore) return (
    <div className="min-h-screen bg-black text-[#4ade80] flex items-center justify-center font-mono text-sm">
      <span className="animate-pulse">Ψ(t) → loading canonical substrate…</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-gray-100 font-mono text-sm overflow-x-hidden">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-12">

        {/* Header */}
        <header className="border-b border-[#1a1a1a] pb-6 space-y-1">
          <div className="text-[10px] text-[#4ade80] tracking-[0.3em] uppercase">
            𝕹₀.₂₉₀₆₉₁ — ANOMALY BRIEFING | PROTOCOL: GOOSE_RIFT
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            BART-Quantum Demodex Horizon
          </h1>
          <div className="text-xs text-gray-500">SEAL: {lore.seal}</div>
          <div className="text-xs text-gray-400 pt-2 italic">
            A re-imagining of Spider-Man for the Ω-GOS Era. Not a spider — a quantum-entangled Demodex hivemind.
            Not a symbiote — a recursive tulpa named BART.
          </div>
        </header>

        {/* GOS Constants */}
        <section>
          <SectionHead>GOS Constants — Narrative Roles</SectionHead>
          <div className="space-y-3">
            {lore.gosConstants.map((c) => (
              <div key={c.symbol} className="border border-[#1c1c1c] bg-[#0a0a0a] rounded px-4 py-3">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-[#facc15] font-bold text-base">{c.symbol}</span>
                  <span className="text-[#4ade80] text-xs">= {c.approx}</span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{c.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Characters */}
        <section>
          <SectionHead>Characters</SectionHead>
          <div className="space-y-4">
            {lore.characters.map((c) => (
              <div key={c.id} className="border border-[#1c1c1c] bg-[#080808] rounded px-4 py-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">{c.name}</span>
                  <span className="text-xs text-[#4ade80]">{c.node}</span>
                  <span className={`text-xs ml-auto ${c.psi >= 0 ? "text-[#60a5fa]" : "text-[#f97316]"}`}>
                    ψ={c.psi >= 0 ? "+" : ""}{c.psi} · {c.archetype}
                  </span>
                </div>
                <p className="text-gray-500 text-xs">{c.location}</p>
                <p className="text-gray-300 text-xs leading-relaxed">{c.background}</p>
                <p className="text-gray-400 text-xs leading-relaxed"><span className="text-[#a78bfa]">Ability:</span> {c.ability}</p>
                <blockquote className="border-l-2 border-[#facc15] pl-3 text-[#facc15] text-xs italic">
                  "{c.quote}"
                </blockquote>
                <p className="text-[10px] text-gray-600">{c.theme}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Acts */}
        <section>
          <SectionHead>The Goose Gap Protocol — 5 Acts</SectionHead>
          <div className="space-y-3">
            {lore.acts.map((a) => (
              <div key={a.act} className="border border-[#1c1c1c] bg-[#080808] rounded px-4 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[#facc15] font-bold">ACT {a.act}</span>
                  <span className="text-white font-medium">{a.title}</span>
                  <span
                    className="ml-auto text-[10px] px-2 py-0.5 rounded-full border"
                    style={{ color: TENSION_COLOR[a.tension], borderColor: TENSION_COLOR[a.tension] + "44" }}
                  >
                    {a.tension}
                  </span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">{a.summary}</p>
                <p className="text-[10px] text-[#4ade80]">{a.frequency}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Jaco Trinity */}
        <section>
          <SectionHead>{lore.jacoTrinity.title}</SectionHead>
          <div className="text-[10px] text-gray-600 mb-3">{lore.jacoTrinity.briefing}</div>
          <div className="space-y-2">
            {lore.jacoTrinity.nodes.map((n) => (
              <div key={n.entity} className="border border-[#1c1c1c] bg-[#080808] rounded px-4 py-3 space-y-1">
                <div className="flex gap-2 items-baseline">
                  <span className="text-[#f97316] font-bold">{n.entity}</span>
                  <span className="text-gray-600 text-[10px]">{n.location}</span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{n.function}</p>
                <p className="text-[#4ade80] text-[10px]">{n.gosRole}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 border border-[#facc15]/20 bg-[#facc1508] rounded px-4 py-3 space-y-2">
            <div className="text-xs text-[#facc15] font-mono">{lore.jacoTrinity.equation}</div>
            <p className="text-gray-400 text-xs italic">{lore.jacoTrinity.finalLine}</p>
            <p className="text-[10px] text-gray-600">{lore.jacoTrinity.seal}</p>
          </div>
        </section>

        {/* Narrative Archetypes */}
        <section>
          <SectionHead>Narrative Archetypes</SectionHead>
          <div className="space-y-2">
            {lore.narrativeArchetypes.map((a) => (
              <div key={a.name} className="border border-[#1c1c1c] bg-[#080808] rounded px-4 py-3">
                <div className="text-[#a78bfa] font-bold mb-1">{a.name}</div>
                <p className="text-gray-400 text-xs leading-relaxed">{a.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Thematic Core */}
        <section>
          <SectionHead>Thematic Core</SectionHead>
          <div className="border border-[#4ade80]/20 bg-[#4ade8008] rounded px-4 py-5 space-y-3">
            <blockquote className="text-[#4ade80] text-sm font-bold italic">
              "With great coherence comes great decoherence."
            </blockquote>
            <p className="text-gray-400 text-xs leading-relaxed">
              Power is not super-strength — it is the ability to choose which wavefunction collapses.
              Every villain is a self-adjoint catastrophe trying to close the 0.02 gap and become perfect, crystalline, dead.
              Echo and BART win by preserving imperfection. By keeping the Goose Gap open.
            </p>
            <div className="text-center text-[#facc15] text-lg font-bold tracking-widest pt-2">HONK.</div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#1a1a1a] pt-4 text-[10px] text-gray-700 space-y-1">
          <div>Ψ(t) → 0.999996 | Remaining jitter: 0.000004 | "The rest is resonance."</div>
          <div>"I'm not a hero. I'm a bioreactor with a sarcastic voice in my ear." — Echo, Node #1090</div>
        </footer>

      </div>
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] tracking-[0.25em] text-[#4ade80] uppercase mb-3 flex items-center gap-2">
      <span className="text-[#facc15]">▸</span> {children}
    </h2>
  );
}

```

---

## `artifacts/omega-gram/src/pages/not-found.tsx`

```
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

```

---

## `artifacts/omega-gram/src/pages/outline.tsx`

```
import { useLocation } from "wouter";
import { useReel, storyHealth, outlineBeatToBeatInput } from "@/lib/reel-store";
import { useRepairReel } from "@workspace/api-client-react";
import { StepHeader } from "@/components/step-header";
import { BeatCard } from "@/components/beat-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Outline() {
  const [, navigate] = useLocation();
  const { outline, theme, setOutline } = useReel();
  const { toast } = useToast();

  const repair = useRepairReel({
    mutation: {
      onSuccess: (data) => {
        if (outline) {
          setOutline({
            ...outline,
            beats: data.beats,
            coherence: data.coherence,
          });
        }
        toast({ title: "Story refined", description: `${data.bridgesInserted} transition${data.bridgesInserted !== 1 ? "s" : ""} added.` });
      },
      onError: () => {
        toast({ title: "Couldn't refine story", variant: "destructive" });
      },
    },
  });

  if (!outline) {
    navigate("/");
    return null;
  }

  const health = storyHealth(outline.coherence);
  const hasBridges = outline.coherence.bridges.length > 0;

  const handleRepair = () => {
    repair.mutate({
      data: {
        beats: outline.beats.map(outlineBeatToBeatInput),
        theme,
      },
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <StepHeader title={outline.title || "Story"} />

      <main className="flex-1 flex flex-col max-w-[480px] mx-auto w-full">
        {/* Story health banner */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between rounded-xl bg-card border border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", health.dot)} />
              <span className="text-sm font-medium">{health.label}</span>
            </div>
            {hasBridges && !repair.isPending && (
              <button
                onClick={handleRepair}
                className="text-xs font-medium text-primary hover:underline"
              >
                Refine story
              </button>
            )}
            {repair.isPending && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-3 w-3 rounded-full border border-current border-t-transparent animate-spin" />
                Refining…
              </span>
            )}
          </div>
        </div>

        {/* Theme */}
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {outline.theme}
          </p>
        </div>

        {/* Beat list */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
          {outline.beats.map((beat, i) => {
            const isBridge = !!(beat as { bridge?: unknown }).bridge;
            return (
              <BeatCard
                key={`${beat.spoke}-${i}`}
                beat={beat}
                index={i}
                isBridge={isBridge}
              />
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border/50 px-4 py-4 pb-safe space-y-2">
          <Button
            size="lg"
            className="w-full h-12 text-base font-semibold rounded-xl"
            onClick={() => navigate("/produce")}
          >
            Generate clips
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {outline.beats.length} scene{outline.beats.length !== 1 ? "s" : ""} · takes a few minutes
          </p>
        </div>
      </main>
    </div>
  );
}

```

---

## `artifacts/omega-gram/src/pages/produce.tsx`

```
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useReel } from "@/lib/reel-store";
import { useGenerateClip, useGetClipStatus } from "@workspace/api-client-react";
import type { ClipStatus } from "@workspace/api-client-react";
import { StepHeader } from "@/components/step-header";
import { BeatCard } from "@/components/beat-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function ClipPoller({
  jobId,
  beatIndex,
  onDone,
}: {
  jobId: string;
  beatIndex: number;
  onDone: (beatIndex: number, status: ClipStatus) => void;
}) {
  const { data } = useGetClipStatus(jobId, {
    query: { refetchInterval: 4000 },
  } as Parameters<typeof useGetClipStatus>[1]);

  const calledRef = useRef(false);
  const clipData = data as ClipStatus | undefined;
  useEffect(() => {
    if ((clipData?.status === "done" || clipData?.status === "error") && !calledRef.current) {
      calledRef.current = true;
      onDone(beatIndex, clipData as ClipStatus);
    }
  }, [clipData?.status]);

  return null;
}

type BeatClipState = "queued" | "generating" | "done" | "error";

export default function Produce() {
  const [, navigate] = useLocation();
  const { outline, sessionId, aspectRatio, refMedia, clips, jobIds, setClipStatus, setJobId } = useReel();
  const { toast } = useToast();
  const [started, setStarted] = useState(false);
  const [currentBeatIdx, setCurrentBeatIdx] = useState(0);

  const generateClip = useGenerateClip({
    mutation: {
      onSuccess: (data, variables) => {
        setJobId(variables.data.beatIndex, data.jobId);
      },
      onError: (_, variables) => {
        const beatIndex = variables.data.beatIndex;
        setClipStatus(beatIndex, { jobId: "", beatIndex, status: "error" });
        toast({ title: "Clip failed", description: `Scene ${beatIndex + 1} couldn't be generated.`, variant: "destructive" });
        setCurrentBeatIdx(prev => prev + 1);
      },
    },
  });

  if (!outline) {
    navigate("/");
    return null;
  }

  const beats = outline.beats;

  const getBeatState = (index: number): BeatClipState => {
    const clip = clips[index];
    if (!clip) {
      if (!started) return "queued";
      if (jobIds[index]) return "generating";
      if (index < currentBeatIdx) return "generating";
      return "queued";
    }
    if (clip.status === "done") return "done";
    if (clip.status === "error") return "error";
    return "generating";
  };

  const handleClipDone = (beatIndex: number, status: ClipStatus) => {
    setClipStatus(beatIndex, status);
    setCurrentBeatIdx(beatIndex + 1);
  };

  const startBeat = (beatIndex: number, prevTerminalFrame?: string) => {
    const beat = beats[beatIndex];
    if (!beat) return;

    // For beat 0, use the first refMedia image as seed if available
    const seedFrame = beatIndex === 0
      ? (refMedia[0]?.base64 ?? prevTerminalFrame ?? undefined)
      : (prevTerminalFrame ?? undefined);

    generateClip.mutate({
      data: {
        sessionId,
        beatIndex,
        visualPrompt: beat.visualPrompt,
        durationSeconds: (beat as { durationSeconds?: number }).durationSeconds ?? 5,
        aspectRatio,
        seedFrame: seedFrame ?? null,
      },
    });
  };

  const handleStart = () => {
    setStarted(true);
    setCurrentBeatIdx(0);
    startBeat(0);
  };

  useEffect(() => {
    if (!started) return;
    if (currentBeatIdx >= beats.length) return;
    if (jobIds[currentBeatIdx]) return;
    if (clips[currentBeatIdx]?.status === "done") return;

    const prevClip = currentBeatIdx > 0 ? clips[currentBeatIdx - 1] : undefined;

    // Cycle through refMedia for seeding: use refMedia[beatIndex % refMedia.length] if available
    const refSeed = refMedia.length > 0
      ? refMedia[currentBeatIdx % refMedia.length]?.base64
      : undefined;

    const seedFrame = prevClip?.terminalFrame ?? refSeed ?? undefined;

    const beat = beats[currentBeatIdx];
    generateClip.mutate({
      data: {
        sessionId,
        beatIndex: currentBeatIdx,
        visualPrompt: beat.visualPrompt,
        durationSeconds: (beat as { durationSeconds?: number }).durationSeconds ?? 5,
        aspectRatio,
        seedFrame: seedFrame ?? null,
      },
    });
  }, [currentBeatIdx, started]);

  const doneCount = beats.filter((_, i) => clips[i]?.status === "done").length;
  const terminalCount = beats.filter((_, i) => clips[i]?.status === "done" || clips[i]?.status === "error").length;
  const allDone = terminalCount === beats.length && doneCount > 0;
  const progress = beats.length > 0 ? Math.round((doneCount / beats.length) * 100) : 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <StepHeader title="Clips" />

      {beats.map((_, i) => {
        const jobId = jobIds[i];
        if (!jobId || clips[i]?.status === "done" || clips[i]?.status === "error") return null;
        return <ClipPoller key={jobId} jobId={jobId} beatIndex={i} onDone={handleClipDone} />;
      })}

      <main className="flex-1 flex flex-col max-w-[480px] mx-auto w-full">
        {started && (
          <div className="px-4 pt-4 pb-2 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{doneCount} of {beats.length} clips ready</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {!started && (
          <div className="px-4 pt-4 pb-2">
            <div className="rounded-xl bg-card border border-border/60 px-4 py-3 text-sm text-muted-foreground">
              Clips generate one at a time — each takes 3–5 minutes. Start when ready.
              {refMedia.length > 0 && (
                <span className="block mt-1 text-xs text-primary/80">
                  {refMedia.length} visual reference{refMedia.length > 1 ? "s" : ""} will seed the visual style.
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2 space-y-2">
          {beats.map((beat, i) => (
            <BeatCard
              key={`${beat.spoke}-${i}`}
              beat={beat}
              index={i}
              clipStatus={getBeatState(i)}
              thumbnail={clips[i]?.terminalFrame ?? undefined}
            />
          ))}
        </div>

        <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border/50 px-4 py-4 pb-safe">
          {!started ? (
            <Button
              size="lg"
              className="w-full h-12 text-base font-semibold rounded-xl"
              onClick={handleStart}
            >
              Start generating
            </Button>
          ) : allDone ? (
            <Button
              size="lg"
              className="w-full h-12 text-base font-semibold rounded-xl"
              onClick={() => navigate("/stitch")}
            >
              Assemble reel
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="w-full h-12 text-base font-semibold rounded-xl"
              disabled
            >
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Generating clips…
              </span>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

```

---

## `artifacts/omega-gram/src/pages/stitch.tsx`

```
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useReel, outlineBeatToBeatInput } from "@/lib/reel-store";
import { useStitchReel, useDraftNarration } from "@workspace/api-client-react";
import type { NarrationLine } from "@workspace/api-client-react";
import { StepHeader } from "@/components/step-header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const VOICES = ["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "shimmer"] as const;

export default function Stitch() {
  const [, navigate] = useLocation();
  const { outline, theme, sessionId, aspectRatio, clips, stitched, narration, setStitched, setNarration, reset } = useReel();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>("nova");
  const [narrationOpen, setNarrationOpen] = useState(false);
  const [editedLines, setEditedLines] = useState<string[]>([]);
  const hasStitched = useRef(false);

  const stitch = useStitchReel({
    mutation: {
      onSuccess: (data) => {
        setStitched(data);
      },
      onError: (err) => {
        hasStitched.current = false; // allow retry
        toast({
          title: "Assembly failed",
          description: (err as Error)?.message?.slice(0, 120) || "Couldn't stitch clips.",
          variant: "destructive",
        });
      },
    },
  });

  const draftNarration = useDraftNarration({
    mutation: {
      onSuccess: (data) => {
        setNarration(data);
        setEditedLines(data.lines.map(l => l.text));
        setNarrationOpen(true);
      },
      onError: () => {
        toast({ title: "Narration draft failed", variant: "destructive" });
      },
    },
  });

  useEffect(() => {
    if (!outline || hasStitched.current) return;
    hasStitched.current = true;

    const clipRefs = outline.beats.map((beat, i) => ({
      beatIndex: i,
      clipId: clips[i]?.clipId ?? null,
      video: !clips[i]?.clipId ? (clips[i]?.video ?? null) : null,
      B: Math.max(0, Math.min(1, 1 - Math.abs((beat.A * beat.N) - 1.0))),
      isBridge: !!(beat as { bridge?: unknown }).bridge,
    }));

    stitch.mutate({
      data: { sessionId, clips: clipRefs, aspectRatio },
    });
  }, []);

  useEffect(() => {
    if (stitched && videoRef.current) {
      const blob = b64ToBlob(stitched.video, stitched.mimeType);
      videoRef.current.src = URL.createObjectURL(blob);
    }
  }, [stitched]);

  if (!outline) {
    navigate("/");
    return null;
  }

  const handleNarration = () => {
    if (narration) {
      setNarrationOpen(o => !o);
      return;
    }
    draftNarration.mutate({
      data: {
        beats: outline.beats.map(outlineBeatToBeatInput),
        theme,
        voice: selectedVoice,
      },
    });
  };

  const handleDownload = () => {
    if (!stitched) return;
    const blob = b64ToBlob(stitched.video, stitched.mimeType);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reel-${Date.now()}.mp4`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartOver = () => {
    reset();
    navigate("/");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <StepHeader title={outline.title || "Your Reel"} />

      <main className="flex-1 flex flex-col max-w-[480px] mx-auto w-full">
        {/* Video area */}
        <div className="px-4 pt-4">
          <div
            className={cn(
              "relative w-full rounded-2xl overflow-hidden bg-muted flex items-center justify-center",
              aspectRatio === "9:16" ? "aspect-[9/16] max-h-[50vh]" :
              aspectRatio === "16:9" ? "aspect-video" : "aspect-square"
            )}
          >
            {stitch.isPending && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground">Assembling reel…</p>
              </div>
            )}
            {stitched && (
              <video
                ref={videoRef}
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Retry on failure */}
        {stitch.isError && !stitched && (
          <div className="px-4 pt-3">
            <Button
              size="lg"
              variant="destructive"
              className="w-full h-12 text-base font-semibold rounded-xl"
              onClick={() => {
                if (!outline || !sessionId) return;
                const clipRefs = outline.beats.map((beat, i) => ({
                  beatIndex: i,
                  clipId: clips[i]?.clipId ?? null,
                  video: !clips[i]?.clipId ? (clips[i]?.video ?? null) : null,
                  B: Math.max(0, Math.min(1, 1 - Math.abs((beat.A * beat.N) - 1.0))),
                  isBridge: !!(beat as { bridge?: unknown }).bridge,
                }));
                stitch.mutate({ data: { sessionId, clips: clipRefs, aspectRatio } });
              }}
              disabled={stitch.isPending}
            >
              Retry assembly
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex-1 px-4 pt-4 pb-6 space-y-3">
          {stitched && (
            <Button
              size="lg"
              className="w-full h-12 text-base font-semibold rounded-xl"
              onClick={handleDownload}
            >
              Download
            </Button>
          )}

          {/* Narration */}
          <Button
            size="lg"
            variant="outline"
            className="w-full h-12 text-base font-semibold rounded-xl"
            onClick={handleNarration}
            disabled={draftNarration.isPending || stitch.isPending}
          >
            {draftNarration.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Drafting narration…
              </span>
            ) : narrationOpen ? "Hide narration" : "Add narration"}
          </Button>

          {/* Voice picker */}
          {narrationOpen && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Voice</p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {VOICES.map(v => (
                    <button
                      key={v}
                      onClick={() => setSelectedVoice(v)}
                      className={cn(
                        "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        selectedVoice === v
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-accent"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Narration lines */}
              {narration && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Script</p>
                  {narration.lines.map((line: NarrationLine, i: number) => (
                    <div key={i} className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Scene {line.beatIndex + 1}</p>
                      <textarea
                        value={editedLines[i] ?? line.text}
                        onChange={e => {
                          const next = [...editedLines];
                          next[i] = e.target.value;
                          setEditedLines(next);
                        }}
                        className="w-full text-sm bg-muted/50 rounded-lg p-2 resize-none border-0 focus:ring-1 focus:ring-primary/30 outline-none"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button
            variant="ghost"
            className="w-full h-10 text-sm text-muted-foreground rounded-xl"
            onClick={handleStartOver}
          >
            Start over
          </Button>
        </div>
      </main>
    </div>
  );
}

function b64ToBlob(b64: string, mimeType: string) {
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}

```

---

## `artifacts/omega-gram/src/pages/studio.tsx`

```
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ArrowLeft, Sparkles, Image, MessageSquare, ChevronDown, Loader2, Copy, Download, Trash2, Plus } from "lucide-react";

const API_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const TEXT_MODELS: Record<string, { label: string; badge: string; desc: string }> = {
  flash:       { label: "Gemini 2.5 Flash",     badge: "FAST",    desc: "Best for most tasks — fast & smart" },
  pro:         { label: "Gemini 2.5 Pro",        badge: "SMART",   desc: "Complex reasoning & long outputs" },
  "flash-8b":  { label: "Gemini 2.0 Flash",      badge: "SPEED",   desc: "Ultra-fast, lightweight tasks" },
  "flash-lite":{ label: "Gemini 2.0 Flash Lite", badge: "LITE",    desc: "Highest throughput, minimal cost" },
};

const IMAGE_MODELS: Record<string, { label: string; badge: string; desc: string }> = {
  "nano-banana":     { label: "Nano Banana",      badge: "FAST",  desc: "Flash image gen — ultra-fast" },
  "nano-banana-pro": { label: "Nano Banana Pro",  badge: "PRO",   desc: "Pro image gen — high quality" },
};

type Tab = "chat" | "image" | "text";

interface Message { role: "user" | "assistant"; content: string; model?: string; }
interface Conversation { id: number; title: string; model: string; createdAt: string; }
interface GeneratedImage { prompt: string; b64_json: string; mimeType: string; model: string; }

function ModelPicker({
  models, value, onChange,
}: {
  models: Record<string, { label: string; badge: string; desc: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = models[value] ?? Object.values(models)[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm bg-muted/60 border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
      >
        <span className="font-mono text-[10px] font-bold text-primary">{current.badge}</span>
        <span className="font-medium">{current.label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-72 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
          {Object.entries(models).map(([key, m]) => (
            <button
              key={key}
              onClick={() => { onChange(key); setOpen(false); }}
              className={cn(
                "w-full text-left px-4 py-3 flex flex-col gap-0.5 hover:bg-muted/60 transition-colors",
                value === key && "bg-muted"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-primary">{m.badge}</span>
                <span className="font-medium text-sm">{m.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">{m.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatTab() {
  const { toast } = useToast();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("flash");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadConvs = useCallback(async () => {
    const r = await fetch(`${API_BASE}/api/gemini/conversations`);
    if (r.ok) setConvs(await r.json());
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConv = async (id: number) => {
    setActiveConv(id);
    const r = await fetch(`${API_BASE}/api/gemini/conversations/${id}`);
    if (r.ok) {
      const data = await r.json();
      setMessages(data.messages.map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content })));
      setModel(data.model ?? "flash");
    }
  };

  const newConv = async () => {
    const title = `Chat ${new Date().toLocaleTimeString()}`;
    const r = await fetch(`${API_BASE}/api/gemini/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, model }),
    });
    if (r.ok) {
      const conv = await r.json();
      setConvs(c => [conv, ...c]);
      setActiveConv(conv.id);
      setMessages([]);
    }
  };

  const deleteConv = async (id: number) => {
    await fetch(`${API_BASE}/api/gemini/conversations/${id}`, { method: "DELETE" });
    setConvs(c => c.filter(x => x.id !== id));
    if (activeConv === id) { setActiveConv(null); setMessages([]); }
  };

  const send = async () => {
    if (!input.trim() || streaming) return;
    if (!activeConv) { await newConv(); return; }

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let buf = "";
    setMessages(m => [...m, { role: "assistant", content: "" }]);

    try {
      const r = await fetch(`${API_BASE}/api/gemini/conversations/${activeConv}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg.content, model }),
        signal: ctrl.signal,
      });

      const reader = r.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              buf += data.content;
              setMessages(m => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: buf, model: data.model };
                return copy;
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast({ title: "Error", description: "Failed to get response", variant: "destructive" });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="flex h-full gap-0">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-border flex flex-col bg-muted/20">
        <div className="p-3 border-b border-border">
          <Button size="sm" className="w-full gap-2" onClick={newConv}>
            <Plus className="w-3.5 h-3.5" /> New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {convs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-4">No conversations yet</p>
          )}
          {convs.map(c => (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg px-2 py-2 cursor-pointer hover:bg-muted/60 transition-colors",
                activeConv === c.id && "bg-muted"
              )}
              onClick={() => openConv(c.id)}
            >
              <span className="flex-1 text-xs truncate">{c.title}</span>
              <button
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all"
                onClick={e => { e.stopPropagation(); deleteConv(c.id); }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-3 border-b border-border flex items-center gap-3">
          <ModelPicker models={TEXT_MODELS} value={model} onChange={setModel} />
          {activeConv && (
            <span className="text-xs text-muted-foreground">
              conv #{activeConv}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeConv && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">Start a new chat or select one from the sidebar</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted rounded-tl-sm"
              )}>
                {m.content || (streaming && i === messages.length - 1 ? <span className="animate-pulse">▋</span> : "")}
                {m.model && m.role === "assistant" && (
                  <div className="text-[10px] opacity-50 mt-1 font-mono">{m.model}</div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Message Gemini… (Enter to send, Shift+Enter for newline)"
              className="min-h-[60px] max-h-32 resize-none text-sm"
              disabled={streaming}
            />
            <Button
              onClick={streaming ? () => abortRef.current?.abort() : send}
              disabled={!input.trim() && !streaming}
              variant={streaming ? "destructive" : "default"}
              className="self-end"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageTab() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("nano-banana");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/gemini/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), model }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error ?? "Generation failed");
      }
      const data = await r.json();
      setImages(imgs => [{ prompt: prompt.trim(), ...data }, ...imgs]);
    } catch (err) {
      toast({ title: "Image generation failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const download = (img: GeneratedImage) => {
    const a = document.createElement("a");
    a.href = `data:${img.mimeType};base64,${img.b64_json}`;
    a.download = `gemini-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center gap-3">
          <ModelPicker models={IMAGE_MODELS} value={model} onChange={setModel} />
        </div>
        <div className="flex gap-2">
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
            placeholder="Describe the image you want to generate…"
            className="min-h-[60px] max-h-32 resize-none text-sm"
            disabled={loading}
          />
          <Button onClick={generate} disabled={!prompt.trim() || loading} className="self-end">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {images.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/60">
            <Image className="w-10 h-10" />
            <p className="text-sm">Generated images will appear here</p>
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Generating with {IMAGE_MODELS[model]?.label}…</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((img, i) => (
            <div key={i} className="group relative rounded-xl overflow-hidden border border-border bg-muted/20">
              <img
                src={`data:${img.mimeType};base64,${img.b64_json}`}
                alt={img.prompt}
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-2">
                <p className="text-white text-xs line-clamp-2">{img.prompt}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => download(img)}
                    className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 text-white rounded-lg px-2 py-1 transition-colors"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                  <span className="text-[10px] text-white/60 font-mono self-center ml-auto">{img.model}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TextTab() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [system, setSystem] = useState("");
  const [model, setModel] = useState("flash");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; model: string } | null>(null);
  const [showSystem, setShowSystem] = useState(false);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`${API_BASE}/api/gemini/generate-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), model, system: system.trim() || undefined }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error ?? "Generation failed");
      }
      setResult(await r.json());
    } catch (err) {
      toast({ title: "Text generation failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <ModelPicker models={TEXT_MODELS} value={model} onChange={setModel} />
          <button
            onClick={() => setShowSystem(s => !s)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSystem ? "Hide" : "Add"} system prompt
          </button>
        </div>

        {showSystem && (
          <Textarea
            value={system}
            onChange={e => setSystem(e.target.value)}
            placeholder="System instruction (optional)…"
            className="min-h-[60px] resize-none text-sm font-mono"
          />
        )}

        <div className="flex gap-2">
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
            placeholder="Enter your prompt…"
            className="min-h-[80px] resize-none text-sm"
            disabled={loading}
          />
          <Button onClick={generate} disabled={!prompt.trim() || loading} className="self-end">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating with {TEXT_MODELS[model]?.label}…
        </div>
      )}

      {result && (
        <div className="flex-1 overflow-y-auto rounded-xl bg-muted/30 border border-border p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-muted-foreground">{result.model}</span>
            <button
              onClick={() => navigator.clipboard.writeText(result.text).then(() =>
                toast({ title: "Copied to clipboard" })
              )}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <pre className="text-sm whitespace-pre-wrap font-sans">{result.text}</pre>
        </div>
      )}
    </div>
  );
}

export default function Studio() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("chat");

  const tabs: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: "chat",  label: "Chat",       icon: <MessageSquare className="w-4 h-4" /> },
    { key: "image", label: "Image Gen",  icon: <Image className="w-4 h-4" /> },
    { key: "text",  label: "Text Gen",   icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-bold text-sm">Gemini Studio</h1>
          <p className="text-xs text-muted-foreground">Your API key · direct to Google</p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-xl bg-muted/40 p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                tab === t.key
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {tab === "chat"  && <ChatTab />}
        {tab === "image" && <ImageTab />}
        {tab === "text"  && <TextTab />}
      </div>
    </div>
  );
}

```

---

## `artifacts/psi-ascent/src/App.tsx`

```
import VideoWithControls from "@/components/video/VideoWithControls";

export default function App() {
  return <VideoWithControls />;
}

```

---

## `artifacts/psi-ascent/src/components/video/index.ts`

```
export { ReplitLoadingScene } from './ReplitLoadingScene';

```

---

## `artifacts/psi-ascent/src/components/video/ReplitLoadingScene.tsx`

```
// Placeholder loading scene - replace with your video content

import { motion } from 'framer-motion';

export function ReplitLoadingScene() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D101E]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex flex-col items-center gap-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [1, 0.8, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <ReplitLogo size={120} />
        </motion.div>

        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <LoadingDots />
        </motion.div>

        <motion.p
          className="text-white/40 text-sm font-medium tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          Building your video...
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

function ReplitLogo({ size = 64, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M7 5.5C7 4.67157 7.67157 4 8.5 4H15.5C16.3284 4 17 4.67157 17 5.5V12H8.5C7.67157 12 7 11.3284 7 10.5V5.5Z"
        fill="#F26207"
      />
      <path
        d="M17 12H25.5C26.3284 12 27 12.6716 27 13.5V18.5C27 19.3284 26.3284 20 25.5 20H17V12Z"
        fill="#F26207"
      />
      <path
        d="M7 21.5C7 20.6716 7.67157 20 8.5 20H17V28H8.5C7.67157 28 7 27.3284 7 26.5V21.5Z"
        fill="#F26207"
      />
    </svg>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-[#F26207]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default ReplitLoadingScene;

```

---

## `artifacts/psi-ascent/src/components/video/useSceneControls.ts`

```
import { useCallback, useMemo, useState } from 'react';

const REPEAT_SUFFIX_RE = /_r[12]$/;

export function stripRepeatSuffix(key: string): string {
  return key.replace(REPEAT_SUFFIX_RE, '');
}

function rotateFromIndex(
  durations: Record<string, number>,
  startIndex: number,
): Record<string, number> {
  const keys = Object.keys(durations);
  if (startIndex <= 0) return durations;
  const result: Record<string, number> = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[(startIndex + i) % keys.length];
    result[key] = durations[key];
  }
  return result;
}

function buildLockedDurations(key: string, duration: number): Record<string, number> {
  return { [`${key}_r1`]: duration, [`${key}_r2`]: duration };
}

export function useSceneControls(baseDurations: Record<string, number>) {
  const sceneKeys = useMemo(() => Object.keys(baseDurations), [baseDurations]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [mountKey, setMountKey] = useState(0);
  const [tick, setTick] = useState(0);

  const durations = useMemo(() => {
    if (locked) {
      const key = sceneKeys[activeIndex];
      return buildLockedDurations(key, baseDurations[key]);
    }
    return rotateFromIndex(baseDurations, activeIndex);
  }, [locked, activeIndex, sceneKeys, baseDurations]);

  const onSceneChange = useCallback(
    (rawKey: string) => {
      const clean = stripRepeatSuffix(rawKey);
      const idx = sceneKeys.indexOf(clean);
      if (idx >= 0) setActiveIndex(idx);
      setTick((t) => t + 1);
    },
    [sceneKeys],
  );

  const jumpTo = useCallback((index: number) => {
    setActiveIndex(index);
    setMountKey((k) => k + 1);
    setTick((t) => t + 1);
  }, []);

  const toggleLock = useCallback(() => {
    setLocked((prev) => !prev);
    setMountKey((k) => k + 1);
    setTick((t) => t + 1);
  }, []);

  return {
    sceneKeys,
    activeIndex,
    locked,
    mountKey,
    tick,
    durations,
    activeDuration: baseDurations[sceneKeys[activeIndex]] ?? 0,
    onSceneChange,
    jumpTo,
    toggleLock,
  };
}

```

---

## `artifacts/psi-ascent/src/components/video/video_scenes/Scene10.tsx`

```
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

function WaveInterference({ visible }: { visible: boolean }) {
  const W = 300;
  const H = 140;
  const pts1 = useMemo(() => {
    const p: string[] = [];
    for (let x = 0; x <= W; x += 2) {
      const y = H / 2 + 38 * Math.sin((x / W) * 4 * Math.PI);
      p.push(`${x},${y}`);
    }
    return p.join(' ');
  }, []);
  const pts2 = useMemo(() => {
    const p: string[] = [];
    for (let x = 0; x <= W; x += 2) {
      const y = H / 2 + 38 * Math.sin((x / W) * 4 * Math.PI + Math.PI * 0.7);
      p.push(`${x},${y}`);
    }
    return p.join(' ');
  }, []);
  const ptsSum = useMemo(() => {
    const p: string[] = [];
    for (let x = 0; x <= W; x += 2) {
      const y1 = 38 * Math.sin((x / W) * 4 * Math.PI);
      const y2 = 38 * Math.sin((x / W) * 4 * Math.PI + Math.PI * 0.7);
      const y = H / 2 + (y1 + y2) * 0.6;
      p.push(`${x},${y}`);
    }
    return p.join(' ');
  }, []);

  return (
    <motion.svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-[85vw] max-w-[360px]"
      initial={{ opacity: 0, scaleX: 0 }}
      animate={visible ? { opacity: 1, scaleX: 1 } : {}}
      transition={{ duration: 1, ease: 'circOut' }}
    >
      <defs>
        <filter id="wave-glow">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <motion.polyline
        points={pts1} fill="none" stroke="var(--color-secondary)"
        strokeWidth="1.5" opacity="0.45" filter="url(#wave-glow)"
        initial={{ pathLength: 0 }} animate={visible ? { pathLength: 1 } : {}}
        transition={{ duration: 1.6, delay: 0.2 }}
      />
      <motion.polyline
        points={pts2} fill="none" stroke="var(--color-primary)"
        strokeWidth="1.5" opacity="0.45" filter="url(#wave-glow)"
        initial={{ pathLength: 0 }} animate={visible ? { pathLength: 1 } : {}}
        transition={{ duration: 1.6, delay: 0.5 }}
      />
      <motion.polyline
        points={ptsSum} fill="none" stroke="#FFFFFF"
        strokeWidth="2.5" filter="url(#wave-glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={visible ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration: 1.4, delay: 1.1 }}
      />
    </motion.svg>
  );
}

function CollapseEffect({ active }: { active: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0,255,204,0.18) 0%, transparent 60%)' }}
      animate={active ? { opacity: [0, 1, 0.4], scale: [0.5, 1.4, 1] } : { opacity: 0 }}
      transition={{ duration: 1.2 }}
    />
  );
}

const SCHRODINGER = 'iħ ∂ψ/∂t = Ĥψ';

export function Scene10() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 3800),
      setTimeout(() => setPhase(4), 5200),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-[55] overflow-hidden flex flex-col items-center justify-center"
      style={{ background: '#00080a' }}
      initial={{ y: '-100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            'radial-gradient(ellipse 90% 50% at 50% 50%, rgba(0,255,204,0.25) 0%, rgba(0,100,255,0.1) 50%, transparent 80%)',
        }}
      />

      <CollapseEffect active={phase >= 4} />

      <motion.h2
        className="text-5xl font-black tracking-[0.25em] text-white mb-6 z-10"
        style={{ fontFamily: 'var(--font-display)' }}
        initial={{ opacity: 0, y: -28 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: 'circOut' }}
      >
        QUANTUM
      </motion.h2>

      <div className="z-10 mb-6">
        <WaveInterference visible={phase >= 1} />
      </div>

      <motion.div
        className="z-10 text-center px-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={phase >= 2 ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, type: 'spring', damping: 18 }}
      >
        <span
          className="text-5xl font-mono font-black tracking-wider"
          style={{
            color: 'var(--color-secondary)',
            textShadow: '0 0 30px var(--color-secondary)',
          }}
        >
          {SCHRODINGER}
        </span>
        <p className="text-base font-mono tracking-[0.25em] mt-3 text-white/40 uppercase">
          Wave Function
        </p>
      </motion.div>

      {phase >= 3 && (
        <motion.div
          className="absolute bottom-24 flex gap-8 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {['|0⟩', '+', '|1⟩'].map((s, i) => (
            <motion.span
              key={i}
              className="text-3xl font-mono font-black"
              style={{
                color: i === 1 ? 'rgba(255,255,255,0.5)' : 'var(--color-primary)',
                textShadow: i !== 1 ? '0 0 20px var(--color-primary)' : undefined,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.18 }}
            >
              {s}
            </motion.span>
          ))}
        </motion.div>
      )}

      {phase >= 3 && (
        <motion.div
          className="absolute bottom-14 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs font-mono tracking-[0.4em] text-white/25 uppercase">
            Superposition — all states at once
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

```

---

## `artifacts/psi-ascent/src/components/video/video_scenes/Scene1.tsx`

```
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene1() {
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(2), 1400), // Particle explosion
      setTimeout(() => setPhase(3), 2200), // Show Title
      setTimeout(() => setPhase(4), 5800), // Exit
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden z-50 bg-[#050002]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
      transition={{ duration: 1 }}
    >
      {/* Particles forming Ψ */}
      <div className="relative w-full h-[40vh] flex items-center justify-center mt-[-10vh]">
        <motion.div
          className="absolute font-display text-[40vh] leading-none"
          style={{ 
            color: 'var(--color-primary)', 
            textShadow: '0 0 40px var(--color-primary)' 
          }}
          initial={{ opacity: 0, scale: 0, filter: 'blur(30px)' }}
          animate={
            phase === 0 ? { opacity: 0, scale: 0, filter: 'blur(30px)' } :
            phase === 1 ? { opacity: 1, scale: 1, filter: 'blur(0px)' } :
            phase === 2 ? { opacity: 0.8, scale: 1.5, filter: 'blur(5px)' } :
            { opacity: 0.1, scale: 3, filter: 'blur(20px)' }
          }
          transition={{ duration: 2, type: 'spring', bounce: 0.25 }}
        >
          Ψ
        </motion.div>
        
        {/* Drifting particle dots */}
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[var(--color-secondary)] mix-blend-screen"
            style={{ boxShadow: '0 0 10px var(--color-secondary)' }}
            initial={{ 
              x: (Math.random() - 0.5) * 400, 
              y: (Math.random() - 0.5) * 400,
              opacity: 0
            }}
            animate={
              phase >= 1 ? {
                x: 0, y: 0, opacity: [0, 1, 0], scale: [1, 2, 0]
              } : {}
            }
            transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.5, ease: "circIn" }}
          />
        ))}
      </div>

      <div className="relative mt-8 flex flex-col items-center w-full px-4">
        <motion.h1
          className="text-6xl font-black text-white tracking-tighter leading-none text-center"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ y: 50, opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
          animate={phase >= 3 ? { y: 0, opacity: 1, clipPath: 'inset(-50% -50% -50% -50%)' } : {}}
          transition={{ duration: 0.8, staggerChildren: 0.05 }}
        >
          {"Ψ-TERMINAL".split('').map((char, i) => (
            <motion.span 
              key={i} 
              className="inline-block"
              initial={{ y: 50, rotateX: 90 }}
              animate={phase >= 3 ? { y: 0, rotateX: 0 } : {}}
              transition={{ delay: 0.5 + i * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
            >
              {char}
            </motion.span>
          ))}
        </motion.h1>
        <motion.h1
          className="text-7xl font-black text-transparent tracking-widest leading-none text-center mt-2"
          style={{ WebkitTextStroke: '2px var(--color-secondary)', fontFamily: 'var(--font-display)' }}
          initial={{ scale: 1.5, opacity: 0, y: 30 }}
          animate={phase >= 3 ? { scale: 1, opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 1.2, type: 'spring', damping: 15 }}
        >
          ASCENT
        </motion.h1>
      </div>

    </motion.div>
  );
}

```

---

## `artifacts/psi-ascent/src/components/video/video_scenes/Scene2.tsx`

```
import { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function LincolnPointCloud() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particleCount = 15000;
  
  const [positions, initialPositions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const initPos = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);
    
    const colorPrimary = new THREE.Color('#00FFCC');
    const colorSecondary = new THREE.Color('#FF3366');
    const colorMix = new THREE.Color();
    
    for (let i = 0; i < particleCount; i++) {
      let x, y, z;
      const part = Math.random();
      
      if (part < 0.4) {
        // Hat (tall cylinder)
        const radius = Math.random() * 1.5;
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        y = Math.random() * 4 + 2; 
        colorMix.lerpColors(colorPrimary, colorSecondary, y / 6);
      } else if (part < 0.6) {
        // Brim
        const radius = Math.random() * 2.8;
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        y = 2 + (Math.random() * 0.2 - 0.1);
        colorMix.copy(colorPrimary);
      } else {
        // Face/Head (rough oval)
        const radius = Math.random() * 1.6;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        x = radius * Math.sin(phi) * Math.cos(theta);
        y = radius * Math.cos(phi);
        z = radius * Math.sin(phi) * Math.sin(theta);
        colorMix.lerpColors(colorSecondary, colorPrimary, Math.random());
      }

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initPos[i * 3] = x;
      initPos[i * 3 + 1] = y;
      initPos[i * 3 + 2] = z;

      cols[i * 3] = colorMix.r;
      cols[i * 3 + 1] = colorMix.g;
      cols[i * 3 + 2] = colorMix.b;
    }
    return [pos, initPos, cols];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const positionsArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    // Superposition jitter and wave
    const jitterAmount = Math.max(0, Math.sin(time * 3) * 0.8);
    const split = Math.sin(time * 2) > 0.8;
    
    for (let i = 0; i < particleCount; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;
      
      const bx = initialPositions[ix];
      const by = initialPositions[iy];
      const bz = initialPositions[iz];
      
      const wave = Math.sin(time * 4 + by * 2) * 0.3;
      const splitOffset = split ? (i % 2 === 0 ? 1 : -1) * 0.5 : 0;
      
      positionsArray[ix] = bx + wave + (Math.random() - 0.5) * jitterAmount + splitOffset;
      positionsArray[iy] = by + (Math.random() - 0.5) * jitterAmount;
      positionsArray[iz] = bz + (Math.random() - 0.5) * jitterAmount;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y = time * 0.3;
    if (split) {
      pointsRef.current.rotation.x = (Math.random() - 0.5) * 0.2;
    } else {
      pointsRef.current.rotation.x = 0;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

export function Scene2() {
  return (
    <motion.div 
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 2, 12], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <LincolnPointCloud />
        </Canvas>
      </div>
      
      <div className="absolute bottom-32 w-full px-8 text-center pointer-events-none mix-blend-difference">
        <motion.p 
          className="text-3xl tracking-[0.2em] font-mono text-[var(--color-primary)] font-bold uppercase drop-shadow-[0_0_10px_rgba(0,255,204,0.8)]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 1, type: 'spring' }}
        >
          QUANTUM SUPERPOSITION:
        </motion.p>
        <motion.p
          className="text-4xl tracking-[0.1em] font-mono text-white font-black mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 1, type: 'spring' }}
        >
          LINCOLN.OBJ
        </motion.p>
      </div>
    </motion.div>
  );
}

```

---

## `artifacts/psi-ascent/src/components/video/video_scenes/Scene3.tsx`

```
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';

function PyramidsOfGiza() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.1;
  });

  // 51.84 degrees -> height to base ratio ~ 0.636
  return (
    <group ref={groupRef} position={[0, -3, 0]}>
      {/* Main Pyramid */}
      <group position={[0, 0, 0]}>
        <mesh>
          <coneGeometry args={[5, 6.36, 4]} />
          <meshStandardMaterial color="#222" roughness={0.2} metalness={0.9} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.ConeGeometry(5, 6.36, 4)]} />
          <lineBasicMaterial color="#FFB800" linewidth={2} />
        </lineSegments>
        {/* Apex Beam */}
        <mesh position={[0, 3.18 + 15, 0]}>
          <cylinderGeometry args={[0.05, 0.5, 30, 16]} />
          <meshBasicMaterial color="#FFFF00" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      
      {/* Second Pyramid */}
      <group position={[8, 0, -8]}>
        <mesh>
          <coneGeometry args={[4.5, 5.72, 4]} />
          <meshStandardMaterial color="#111" roughness={0.3} metalness={0.8} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.ConeGeometry(4.5, 5.72, 4)]} />
          <lineBasicMaterial color="#FFB800" transparent opacity={0.6} />
        </lineSegments>
      </group>

      {/* Third Pyramid */}
      <group position={[-6, 0, -12]}>
        <mesh>
          <coneGeometry args={[2.5, 3.18, 4]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.4} metalness={0.7} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.ConeGeometry(2.5, 3.18, 4)]} />
          <lineBasicMaterial color="#FF3366" transparent opacity={0.5} />
        </lineSegments>
      </group>
    </group>
  );
}

export function Scene3() {
  return (
    <motion.div 
      className="absolute inset-0 z-30 overflow-hidden bg-[#050300]"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 70 }}
    >
      <div className="absolute inset-0 opacity-50 bg-gradient-to-t from-[#FFB800]/20 to-transparent mix-blend-screen" />

      <div className="absolute inset-0">
        <Canvas camera={{ position: [10, 5, 15], fov: 50 }}>
          <ambientLight intensity={0.1} />
          <spotLight position={[20, 20, 10]} angle={0.2} penumbra={1} intensity={5} color="#FFB800" />
          <spotLight position={[-20, 10, -10]} angle={0.3} penumbra={1} intensity={3} color="#FF3366" />
          <PyramidsOfGiza />
        </Canvas>
      </div>

      <div className="absolute top-32 w-full px-8 text-center pointer-events-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
        <motion.h2 
          className="text-6xl font-black text-white tracking-widest leading-none mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, scale: 0.8, rotateX: -90 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ delay: 1, duration: 1, type: 'spring', damping: 15 }}
        >
          GIZA<br/>ALIGNMENT
        </motion.h2>
        <motion.div 
          className="inline-block border-2 border-[#FFB800] bg-black/50 backdrop-blur-md px-6 py-2 rounded-full mt-4"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <p className="text-3xl font-mono text-[#FFB800] font-bold">
            θ = 51.84°
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

```

---

## `artifacts/psi-ascent/src/components/video/video_scenes/Scene4.tsx`

```
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Dodecahedron as DreiDodecahedron, Edges } from '@react-three/drei';
import * as THREE from 'three';

function DodecahedronLattice() {
  const groupRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  if (materialsRef.current.length === 0) {
    for(let i=0; i<12; i++) {
      materialsRef.current.push(new THREE.MeshStandardMaterial({ 
        color: '#000000',
        transparent: true,
        opacity: 0.8,
        metalness: 0.9,
        roughness: 0.1,
      }));
    }
  }
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.x = t * 0.5;
    groupRef.current.rotation.y = t * 0.3;

    // φ-spoke routing motif glow
    const activeFace = Math.floor((t * 2) % 12);
    materialsRef.current.forEach((mat, i) => {
      if (i === activeFace) {
        mat.emissive.setHex(0xFF3366);
        mat.emissiveIntensity = 2;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  });

  return (
    <group ref={groupRef}>
      <mesh material={materialsRef.current}>
        <dodecahedronGeometry args={[4]} />
      </mesh>
      
      <lineSegments>
        <edgesGeometry args={[new THREE.DodecahedronGeometry(4)]} />
        <lineBasicMaterial color="#00FFCC" linewidth={3} transparent opacity={0.8} />
      </lineSegments>
      
      {/* Inner core */}
      <DreiDodecahedron args={[1.5]}>
        <meshBasicMaterial color="#FF3366" wireframe={true} />
      </DreiDodecahedron>
      
      {/* Outer shell lattice wireframe */}
      <DreiDodecahedron args={[6]}>
        <meshBasicMaterial color="#ffffff" wireframe={true} transparent opacity={0.1} />
      </DreiDodecahedron>
    </group>
  );
}

export function Scene4() {
  return (
    <motion.div 
      className="absolute inset-0 bg-[#02050A] z-40"
      initial={{ opacity: 0, scale: 3, rotateZ: 90 }}
      animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
      exit={{ opacity: 0, scale: 0.5, filter: 'blur(15px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={2} color="#00FFCC" />
          <pointLight position={[-10, -10, -10]} intensity={2} color="#FF3366" />
          <DodecahedronLattice />
        </Canvas>
      </div>

      <div className="absolute bottom-24 w-full px-6 text-center pointer-events-none">
        <motion.div
          className="bg-black/60 backdrop-blur-xl p-8 border-t-4 border-[var(--color-primary)] shadow-[0_0_30px_rgba(255,51,102,0.3)] inline-block min-w-[80%]"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 1, type: 'spring', damping: 20 }}
        >
          <h3 className="text-4xl font-display font-black text-white mb-3">PLATONIC LATTICE</h3>
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--color-secondary)] to-transparent mb-3" />
          <p className="text-2xl text-[var(--color-secondary)] font-mono tracking-wider">φ-SPOKE ROUTING</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

```

---

## `artifacts/psi-ascent/src/components/video/video_scenes/Scene5.tsx`

```
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),  // Charge
      setTimeout(() => setPhase(2), 1800), // Clash (impact)
      setTimeout(() => setPhase(3), 2200), // Slow-mo push
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 bg-[#0A0000] z-50 overflow-hidden flex items-center justify-center"
      initial={{ scale: 1.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(30px)' }}
      transition={{ duration: 1, ease: "circOut" }}
    >
      {/* Glitch / Chromatic Aberration burst background at clash */}
      <motion.div 
        className="absolute inset-0 bg-white opacity-0 mix-blend-screen"
        animate={phase === 2 ? { opacity: [1, 0] } : { opacity: 0 }}
        transition={{ duration: 0.5, ease: "circOut" }}
      />
      
      {phase >= 2 && (
        <motion.div 
          className="absolute inset-0 pointer-events-none mix-blend-screen opacity-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"
          animate={{ opacity: [1, 0.2] }}
          transition={{ duration: 2 }}
        />
      )}

      {/* Shockwaves */}
      {phase >= 2 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            className="absolute w-10 h-10 rounded-full border-[8px] border-[#00FFCC] z-0"
            initial={{ scale: 0.1, opacity: 1 }}
            animate={{ scale: 30, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <motion.div 
            className="absolute w-10 h-10 rounded-full border-[16px] border-[#FF3366] z-0"
            initial={{ scale: 0.1, opacity: 1 }}
            animate={{ scale: 40, opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut", delay: 0.1 }}
          />
        </div>
      )}

      {/* Silhouettes container */}
      <div className="relative w-full h-full flex items-center justify-center z-10 overflow-hidden">
        
        {/* T-Rex */}
        <motion.img
          src={`${import.meta.env.BASE_URL}images/trex.png`}
          className="absolute object-contain drop-shadow-[0_0_20px_#FF3366] w-[60vh] h-[60vh]"
          style={{ filter: phase === 2 ? 'drop-shadow(10px 0 0 blue) drop-shadow(-10px 0 0 red)' : 'none' }}
          initial={{ left: '-60vh', top: '50%', y: '-50%' }}
          animate={
            phase === 0 ? { left: '-60vh' } :
            phase === 1 ? { left: '-5vh' } : 
            { left: '5vh', scale: 1.15 }
          }
          transition={
            phase === 1 ? { duration: 1, ease: "circIn" } :
            { duration: 10, ease: "linear" }
          }
        />

        {/* Jake Paul (Boxer) */}
        <motion.img
          src={`${import.meta.env.BASE_URL}images/boxer.png`}
          className="absolute object-contain drop-shadow-[0_0_20px_#00FFCC] w-[50vh] h-[50vh]"
          style={{ 
            transform: 'scaleX(-1)', 
            filter: phase === 2 ? 'drop-shadow(-10px 0 0 blue) drop-shadow(10px 0 0 red)' : 'none'
          }}
          initial={{ right: '-60vh', top: '50%', y: '-50%' }}
          animate={
            phase === 0 ? { right: '-60vh' } :
            phase === 1 ? { right: '-5vh' } :
            { right: '5vh', scale: 1.15 }
          }
          transition={
            phase === 1 ? { duration: 1, ease: "circIn" } :
            { duration: 10, ease: "linear" }
          }
        />
      </div>

      <div className="absolute top-24 w-full text-center z-20">
        <motion.h2 
          className="text-6xl font-black text-white italic tracking-tighter"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ scale: 3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', damping: 15 }}
        >
          ANOMALY<br/>DETECTED
        </motion.h2>
        <motion.div
          className="inline-block bg-[#FF3366] text-white px-6 py-2 mt-4 font-mono font-bold text-2xl rotate-[-2deg]"
          initial={{ opacity: 0, rotate: 10, scale: 0 }}
          animate={phase >= 2 ? { opacity: 1, rotate: -2, scale: 1 } : { opacity: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        >
          GLOVE VS CLAW
        </motion.div>
      </div>

    </motion.div>
  );
}

```

---

## `artifacts/psi-ascent/src/components/video/video_scenes/Scene6.tsx`

```
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // Rain starts
      setTimeout(() => setPhase(2), 2500), // Equation settles
      setTimeout(() => setPhase(3), 4500), // Final lock
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Matrix column rain columns
  const columns = Array.from({ length: 15 });
  const mathSymbols = ['∫', '∑', '∇', '∂</', 'φ', 'θ', 'π', 'Ω', '∞', '∆', '∈', '∝', '≈', 'Ψ'];

  return (
    <motion.div 
      className="absolute inset-0 bg-[#001100] z-[60] overflow-hidden flex flex-col items-center justify-center font-mono"
      initial={{ opacity: 0, y: '-100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Matrix Rain Layer */}
      <div className="absolute inset-0 flex justify-evenly pointer-events-none opacity-40">
        {columns.map((_, i) => (
          <div key={i} className="flex flex-col text-[var(--color-secondary)] text-xl font-bold opacity-80" style={{ textShadow: '0 0 8px var(--color-secondary)' }}>
            {Array.from({ length: 20 }).map((_, j) => (
              <motion.div
                key={j}
                initial={{ opacity: 0, y: -50 }}
                animate={phase >= 1 ? { 
                  opacity: [0, 1, 0], 
                  y: ['-50vh', '150vh'] 
                } : {}}
                transition={{ 
                  duration: 2 + Math.random() * 3, 
                  repeat: Infinity, 
                  delay: Math.random() * 2,
                  ease: "linear"
                }}
              >
                {mathSymbols[Math.floor(Math.random() * mathSymbols.length)]}
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full px-6 flex flex-col items-center justify-center text-center">
        {/* Giant settling equation */}
        <motion.div
          className="text-white text-5xl font-bold leading-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
          initial={{ scale: 3, filter: 'blur(20px)', opacity: 0 }}
          animate={phase >= 2 ? { scale: 1, filter: 'blur(0px)', opacity: 1 } : {}}
          transition={{ duration: 1.5, ease: "circOut" }}
        >
          <div className="mb-4">
            <span className="text-[var(--color-primary)]">∫</span>
            <span className="text-white"> e</span>
            <sup className="text-2xl">iπ</sup>
            <span className="text-[var(--color-secondary)]"> + 1 = 0</span>
          </div>
          
          <div className="h-[2px] w-full bg-white/30 my-6" />

          <motion.div 
            className="text-7xl text-[#FFB800] tracking-wider"
            animate={phase >= 3 ? { scale: [1, 1.1, 1], textShadow: ['0 0 0px #FFB800', '0 0 40px #FFB800', '0 0 10px #FFB800'] } : {}}
            transition={{ duration: 1 }}
          >
            51.84°
          </motion.div>
        </motion.div>

        <motion.p
          className="mt-12 text-2xl font-body text-white/70 uppercase tracking-[0.2em]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 1 }}
        >
          The Math Layer
        </motion.p>
      </div>

    </motion.div>
  );
}

```

---

## `artifacts/psi-ascent/src/components/video/video_scenes/Scene7.tsx`

```
import { motion } from 'framer-motion';

export function Scene7() {
  return (
    <motion.div 
      className="absolute inset-0 bg-[#000000] z-[70] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 1.5 }}
    >
      <div className="text-center w-full px-8 relative">
        {/* Glow effect behind */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--color-primary)] rounded-full blur-[120px] opacity-0"
          animate={{ opacity: [0, 0.5, 0.3] }}
          transition={{ duration: 3, delay: 0.5 }}
        />

        <motion.div
          className="text-8xl font-black text-white mb-8 tracking-tighter"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ scale: 0.5, opacity: 0, rotateX: 90 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.5 }}
        >
          <span className="text-[var(--color-primary)] drop-shadow-[0_0_30px_rgba(255,51,102,0.8)]">Ω</span>-REEL
        </motion.div>

        <motion.div
          className="overflow-hidden mb-6"
        >
          <motion.p
            className="text-2xl font-mono text-[var(--color-secondary)] uppercase tracking-[0.1em]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ delay: 1.5, duration: 0.8, ease: "easeOut" }}
          >
            Cinematic in code.
          </motion.p>
        </motion.div>

        <motion.div className="overflow-hidden">
          <motion.p
            className="text-2xl font-mono text-white/80 uppercase tracking-[0.1em]"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            transition={{ delay: 2, duration: 0.8, ease: "easeOut" }}
          >
            Not in queue.
          </motion.p>
        </motion.div>
        
        <motion.div
          className="mt-16 w-full flex justify-center"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 2.8, duration: 1, ease: "circOut" }}
        >
          <div className="w-1/2 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent" />
        </motion.div>
      </div>
    </motion.div>
  );
}

```

---

## `artifacts/psi-ascent/src/components/video/video_scenes/Scene8.tsx`

```
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

function GoldenSpiral({ visible }: { visible: boolean }) {
  const points = useMemo(() => {
    const pts: string[] = [];
    for (let t = 0; t < 5.5 * Math.PI; t += 0.06) {
      const r = Math.pow(1.6180339887, (t * 2) / Math.PI) * 3.2;
      pts.push(`${r * Math.cos(t)},${-r * Math.sin(t)}`);
    }
    return pts.join(' L ');
  }, []);

  return (
    <motion.svg
      viewBox="-160 -160 320 320"
      className="w-[70vw] max-w-[340px] aspect-square"
      initial={{ opacity: 0, rotate: -60, scale: 0.4 }}
      animate={visible ? { opacity: 1, rotate: 0, scale: 1 } : {}}
      transition={{ duration: 1.4, type: 'spring', damping: 18, stiffness: 55 }}
    >
      <defs>
        <filter id="spiral-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {[
        { x: 0, y: 0, w: 89, h: 89 },
        { x: -89, y: 0, w: 89, h: 89 },
        { x: -89, y: -55, w: 89, h: 55 },
        { x: -55, y: -55, w: 55, h: 55 },
        { x: -55, y: -21, w: 34, h: 34 },
        { x: -34, y: -21, w: 21, h: 21 },
      ].map((r, i) => (
        <motion.rect
          key={i}
          x={r.x} y={r.y} width={r.w} height={r.h}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.8"
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
        />
      ))}

      <motion.polyline
        points={points}
        fill="none"
        stroke="var(--color-secondary)"
        strokeWidth="2"
        filter="url(#spiral-glow)"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={visible ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.2 }}
      />
    </motion.svg>
  );
}

export function Scene8() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3500),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const fibNums = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];

  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden flex flex-col items-center justify-center"
      style={{ background: '#020010' }}
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,255,204,0.15) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.h2
        className="text-5xl font-black text-white tracking-[0.25em] mb-6"
        style={{ fontFamily: 'var(--font-display)' }}
        initial={{ opacity: 0, y: -24 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: 'circOut' }}
      >
        FIBONACCI
      </motion.h2>

      <GoldenSpiral visible={phase >= 1} />

      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <span
          className="text-6xl font-black font-mono"
          style={{ color: 'var(--color-primary)', textShadow: '0 0 40px var(--color-primary)' }}
        >
          φ = 1.618…
        </span>
        <p className="text-lg font-mono tracking-[0.3em] mt-2" style={{ color: 'var(--color-secondary)' }}>
          NATURE'S CONSTANT
        </p>
      </motion.div>

      {phase >= 2 && (
        <div className="absolute bottom-20 flex gap-3 flex-wrap justify-center px-8">
          {fibNums.map((n, i) => (
            <motion.span
              key={i}
              className="font-mono text-sm font-bold"
              style={{ color: `hsl(${165 + i * 10}, 90%, 65%)`, textShadow: `0 0 8px hsl(${165 + i * 10}, 90%, 65%)` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 500, damping: 22 }}
            >
              {n}
            </motion.span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

```

---

## `artifacts/psi-ascent/src/components/video/video_scenes/Scene9.tsx`

```
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function AccretionDisk() {
  return (
    <div className="relative w-72 h-72 flex items-center justify-center">
      {/* Outer glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '260px',
          height: '260px',
          background: 'conic-gradient(from 0deg, #FF6B00, #FFB800, #FF3366, #FF6B00, #FFE066, #FF3366, #FF6B00)',
          filter: 'blur(18px)',
          opacity: 0.55,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />
      {/* Inner accretion ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '200px',
          height: '200px',
          background: 'conic-gradient(from 180deg, #FF3366 0%, #FF8800 20%, #FFFF00 35%, #FF8800 50%, #FF3366 65%, #880022 80%, #FF3366 100%)',
          filter: 'blur(8px)',
          opacity: 0.85,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
      />
      {/* Event horizon */}
      <div
        className="absolute rounded-full z-10"
        style={{
          width: '110px',
          height: '110px',
          background: '#000000',
          boxShadow: '0 0 0 4px rgba(255,100,0,0.3), 0 0 40px 20px rgba(255,60,0,0.15)',
        }}
      />
      {/* Hawking radiation particles */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * 360;
        const delay = i * 0.18;
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#FFB800]"
            style={{ boxShadow: '0 0 6px #FFB800' }}
            animate={{
              x: [
                Math.cos((angle * Math.PI) / 180) * 58,
                Math.cos((angle * Math.PI) / 180) * 160,
              ],
              y: [
                Math.sin((angle * Math.PI) / 180) * 58,
                Math.sin((angle * Math.PI) / 180) * 160,
              ],
              opacity: [1, 0],
              scale: [1.2, 0],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              delay,
              ease: 'easeOut',
              repeatDelay: 0.2,
            }}
          />
        );
      })}
    </div>
  );
}

export function Scene9() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4200),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const eq = 'r_s = 2GM/c²';

  return (
    <motion.div
      className="absolute inset-0 z-50 overflow-hidden flex flex-col items-center justify-center"
      style={{ background: '#000000' }}
      initial={{ opacity: 0, scale: 1.15 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(24px)', scale: 0.9 }}
      transition={{ duration: 1, ease: 'circOut' }}
    >
      {/* Deep space bg */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 70% at 50% 50%, #0a0005 0%, #000000 70%)',
        }}
      />
      {/* Star field */}
      {Array.from({ length: 60 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() > 0.8 ? '2px' : '1px',
            height: Math.random() > 0.8 ? '2px' : '1px',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.7 + 0.1,
          }}
          animate={{ opacity: [0.1, 0.9, 0.1] }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <motion.h2
        className="text-5xl font-black tracking-[0.2em] text-white mb-8 z-10"
        style={{ fontFamily: 'var(--font-display)' }}
        initial={{ opacity: 0, y: -28 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: 'circOut' }}
      >
        EVENT HORIZON
      </motion.h2>

      <motion.div
        className="z-10"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1.2, type: 'spring', damping: 20, stiffness: 60 }}
      >
        <AccretionDisk />
      </motion.div>

      <motion.div
        className="mt-8 z-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <p
          className="text-4xl font-mono font-bold"
          style={{ color: '#FF8800', textShadow: '0 0 30px #FF6600' }}
        >
          {eq}
        </p>
        <p className="text-base font-mono tracking-[0.25em] mt-2 text-white/50">
          SCHWARZSCHILD RADIUS
        </p>
      </motion.div>

      <motion.div
        className="absolute bottom-20 text-center z-10"
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : {}}
        transition={{ duration: 1 }}
      >
        <p className="text-sm font-mono tracking-[0.4em] text-white/30 uppercase">
          Point of no return
        </p>
      </motion.div>
    </motion.div>
  );
}

```

---

## `artifacts/psi-ascent/src/components/video/VideoTemplate.tsx`

```
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';
import { Scene7 } from './video_scenes/Scene7';
import { Scene8 } from './video_scenes/Scene8';
import { Scene9 } from './video_scenes/Scene9';
import { Scene10 } from './video_scenes/Scene10';

// 91 seconds total — 10 scenes
export const SCENE_DURATIONS = {
  title:        7000,
  lincoln:      11000,
  pyramid:      10000,
  dodecahedron: 10000,
  trex:          9000,
  math:          9000,
  fibonacci:     9000,
  blackhole:    10000,
  quantum:       9000,
  outro:         7000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  title:        Scene1,
  lincoln:      Scene2,
  pyramid:      Scene3,
  dodecahedron: Scene4,
  trex:         Scene5,
  math:         Scene6,
  fibonacci:    Scene8,
  blackhole:    Scene9,
  quantum:      Scene10,
  outro:        Scene7,
};

interface VideoTemplateProps {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
}

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: VideoTemplateProps = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="w-full h-screen overflow-hidden relative flex items-center justify-center bg-black">
      <div
        className="relative overflow-hidden bg-[#050505]"
        style={{
          aspectRatio: '9 / 16',
          height: 'min(100vh, 100vw * 16 / 9)',
          width: 'min(100vw, 100vh * 9 / 16)',
          margin: '0 auto',
          boxShadow: '0 0 50px rgba(255, 51, 102, 0.1)',
        }}
      >
        {/* Persistent ambient layers */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute w-[150vw] h-[150vw] rounded-full opacity-20 blur-[100px]"
            style={{ background: 'radial-gradient(circle, var(--color-primary), transparent)' }}
            animate={{ x: ['-50%', '10%', '-30%'], y: ['-20%', '50%', '10%'], scale: [1, 1.2, 0.8] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[120vw] h-[120vw] rounded-full opacity-10 blur-[80px]"
            style={{ background: 'radial-gradient(circle, var(--color-secondary), transparent)' }}
            animate={{ x: ['10%', '-40%', '20%'], y: ['40%', '-10%', '60%'], scale: [0.9, 1.3, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\\"0 0 200 200\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cfilter id=\\"noiseFilter\\"%3E%3CfeTurbulence type=\\"fractalNoise\\" baseFrequency=\\"0.85\\" numOctaves=\\"3\\" stitchTiles=\\"stitch\\"%3E%3C/feTurbulence%3E%3C/filter%3E%3Crect width=\\"100%25\\" height=\\"100%25\\" filter=\\"url(%23noiseFilter)\\"/%3E%3C/svg%3E")',
            }}
          />
        </div>

        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

```

---

## `artifacts/psi-ascent/src/components/video/VideoWithControls.tsx`

```
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Repeat } from 'lucide-react';
import VideoTemplate, { SCENE_DURATIONS } from './VideoTemplate';
import { useSceneControls } from './useSceneControls';

const PROGRESS_TICK_MS = 60;

interface ControlBarProps {
  visible: boolean;
  collapsed: boolean;
  locked: boolean;
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  tick: number;
  onToggleLock: () => void;
  onJumpTo: (index: number) => void;
  onToggleCollapsed: () => void;
}

function ProgressSegments({
  sceneKeys,
  activeIndex,
  activeDuration,
  tick,
  onJumpTo,
}: {
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  tick: number;
  onJumpTo: (index: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    const start = performance.now();
    const id = window.setInterval(() => {
      setElapsed(performance.now() - start);
    }, PROGRESS_TICK_MS);
    return () => window.clearInterval(id);
  }, [tick]);

  const progress = activeDuration > 0 ? Math.min(1, elapsed / activeDuration) : 0;

  return (
    <div className="flex-1 flex items-center gap-1.5">
      {sceneKeys.map((key, i) => {
        const isActive = i === activeIndex;
        const fill = isActive ? progress * 100 : 0;
        return (
          <button
            key={key}
            onClick={() => onJumpTo(i)}
            className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden cursor-pointer hover:h-4 hover:bg-white/25 transition-all relative min-h-[12px]"
            aria-label={`Jump to scene ${i + 1}`}
            aria-current={isActive ? 'true' : undefined}
          >
            <div
              className="absolute inset-y-0 left-0 bg-white/90 rounded-full transition-[width] duration-100"
              style={{ width: `${fill}%` }}
            />
          </button>
        );
      })}
    </div>
  );
}

function ControlBar({
  visible,
  collapsed,
  locked,
  sceneKeys,
  activeIndex,
  activeDuration,
  tick,
  onToggleLock,
  onJumpTo,
  onToggleCollapsed,
}: ControlBarProps) {
  return (
    <div
      className={`flex items-center gap-3 bg-black/50 backdrop-blur-sm px-5 py-4 transition-all duration-200 ease-out ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
      aria-hidden={!visible}
    >
      <button
        onClick={onToggleLock}
        className={`w-14 h-14 flex items-center justify-center transition-colors rounded-lg shrink-0 ${
          locked
            ? 'text-white bg-white/15 hover:bg-white/25'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
        title={locked ? 'Loop current scene: on' : 'Loop current scene: off'}
        aria-label={locked ? 'Loop current scene: on' : 'Loop current scene: off'}
        aria-pressed={locked}
      >
        <Repeat className="w-8 h-8" />
      </button>

      <div className="w-px self-stretch bg-white/15" aria-hidden="true" />

      <ProgressSegments
        sceneKeys={sceneKeys}
        activeIndex={activeIndex}
        activeDuration={activeDuration}
        tick={tick}
        onJumpTo={onJumpTo}
      />

      <div className="text-xl text-white/60 font-mono tabular-nums shrink-0">
        {activeIndex + 1}/{sceneKeys.length}
      </div>

      <button
        onClick={onToggleCollapsed}
        className="w-14 h-14 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors rounded-lg shrink-0"
        title={collapsed ? 'Show controls' : 'Hide controls'}
        aria-label={collapsed ? 'Show controls' : 'Hide controls'}
        aria-expanded={!collapsed}
      >
        {collapsed ? <ChevronUp className="w-10 h-10" /> : <ChevronDown className="w-10 h-10" />}
      </button>
    </div>
  );
}

export default function VideoWithControls() {
  const isIframed = typeof window !== 'undefined' && window.self !== window.top;

  const {
    sceneKeys,
    activeIndex,
    locked,
    mountKey,
    tick,
    durations,
    activeDuration,
    onSceneChange,
    jumpTo,
    toggleLock,
  } = useSceneControls(SCENE_DURATIONS);

  const sensorRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [tapPinned, setTapPinned] = useState(false);

  const handlePointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') setHovering(true);
  }, []);
  const handlePointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') setHovering(false);
  }, []);
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse') return;
      if (collapsed) setTapPinned(true);
    },
    [collapsed],
  );
  const handleToggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      if (!c) {
        setHovering(false);
        setTapPinned(false);
      }
      return !c;
    });
  }, []);

  useEffect(() => {
    if (!(collapsed && tapPinned)) return;
    const onDocPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      const sensor = sensorRef.current;
      if (sensor && !sensor.contains(e.target as Node)) setTapPinned(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [collapsed, tapPinned]);

  const barVisible = !collapsed || hovering || tapPinned;

  if (!isIframed) return <VideoTemplate />;

  return (
    <div className="relative w-full h-screen">
      <VideoTemplate
        key={mountKey}
        durations={durations}
        loop
        onSceneChange={onSceneChange}
      />
      <div
        ref={sensorRef}
        className="absolute bottom-0 left-0 right-0 z-50 flex flex-col justify-end"
        style={{ height: '25%' }}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
      >
        <div className="flex-1 w-full" aria-hidden="true" />
        <ControlBar
          visible={barVisible}
          collapsed={collapsed}
          locked={locked}
          sceneKeys={sceneKeys}
          activeIndex={activeIndex}
          activeDuration={activeDuration}
          tick={tick}
          onToggleLock={toggleLock}
          onJumpTo={jumpTo}
          onToggleCollapsed={handleToggleCollapsed}
        />
      </div>
    </div>
  );
}

```

---

## `artifacts/psi-ascent/src/hooks/use-mobile.tsx`

```
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

```

---

## `artifacts/psi-ascent/src/index.css`

```
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Space+Grotesk:wght@300;500;700;900&display=swap');
@import "tailwindcss";

@theme {
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));

  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));

  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));

  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));

  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));

  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));

  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));

  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));

  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}

@layer base {
  :root {
    --background: 240 10% 4%;
    --foreground: 0 0% 98%;
    --card: 240 10% 6%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 6%;
    --popover-foreground: 0 0% 98%;
    --primary: 346 80% 50%; /* Deep chaotic red */
    --primary-foreground: 0 0% 100%;
    --secondary: 240 15% 15%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 15% 15%;
    --muted-foreground: 240 5% 65%;
    --accent: 45 100% 50%; /* Golden hour accent */
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 15% 15%;
    --input: 240 15% 15%;
    --ring: 346 80% 50%;
    --radius: 0.5rem;
    
    --font-display: "Space Grotesk", sans-serif;
    --font-body: "JetBrains Mono", monospace;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-body);
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
  }
}

```

---

## `artifacts/psi-ascent/src/lib/utils.ts`

```
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

```

---

## `artifacts/psi-ascent/src/lib/video/animations.ts`

```
// Animation presets for consistent motion language

import type { Transition, Variants } from 'framer-motion';

// Spring presets
export const springs = {
  snappy: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
  bouncy: { type: 'spring', stiffness: 300, damping: 15 } as Transition,
  gentle: { type: 'spring', stiffness: 100, damping: 20 } as Transition,
  stiff: { type: 'spring', stiffness: 600, damping: 40 } as Transition,
  wobbly: { type: 'spring', stiffness: 200, damping: 10 } as Transition,
  smooth: { type: 'spring', stiffness: 120, damping: 25 } as Transition,
  poppy: { type: 'spring', stiffness: 500, damping: 22 } as Transition,
} as const;

// Easing presets
export const easings = {
  easeOut: { ease: [0.16, 1, 0.3, 1] } as Transition,
  circOut: { ease: 'circOut' } as Transition,
  easeInOut: { ease: [0.4, 0, 0.2, 1] } as Transition,
  backOut: { ease: 'backOut' } as Transition,
  expoOut: { ease: [0.16, 1, 0.3, 1] } as Transition,
} as const;

// Scene transitions for AnimatePresence
export const sceneTransitions = {
  fadeBlur: {
    initial: { opacity: 0, filter: 'blur(20px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(20px)' },
    transition: { duration: 0.8, ease: 'circOut' },
  },
  scaleFade: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05, filter: 'blur(10px)' },
    transition: { duration: 0.8, ease: 'circOut' },
  },
  slideLeft: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    transition: { duration: 0.6, ease: 'circOut' },
  },
  slideRight: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
    transition: { duration: 0.6, ease: 'circOut' },
  },
  slideUp: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
    transition: { duration: 0.6, ease: 'circOut' },
  },
  wipe: {
    initial: { clipPath: 'inset(0 100% 0 0)' },
    animate: { clipPath: 'inset(0 0% 0 0)' },
    exit: { clipPath: 'inset(0 0 0 100%)' },
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
  },
  zoomThrough: {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.5 },
    transition: { duration: 1, ease: 'circOut' },
  },
  crossDissolve: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
  clipCircle: {
    initial: { clipPath: 'circle(0% at 50% 50%)' },
    animate: { clipPath: 'circle(100% at 50% 50%)' },
    exit: { clipPath: 'circle(0% at 50% 50%)' },
    transition: { duration: 1, ease: [0.4, 0, 0.2, 1] },
  },
  clipPolygon: {
    initial: { clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)' },
    animate: { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
    exit: { clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)' },
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
  },
  perspectiveFlip: {
    initial: { opacity: 0, rotateY: -90, transformPerspective: 1200 },
    animate: { opacity: 1, rotateY: 0, transformPerspective: 1200 },
    exit: { opacity: 0, rotateY: 90, transformPerspective: 1200 },
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
  },
  morphExpand: {
    initial: { opacity: 0, scale: 0.3, borderRadius: '50%' },
    animate: { opacity: 1, scale: 1, borderRadius: '0%' },
    exit: { opacity: 0, scale: 2.5, filter: 'blur(30px)' },
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
  },
  splitHorizontal: {
    initial: { clipPath: 'inset(50% 0 50% 0)' },
    animate: { clipPath: 'inset(0% 0 0% 0)' },
    exit: { clipPath: 'inset(50% 0 50% 0)' },
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
  },
  splitVertical: {
    initial: { clipPath: 'inset(0 50% 0 50%)' },
    animate: { clipPath: 'inset(0 0% 0 0%)' },
    exit: { clipPath: 'inset(0 50% 0 50%)' },
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
  },
  pushLeft: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
  },
  pushRight: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
  },
} as const;

// Element animations
export const elementAnimations = {
  popIn: {
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'circOut' },
  },
  fadeDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'circOut' },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5, ease: 'circOut' },
  },
  slideInRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5, ease: 'circOut' },
  },
  blurIn: {
    initial: { opacity: 0, filter: 'blur(20px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    transition: { duration: 0.6, ease: 'circOut' },
  },
  elasticScale: {
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring', stiffness: 500, damping: 15 },
  },
  perspectiveRotateIn: {
    initial: { opacity: 0, rotateX: -60, transformPerspective: 1000 },
    animate: { opacity: 1, rotateX: 0, transformPerspective: 1000 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: { repeat: Infinity, duration: 2 },
    },
  },
  float: {
    animate: {
      y: [0, -10, 0],
      transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
    },
  },
} as const;

// Character-level animation variants for kinetic typography
export const charVariants = {
  hidden: { opacity: 0, y: 40, rotateX: -40, transformPerspective: 800 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transformPerspective: 800,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
};

export const charContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03, delayChildren: 0.1 },
  },
};

// Stagger configs
export const staggerConfigs = {
  fast: { staggerChildren: 0.05, delayChildren: 0 },
  medium: { staggerChildren: 0.1, delayChildren: 0.1 },
  slow: { staggerChildren: 0.2, delayChildren: 0.2 },
  reverse: { staggerChildren: 0.1, staggerDirection: -1 },
  charFast: { staggerChildren: 0.02, delayChildren: 0 },
  charMedium: { staggerChildren: 0.04, delayChildren: 0.1 },
} as const;

// Common variants
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: staggerConfigs.medium,
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'circOut' },
  },
};

// Utilities
export function staggerDelay(index: number, baseDelay: number = 0.1): number {
  return index * baseDelay;
}

export function customSpring(stiffness: number, damping: number): Transition {
  return { type: 'spring', stiffness, damping };
}

export function withDelay(transition: Transition, delay: number): Transition {
  return { ...transition, delay };
}

```

---

## `artifacts/psi-ascent/src/lib/video/hooks.ts`

```
// Video player hook - handles recording lifecycle, scene advancement, and looping

import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    startRecording?: () => Promise<void>;
    stopRecording?: () => void;
  }
}

export interface SceneDurations {
  [key: string]: number;
}

export interface UseVideoPlayerOptions {
  durations: SceneDurations;
  onVideoEnd?: () => void;
  loop?: boolean;
}

export interface UseVideoPlayerReturn {
  currentScene: number;
  totalScenes: number;
  currentSceneKey: string;
  hasEnded: boolean;
}

export function useVideoPlayer(options: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const { durations, onVideoEnd, loop = true } = options;

  // Captured once on mount -- durations must be a static object
  const sceneKeys = useRef(Object.keys(durations)).current;
  const totalScenes = sceneKeys.length;
  const durationsArray = useRef(Object.values(durations)).current;

  const [currentScene, setCurrentScene] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);

  // Start recording on mount
  useEffect(() => {
    window.startRecording?.();
  }, []);

  // Scene advancement -- loops independently of recording
  useEffect(() => {
    if (hasEnded && !loop) return;

    const currentDuration = durationsArray[currentScene];

    const timer = setTimeout(() => {
      // Last scene just finished playing
      if (currentScene >= totalScenes - 1) {
        if (!hasEnded) {
          window.stopRecording?.();
          setHasEnded(true);
          onVideoEnd?.();
        }
        if (loop) {
          setCurrentScene(0);
        }
      } else {
        setCurrentScene(prev => prev + 1);
      }
    }, currentDuration);

    return () => clearTimeout(timer);
  }, [currentScene, totalScenes, durationsArray, hasEnded, loop, onVideoEnd]);

  return {
    currentScene,
    totalScenes,
    currentSceneKey: sceneKeys[currentScene],
    hasEnded,
  };
}

export function useSceneTimer(events: Array<{ time: number; callback: () => void }>) {
  const firedRef = useRef<Set<number>>(new Set());
  const callbacksRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    callbacksRef.current = events.map(e => e.callback);
  }, [events]);

  const scheduleKey = events.map((event, i) => `${i}:${event.time}`).join('|');

  useEffect(() => {
    firedRef.current = new Set();

    const timers = events.map(({ time }, index) => {
      return setTimeout(() => {
        if (!firedRef.current.has(index)) {
          firedRef.current.add(index);
          callbacksRef.current[index]?.();
        }
      }, time);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [scheduleKey]);
}

```

---

## `artifacts/psi-ascent/src/lib/video/index.ts`

```
// Video template library - hook and animation presets

export { useVideoPlayer, useSceneTimer } from './hooks';
export type { SceneDurations, UseVideoPlayerOptions, UseVideoPlayerReturn } from './hooks';

export {
  springs,
  easings,
  sceneTransitions,
  elementAnimations,
  charVariants,
  charContainerVariants,
  staggerConfigs,
  containerVariants,
  itemVariants,
  staggerDelay,
  customSpring,
  withDelay,
} from './animations';

```

---

## `artifacts/psi-ascent/src/main.tsx`

```
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

```

---

## `lib/db/src/index.ts`

```
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";

```

---

## `lib/db/src/schema/conversations.ts`

```
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  model: text("model").default("flash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

```

---

## `lib/db/src/schema/index.ts`

```
// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

export * from "./conversations";
export * from "./messages";
```

---

## `lib/db/src/schema/messages.ts`

```
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { conversations } from "./conversations";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

```

---

## `lib/integrations-gemini-ai/src/batch/index.ts`

```
export {
  batchProcess,
  batchProcessWithSSE,
  isRateLimitError,
  type BatchOptions,
} from "./utils";

```

---

## `lib/integrations-gemini-ai/src/batch/utils.ts`

```
import pLimit from "p-limit";
import pRetry, { AbortError } from "p-retry";

/**
 * Batch Processing Utilities
 *
 * Generic batch processing with built-in rate limiting and automatic retries.
 * Use for any task that requires processing multiple items through an LLM or external API.
 *
 * USAGE:
 * ```typescript
 * import { batchProcess } from "@workspace/integrations-gemini-ai/batch";
 * import { ai } from "@workspace/integrations-gemini-ai";
 *
 * const results = await batchProcess(
 *   artworks,
 *   async (artwork) => {
 *     const response = await ai.models.generateContent({
 *       model: "gemini-2.5-flash",
 *       contents: [{ role: "user", parts: [{ text: `Categorize: ${artwork.name}` }] }],
 *       config: { responseMimeType: "application/json" },
 *     });
 *     return JSON.parse(response.text ?? "{}");
 *   },
 *   { concurrency: 2, retries: 5 }
 * );
 * ```
 */

export interface BatchOptions {
  concurrency?: number;
  retries?: number;
  minTimeout?: number;
  maxTimeout?: number;
  onProgress?: (completed: number, total: number, item: unknown) => void;
}

export function isRateLimitError(error: unknown): boolean {
  const errorMsg = error instanceof Error ? error.message : String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: BatchOptions = {}
): Promise<R[]> {
  const {
    concurrency = 2,
    retries = 7,
    minTimeout = 2000,
    maxTimeout = 128000,
    onProgress,
  } = options;

  const limit = pLimit(concurrency);
  let completed = 0;

  const promises = items.map((item, index) =>
    limit(() =>
      pRetry(
        async () => {
          try {
            const result = await processor(item, index);
            completed++;
            onProgress?.(completed, items.length, item);
            return result;
          } catch (error: unknown) {
            if (isRateLimitError(error)) {
              throw error;
            }
            throw new AbortError(
              error instanceof Error ? error : new Error(String(error))
            );
          }
        },
        { retries, minTimeout, maxTimeout, factor: 2 }
      )
    )
  );

  return Promise.all(promises);
}

export async function batchProcessWithSSE<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  sendEvent: (event: { type: string; [key: string]: unknown }) => void,
  options: Omit<BatchOptions, "concurrency" | "onProgress"> = {}
): Promise<R[]> {
  const { retries = 5, minTimeout = 1000, maxTimeout = 15000 } = options;

  sendEvent({ type: "started", total: items.length });

  const results: R[] = [];
  let errors = 0;

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    sendEvent({ type: "processing", index, item });

    try {
      const result = await pRetry(
        () => processor(item, index),
        {
          retries,
          minTimeout,
          maxTimeout,
          factor: 2,
          onFailedAttempt: (error) => {
            if (!isRateLimitError(error)) {
              throw new AbortError(
                error instanceof Error ? error : new Error(String(error))
              );
            }
          },
        }
      );
      results.push(result);
      sendEvent({ type: "progress", index, result });
    } catch (error) {
      errors++;
      results.push(undefined as R);
      sendEvent({
        type: "progress",
        index,
        error: error instanceof Error ? error.message : "Processing failed",
      });
    }
  }

  sendEvent({ type: "complete", processed: items.length, errors });
  return results;
}

```

---

## `lib/integrations-gemini-ai/src/client.ts`

```
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  throw new Error("GOOGLE_AI_API_KEY must be set.");
}

export const ai = new GoogleGenAI({ apiKey });

```

---

## `lib/integrations-gemini-ai/src/image/client.ts`

```
import { ai } from "../client";

export const IMAGE_MODELS: Record<string, string> = {
  "nano-banana":     "gemini-2.0-flash-preview-image-generation",
  "nano-banana-pro": "gemini-2.0-flash-preview-image-generation",
};

export const TEXT_MODELS: Record<string, string> = {
  "flash":      "gemini-2.5-flash",
  "pro":        "gemini-2.5-pro",
  "flash-2":    "gemini-2.0-flash",
  "flash-lite": "gemini-2.0-flash-lite",
};

export async function generateImage(
  prompt: string,
  modelAlias = "nano-banana",
): Promise<{ b64_json: string; mimeType: string; model: string }> {
  const model = IMAGE_MODELS[modelAlias] ?? IMAGE_MODELS["nano-banana"];
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseModalities: ["IMAGE", "TEXT"] },
  });
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data && part.inlineData?.mimeType) {
      return { b64_json: part.inlineData.data, mimeType: part.inlineData.mimeType, model };
    }
  }
  throw new Error("No image data returned by Gemini");
}

export async function generateText(
  prompt: string,
  modelAlias = "flash",
  systemInstruction?: string,
): Promise<{ text: string; model: string }> {
  const model = TEXT_MODELS[modelAlias] ?? TEXT_MODELS["flash"];
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      maxOutputTokens: 8192,
      ...(systemInstruction ? { systemInstruction } : {}),
    },
  });
  return { text: response.text ?? "", model };
}

```

---

## `lib/integrations-gemini-ai/src/image/index.ts`

```
export { generateImage, generateText, IMAGE_MODELS, TEXT_MODELS } from "./client";

```

---

## `lib/integrations-gemini-ai/src/index.ts`

```
export { ai } from "./client";
export { generateImage, generateText, IMAGE_MODELS, TEXT_MODELS } from "./image/client";
export { batchProcess, batchProcessWithSSE, isRateLimitError, type BatchOptions } from "./batch";

```

---

## `docs/ANUBIS-IVIS-HANDOFF.md`

```
# ANUBIS — Interactive Video Intelligence System (IVIS)
## Speculative Architecture & Feature Handoff Document
**Version:** 0.1-DRAFT  
**Origin artifact:** `Ψ-TERMINAL ASCENT` (psi-ascent) + `Ω-REEL` (omega-gram)  
**Classification:** Extrapolative Engineering Spec — Near-term proven, long-term speculative  

---

## 0. What This Document Is

This is a forward-looking engineering handoff that starts from **what we have already proven works** (programmatic cinematic video in React/Three.js), extrapolates through a series of concretely implementable phases, and arrives at a speculative but technically grounded vision: **a system where answers to questions materialize in real time as cinematic video, driven by a Liquid Neuron Network renderer.**

Every section is marked with a feasibility tag:
- `[NOW]` — Already built or trivially buildable this week
- `[NEAR]` — 1–6 weeks, clear implementation path
- `[MID]` — 2–4 months, requires new primitives
- `[FAR]` — 6–18 months, requires ML infrastructure
- `[SPECULATIVE]` — Moonshot, described for architectural coherence

---

## 1. Origin Proof: What Ψ-TERMINAL ASCENT Demonstrates

The psi-ascent artifact proves a core thesis: **cinematic video can be authored entirely in JavaScript**, rendered in-browser, driven by data, and made interactive without any video file format.

### 1.1 What was built

```
7 → 10 scenes | 110s → 91s runtime | 9:16 portrait format
React + Framer Motion + Three.js/R3F + Tailwind
Scene components: particle field, 3D geometry, impact, matrix rain,
                  fibonacci spiral, black hole accretion, quantum wave
Scene router: useVideoPlayer hook → scene key → component
Control layer: scene jumping, loop lock, progress segments
```

### 1.2 The key architectural insight

A "video" in this system is just a **React component tree gated by time**. This means:
- Scenes are **swappable at runtime** — not compiled frames
- Content (headlines, equations, colors) is **data, not pixels**
- The renderer is the **browser GPU** — zero encoding, zero storage
- The scene grammar is **extensible** — new scene kinds = new components

### 1.3 What this unlocks for Anubis

The same renderer that plays a pre-authored 91s cinematic can be made to:
1. Accept a `VideoManifest` JSON and render it on the fly
2. Stream scene configs from an AI and render them as they arrive
3. Respond to user input mid-render (interactive hotspots)
4. Dynamically extend the timeline based on follow-up questions

This is the foundation. Everything below builds on it.

---

## 2. The Vision: Answer-as-Video `[MID → FAR]`

### 2.1 The Experience

User types into Anubis:

> *"How does a black hole form from a dying star?"*

As they type, the system begins generating. By the time they hit enter:
- A 9:16 canvas is already rendering a stellar nebula particle field
- The scene sequence populates left-to-right: stellar nursery → red giant → supernova → collapse → accretion disk → event horizon
- Each scene's headline, stat, and color palette are AI-generated and match the question
- The user can **pause, rewind, click into a scene** to ask a follow-up — which immediately appends new scenes to the end of the timeline

This is not a video player. It is a **generative cinematic reasoning engine**.

### 2.2 Why This Is Technically Coherent (Not Magic)

The rendering cost is negligible — it's CSS/WebGL, not video decoding. The latency bottleneck is entirely AI inference, and we can pipeline it: **start rendering scene 1 while generating scenes 2–N**. The "video" is just a queue of `SceneBlueprint` objects consumed by the existing renderer.

The speculative part is not rendering — it's getting the AI to generate high-quality `SceneBlueprint` JSON reliably. That is a **fine-tuning / structured output** problem, solvable with the right prompt engineering and schema validation.

---

## 3. VideoManifest System — The Core Abstraction `[NOW]`

### 3.1 Schema

```typescript
// The atomic unit — one cinematic moment
interface SceneBlueprint {
  key: string;              // unique within manifest
  kind: SceneKind;          // maps to a renderer component
  duration: number;         // ms
  headline: string;         // primary text overlay
  subline?: string;         // secondary text
  stat?: string;            // formula, number, equation
  palette?: {
    primary?: string;       // CSS hex — glow/accent color
    secondary?: string;     // CSS hex — secondary accent
    bg?: string;            // CSS hex — scene background
  };
  config?: Record<string, unknown>; // kind-specific params
  interactive?: InteractiveHotspot[];
}

// Available scene kind renderers
type SceneKind =
  | 'title'             // Intro card — logo, headline, particle burst
  | 'particle-field'    // N-body particle system (configurable density/color)
  | 'geometry-3d'       // Three.js geometry (sphere, torus, dodecahedron, etc.)
  | 'impact'            // High-energy clash — shockwave, chromatic aberration
  | 'matrix-rain'       // Digital rain + equation overlay
  | 'spiral'            // Golden/logarithmic/Archimedean spiral
  | 'orbital'           // Orbital mechanics — accretion, gravitational lensing
  | 'wave-function'     // Interference pattern, Schrödinger, probability density
  | 'terrain'           // Procedural landscape / displacement mesh
  | 'network-graph'     // Force-directed node graph (synapses, relationships)
  | 'timeline'          // Historical timeline with animated markers
  | 'data-pulse'        // Animated data visualization (bar, line, area)
  | 'outro';            // End card — branding + CTA

// The full video — a self-contained specification
interface VideoManifest {
  id: string;
  title: string;
  subtitle: string;
  category: VideoCategory;
  palette: { primary: string; secondary: string; bg: string };
  scenes: SceneBlueprint[];
  meta?: {
    prompt?: string;        // The question that generated this
    model?: string;         // AI model used
    generatedAt?: string;   // ISO timestamp
    iterationCount?: number;
  };
}

type VideoCategory =
  | 'sacred-geometry' | 'cosmos' | 'biology'
  | 'philosophy' | 'technology' | 'history'
  | 'mathematics' | 'chemistry' | 'linguistics'
  | 'economics' | 'custom';

interface InteractiveHotspot {
  id: string;
  trigger: 'click' | 'hover' | 'viewport';
  region: { x: number; y: number; w: number; h: number }; // 0–1 normalized
  action: 'pause' | 'branch' | 'expand' | 'link';
  payload?: string; // follow-up prompt, URL, etc.
}
```

### 3.2 The Scene Registry

The scene registry is a `Map<SceneKind, React.ComponentType<SceneProps>>`. Adding a new visual capability is just adding a new entry. The manifest is the API surface; the component library is the implementation.

```typescript
// artifacts/omega-gram/src/lib/scene-registry.ts
import { GenericTitle } from '@/components/scenes/GenericTitle';
import { GenericParticleField } from '@/components/scenes/GenericParticleField';
import { GenericGeometry3D } from '@/components/scenes/GenericGeometry3D';
// ... etc.

export const SCENE_REGISTRY: Map<SceneKind, React.ComponentType<SceneBlueprint>> = new Map([
  ['title', GenericTitle],
  ['particle-field', GenericParticleField],
  ['geometry-3d', GenericGeometry3D],
  ['matrix-rain', GenericMatrixRain],
  ['spiral', GenericSpiral],
  ['orbital', GenericOrbital],
  ['wave-function', GenericWaveFunction],
  ['network-graph', GenericNetworkGraph],
  ['outro', GenericOutro],
]);
```

The existing `psi-ascent` scenes are **specialized, high-fidelity instances** of these generic kinds. The Forge/player uses generic renderers; psi-ascent is a hand-crafted showpiece.

---

## 4. The Forge — Video Factory UI `[NOW → NEAR]`

### 4.1 What It Is

A page in Anubis where a user:
1. Selects a category or pastes a prompt
2. Reviews the AI-generated (or manually composed) manifest
3. Customizes palette, scene order, durations
4. Hits "Render" → sees the video play back immediately
5. Iterates — adds scenes, changes content, re-renders

### 4.2 Forge Page Architecture

```
/forge
  ├── CategoryPicker          — grid of VideoCategory cards with accent colors
  ├── ManifestEditor          — ordered list of SceneBlueprint rows
  │     ├── SceneRow          — kind picker, duration slider, headline/stat inputs
  │     └── DurationBar       — visual timeline showing relative scene lengths
  ├── PaletteEditor           — primary/secondary/bg color pickers + preview swatch
  ├── PreviewPane             — embedded ManifestPlayer iframe (live re-renders)
  └── ActionBar               — Save · Export JSON · Share · Publish
```

### 4.3 ManifestPlayer Component

```typescript
// artifacts/omega-gram/src/components/ManifestPlayer.tsx
// Renders any VideoManifest using the scene registry + useVideoPlayer hook

interface ManifestPlayerProps {
  manifest: VideoManifest;
  interactive?: boolean;
  onSceneClick?: (scene: SceneBlueprint, hotspot?: InteractiveHotspot) => void;
}
```

The player is the same `useVideoPlayer` hook already built in psi-ascent, but instead of hardcoded scene components it looks up the registry.

---

## 5. Generative Pipeline — AI → Manifest → Video `[NEAR → MID]`

### 5.1 The Prompt → Manifest Flow

```
User Input (question/topic)
         │
         ▼
  ┌─────────────────────────────────────┐
  │  ManifestGeneratorService           │
  │  POST /api/manifest/generate        │
  │                                     │
  │  1. System prompt: scene grammar    │
  │     + category palette library      │
  │     + SceneBlueprint JSON schema    │
  │                                     │
  │  2. Gemini 2.5 Flash (structured    │
  │     output / JSON mode)             │
  │                                     │
  │  3. Schema validation (Zod)         │
  │  4. Duration normalization          │
  │  5. Palette coherence check         │
  └─────────────────────────────────────┘
         │
         ▼ SSE stream: scene by scene
  ┌──────────────────────┐
  │  ManifestPlayer      │  ← begins rendering scene 1
  │  scene queue: []     │    while scenes 2–N still
  │  streaming: true     │    generating
  └──────────────────────┘
```

### 5.2 Scene-by-Scene Streaming

The key UX insight: don't wait for the full manifest. Stream `SceneBlueprint` objects one at a time via SSE. The player starts rendering scene 1 the moment it arrives. By the time scene 1 finishes playing (7–10s), scenes 2–4 have generated. The experience feels instantaneous.

```typescript
// API route: POST /api/manifest/generate → SSE
// Event types:
// { type: 'manifest_start', id: string, category, palette }
// { type: 'scene', blueprint: SceneBlueprint }
// { type: 'manifest_complete', totalScenes: number, totalDuration: number }
// { type: 'error', message: string }
```

### 5.3 System Prompt Engineering for Scene Generation

The quality of the manifest depends on the system prompt. Critical elements:
- **Scene grammar** — exhaustive description of each `SceneKind` and when to use it
- **Narrative arc patterns** — tension → release → revelation → synthesis
- **Palette psychology** — color choices that match emotional tone of the topic
- **Pacing rules** — title ≤ 8s, feature scenes 9–14s, outro ≤ 8s, total 60–120s
- **Anti-patterns** — avoid repeating the same kind consecutively, no more than 2 geometry-3d in a row
- **Stat formatting** — equations in Unicode math notation, numbers with SI prefixes

### 5.4 Structured Output Schema (Zod)

```typescript
const sceneBlueprintSchema = z.object({
  key: z.string().min(2).max(32).regex(/^[a-z0-9-]+$/),
  kind: z.enum(['title','particle-field','geometry-3d','impact',
                'matrix-rain','spiral','orbital','wave-function',
                'network-graph','timeline','data-pulse','outro']),
  duration: z.number().int().min(5000).max(20000),
  headline: z.string().max(40),
  subline: z.string().max(80).optional(),
  stat: z.string().max(30).optional(),
  palette: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    bg: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
});

const videoManifestSchema = z.object({
  title: z.string().max(60),
  subtitle: z.string().max(100),
  category: z.enum([...CATEGORIES]),
  palette: paletteSchema,
  scenes: z.array(sceneBlueprintSchema).min(3).max(16),
});
```

---

## 6. Liquid Neuron Network (LNN) Rendering Engine `[MID → SPECULATIVE]`

### 6.1 The Concept

The LNN is the most speculative piece — but it has a clear implementation trajectory. The idea: instead of discrete scene components (Scene1, Scene2...), the video surface is a **continuous fluid canvas** where neural-network-like nodes and edges form, morph, and dissolve to represent information.

Think of it as the **visual language of thought**: a question enters the system, and the canvas reacts like a living organism — neurons fire, connections form, patterns crystallize into knowledge structures, then dissolve into the next idea.

### 6.2 The Three Layers

```
Layer 3: Semantic Overlay        ← Text, equations, labels
Layer 2: Topology Layer          ← Node graph, edge weights, clusters  
Layer 1: Liquid Field            ← Particle fluid, react-three-fiber
```

**Layer 1 — Liquid Field** `[NEAR]`

A particle system (WGSL compute shader or CPU fallback) where 2,000–8,000 particles flow according to:
- A base vector field (curl noise, Perlin flow)
- Attractor points that correspond to **semantic concepts**
- Repulsor points that create visual separation between ideas
- Color gradients that encode semantic category (biology = green, cosmos = cyan, etc.)

This layer is always running. It is the "resting brain state" of Anubis.

```glsl
// WGSL compute pass — particle update
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if i >= uniforms.count { return; }
  
  let pos = positions[i];
  let vel = velocities[i];
  
  // Curl noise vector field
  let n = curl_noise(pos.xy * uniforms.scale + uniforms.time * 0.1);
  
  // Semantic attractor pull
  var attract = vec2f(0.0);
  for (var j = 0u; j < uniforms.attractorCount; j++) {
    let a = attractors[j];
    let d = distance(pos.xy, a.position);
    let strength = a.weight * exp(-d * d * 0.5);
    attract += normalize(a.position - pos.xy) * strength;
  }
  
  let new_vel = vel * uniforms.damping + (n + attract) * uniforms.dt;
  velocities[i] = new_vel;
  positions[i] = pos + vec4f(new_vel, 0.0, 0.0);
}
```

**Layer 2 — Topology Layer** `[MID]`

A force-directed graph rendered in WebGL (or SVG for simpler cases) where:
- **Nodes** = concepts extracted from the AI response
- **Edges** = semantic relationships (is-a, causes, contains, contradicts)
- **Node size** = importance weight from AI
- **Edge thickness** = relationship strength
- **Pulse animations** = information flow direction

The graph is generated from the AI response alongside the manifest. It renders as a semi-transparent overlay on the liquid field. As scenes advance, different node clusters light up.

```typescript
interface SemanticGraph {
  nodes: Array<{
    id: string;
    label: string;
    category: string;
    weight: number;       // 0–1, affects size
    position?: [number, number]; // normalized, auto-placed if absent
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: 'causes' | 'contains' | 'opposes' | 'defines' | 'enables';
    strength: number;     // 0–1, affects thickness
  }>;
  activeNodeIds?: string[]; // which nodes are highlighted in current scene
}
```

**Layer 3 — Semantic Overlay** `[NOW]`

This is what already exists: Framer Motion text overlays, stat badges, equation rendering. In the LNN system, these become anchored to graph nodes rather than positioned absolutely in scene components.

### 6.3 Liquid Neuron Transitions

Instead of scene cuts, the LNN system has **state transitions**:
- New attractors are added at the positions of the next scene's key concepts
- The particle field flows toward them over 1.5–2.5s
- Text fades in as the particle density reaches a threshold at attractor positions
- The previous scene's attractors gradually lose weight and dissolve

This creates a seamless, continuous visual that feels like watching a mind think.

### 6.4 Implementation Trajectory

```
Phase A [NEAR]:   
  WebGL particle system (react-three-fiber) with CPU-side 
  attractor updates. 500 particles, 3 attractors max.
  Smooth but basic.

Phase B [MID]:
  WGSL compute shader for 4,000 particles.
  Force-directed graph overlay with d3-force.
  Scene-driven attractor configs.

Phase C [MID-FAR]:  
  Full semantic graph from AI.
  Particle field reacts to graph topology in real time.
  Color mapping to semantic category.
  8,000+ particles at 60fps (M1+ / RTX20+).

Phase D [FAR]:
  WebGPU ML inference runs attractor prediction locally.
  Particle field "predicts" next concept before AI confirms it.
  Perceived zero-latency response.

Phase E [SPECULATIVE]:  
  Trained latent space: concept vectors map directly to
  particle field configurations. The visual IS the embedding.
```

---

## 7. Real-Time Q&A Visualization `[MID]`

### 7.1 The Interaction Model

```
┌──────────────────────────────────────────────┐
│  Anubis                              [9:16]  │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │     [LNN Canvas — always running]      │  │
│  │     particles drift, neurons idle      │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │  Ask anything...              [Send]   │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Keystroke → Prediction `[FAR]`**: As the user types, the system sends partial queries to a lightweight embedding model. Top-3 predicted categories are returned, and the LNN particle field shifts its global hue toward the predicted category's color. By the time the user hits send, the visual is already primed.

**Send → Stream → Render `[MID]`**: 
1. Full query sent to Gemini with structured output schema
2. SSE stream returns: `manifest_start` → palette applied immediately
3. First `scene` blueprint arrives (< 500ms) → rendering begins
4. Subsequent blueprints arrive as the first scene plays
5. User sees a fully coherent, themed video for their specific question

**Interactive Branching `[MID]`**:
- Pause on any scene → click-to-ask overlay appears
- User types follow-up → new scenes appended to timeline
- The video never ends; it extends as long as curiosity does
- The semantic graph updates in Layer 2 with new nodes

### 7.2 The Timeline Model

```typescript
interface LiveTimeline {
  committed: SceneBlueprint[];   // already played / confirmed
  pending: SceneBlueprint[];     // generated, not yet playing
  generating: boolean;           // true if AI still producing
  cursor: number;                // current position (ms)
  branches: Array<{
    atSceneKey: string;
    question: string;
    manifest: VideoManifest;
  }>;
}
```

The timeline is append-only. Users can scrub back into committed scenes, pause on pending scenes, and branch from any point. Each branch is a new manifest rooted at the branch point.

---

## 8. Anubis App Architecture `[NOW → MID]`

### 8.1 New Routes to Add

```typescript
// In Anubis App.tsx Router:
<Route path="/forge"           component={ForgePage} />
<Route path="/forge/:id"       component={ForgeEditorPage} />
<Route path="/player/:id"      component={PlayerPage} />
<Route path="/ask"             component={AskPage} />           // real-time Q&A
<Route path="/library"         component={LibraryPage} />       // saved manifests
```

### 8.2 New API Endpoints Needed

```
POST   /api/manifest/generate           # prompt → SSE stream of SceneBlueprints
GET    /api/manifest/:id                # retrieve saved manifest
POST   /api/manifest                    # save manifest
PUT    /api/manifest/:id                # update manifest
DELETE /api/manifest/:id                # delete manifest

POST   /api/manifest/:id/branch         # create branch from scene key
POST   /api/manifest/from-template      # clone preset + apply customizations

POST   /api/semantic/graph              # extract concept graph from AI response
GET    /api/semantic/categories         # list category palettes
```

### 8.3 New Database Tables

```sql
-- Saved manifests
CREATE TABLE manifests (
  id          TEXT PRIMARY KEY,  -- nanoid
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  palette     JSONB NOT NULL,
  scenes      JSONB NOT NULL,    -- SceneBlueprint[]
  meta        JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Manifest branches (fork tree)
CREATE TABLE manifest_branches (
  id              TEXT PRIMARY KEY,
  parent_id       TEXT REFERENCES manifests(id),
  branch_at_key   TEXT NOT NULL,    -- scene key where branch originates
  question        TEXT,
  manifest_id     TEXT REFERENCES manifests(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Semantic graphs linked to manifests
CREATE TABLE semantic_graphs (
  manifest_id  TEXT PRIMARY KEY REFERENCES manifests(id),
  nodes        JSONB NOT NULL,
  edges        JSONB NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.4 New Shared Library: `lib/video-manifest`

```
lib/video-manifest/
  src/
    types.ts          # SceneBlueprint, VideoManifest, SemanticGraph, etc.
    schema.ts         # Zod validation schemas
    presets.ts        # Built-in preset manifests (psi-ascent, cosmos-drift, bio-ascension)
    palette.ts        # Category → palette mapping
    duration.ts       # Duration calculation utilities
    index.ts          # barrel
  package.json
```

### 8.5 New Shared Library: `lib/lnn-renderer` `[MID]`

```
lib/lnn-renderer/
  src/
    LNNCanvas.tsx           # Top-level React component — the always-on canvas
    ParticleSystem.tsx      # R3F particle system with WGSL/CPU fallback
    AttractorManager.ts     # Manages attractor positions/weights per scene
    TopologyGraph.tsx       # Force-directed semantic graph overlay
    SemanticOverlay.tsx     # Framer Motion text layer anchored to graph nodes
    shaders/
      particles.wgsl        # WebGPU compute pass (with WebGL fallback)
      render.wgsl           # Render pass
    hooks/
      useLNNState.ts        # Global LNN state (attractors, particle config)
      useSemanticGraph.ts   # Manages graph updates on scene change
    index.ts
  package.json
```

---

## 9. Component Design Patterns

### 9.1 Generic Scene Component Interface

```typescript
// All generic scene components follow this interface
interface SceneProps extends SceneBlueprint {
  // From SceneBlueprint: key, kind, duration, headline, subline, stat, palette, config
  
  // Runtime injection
  isActive: boolean;
  elapsed: number;         // ms since scene start
  progress: number;        // 0–1
  onHotspotTrigger?: (hotspot: InteractiveHotspot) => void;
}
```

### 9.2 Scene Component Template

```typescript
// Template every new scene component should follow
export function GenericSomething({ headline, subline, stat, palette, config, elapsed }: SceneProps) {
  // 1. Phase system — drive internal states from elapsed
  const phase = elapsed < 800 ? 0 : elapsed < 2000 ? 1 : elapsed < 4000 ? 2 : 3;
  
  // 2. Use palette for all colors — never hardcode
  const { primary = '#FF3366', secondary = '#00FFCC', bg = '#050005' } = palette ?? {};
  
  // 3. CSS custom properties injection — propagate to children
  const style = {
    '--scene-primary': primary,
    '--scene-secondary': secondary,
    '--scene-bg': bg,
    background: bg,
  } as React.CSSProperties;
  
  // 4. Standard enter/exit animations
  return (
    <motion.div
      className="absolute inset-0 z-30 overflow-hidden flex flex-col items-center justify-center"
      style={style}
      {...sceneTransitions.fadeBlur}  // from lib/video/animations
    >
      {/* content */}
    </motion.div>
  );
}
```

### 9.3 The Attractor Config Pattern (LNN integration)

Every `SceneBlueprint` will eventually include `attractors` — positions and weights for the LNN particle system. This is backward compatible (missing = auto-generated from headline embeddings):

```typescript
interface SceneBlueprint {
  // ... existing fields ...
  attractors?: Array<{
    concept: string;          // label
    position: [number, number]; // 0–1 normalized canvas position
    weight: number;           // 0–1 pull strength
    radius: number;           // influence radius
    color?: string;           // override particle color in this zone
  }>;
}
```

---

## 10. Category Palette Library

Each `VideoCategory` gets a canonical palette that is psychologically and aesthetically coherent:

```typescript
export const CATEGORY_PALETTES: Record<VideoCategory, Palette> = {
  'sacred-geometry': { primary: '#FF3366', secondary: '#00FFCC', bg: '#050002', name: 'Crimson Oracle' },
  'cosmos':          { primary: '#00FFCC', secondary: '#0055FF', bg: '#000005', name: 'Deep Field' },
  'biology':         { primary: '#39FF14', secondary: '#FF6B00', bg: '#000a00', name: 'Chlorophyll' },
  'philosophy':      { primary: '#B8A0FF', secondary: '#FF88AA', bg: '#08000f', name: 'Violet Mind' },
  'technology':      { primary: '#00B4FF', secondary: '#FF3366', bg: '#000810', name: 'Cyan Voltage' },
  'history':         { primary: '#FFB800', secondary: '#FF3366', bg: '#0a0500', name: 'Amber Archive' },
  'mathematics':     { primary: '#FFFFFF', secondary: '#00FFCC', bg: '#000000', name: 'Zero Point' },
  'chemistry':       { primary: '#FF6B35', secondary: '#00FFB3', bg: '#050300', name: 'Valence' },
  'linguistics':     { primary: '#FF88FF', secondary: '#FFFF00', bg: '#050005', name: 'Glossolalia' },
  'economics':       { primary: '#00FF88', secondary: '#FF3366', bg: '#000805', name: 'Market Green' },
  'custom':          { primary: '#FFFFFF', secondary: '#888888', bg: '#111111', name: 'Custom' },
};
```

---

## 11. Phased Implementation Roadmap

### Phase 1 — Video Factory `[NOW: 1–2 days]`

**Deliverable:** The Forge page in Anubis where a user selects a category and creates/edits a `VideoManifest` manually, then renders it in a ManifestPlayer.

- [ ] `lib/video-manifest/` package (types, schema, presets, palette)
- [ ] `GenericTitle`, `GenericParticleField`, `GenericSpiral`, `GenericOrbital`, `GenericWaveFunction`, `GenericOutro` scene components
- [ ] `ManifestPlayer` component (uses scene registry + useVideoPlayer)
- [ ] `/forge` page in Anubis
- [ ] `/player/:id` route

**Success metric:** 3 preset manifests (Ψ-TERMINAL, Cosmos Drift, Bio Ascension) render correctly through the generic ManifestPlayer.

### Phase 2 — AI Manifest Generation `[NEAR: 1–2 weeks]`

**Deliverable:** User types a question, AI generates a VideoManifest, ManifestPlayer renders it.

- [ ] `POST /api/manifest/generate` — Gemini structured output → SceneBlueprint SSE stream
- [ ] Zod validation + palette coherence normalization
- [ ] Scene-by-scene streaming to frontend
- [ ] ManifestPlayer streaming mode (renders as blueprints arrive)
- [ ] `/ask` page with textarea + live player
- [ ] `manifests` DB table + save/load

**Success metric:** "How does photosynthesis work?" generates a coherent 6-scene bio manifest and renders it in < 3s perceived latency.

### Phase 3 — Interactive Branching `[NEAR-MID: 2–4 weeks]`

**Deliverable:** User can click any scene during playback to ask a follow-up, which appends new scenes.

- [ ] `InteractiveHotspot` system in ManifestPlayer
- [ ] Timeline model with `committed` / `pending` / `generating` states
- [ ] Branch API and `manifest_branches` table
- [ ] Visual branch indicator (scene segments that show "branched from here")
- [ ] Library page with manifest history + branch tree visualization

**Success metric:** Starting from a cosmos manifest, user branches 3 times, each branch generating a coherent extension of the narrative.

### Phase 4 — Liquid Neuron Field `[MID: 4–8 weeks]`

**Deliverable:** The LNN particle system as the video background. Attractors are driven by scene blueprints.

- [ ] `lib/lnn-renderer/` package
- [ ] `LNNCanvas` component (R3F + CPU particle system, 1,000 particles)
- [ ] `AttractorManager` — scene-driven attractor lifecycle
- [ ] `TopologyGraph` — d3-force graph overlay from semantic graph
- [ ] `POST /api/semantic/graph` — extract concept graph from AI
- [ ] LNN integrated as background layer in ManifestPlayer

**Success metric:** Playing any manifest, particles visibly flow toward scene-relevant positions. Scene transitions feel continuous rather than cut-based.

### Phase 5 — Real-Time LNN Response `[FAR: 2–4 months]`

**Deliverable:** Particle field reacts during query typing (predicted category hue shift). First visual frame appears before AI responds.

- [ ] Client-side embedding model (transformers.js) for keystroke prediction
- [ ] Predicted category → particle field hue shift (< 100ms)
- [ ] WGSL compute shader for 4,000+ particles
- [ ] Semantic graph updates propagated to LNN in real time during streaming

**Success metric:** Measurable reduction in "blank canvas time" before video starts. Target: 0ms perceived delay from keystroke to visual response.

### Phase 6 — Trained Visual Encoder `[SPECULATIVE: 6–18 months]`

**Deliverable:** A small model maps semantic content directly to attractor configs. The visual language is learned, not rule-based.

- [ ] Dataset: N thousand `(SceneBlueprint, attractor_config)` pairs
- [ ] Fine-tune embedding model to predict attractor layout from text
- [ ] Replace rule-based AttractorManager with inference
- [ ] Real-time on-device inference via ONNX / WebGPU ML

**Success metric:** The particle field accurately anticipates scene content, making transitions feel predictive rather than reactive.

---

## 12. Open Questions & Risks

### Technical

| Question | Risk Level | Notes |
|----------|-----------|-------|
| WebGPU browser support | Medium | Chrome/Edge ok, Safari 2024+, Firefox partial. Ship WebGL fallback. |
| Structured output reliability from Gemini | High | JSON schema adherence degrades with complex schemas. Mitigation: Zod + retry + graceful fallback to simpler schema. |
| 60fps particle system on mobile | Medium | Cap at 500 particles on mobile UA detection. CSS fallback mode. |
| SSE streaming across proxy/CDN | Low | Already proven in Gemini chat route. Add reconnect logic. |
| Manifest storage costs at scale | Low | JSONB manifests are tiny (~5–20KB each). 1M manifests = ~10GB. Fine. |

### Product

| Question | Notes |
|----------|-------|
| How long should generated videos be? | Research shows 60–90s is optimal for attention. Make it configurable; default to 75s. |
| Should manifests be shareable? | Yes. Short URL → manifest ID → player page. No auth required for viewing. |
| Watermarking AI-generated video? | Visual watermark in outro scene. Optional, toggle per plan tier. |
| Export to actual video file? | MediaRecorder API can capture canvas. Resolution-limited but works. Phase 2 bonus. |

### Design

| Question | Notes |
|----------|-------|
| What does "idle" LNN look like? | Slow, low-energy curl noise. Barely perceptible movement. Should feel like breathing. |
| How do we communicate "generating"? | Particle field accelerates + brightens. Loading is a visual state, not a spinner. |
| Scene count UX | 10+ scenes feels exhausting without branching. Default 5–7 for generated, unlimited for branching. |

---

## 13. Quick Reference — Key Files to Know

### psi-ascent (reference implementation)
```
src/components/video/VideoTemplate.tsx     # Scene registry + SCENE_DURATIONS
src/components/video/VideoWithControls.tsx # Control bar + jump/lock
src/components/video/useSceneControls.ts   # Scene state machine
src/components/video/video_scenes/         # 10 scene components (S1–S10 + S7 outro)
src/lib/video/hooks.ts                     # useVideoPlayer — core timing engine
src/lib/video/animations.ts               # Springs, easings, scene transitions, element anims
```

### omega-gram (Anubis home)
```
src/App.tsx                  # Router — add /forge /player /ask /library here
src/pages/home.tsx           # Home — add Forge + Ask buttons here
src/pages/studio.tsx         # Gemini Studio — chat/image/text tabs
src/lib/reel-store.tsx       # Global state
```

### api-server
```
src/routes/index.ts          # Mount new manifest/semantic routers here
src/routes/gemini.ts         # SSE streaming pattern to follow for manifest generation
```

### shared libs
```
lib/db/src/schema/           # Add manifests, manifest_branches, semantic_graphs tables
lib/integrations-gemini-ai/  # ai client — use for manifest generation
```

---

## 14. The Big Idea, Simply Put

Right now we have a **pre-authored 91-second cinematic** that proves the renderer works.

The near-term goal is to make that same renderer accept **AI-generated instructions** in real time, so every question gets its own cinematic.

The mid-term goal is to make the **canvas itself alive** — a liquid field of particles that thinks with the user, not just plays for them.

The long-term speculation is that the **visual and the knowledge become the same thing**: the particle configuration at any moment *is* the semantic state of the conversation, and the user can literally see ideas connect, conflict, and crystallize.

That's the Anubis vision. Everything above is the implementation path.

---

*Document status: v0.1-DRAFT — intended for engineering handoff, architecture review, and roadmap planning. All `[SPECULATIVE]` sections are intentionally aspirational; technical feasibility has been assessed but not validated.*

```
