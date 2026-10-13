# Security Policy

## Supported versions

Only the latest version on the default branch is supported.

## Reporting a vulnerability

Please do not report security vulnerabilities in public issues or discussions.

Use **Report a vulnerability** on the repository's **Security** tab to send a private report through GitHub Security Advisories. Include the affected version or commit, steps to reproduce, and the potential impact. If private vulnerability reporting is unavailable, contact the repository maintainers privately through their GitHub profile.

The maintainers will acknowledge reports as soon as practical, investigate them, and coordinate any fix and public disclosure with the reporter.

## Application security notes

This project is a static browser game. It has no server, account system, or API credentials. Do not add secrets to client-side code, `.env` files, repository contents, or workflow logs; values bundled into a frontend build are public. Local `.env` files are excluded by `.gitignore`.
