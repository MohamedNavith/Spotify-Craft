import os
import struct

def patch_exe_version(path):
    print(f"Patching PE version info in {path}...")
    with open(path, 'r+b') as f:
        data = f.read()

        # 1. Update FixedFileInfo (dwFileVersionMS and dwProductVersionMS from 0x00010000 to 0x00020000)
        sig = b'\xbd\x04\xef\xfe'
        pos = 0
        fixed_count = 0
        while True:
            pos = data.find(sig, pos)
            if pos == -1:
                break
            # Struct has 13 uint32s: sig, structVersion, fileVerMS, fileVerLS, prodVerMS, prodVerLS, ...
            # Check if fileVerMS is 0x00010000
            fileVerMS = struct.unpack('<I', data[pos+8:pos+12])[0]
            prodVerMS = struct.unpack('<I', data[pos+16:pos+20])[0]
            if fileVerMS == 0x00010000 and prodVerMS == 0x00010000:
                f.seek(pos + 8)
                f.write(struct.pack('<I', 0x00020000))
                f.seek(pos + 16)
                f.write(struct.pack('<I', 0x00020000))
                fixed_count += 1
                print(f"  Patched VS_FIXEDFILEINFO at byte offset {pos}")
            pos += len(sig)

        # 2. Update UTF-16LE string tables: '1.0.0' -> '2.0.0'
        str_old = '1.0.0'.encode('utf-16le')
        str_new = '2.0.0'.encode('utf-16le')
        pos = 0
        str_count = 0
        while True:
            pos = data.find(str_old, pos)
            if pos == -1:
                break
            f.seek(pos)
            f.write(str_new)
            str_count += 1
            print(f"  Patched UTF-16 string at byte offset {pos}")
            pos += len(str_old)

        print(f"Done: {fixed_count} FixedFileInfo patched, {str_count} strings patched.")

EXE_PATHS = [
    r"F:\Spotify-Craft[rea]\Wavelength\wavelength-desktop.exe",
    r"F:\Spotify-Craft[rea]\Wavelength\desktop\dist\win-unpacked\Wavelength.exe",
]

for p in EXE_PATHS:
    if os.path.exists(p):
        patch_exe_version(p)
