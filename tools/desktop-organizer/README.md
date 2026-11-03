# Desktop organizer

One command that turns a messy Desktop into this:

```
Desktop/
├── 00-INDEX.md          ← every project described: stack, git remote, branch, last commit, size, secrets inside
├── Projects/            ← one folder per project (git repo, package.json, pyproject, Cargo.toml, supabase/, …)
├── Folders/             ← plain folders that are not code
├── Documents/           ← pdf, docx, txt, md  (+ Spreadsheets/, Presentations/)
├── Images/              ← png, jpg, svg, psd, fig  (+ Screenshots/)
├── Videos/  Audio/  Archives/  Installers/  Code-Snippets/  Shortcuts/  Other/
└── .organize-desktop/   ← move logs, so every run can be undone

~/.secrets/              ← API keys, .env files, certificates, credentials. Hidden, owner-only permissions.
```

Nothing is deleted, nothing moves without `--apply`, every move is logged and reversible,
and secret values are never printed or written into the index (only file names).

## Run it

**macOS / Linux** (Python 3 is already installed on macOS):

```bash
python3 organize_desktop.py            # dry run: shows the plan, writes a preview index
python3 organize_desktop.py --apply    # do it
```

Or double-click `Organize Desktop.command` (macOS) and answer `y` when the preview looks right.

**Windows** (install Python from the Microsoft Store if `python` is not found):

```bat
python organize_desktop.py
python organize_desktop.py --apply
```

Or double-click `Organize Desktop.bat`.

## Options

| Flag | Meaning |
|---|---|
| `--desktop PATH` | Desktop folder, if auto-detection picks the wrong one (OneDrive, French "Bureau", …) |
| `--secrets-dir PATH` | Where credentials go. Default `~/.secrets`. Example: `--secrets-dir "~/Desktop/.Secrets"` |
| `--no-content-scan` | Only use file names to spot secrets; skip looking inside text files |
| `--undo LOG.json` | Reverse a run. The log path is printed at the end of every `--apply` |

## How secrets are detected

- **By name:** `.env`, `.env.local`, `*.pem`, `*.key`, `*.p12`, `id_rsa`, anything containing
  `api key`, `apikey`, `secret`, `token`, `credential`, `password`, `service-account*.json`,
  `.npmrc`, `.netrc`, `.aws`, `kubeconfig`. Files ending in `.example`, `.sample`, `.template` are not secrets.
- **By content** (text files under 512 KB): private key blocks, OpenAI / Anthropic / Stripe /
  AWS / GitHub / Slack / Google / Supabase / Hugging Face / SendGrid key formats, JWTs,
  `API_KEY=…` style assignments, and database URLs with a password in them.

Loose secret files on the Desktop are moved to the secrets folder and set to owner-only
(`chmod 600` on macOS/Linux, hidden + user-only ACL on Windows). Secret files **inside a project**
are left where they are, because moving them breaks the project, and are flagged in the index so
you can confirm they are in that project's `.gitignore`.

## Re-running

Safe to run again any time. Things already inside `Projects/`, `Documents/`, etc. are left alone;
only new loose items on the Desktop are sorted, and the index is regenerated.
