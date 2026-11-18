#!/usr/bin/env python3
"""Build an offline, single-file preview without changing the working website.

Usage:
    python teddy-door/build-preview.py [output.html]
    python teddy-door/build-preview.py --entry model-study.html output.html

The default output is /workspace/web-review/teddy-room-toon.html. Classic
scripts keep their original global scope and deferred execution order. Their
source is stored as safe JSON, then executed by one tiny deferred data-URI
bootstrap after HTML parsing and before DOMContentLoaded. This avoids base64
encoding every large JavaScript bundle or wrapping unrelated scripts together.
"""

from __future__ import annotations

import argparse
import base64
import html
from html.parser import HTMLParser
import json
import mimetypes
from pathlib import Path
import re
import struct
import sys
from urllib.parse import unquote, unquote_to_bytes, urlsplit

DEFAULT_OUTPUT = Path('/workspace/web-review/teddy-room-toon.html')
ROOM_URL = re.compile(r'''(?P<quote>["'])(?P<url>(?:\./)?assets/room/[^"'\\\r\n]+)(?P=quote)''')
CSS_URL = re.compile(r'''url\(\s*(?:(?P<quote>["'])(?P<quoted>.*?)(?P=quote)|(?P<bare>[^)\s]+))\s*\)''', re.IGNORECASE)
MIME_TYPES = {
    '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
    '.js': 'text/javascript', '.webp': 'image/webp',
    '.woff': 'font/woff', '.woff2': 'font/woff2',
}
BOOTSTRAP = """(() => {
  for (const payload of document.querySelectorAll('script[data-preview-source]')) {
    const spec = JSON.parse(payload.textContent);
    const script = document.createElement('script');
    for (const [name, value] of spec.attributes) script.setAttribute(name, value ?? '');
    script.textContent = spec.source;
    payload.replaceWith(script);
  }
})();"""


class BuildError(Exception):
    pass


class Resources(HTMLParser):
    """Locate resource tags while leaving all surrounding HTML verbatim."""

    def __init__(self, source: str):
        super().__init__(convert_charrefs=True)
        self.source = source
        self.line_offsets = [0]
        self.line_offsets.extend(m.end() for m in re.finditer('\n', source))
        self.tags = []
        self.script = None
        self.feed(source)
        self.close()

    def source_offset(self):
        line, column = self.getpos()
        return self.line_offsets[line - 1] + column

    def handle_starttag(self, tag, attrs):
        start = self.source_offset()
        if tag == 'script':
            self.script = (start, attrs)
        elif tag == 'link' and 'stylesheet' in dict(attrs).get('rel', '').lower().split():
            self.tags.append(('style', start, start + len(self.get_starttag_text()), attrs))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            start, attrs = self.script
            self.tags.append(('script', start, self.source.index('>', self.source_offset()) + 1, attrs))
            self.script = None


def data_uri(content: bytes, mime: str):
    return f'data:{mime};base64,' + base64.b64encode(content).decode('ascii')


def safe_json(value):
    # Escaping every '<' also prevents HTML script double-escape states, not just
    # a literal closing tag. JSON.parse restores the exact JavaScript source.
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')


class Builder:
    def __init__(self, entry: Path):
        self.entry = entry.resolve()
        self.root = self.entry.parent
        self.embedded = {}
        self.script_count = 0
        self.stylesheet_count = 0
        self.registry_url_count = 0

    def local_path(self, url: str, base: Path):
        parts = urlsplit(url)
        if parts.scheme or parts.netloc or not parts.path:
            raise BuildError(f'Expected a local asset, got {url!r}')
        candidate = (base / unquote(parts.path)).resolve()
        if not candidate.is_relative_to(self.root):
            raise BuildError(f'Asset is outside the preview folder: {url}')
        if not candidate.is_file():
            raise BuildError(f'Missing asset: {candidate}')
        return candidate

    @staticmethod
    def check_glb(path, content):
        if len(content) < 20:
            raise BuildError(f'Invalid GLB: {path}')
        magic, version, total, size, chunk = struct.unpack_from('<IIIII', content)
        if magic != 0x46546C67 or version != 2 or total != len(content) or chunk != 0x4E4F534A:
            raise BuildError(f'Invalid GLB header: {path}')
        doc = json.loads(content[20:20 + size])
        for item in doc.get('buffers', []) + doc.get('images', []):
            uri = item.get('uri')
            if uri and not uri.startswith('data:'):
                raise BuildError(f'GLB still references an external file ({uri}): {path}')

    def asset_uri(self, url: str, base: Path):
        if url.startswith('data:') or url.startswith('#'):
            return url
        path = self.local_path(url, base)
        if path not in self.embedded:
            content = path.read_bytes()
            if path.suffix.lower() == '.glb':
                self.check_glb(path, content)
            mime = MIME_TYPES.get(path.suffix.lower()) or mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
            self.embedded[path] = (data_uri(content, mime), len(content))
        return self.embedded[path][0]

    def stylesheet(self, path: Path):
        source = path.read_text(encoding='utf-8')
        if re.search(r'@import\b', source, re.IGNORECASE):
            raise BuildError(f'Inline CSS @import before packaging: {path}')
        source = CSS_URL.sub(lambda m: 'url(' + json.dumps(self.asset_uri(m.group('quoted') or m.group('bare'), path.parent)) + ')', source)
        return re.sub(r'</style', lambda _: r'<\/style', source, flags=re.IGNORECASE)

    def script_source(self, url: str):
        if url.startswith('data:'):
            header, content = url.split(',', 1)
            return (base64.b64decode(content) if ';base64' in header else unquote_to_bytes(content)).decode('utf-8')
        path = self.local_path(url, self.root)
        source = path.read_text(encoding='utf-8-sig')
        if path.name == 'season-chart.js':
            record = './season-chart-sources.json'
            source = source.replace(f'href="{record}"', f'href="{self.asset_uri(record, path.parent)}"')
        if path.name == 'room-assets.js':
            if 'roomAssetSources' not in source:
                raise BuildError(f'The room asset registry is missing from {path}')
            def embed(match):
                self.registry_url_count += 1
                return json.dumps(self.asset_uri(match.group('url'), self.root))
            source = ROOM_URL.sub(embed, source)
            if re.search(r'''["'](?:\./)?assets/room/''', source):
                raise BuildError('The room registry contains an unsupported asset URL; use plain string literals.')
        return source

    def build(self):
        source = self.entry.read_text(encoding='utf-8')
        changes = []
        deferred = 0
        for kind, start, end, attrs in Resources(source).tags:
            properties = dict(attrs)
            if kind == 'style':
                href = properties.get('href')
                if not href:
                    raise BuildError('A stylesheet has no href.')
                path = self.local_path(href, self.root)
                kept = [(key, value) for key, value in attrs if key not in ('href', 'rel', 'integrity', 'crossorigin')]
                rendered = ''.join(' ' + key + ('' if value is None else '="' + html.escape(value, quote=True) + '"') for key, value in kept)
                replacement = '<style' + rendered + '>\n' + self.stylesheet(path) + '\n</style>'
                self.stylesheet_count += 1
            else:
                url = properties.get('src')
                if not url:
                    continue  # Preserve original inline scripts and license text.
                script_type = properties.get('type', '').lower()
                if script_type not in ('', 'text/javascript', 'application/javascript'):
                    raise BuildError(f'Only bundled classic scripts are supported: {url} ({script_type})')
                javascript = self.script_source(url)
                kept = [(key, value) for key, value in attrs if key not in ('src', 'defer', 'async', 'integrity', 'crossorigin', 'referrerpolicy')]
                if 'defer' in properties and 'async' not in properties:
                    spec = {'attributes': kept, 'source': javascript}
                    replacement = '<script type="application/json" data-preview-source="' + html.escape(url, quote=True) + '">' + safe_json(spec) + '</script>'
                    deferred += 1
                else:
                    # A data URI preserves parser-blocking / async behavior for
                    # the uncommon scripts that did not originally use defer.
                    if 'async' in properties:
                        kept.append(('async', None))
                    kept.append(('src', data_uri(javascript.encode('utf-8'), 'text/javascript')))
                    rendered = ''.join(' ' + key + ('' if value is None else '="' + html.escape(value, quote=True) + '"') for key, value in kept)
                    replacement = '<script' + rendered + '></script>'
                self.script_count += 1
            changes.append((start, end, replacement))
        for start, end, replacement in sorted(changes, reverse=True):
            source = source[:start] + replacement + source[end:]
        if deferred:
            bootstrap = '<script defer src="' + data_uri(BOOTSTRAP.encode(), 'text/javascript') + '"></script>\n'
            source, count = re.subn(r'</head\s*>', lambda m: bootstrap + m.group(), source, count=1, flags=re.IGNORECASE)
            if count != 1:
                raise BuildError('No closing head tag found for the deferred bootstrap.')
        return source


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('output', nargs='?', type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument('--entry', type=Path, default=Path(__file__).resolve().with_name('index.html'), help='HTML entry; relative paths resolve beside this script')
    args = parser.parse_args()
    entry = args.entry if args.entry.is_absolute() else Path(__file__).resolve().parent / args.entry
    try:
        builder = Builder(entry)
        result = builder.build()
        if args.output.resolve() == entry.resolve():
            raise BuildError('Output must not overwrite the source HTML.')
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(result, encoding='utf-8')
    except (BuildError, OSError, ValueError) as error:
        parser.exit(1, f'Preview build failed: {error}\n')
    print(f'Built {args.output.resolve()} ({len(result.encode("utf-8")):,} bytes)')
    print(f'Embedded {builder.script_count} scripts, {builder.stylesheet_count} stylesheets and {len(builder.embedded)} binary assets; {builder.registry_url_count} room URLs replaced.')


if __name__ == '__main__':
    main()
