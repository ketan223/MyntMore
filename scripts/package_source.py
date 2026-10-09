"""Create a portable project ZIP without local caches, credentials, or preview images."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
destination = root.parent / "myntmore-round-2-source.zip"
excluded_dirs = {"node_modules", ".next", ".git", "__pycache__"}
excluded_files = {".env.local", "data/preview-results.json"}
with ZipFile(destination, "w", ZIP_DEFLATED) as archive:
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(root)
        posix = relative.as_posix()
        if any(part in excluded_dirs for part in relative.parts) or posix in excluded_files or posix.endswith(".png"):
            continue
        if path.name.startswith(".env") and path.name != ".env.example":
            continue
        archive.write(path, Path("myntmore-round-2") / relative)
print(destination)
