"""Check public HTML responses without executing JavaScript.

python scripts/check_raw_metadata.py --base http://127.0.0.1:3100
"""
import argparse
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import urlopen


class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.values = {}
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self.in_title = True
            self.values['title'] = ''
        if tag == "meta":
            self.values[attrs.get('property') or attrs.get('name')] = attrs.get('content')
        if tag == "link" and attrs.get('rel') == 'canonical':
            self.values['canonical'] = attrs.get('href')

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.values['title'] += data


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--base', default='http://127.0.0.1:3100')
    p.add_argument('--canonical-origin', default='https://hianzy.com')
    args = p.parse_args()
    build = Path(__file__).resolve().parents[1] / 'frontend/build'
    records = json.loads((build/'route-metadata.json').read_text(encoding='utf-8'))
    images = set()
    for item in records:
        with urlopen(args.base.rstrip('/') + item['route'], timeout=10) as response:
            assert response.status == 200
            head = Head()
            head.feed(response.read().decode('utf-8'))
        expected = {'title':item['title'], 'description':item['description'], 'og:title':item['title'],
                    'og:description':item['description'], 'canonical':urljoin(args.canonical_origin, item['route']),
                    'og:url':urljoin(args.canonical_origin, item['route']),
                    'og:image':urljoin(args.canonical_origin, item.get('image') or '/og-default.png')}
        for key, value in expected.items():
            assert head.values.get(key) == value, f"{item['route']}: {key} mismatch"
        images.add(item.get('image') or '/og-default.png')
    for image in images:
        if image.startswith('/'):
            with urlopen(args.base.rstrip('/') + image, timeout=10) as response:
                assert response.status == 200 and response.headers['Content-Type'].startswith('image/')
    print(f'Verified raw HTML metadata for {len(records)} public routes and {len(images)} share images.')


if __name__ == '__main__':
    main()
