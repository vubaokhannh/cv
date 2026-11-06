---
title: Automating deployment with GitHub Actions and a self-hosted runner
date: 2025-12-05
summary: How Krello deploys to an Ubuntu VM on Proxmox using GitHub Actions, a self-hosted runner, SSH, PM2 and Cloudflare DNS.
tags: GitHub Actions, CI/CD, PM2, Proxmox, Cloudflare
---

A project is not really finished until other people can use it. For Krello, I wanted every change to reach production **without a manual, error-prone checklist**. I automated deployment to an **Ubuntu VM running on Proxmox** using **GitHub Actions**, a **self-hosted runner**, **SSH**, **PM2** and **Cloudflare DNS**.

This post explains how those pieces fit together and the reasoning behind each choice.

## The goal

Pushing to the main branch should, with no manual steps:

1. Run checks so a broken change does not ship.
2. Build the application.
3. Update the running service on the server.
4. Restart it without leaving the site broken.

Manual deploys fail in boring ways: forgetting a step, deploying the wrong branch, or leaving a service half-updated. Automation makes the process **repeatable**, which is the real value.

## The pieces

### Ubuntu VM on Proxmox
Instead of a managed platform, Krello runs on a virtual machine I control, hosted on **Proxmox**. That gives full control over the environment (Node, Redis, PostgreSQL, process manager) and a good chance to practice real operations work.

### GitHub Actions
GitHub Actions runs a **workflow** defined in the repository whenever something happens, such as a push. The workflow file lives next to the code, so the deploy process is **versioned and reviewable** like any other change.

### Self-hosted runner
A normal workflow runs on a machine GitHub provides. A **self-hosted runner** is a small agent you install on **your own server**, which then picks up jobs from GitHub. For a VM behind a home or private network this is convenient: the runner connects **outward** to GitHub, so you do not need to expose an inbound port for GitHub to reach your server.

### SSH
When the runner is not on the target machine, or when separating the build from the deploy, **SSH** carries the commands to the server using a key stored as an encrypted secret. Either way, the principle is the same: the pipeline authenticates with a **key, never a password**.

### PM2
**PM2** is a process manager for Node.js. It keeps the application running, restarts it if it crashes, and turns reloading the app and reading its logs into single commands. It also lets the process start again automatically after a reboot.

### Cloudflare DNS
**Cloudflare DNS** points the domain at the server and can proxy traffic, which provides TLS and shields the origin's address. It is the final link between a pushed commit and a URL people can open.

## A simplified workflow

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted        # runs on the VM itself
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Lint and build
        run: |
          npm run lint
          npm run build

      - name: Restart service
        run: pm2 reload ecosystem.config.js --update-env
```

This is a minimal illustration of the shape, not Krello's exact workflow. A real one would also handle environment variables, database migrations and the frontend and backend separately.

## Decisions worth making deliberately

### Secrets stay out of the repository
Keys, tokens and environment values go into **GitHub encrypted secrets** or into configuration on the server, never into the code. A leaked secret in git history is hard to truly remove.

### Fail early
Put **lint, type checks and tests before the deploy step**. A failing check should stop the pipeline so a broken commit never reaches the server.

### Prefer reload over a hard restart
`pm2 reload` restarts workers one by one so there is no moment when nothing is serving. For simple apps a restart is fine, but it is worth knowing the difference.

### Make migrations explicit
Database schema changes are the riskiest part of a deploy. Running them as a **deliberate step** (and keeping them backward compatible when possible) avoids a new version starting against an old schema.

### Keep a way back
Know how you would **roll back**: redeploy the previous commit, or keep the previous build around. The first time something goes wrong in production is a bad time to design this.

## Security notes for self-hosted runners

A self-hosted runner executes workflow code **on your machine**, so treat it carefully:

- Use it only for **private repositories or trusted code**. Running untrusted pull-request code on your own server is risky.
- Give the runner a **dedicated, least-privileged user**, not root.
- Keep the VM **patched** and restrict what it can reach on your network.

## What I learned

- Automating deployment is mostly about **removing the steps humans forget**.
- A boring, repeatable pipeline beats a clever one-off script.
- **Process managers** and **DNS/proxy** layers are part of the application's reliability, not afterthoughts.
- Having to operate the server myself made me design the app with **configuration, logging and restarts** in mind from the start.

## Takeaways

- Put the deploy process **in the repository** so it is versioned and reviewable.
- A **self-hosted runner** is a convenient way to deploy to a private server without opening inbound ports, if you secure it.
- Use **SSH keys and encrypted secrets**, never passwords in code.
- **Fail early, reload gracefully, and plan rollbacks.**
