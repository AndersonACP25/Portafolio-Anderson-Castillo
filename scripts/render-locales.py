"""Render crawlable EN/ES pages from index.html and the locale dictionaries.
Run after changing page content or locale JSON: python scripts/render-locales.py
No dependencies; the English page is the shared layout source.
"""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://andersonacp25.github.io/Portafolio-Anderson-Castillo/'
source = (ROOT / 'index.html').read_text()
pattern = r'(<(?P<tag>\w+)\b[^>]*\bdata-translate="(?P<key>[^"]+)"[^>]*>)[^<]*(</(?P=tag)\s*>)'

for lang, filename in [('en', 'index.html'), ('es', 'es.html')]:
    text = json.loads((ROOT / 'locales' / f'{lang}.json').read_text())
    page = re.sub(pattern, lambda m: m[1] + html.escape(text[m['key']]) + m[4], source)
    page = re.sub(r'(<[^>]+data-translate-aria="([^"]+)"[^>]*>)', lambda m: re.sub(r'aria-label="[^"]*"', 'aria-label="' + html.escape(text[m[2]], quote=True) + '"', m[1]), page)
    page = re.sub(r'<html lang="[^"]+"', f'<html lang="{lang}"', page)
    page = re.sub(r'(<option value="(?:en|es)") selected(?:="")?', r'\1', page)
    page = page.replace(f'<option value="{lang}"', f'<option value="{lang}" selected')
    url = BASE if lang == 'en' else BASE + 'es.html'
    page = re.sub(r'(<link\s+rel="canonical"\s+href=")[^"]+', lambda m: m[1]+url, page)
    for attribute, name, value in [('name','description',text['seo_description']), ('property','og:description',text['seo_description']), ('name','twitter:description',text['seo_description']), ('property','og:url',url), ('property','og:locale','en_US' if lang=='en' else 'es_DO'), ('property','og:locale:alternate','es_DO' if lang=='en' else 'en_US')]:
        page = re.sub(r'(<meta\s+'+attribute+'="'+re.escape(name)+r'"\s+content=")[^"]*', lambda m: m[1] + html.escape(value,quote=True), page)
    schema = re.search(r'(<script[^>]*id="profile-schema"[^>]*>)(.*?)(</script>)', page, re.S)
    data = json.loads(schema[2]); data.update(url=url, inLanguage=lang)
    data['mainEntity']['description'] = text['seo_description']
    page = page[:schema.start(2)] + json.dumps(data, ensure_ascii=False, indent=2) + page[schema.end(2):]
    (ROOT / filename).write_text(page)
