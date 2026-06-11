"""
v.215 — atomic, truncate-on-commit file writer.

THE ROOT CAUSE
--------------
The "documents.html ends mid-statement" / "335 null bytes after </html>"
failures are NOT real source truncations. They're sparse-file artifacts:

- I write a SHORTER version of the file from the Linux sandbox.
- The Windows-side workspace mount keeps the OLD (longer) file size in its
  metadata cache. (The frequent "<file> was modified" reminders are the
  Windows side touching the same path.)
- When anything reads the file (Python, node, bash), it gets the new
  content but the OLD size — and the gap from end-of-real-content to
  cached-size is filled with NULL bytes by the kernel.
- Worse: if a downstream tool then re-writes that file, it preserves the
  null padding (because it read the full "size"), and the next write
  layer can clip mid-byte during heredoc appends.

THE FIX
-------
Open with O_WRONLY|O_CREAT|O_TRUNC + ftruncate + fsync, in a temp file,
then atomically rename. After the rename the kernel and the workspace
mount agree on the final size, no holes, no nulls.
"""
import os

def safe_write(path, content):
    if isinstance(content, str):
        data = content.encode('utf-8')
    else:
        data = content
    tmp = path + '.tmp'
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
    try:
        written = os.write(fd, data)
        if written != len(data):
            raise RuntimeError(f'short write: {written}/{len(data)} on {path}')
        os.ftruncate(fd, len(data))   # clamp to exact length, no sparse tail
        os.fsync(fd)
    finally:
        os.close(fd)
    actual = os.path.getsize(tmp)
    if actual != len(data):
        os.remove(tmp)
        raise RuntimeError(f'{path}: tmp size {actual} != expected {len(data)}')
    os.replace(tmp, path)
