# Wavelength Android reference recreation

This independent Flutter project uses the supplied wavelength-mobile GPT Astra 6.2 Extra High.apk as its design and catalog reference. Its SHA-256 is 004866f43665f1a8595e80c0ff17929a844e9f2df9631f546bc9d73875df0ba0. The project has a separate Android application ID so both apps can be installed and compared on one phone.

Flutter renders the interface. A single just_audio instance runs behind audio_service. Library records and playlist membership live on the device. No Wavelength server, sign-in, or new API key is required. Online catalog availability depends on the provider. The bundled commercial catalog entries contain the previews supplied with the reference. Local imports use copies of the selected files in app storage.

## Reference material

The four bundled catalog shelves were read from the reference APK's JavaScript bundle. The 14 credited portraits come from its assets/public/artists directory. The quick links, portrait shelf, ambient panel and five destinations follow its home screen. The code in this project was written separately from mobile_flutter.

## Build

Run flutter pub get, flutter test and flutter build apk --release from this directory. The current APK uses a development signing identity for private installation.

## Scope of this build

The player supports searching the bundled catalog and Jamendo, local audio import, playlist creation and adding songs, opening a queue, seeking, repeat and shuffle. The source APK's account UI, Verci visualizations, podcast catalog, lyrics, sharing, Spotify import, advanced audio settings and social features still need implementation in this recreation. The full device and visual parity checklist remains open.
