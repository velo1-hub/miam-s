#!/usr/bin/env python3
"""
organize_desktop.py - tidy a messy Desktop into named project folders, sort
loose files by type, move API keys / credentials into a locked secrets folder,
and write a detailed 00-INDEX.md describing everything.

Works on macOS, Windows and Linux. Python 3.8+, standard library only.

    python3 organize_desktop.py            # DRY RUN: shows what would happen
    python3 organize_desktop.py --apply    # actually move things
    python3 organize_desktop.py --undo <log.json>   # put everything back

Safe by default: nothing moves without --apply, every move is logged so it
can be undone, nothing is ever deleted, and no secret value is ever printed
or written to the index (only file names).
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import shutil
import stat
import subprocess
import sys
from pathlib import Path

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

INDEX_NAME = "00-INDEX.md"
LOG_DIRNAME = ".organize-desktop"

# Files that live on every desktop and must be left alone.
SYSTEM_FILES = {".DS_Store", ".localized", "desktop.ini", "Thumbs.db", INDEX_NAME}

# Top-level folders the organizer creates. Anything already inside them is
# left where it is on later runs.
CATEGORY_DIRS = {
    "projects": "Projects",
    "folders": "Folders",
    "documents": "Documents",
    "spreadsheets": "Documents/Spreadsheets",
    "presentations": "Documents/Presentations",
    "images": "Images",
    "screenshots": "Images/Screenshots",
    "videos": "Videos",
    "audio": "Audio",
    "archives": "Archives",
    "installers": "Installers",
    "code": "Code-Snippets",
    "shortcuts": "Shortcuts",
    "other": "Other",
}

EXT_CATEGORY = {
    # documents
    ".pdf": "documents", ".doc": "documents", ".docx": "documents", ".odt": "documents",
    ".txt": "documents", ".md": "documents", ".rtf": "documents", ".pages": "documents",
    ".epub": "documents", ".tex": "documents",
    ".xls": "spreadsheets", ".xlsx": "spreadsheets", ".csv": "spreadsheets",
    ".numbers": "spreadsheets", ".ods": "spreadsheets",
    ".ppt": "presentations", ".pptx": "presentations", ".key": "presentations",
    ".odp": "presentations",
    # media
    ".png": "images", ".jpg": "images", ".jpeg": "images", ".gif": "images",
    ".svg": "images", ".webp": "images", ".heic": "images", ".bmp": "images",
    ".tif": "images", ".tiff": "images", ".psd": "images", ".ai": "images",
    ".fig": "images", ".sketch": "images",
    ".mp4": "videos", ".mov": "videos", ".mkv": "videos", ".webm": "videos",
    ".avi": "videos", ".m4v": "videos",
    ".mp3": "audio", ".wav": "audio", ".m4a": "audio", ".flac": "audio",
    ".aac": "audio", ".ogg": "audio",
    # bundles
    ".zip": "archives", ".tar": "archives", ".gz": "archives", ".tgz": "archives",
    ".rar": "archives", ".7z": "archives", ".bz2": "archives", ".xz": "archives",
    ".dmg": "installers", ".pkg": "installers", ".exe": "installers",
    ".msi": "installers", ".deb": "installers", ".rpm": "installers",
    ".appimage": "installers", ".apk": "installers", ".iso": "installers",
    # loose code
    ".py": "code", ".js": "code", ".mjs": "code", ".cjs": "code", ".ts": "code",
    ".tsx": "code", ".jsx": "code", ".sh": "code", ".bash": "code", ".zsh": "code",
    ".ps1": "code", ".bat": "code", ".sql": "code", ".html": "code", ".css": "code",
    ".json": "code", ".yaml": "code", ".yml": "code", ".toml": "code", ".xml": "code",
    ".go": "code", ".rs": "code", ".java": "code", ".kt": "code", ".swift": "code",
    ".c": "code", ".cpp": "code", ".h": "code", ".rb": "code", ".php": "code",
    ".ipynb": "code",
    # shortcuts
    ".lnk": "shortcuts", ".url": "shortcuts", ".webloc": "shortcuts",
    ".desktop": "shortcuts",
}

# A directory is a "project" when it contains one of these markers.
PROJECT_MARKERS = {
    ".git": "git repository",
    "package.json": "Node.js",
    "pnpm-lock.yaml": "Node.js (pnpm)",
    "yarn.lock": "Node.js (yarn)",
    "bun.lockb": "Node.js (bun)",
    "pyproject.toml": "Python",
    "requirements.txt": "Python",
    "Pipfile": "Python (pipenv)",
    "environment.yml": "Python (conda)",
    "Cargo.toml": "Rust",
    "go.mod": "Go",
    "pom.xml": "Java (Maven)",
    "build.gradle": "Java/Kotlin (Gradle)",
    "build.gradle.kts": "Kotlin (Gradle)",
    "Gemfile": "Ruby",
    "composer.json": "PHP",
    "mix.exs": "Elixir",
    "pubspec.yaml": "Flutter/Dart",
    "Package.swift": "Swift",
    "CMakeLists.txt": "C/C++ (CMake)",
    "Makefile": "Make",
    "Dockerfile": "Docker",
    "docker-compose.yml": "Docker Compose",
    "supabase": "Supabase",
    "vercel.json": "Vercel",
    "netlify.toml": "Netlify",
    "next.config.js": "Next.js",
    "next.config.mjs": "Next.js",
    "vite.config.js": "Vite",
    "vite.config.ts": "Vite",
    "angular.json": "Angular",
    "nuxt.config.ts": "Nuxt",
    "astro.config.mjs": "Astro",
    "svelte.config.js": "Svelte",
    "tsconfig.json": "TypeScript",
    "README.md": "documented project",
    ".env": "has .env",
}
PROJECT_MARKER_GLOBS = ("*.sln", "*.csproj", "*.xcodeproj", "*.xcworkspace")

# Loose files whose NAME marks them as secrets.
SECRET_NAME_PATTERNS = [
    re.compile(p, re.IGNORECASE)
    for p in (
        r"^\.env(\..+)?$",                 # .env, .env.local, .env.production
        r"\.(pem|key|p12|pfx|jks|keystore|asc|gpg|ovpn)$",
        r"^id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$",
        r"(api[_\-. ]?keys?|apikey)",
        r"secret",
        r"token",
        r"credential",
        r"passw(or)?d",
        r"service[_\-]?account.*\.json$",
        r"^\.(npmrc|netrc|pypirc|boto|aws)$",
        r"^kubeconfig",
        r"^\.?htpasswd$",
    )
]
SECRET_NAME_EXCLUDE = re.compile(r"(\.example|\.sample|\.template|\.dist)$", re.IGNORECASE)

# Content patterns that identify real credentials inside small text files.
SECRET_CONTENT_PATTERNS = [
    re.compile(p)
    for p in (
        r"-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----",
        r"\bsk-[A-Za-z0-9_\-]{20,}",                        # OpenAI / Stripe secret
        r"\bsk_(live|test)_[A-Za-z0-9]{16,}",               # Stripe
        r"\brk_(live|test)_[A-Za-z0-9]{16,}",
        r"\bAKIA[0-9A-Z]{16}\b",                            # AWS access key
        r"\bgh[pousr]_[A-Za-z0-9]{30,}",                    # GitHub tokens
        r"\bgithub_pat_[A-Za-z0-9_]{20,}",
        r"\bxox[baprs]-[A-Za-z0-9\-]{10,}",                 # Slack
        r"\bAIza[0-9A-Za-z_\-]{35}\b",                      # Google API key
        r"\bsk-ant-[A-Za-z0-9_\-]{20,}",                    # Anthropic
        r"\beyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}",  # JWT (Supabase keys)
        r"\bsbp_[A-Za-z0-9]{20,}",                          # Supabase PAT
        r"\bsb_(secret|publishable)_[A-Za-z0-9_\-]{10,}",   # Supabase new keys
        r"\bhf_[A-Za-z0-9]{20,}",                           # Hugging Face
        r"\bSG\.[A-Za-z0-9_\-]{16,}\.[A-Za-z0-9_\-]{16,}",  # SendGrid
        r"(?i)\b(api[_\-]?key|secret[_\-]?key|access[_\-]?token|auth[_\-]?token|client[_\-]?secret|private[_\-]?key|password)\b\s*[:=]\s*['\"]?[A-Za-z0-9_\-\./+]{12,}",
        r"(?i)(postgres|postgresql|mysql|mongodb(\+srv)?|redis|amqp)://[^:\s]+:[^@\s]+@",  # DSN with password
    )
]
TEXT_EXTS = {".txt", ".md", ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf",
             ".env", ".sh", ".bash", ".zsh", ".ps1", ".bat", ".py", ".js", ".mjs", ".ts",
             ".csv", ".xml", ".properties", ".rtf", ""}
MAX_CONTENT_SCAN_BYTES = 512 * 1024

SCREENSHOT_RE = re.compile(r"^(screen ?shot|screenshot|capture d['’]écran|screen recording|bildschirmfoto|snip)", re.IGNORECASE)

SKIP_DIRS_IN_PROJECT_SCAN = {"node_modules", ".git", "dist", "build", ".next", ".venv", "venv",
                             "__pycache__", "target", ".cache", "vendor", ".turbo", "coverage"}

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def default_desktop() -> Path:
    home = Path.home()
    candidates = []
    if sys.platform == "win32":
        up = os.environ.get("USERPROFILE")
        if up:
            candidates.append(Path(up) / "Desktop")
        od = os.environ.get("OneDrive")
        if od:
            candidates.append(Path(od) / "Desktop")
    else:
        xdg = os.environ.get("XDG_DESKTOP_DIR")
        if xdg:
            candidates.append(Path(os.path.expandvars(xdg)))
        for name in ("Desktop", "Bureau", "Escritorio", "Schreibtisch"):
            candidates.append(home / name)
    for c in candidates:
        if c.is_dir():
            return c
    return home / "Desktop"


def default_secrets_dir(desktop: Path) -> Path:
    # Hidden, outside Desktop, so it is never shared on screen or synced by
    # accident. Override with --secrets-dir.
    return Path.home() / ".secrets"


def human_size(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024 or unit == "TB":
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def dir_stats(path: Path, limit_files: int = 200000):
    total = 0
    count = 0
    newest = 0.0
    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS_IN_PROJECT_SCAN]
        for f in files:
            fp = Path(root) / f
            try:
                st = fp.stat()
            except OSError:
                continue
            total += st.st_size
            count += 1
            newest = max(newest, st.st_mtime)
            if count >= limit_files:
                return total, count, newest, True
    return total, count, newest, False


def git_info(path: Path):
    if not (path / ".git").exists():
        return None
    info = {}
    def run(*args):
        try:
            return subprocess.run(["git", "-C", str(path), *args], capture_output=True,
                                  text=True, timeout=5).stdout.strip()
        except (OSError, subprocess.SubprocessError):
            return ""
    info["remote"] = run("remote", "get-url", "origin")
    info["branch"] = run("rev-parse", "--abbrev-ref", "HEAD")
    info["last_commit"] = run("log", "-1", "--format=%cs %s")
    dirty = run("status", "--porcelain")
    info["dirty"] = bool(dirty)
    return info


def project_description(path: Path) -> str:
    pj = path / "package.json"
    if pj.is_file():
        try:
            data = json.loads(pj.read_text(encoding="utf-8", errors="ignore"))
            if isinstance(data, dict) and data.get("description"):
                return str(data["description"]).strip()
        except (ValueError, OSError):
            pass
    for name in ("README.md", "readme.md", "README.txt", "README"):
        rp = path / name
        if rp.is_file():
            try:
                for line in rp.read_text(encoding="utf-8", errors="ignore").splitlines():
                    s = line.strip().lstrip("#").strip()
                    if s and not s.startswith(("!", "[", "<", "|", "-", "=")):
                        return s[:160]
            except OSError:
                pass
    return ""


def detect_project(path: Path):
    """Return list of stack labels if directory looks like a project, else []."""
    labels = []
    try:
        names = {p.name for p in path.iterdir()}
    except OSError:
        return []
    for marker, label in PROJECT_MARKERS.items():
        if marker in names and label not in labels:
            labels.append(label)
    for g in PROJECT_MARKER_GLOBS:
        if any(path.glob(g)):
            labels.append({"*.sln": ".NET", "*.csproj": ".NET", "*.xcodeproj": "Xcode",
                           "*.xcworkspace": "Xcode"}[g])
    return labels


def is_secret_name(name: str) -> bool:
    if SECRET_NAME_EXCLUDE.search(name):
        return False
    return any(p.search(name) for p in SECRET_NAME_PATTERNS)


def content_has_secret(path: Path) -> bool:
    try:
        if path.suffix.lower() not in TEXT_EXTS or path.stat().st_size > MAX_CONTENT_SCAN_BYTES:
            return False
        data = path.read_bytes()
    except OSError:
        return False
    if b"\x00" in data[:4096]:
        return False
    text = data.decode("utf-8", errors="ignore")
    return any(p.search(text) for p in SECRET_CONTENT_PATTERNS)


def find_secrets_in_project(path: Path, limit=50):
    hits = []
    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS_IN_PROJECT_SCAN]
        for f in files:
            if is_secret_name(f):
                hits.append(str(Path(root, f).relative_to(path)))
                if len(hits) >= limit:
                    return hits
    return hits


def unique_destination(dest: Path) -> Path:
    if not dest.exists():
        return dest
    stem, suffix = dest.stem, dest.suffix
    if dest.is_dir() or not suffix:
        stem, suffix = dest.name, ""
    i = 2
    while True:
        cand = dest.with_name(f"{stem} ({i}){suffix}")
        if not cand.exists():
            return cand
        i += 1


def lock_down(path: Path, is_dir: bool):
    try:
        if sys.platform == "win32":
            subprocess.run(["attrib", "+h", str(path)], capture_output=True)
            # Restrict NTFS ACL to the current user only.
            user = os.environ.get("USERNAME")
            if user:
                subprocess.run(["icacls", str(path), "/inheritance:r", "/grant:r",
                                f"{user}:(OI)(CI)F" if is_dir else f"{user}:F"],
                               capture_output=True)
        else:
            os.chmod(path, stat.S_IRWXU if is_dir else (stat.S_IRUSR | stat.S_IWUSR))
    except OSError:
        pass


# --------------------------------------------------------------------------
# Planning
# --------------------------------------------------------------------------

class Plan:
    def __init__(self):
        self.moves = []        # dicts: src, dst, kind, reason
        self.projects = []     # project metadata for the index
        self.folders = []
        self.secrets = []      # loose secret files
        self.project_secret_hits = {}  # project name -> [relative paths]
        self.counts = {}
        self.skipped = []

    def add(self, src: Path, dst: Path, kind: str, reason: str):
        self.moves.append({"src": str(src), "dst": str(dst), "kind": kind, "reason": reason})
        self.counts[kind] = self.counts.get(kind, 0) + 1


def build_plan(desktop: Path, secrets_dir: Path, scan_content: bool) -> Plan:
    plan = Plan()
    managed = {desktop / v.split("/")[0] for v in CATEGORY_DIRS.values()} | {desktop / LOG_DIRNAME}
    try:
        entries = sorted(desktop.iterdir(), key=lambda p: p.name.lower())
    except OSError as e:
        sys.exit(f"Cannot read {desktop}: {e}")

    for entry in entries:
        name = entry.name
        if name in SYSTEM_FILES or entry in managed:
            continue
        if entry.is_symlink():
            plan.add(entry, unique_destination(desktop / CATEGORY_DIRS["shortcuts"] / name),
                     "shortcuts", "symbolic link")
            continue

        if entry.is_dir():
            if name.endswith(".app"):
                plan.add(entry, unique_destination(desktop / CATEGORY_DIRS["installers"] / name),
                         "installers", "macOS application bundle")
                continue
            labels = detect_project(entry)
            size, files, newest, truncated = dir_stats(entry)
            meta = {
                "name": name,
                "stack": labels,
                "size": human_size(size),
                "files": f"{files}{'+' if truncated else ''}",
                "modified": dt.datetime.fromtimestamp(newest).strftime("%Y-%m-%d") if newest else "",
                "description": project_description(entry),
                "git": git_info(entry),
            }
            if labels:
                hits = find_secrets_in_project(entry)
                if hits:
                    plan.project_secret_hits[name] = hits
                meta["secret_files"] = hits
                dst = unique_destination(desktop / CATEGORY_DIRS["projects"] / name)
                meta["path"] = str(dst)
                plan.projects.append(meta)
                plan.add(entry, dst, "projects", "project: " + ", ".join(labels))
            else:
                dst = unique_destination(desktop / CATEGORY_DIRS["folders"] / name)
                meta["path"] = str(dst)
                plan.folders.append(meta)
                plan.add(entry, dst, "folders", "plain folder")
            continue

        # ---- loose file ----
        if name.startswith("."):
            if is_secret_name(name):
                plan.add(entry, unique_destination(secrets_dir / name), "secrets", "secret by name")
                plan.secrets.append(name)
            else:
                plan.skipped.append((name, "hidden file"))
            continue
        if is_secret_name(name) or (scan_content and content_has_secret(entry)):
            reason = "secret by name" if is_secret_name(name) else "contains a credential pattern"
            plan.add(entry, unique_destination(secrets_dir / name), "secrets", reason)
            plan.secrets.append(name)
            continue
        ext = entry.suffix.lower()
        cat = EXT_CATEGORY.get(ext, "other")
        if cat == "images" and SCREENSHOT_RE.search(name):
            cat = "screenshots"
        plan.add(entry, unique_destination(desktop / CATEGORY_DIRS[cat] / name), cat, f"{ext or 'no'} extension")
    return plan


# --------------------------------------------------------------------------
# Index
# --------------------------------------------------------------------------

def write_index(desktop: Path, secrets_dir: Path, plan: Plan, applied: bool) -> str:
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    L = []
    L.append(f"# Desktop index\n")
    L.append(f"_Generated {now} by organize_desktop.py ({'applied' if applied else 'DRY RUN, nothing moved yet'})._\n")
    L.append("## Layout\n")
    L.append("| Folder | What goes there |\n|---|---|")
    layout = [
        ("Projects/", "one folder per project (anything with a git repo, package.json, pyproject, etc.)"),
        ("Folders/", "plain folders that are not code projects"),
        ("Documents/", "PDF, Word, text, Markdown; `Spreadsheets/` and `Presentations/` inside"),
        ("Images/", "pictures and design files; `Screenshots/` inside"),
        ("Videos/", "video files"), ("Audio/", "audio files"),
        ("Archives/", "zip, tar, rar, 7z"), ("Installers/", "dmg, pkg, exe, msi, deb, apps"),
        ("Code-Snippets/", "loose scripts and config files not belonging to a project"),
        ("Shortcuts/", "links and aliases"), ("Other/", "everything else"),
        (f"`{secrets_dir}`", "API keys, .env files, certificates, credentials. Owner-only permissions. Never share or sync."),
    ]
    for a, b in layout:
        L.append(f"| {a} | {b} |")
    L.append("")

    L.append(f"## Projects ({len(plan.projects)})\n")
    if plan.projects:
        L.append("| Project | Stack | Description | Git remote | Branch | Last commit | Modified | Size | Files | Secrets inside |")
        L.append("|---|---|---|---|---|---|---|---|---|---|")
        for p in sorted(plan.projects, key=lambda x: x["name"].lower()):
            g = p.get("git") or {}
            remote = g.get("remote", "") or ""
            branch = (g.get("branch", "") or "") + (" (uncommitted changes)" if g.get("dirty") else "")
            sec = ", ".join(p.get("secret_files", [])) or "none found"
            L.append(f"| **{p['name']}** | {', '.join(p['stack'])} | {p['description']} | {remote} | {branch} | "
                     f"{g.get('last_commit', '')} | {p['modified']} | {p['size']} | {p['files']} | {sec} |")
        L.append("")
        L.append("### Project details\n")
        for p in sorted(plan.projects, key=lambda x: x["name"].lower()):
            L.append(f"#### {p['name']}")
            L.append(f"- Location: `{p['path']}`")
            L.append(f"- Stack: {', '.join(p['stack'])}")
            if p["description"]:
                L.append(f"- About: {p['description']}")
            g = p.get("git")
            if g:
                L.append(f"- Git: {g.get('remote') or 'no remote'} · branch `{g.get('branch')}` · last commit {g.get('last_commit') or 'none'}"
                         + (" · has uncommitted changes" if g.get("dirty") else ""))
            else:
                L.append("- Git: not a repository (consider `git init`)")
            L.append(f"- Last modified {p['modified']} · {p['size']} · {p['files']} files")
            if p.get("secret_files"):
                L.append("- ⚠️ Secret-looking files left in place (moving them would break the project). "
                         "Make sure they are in `.gitignore`: " + ", ".join(f"`{s}`" for s in p["secret_files"]))
            L.append("")
    else:
        L.append("_No project folders detected._\n")

    L.append(f"## Other folders ({len(plan.folders)})\n")
    if plan.folders:
        L.append("| Folder | Modified | Size | Files |\n|---|---|---|---|")
        for f in sorted(plan.folders, key=lambda x: x["name"].lower()):
            L.append(f"| {f['name']} | {f['modified']} | {f['size']} | {f['files']} |")
        L.append("")

    L.append("## Loose files sorted\n")
    L.append("| Category | Count |\n|---|---|")
    for k, v in sorted(plan.counts.items()):
        if k not in ("projects", "folders", "secrets"):
            L.append(f"| {CATEGORY_DIRS.get(k, k)} | {v} |")
    L.append("")

    L.append(f"## Secrets moved to `{secrets_dir}` ({len(plan.secrets)})\n")
    if plan.secrets:
        for s in sorted(plan.secrets):
            L.append(f"- `{s}`")
        L.append("")
        L.append("Values are never written to this index. Open the folder directly when you need a key.\n")
    else:
        L.append("_No loose credential files found on the Desktop._\n")

    L.append("## Full move log\n")
    L.append("| From | To | Why |\n|---|---|---|")
    for m in plan.moves:
        L.append(f"| {Path(m['src']).name} | {Path(m['dst']).relative_to(desktop) if str(m['dst']).startswith(str(desktop)) else m['dst']} | {m['reason']} |")
    L.append("")
    if plan.skipped:
        L.append("## Skipped\n")
        for n, why in plan.skipped:
            L.append(f"- `{n}`: {why}")
        L.append("")
    return "\n".join(L)


# --------------------------------------------------------------------------
# Apply / undo
# --------------------------------------------------------------------------

def apply_plan(desktop: Path, secrets_dir: Path, plan: Plan) -> Path:
    log_dir = desktop / LOG_DIRNAME
    log_dir.mkdir(exist_ok=True)
    if plan.counts.get("secrets"):
        secrets_dir.mkdir(parents=True, exist_ok=True)
        lock_down(secrets_dir, is_dir=True)
        gi = secrets_dir / ".gitignore"
        if not gi.exists():
            gi.write_text("*\n!.gitignore\n!README.txt\n", encoding="utf-8")
        rd = secrets_dir / "README.txt"
        if not rd.exists():
            rd.write_text(
                "This folder holds API keys, .env files, certificates and other credentials.\n"
                "Permissions are owner-only. Do not copy it into a project, a cloud sync folder,\n"
                "a screenshot or a chat. Projects should reference these values through their own\n"
                "untracked .env file, never by committing them.\n", encoding="utf-8")
    done = []
    for m in plan.moves:
        src, dst = Path(m["src"]), Path(m["dst"])
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst = unique_destination(dst)
        shutil.move(str(src), str(dst))
        m["dst"] = str(dst)
        done.append(m)
        if m["kind"] == "secrets":
            lock_down(dst, is_dir=dst.is_dir())
        print(f"  moved  {src.name}  ->  {dst}")
    log = log_dir / f"log-{dt.datetime.now():%Y%m%d-%H%M%S}.json"
    log.write_text(json.dumps({"desktop": str(desktop), "secrets_dir": str(secrets_dir),
                               "moves": done}, indent=2), encoding="utf-8")
    return log


def undo(log_path: Path):
    data = json.loads(log_path.read_text(encoding="utf-8"))
    for m in reversed(data["moves"]):
        src, dst = Path(m["dst"]), Path(m["src"])
        if not src.exists():
            print(f"  missing, skipped: {src}")
            continue
        dst = unique_destination(dst)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dst))
        print(f"  restored  {src.name}  ->  {dst}")
    # Remove now-empty category folders
    desktop = Path(data["desktop"])
    for v in sorted(CATEGORY_DIRS.values(), key=len, reverse=True):
        d = desktop / v
        try:
            if d.is_dir() and not any(d.iterdir()):
                d.rmdir()
        except OSError:
            pass
    idx = desktop / INDEX_NAME
    if idx.exists():
        idx.unlink()
    print("Undo complete.")


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--desktop", type=Path, default=None, help="Desktop folder (auto-detected)")
    ap.add_argument("--secrets-dir", type=Path, default=None,
                    help="where to put API keys and credentials (default: ~/.secrets)")
    ap.add_argument("--apply", action="store_true", help="actually move files (default is a dry run)")
    ap.add_argument("--no-content-scan", action="store_true",
                    help="only detect secrets by file name, do not look inside text files")
    ap.add_argument("--undo", type=Path, metavar="LOG_JSON", help="reverse a previous run")
    args = ap.parse_args()

    if args.undo:
        undo(args.undo)
        return

    desktop = (args.desktop or default_desktop()).expanduser().resolve()
    if not desktop.is_dir():
        sys.exit(f"Desktop folder not found: {desktop} (use --desktop PATH)")
    secrets_dir = (args.secrets_dir or default_secrets_dir(desktop)).expanduser().resolve()

    print(f"Desktop : {desktop}")
    print(f"Secrets : {secrets_dir}")
    print(f"Mode    : {'APPLY' if args.apply else 'DRY RUN (add --apply to move files)'}\n")

    plan = build_plan(desktop, secrets_dir, scan_content=not args.no_content_scan)
    if not plan.moves:
        print("Nothing to organize. Desktop is already tidy.")
    for m in plan.moves:
        tag = "SECRET " if m["kind"] == "secrets" else ""
        print(f"  {tag}{Path(m['src']).name:45.45}  ->  {m['dst'] if m['kind']=='secrets' else Path(m['dst']).relative_to(desktop)}   [{m['reason']}]")
    print()
    for k, v in sorted(plan.counts.items()):
        print(f"  {k:12} {v}")
    if plan.project_secret_hits:
        print("\n  ⚠️  Secret-looking files inside projects (left in place, check .gitignore):")
        for proj, hits in plan.project_secret_hits.items():
            print(f"     {proj}: {', '.join(hits)}")

    if args.apply:
        print("\nApplying...")
        log = apply_plan(desktop, secrets_dir, plan)
        (desktop / INDEX_NAME).write_text(write_index(desktop, secrets_dir, plan, applied=True), encoding="utf-8")
        print(f"\nDone. Index written to {desktop / INDEX_NAME}")
        print(f"Undo with: python3 {Path(__file__).name} --undo \"{log}\"")
    else:
        preview = desktop / LOG_DIRNAME / "INDEX-preview.md"
        preview.parent.mkdir(exist_ok=True)
        preview.write_text(write_index(desktop, secrets_dir, plan, applied=False), encoding="utf-8")
        print(f"\nDry run only. Preview of the index: {preview}")
        print("Run again with --apply to organize for real.")


if __name__ == "__main__":
    main()
