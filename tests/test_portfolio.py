"""Content regressions: run with python -m unittest discover -s tests."""
from pathlib import Path
from html.parser import HTMLParser
from xml.etree import ElementTree
import json
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]

class Content(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.dates = []
    def handle_data(self, text):
        self.text.append(text)
    def handle_starttag(self, tag, attrs):
        if tag == 'time':
            self.dates.append(dict(attrs)['datetime'])

class PortfolioTests(unittest.TestCase):
    def test_course_content_in_both_languages(self):
        for filename in ['index.html', 'es.html']:
            with self.subTest(page=filename):
                parser = Content()
                parser.feed((ROOT / filename).read_text())
                text = ' '.join(parser.text)
                self.assertNotIn('undefined', text)
                self.assertNotIn('TODOCODE', text)
                self.assertNotIn('TESTARUDO', text)
                self.assertEqual(text.count('Todo Code'), 4)
                self.assertEqual(text.count('Tester Testarudo'), 4)
                self.assertEqual(len(parser.dates), 24)

    def test_manual_metric_and_case_study(self):
        for language, filename, label in [('en', 'index.html', 'Automated tests'), ('es', 'es.html', 'Pruebas automatizadas')]:
            dictionary = json.loads((ROOT / 'locales' / f'{language}.json').read_text())
            self.assertEqual(dictionary['metric_cases'], label)
            self.assertIn('400', dictionary['achievement_cases'])
            self.assertIn('750', dictionary['achievement_manual'])
            for topic in ['edu_programming', 'edu_logic', 'edu_design', 'edu_environments', 'edu_computing', 'edu_tools']:
                self.assertTrue(dictionary[topic + '_text'])
            self.assertIn('manual', dictionary['achievement_manual'].lower())
            page = (ROOT / filename).read_text()
            self.assertIn('>750+</h3>', page)
            self.assertIn('id="case-study-regression"', page)
            self.assertIn('href="#case-study-regression"', page)
            self.assertIn(dictionary['case_title'], page)
            self.assertIn(dictionary['case_role'], page)
        self.assertIn('750 casos de prueba manuales', (ROOT / 'README.md').read_text())
        self.assertIn('400 pruebas automatizadas', (ROOT / 'README.md').read_text())

    def test_ai_case_and_evidence(self):
        for language, filename in [('en', 'index.html'), ('es', 'es.html')]:
            text = json.loads((ROOT / 'locales' / f'{language}.json').read_text())
            page = (ROOT / filename).read_text()
            self.assertIn('id="case-study-qatestge"', page)
            self.assertIn('href="#case-study-qatestge"', page)
            self.assertIn(text['qa_case_status'], page)
            self.assertIn(text['qa_case_title'], page)
            self.assertIn('pg', text['qa_case_validation'])
            self.assertNotIn('Prisma', text['qa_case_validation'])
            for name in ['qatestge-designer', 'qatestge-login']:
                self.assertTrue((ROOT / 'assets/projects' / f'{name}.webp').is_file())
                self.assertIn(f'./assets/projects/{name}.webp', page)

    def test_sql_case_is_linked_and_translated(self):
        for language, filename in [('en', 'index.html'), ('es', 'es.html')]:
            text = json.loads((ROOT / 'locales' / f'{language}.json').read_text())
            page = (ROOT / filename).read_text()
            self.assertIn('id="case-study-sql"', page)
            self.assertIn('href="#case-study-sql"', page)
            self.assertIn(text['sql_case_title'], page)
            self.assertIn(text['sql_case_measurement'], page)
            self.assertIn('SSMS', text['sql_case_context'])
            for clause in ['JOIN', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY']:
                self.assertIn(clause, text['sql_case_queries'])

    def test_renderer_rejects_placeholder_nodes(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory)
            shutil.copytree(ROOT / 'scripts', destination / 'scripts')
            shutil.copytree(ROOT / 'locales', destination / 'locales')
            source = (ROOT / 'index.html').read_text().replace('</main>', 'undefinedundefined</main>')
            (destination / 'index.html').write_text(source)
            result = subprocess.run([sys.executable, str(destination / 'scripts/render-locales.py')], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Invalid placeholder', result.stderr)
            self.assertFalse((destination / 'es.html').exists())

    def test_renderer_rejects_missing_translations(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory)
            shutil.copytree(ROOT / 'scripts', destination / 'scripts')
            shutil.copytree(ROOT / 'locales', destination / 'locales')
            shutil.copy(ROOT / 'index.html', destination / 'index.html')
            path = destination / 'locales/en.json'
            dictionary = json.loads(path.read_text())
            del dictionary['courses_featured']
            path.write_text(json.dumps(dictionary))
            result = subprocess.run([sys.executable, str(destination / 'scripts/render-locales.py')], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Missing en translations', result.stderr)

    def test_local_icons_have_no_previous_monochrome_fill(self):
        for path in (ROOT / 'assets/icons').glob('*.svg'):
            with self.subTest(icon=path.name):
                ElementTree.parse(path)
                self.assertNotIn('#cbd5e1', path.read_text().lower())

if __name__ == '__main__':
    unittest.main()
