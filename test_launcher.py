"""Regression coverage for Python installed behind a symlink/shortcut."""
from pathlib import Path
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

from start_local import environment_is_healthy, prepare_environment


class LauncherRegression(unittest.TestCase):
    def test_repair_copied_interpreter_and_preserve_old_environment(self):
        with tempfile.TemporaryDirectory(prefix='sta313 launcher repair ') as directory:
            root = Path(directory)
            shim = root / 'local/bin/python'
            shim.parent.mkdir(parents=True)
            shim.symlink_to(Path(sys.executable).resolve())
            environment = root / '.demo-venv'
            subprocess.run([
                str(shim), '-I', '-c',
                'import venv; venv.EnvBuilder(with_pip=False,symlinks=False).create(' + repr(str(environment)) + ')',
            ], check=True)
            if environment_is_healthy(environment):
                self.skipTest('This base interpreter does not reproduce the relocatable-Python defect.')
            error = subprocess.run([str(environment / 'bin/python'), '-I', '-c', 'import encodings'], capture_output=True, text=True)
            self.assertIn('encodings', error.stderr)
            self.assertIn('/install', error.stderr)
            (environment / 'preserve.txt').write_text('Existing environment must be backed up.')
            python = prepare_environment(environment)
            self.assertTrue(environment_is_healthy(environment))
            self.assertTrue(python.is_symlink())
            backups = list(root.glob('.demo-venv.backup-*'))
            self.assertEqual(len(backups), 1)
            self.assertEqual((backups[0] / 'preserve.txt').read_text(), 'Existing environment must be backed up.')
            subprocess.run([str(python), '-I', '-m', 'pip', '--version'], check=True, stdout=subprocess.DEVNULL)
            cfg_before = (environment / 'pyvenv.cfg').stat().st_mtime_ns
            self.assertEqual(prepare_environment(environment), python)
            self.assertEqual((environment / 'pyvenv.cfg').stat().st_mtime_ns, cfg_before)

    def test_shell_resolves_shortcut_and_ignores_pythonhome(self):
        with tempfile.TemporaryDirectory(prefix='sta313 launcher shell ') as directory:
            root = Path(directory)
            shim_dir = root / 'local/bin'
            shim_dir.mkdir(parents=True)
            real_python = Path(getattr(sys, '_base_executable', sys.executable)).resolve()
            for name in ('python3.12', 'python3.13', 'python3.11', 'python3'):
                (shim_dir / name).symlink_to(real_python)
            shutil.copy2(Path(__file__).parent / 'Start-Demos.command', root / 'Start-Demos.command')
            (root / 'start_local.py').write_text(
                "import encodings,json,sys\nfrom pathlib import Path\n"
                "Path('probe.json').write_text(json.dumps({'executable':sys.executable,'isolated':sys.flags.isolated}))\n"
            )
            env = dict(os.environ)
            env['PATH'] = str(shim_dir) + os.pathsep + env.get('PATH', '')
            env['PYTHONHOME'] = '/install'
            env['PYTHONPATH'] = '/nonexistent-python-test-path'
            result = subprocess.run(['/bin/bash', str(root / 'Start-Demos.command')], env=env, capture_output=True, text=True, timeout=30)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            probe = json.loads((root / 'probe.json').read_text())
            self.assertEqual(Path(probe['executable']), real_python)
            self.assertEqual(probe['isolated'], 1)


if __name__ == '__main__':
    unittest.main(verbosity=2)
