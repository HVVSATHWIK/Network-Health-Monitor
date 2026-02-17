from __future__ import annotations

import sys
from pathlib import Path

from pypdf import PdfReader


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print('Usage: python scripts/extract_pdf_text.py <input.pdf> [output.txt]')
        sys.exit(2)

    pdf_path = Path(args[0])
    out_path = Path(args[1]) if len(args) > 1 else Path('extracted_pdf_text.txt')

    if not pdf_path.exists():
        print(f'Input PDF not found: {pdf_path}')
        sys.exit(1)

    reader = PdfReader(str(pdf_path))
    parts: list[str] = []
    for page in reader.pages:
        parts.append(page.extract_text() or '')

    text = '\n'.join(parts)
    out_path.write_text(text, encoding='utf-8', errors='ignore')

    print(f'pages={len(reader.pages)} textLen={len(text)} wrote={out_path}')


if __name__ == '__main__':
    main()
