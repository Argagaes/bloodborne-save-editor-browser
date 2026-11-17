"""Prepare standalone desktop release assets and platform-specific ZIP archives."""
import json
import shutil
import sys
import zipfile
from pathlib import Path


def package_release(assets, output, version):
    assets, output = Path(assets), Path(output)
    matches = {
        'linux': list(assets.rglob('*.AppImage')),
        'windows': list(assets.rglob('*.exe')),
    }
    for platform, files in matches.items():
        if len(files) != 1:
            raise ValueError(f'Expected exactly one {platform} binary; found {len(files)}')
    output.mkdir(parents=True, exist_ok=True)
    stem = f'Bloodborne.Save.Editor_{version}_amd64'
    for platform, extension, mode in [('linux', '.AppImage', 0o755), ('windows', '.exe', 0o644)]:
        target = output / (stem + extension)
        shutil.copyfile(matches[platform][0], target)
        info = zipfile.ZipInfo(target.name)
        info.create_system = 3
        info.external_attr = (0o100000 | mode) << 16
        info.compress_type = zipfile.ZIP_DEFLATED
        with zipfile.ZipFile(output / f'{stem}-{platform}.zip', 'w') as archive:
            archive.writestr(info, target.read_bytes())


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Usage: package-release.py ASSETS_DIR OUTPUT_DIR')
    config = json.loads(Path('src-tauri/tauri.conf.json').read_text(encoding='utf-8'))
    package_release(sys.argv[1], sys.argv[2], config['version'])
