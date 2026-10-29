"""Structure contracts for progressive disclosure and stable deep links."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote
import unittest

ROOT = Path(__file__).resolve().parents[1]
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'param', 'source', 'track', 'wbr'}


class Structure(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.nodes = []
        self.stack = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        node = {'tag': tag, 'attrs': dict(attrs), 'parents': self.stack.copy()}
        self.nodes.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]['tag'] == tag:
                self.stack = self.stack[:index]
                break


def has_class(node, name):
    return name in node['attrs'].get('class', '').split()


class NavigationTests(unittest.TestCase):
    def test_internal_links_and_assets_resolve_in_both_languages(self):
        for filename in ['index.html', 'es.html']:
            page = Structure((ROOT / filename).read_text())
            ids = [n['attrs']['id'] for n in page.nodes if 'id' in n['attrs']]
            self.assertEqual(len(ids), len(set(ids)), filename)
            for node in page.nodes:
                for attribute in ['href', 'src']:
                    value = node['attrs'].get(attribute, '')
                    if value.startswith('#'):
                        self.assertIn(value[1:], ids)
                    elif value.startswith('./'):
                        self.assertTrue((ROOT / unquote(value[2:])).exists(), value)

    def test_case_studies_belong_to_their_projects(self):
        page = Structure((ROOT / 'index.html').read_text())
        by_id = {n['attrs']['id']: n for n in page.nodes if 'id' in n['attrs']}
        for case, project in [('case-study-qatestge', 'project-qatestge'),
                              ('case-study-flowsaldo', 'project-flowsaldo')]:
            node = by_id[case]
            self.assertEqual(node['tag'], 'details')
            self.assertNotIn('open', node['attrs'])
            self.assertIn(project, [n['attrs'].get('id') for n in node['parents']])
        sql = by_id['case-study-sql']
        self.assertEqual(sql['tag'], 'details')
        self.assertIn('experience', [n['attrs'].get('id') for n in sql['parents']])

    def test_project_order_and_secondary_group(self):
        page = Structure((ROOT / 'index.html').read_text())
        projects = [n for n in page.nodes if n['tag'] == 'article' and has_class(n, 'project-card')]
        self.assertEqual([n['attrs']['id'] for n in projects],
                         ['project-qatestge', 'project-flowsaldo', 'project-arsfuturo',
                          'project-cashfast', 'project-bitzone'])
        for node in projects[3:]:
            self.assertTrue(any(has_class(n, 'other-projects') for n in node['parents']))

    def test_experience_has_three_primary_responsibilities_and_achievements(self):
        page = Structure((ROOT / 'index.html').read_text())
        lists = [n for n in page.nodes if n['tag'] == 'ul'
                 and has_class(n, 'experience-card__list')
                 and not any(n['tag'] == 'details' for n in n['parents'])]
        self.assertEqual(len(lists), 2)
        for node in lists:
            children = [n for n in page.nodes if n['tag'] == 'li'
                        and n['parents'] and n['parents'][-1] is node]
            self.assertEqual(len(children), 3)


if __name__ == '__main__':
    unittest.main()
