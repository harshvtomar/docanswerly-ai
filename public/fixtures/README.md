# Synthetic PDF fixtures

Original test sentences authored for this project. `scripts/generate-fixtures.py`
generates English, Hindi, and mixed-language PDFs. Text fixtures contain a shaped
raster visual plus an invisible, original-Unicode text overlay (a searchable PDF
structure). Scan fixtures contain only that raster, with no hidden text layer.
`bilingual-text.pdf` has three text pages; `hybrid.pdf` has an English text page
and a Hindi scan. `invalid.pdf` is deliberately not a PDF.

These clean single-line fixtures do not represent real-world layouts, poor scans,
handwriting, rotated pages, or arbitrary font encodings. Add diverse public-domain
corpora before making quality claims. Fonts are from Fontsource (SIL OFL).
