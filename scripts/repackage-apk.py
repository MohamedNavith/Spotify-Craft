import os
import shutil
import zipfile
import subprocess

ROOT_DIR = r"F:\Spotify-Craft[rea]\Wavelength"
SRC_APK = os.path.join(ROOT_DIR, "wavelength-mobile.apk")
PUBLIC_DIR = os.path.join(ROOT_DIR, "mobile", "android", "app", "src", "main", "assets", "public")
TEMP_APK = os.path.join(ROOT_DIR, "temp_unsigned.apk")
ALIGNED_APK = os.path.join(ROOT_DIR, "temp_aligned.apk")
OUTPUT_APK = os.path.join(ROOT_DIR, "wavelength-mobile.apk")

BUILD_TOOLS_DIR = r"C:\Users\moham\AppData\Local\Android\Sdk\build-tools\34.0.0"
ZIPALIGN = os.path.join(BUILD_TOOLS_DIR, "zipalign.exe")
APKSIGNER = os.path.join(BUILD_TOOLS_DIR, "apksigner.bat")
KEYSTORE = r"C:\Users\moham\.android\debug.keystore"

print("1. Reading original APK and replacing assets/public...")
with zipfile.ZipFile(SRC_APK, 'r') as zin:
    with zipfile.ZipFile(TEMP_APK, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            # Skip old assets/public and old META-INF signing blocks
            if item.filename.startswith("assets/public/") or item.filename.startswith("META-INF/"):
                continue
            zout.writestr(item, zin.read(item.filename))

        # Add all fresh files from PUBLIC_DIR
        for root, dirs, files in os.walk(PUBLIC_DIR):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, PUBLIC_DIR).replace('\\', '/')
                arcname = f"assets/public/{rel_path}"
                zout.write(full_path, arcname)

print("2. Aligning APK with zipalign...")
if os.path.exists(ALIGNED_APK):
    os.remove(ALIGNED_APK)
cmd_align = f'"{ZIPALIGN}" -f -p 4 "{TEMP_APK}" "{ALIGNED_APK}"'
subprocess.check_call(cmd_align, shell=True)

print("3. Signing APK with apksigner...")
cmd_sign = f'cmd.exe /c ""{APKSIGNER}" sign --ks "{KEYSTORE}" --ks-pass pass:android --key-pass pass:android "{ALIGNED_APK}""'
subprocess.check_call(cmd_sign, shell=True)

print("4. Verifying signed APK...")
cmd_verify = f'cmd.exe /c ""{APKSIGNER}" verify -v "{ALIGNED_APK}""'
output = subprocess.check_output(cmd_verify, shell=True, text=True)
print("Verification output:\n", output)

print("5. Overwriting wavelength-mobile.apk...")
shutil.move(ALIGNED_APK, OUTPUT_APK)
if os.path.exists(TEMP_APK):
    os.remove(TEMP_APK)
print("SUCCESS: wavelength-mobile.apk updated and signed for v2.0.0!")
