# Distributed Systems Visual Lab

Interactive, frontend-only simulations for distributed systems concepts. The first module is a Kafka-like event streaming simulator (producers, partitions, consumer groups, lag, metrics).

Built with [Next.js](https://nextjs.org) (App Router), React, TypeScript, Tailwind CSS, and Zustand.

## Prerequisites

- [Node.js](https://nodejs.org/) 20.x or newer (recommended for this Next.js version)

## Run locally

From the project root:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The dev server uses hot reload when you edit files under `app/`.

## Other commands

| Command        | Description                                      |
| -------------- | ------------------------------------------------ |
| `npm run dev`  | Start the development server (default port 3000) |
| `npm run build` | Create an optimized production build             |
| `npm run start` | Run the production server (run `build` first)  |
| `npm run lint`  | Run ESLint                                       |

## Deploy

You can host this like any Next.js app (for example [Vercel](https://vercel.com) or a Node host running `npm run build` and `npm run start`). See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for options and environment notes.
