# Wavelength for Android

Wavelength renders its Android interface in Flutter. The player uses just_audio and audio_service, and the library lives in SQLite on the device. Internet catalog searches and lyrics requests go directly to providers. Friends can sideload the APK without setting up a Wavelength server.

## Using the app

Search for a song, artist, album or playlist from Search. Use the plus button on a song to add it to a playlist. Open the mini-player to seek or change the queue. The library also supports local files. Sharing opens a card preview and uses Android share targets. Large playlists can be sent through the share sheet when the contents exceed the QR badge limit.

## Reference and verification

The reference was wavelength-mobile GPT Astra 6.2 Extra High.apk. Its 14 artist portraits and their credits match the Flutter assets byte for byte. Automated tests cover short queries, Hindi and Tamil prefixes, Spotify link and CSV parsing, timed lyrics parsing, player navigation, headset click interpretation, and track row controls. Gesture tests simulate inputs. They do not establish interoperability with a physical headset.

| Area | Current coverage | Release verification still needed |
| --- | --- | --- |
| Playback | Android media session, queue, local audio and offline storage | Notification shade, lock screen, long screen-off session, interruptions and Bluetooth |
| Interface | Home, search, library, full player, Verci and Lumn | Side-by-side screenshots and small-phone layout comparison |
| Sharing | On-device image cards, QR and Android share targets | Delivery to actual installed social apps |
| Library | Device-local playlists, likes and import | Existing-install data migration and offline restore |
| Devices | Widget, Quick Settings tile and Android audio routing code | Oppo, Vivo, USB DAC and car controls |

## Build and distribution

Run `flutter pub get`, `flutter test` and `flutter build apk --release` from this directory. The APK is written to `build/app/outputs/flutter-apk/app-release.apk`. The existing release configuration signs with the developer debug key. Android permits an in-place update only when application ID and signing identity match. WebView libraries and Flutter SQLite libraries use different storage formats.

No paid hosting, Meta account or Snap account is required for the system share sheet. Receiving apps choose which posting destinations to expose. Private Spotify collections depend on provider access. Remote streaming and artwork require internet access. The serverless configuration has no central username inbox or cross-device account service. Physical DAC output quality, screen fidelity and full commercial-service feature parity remain unverified.

## Build 8 verification

On an isolated Android 14 emulator, the release APK installed over the supplied reference APK using the same signing certificate. Home and Library opened. A shared playlist link opened Evening drive with Tum Hi Ho by Arijit Singh. A local WAV played through the Android media session with the screen off. The notification displayed its title and artist, and tapping Pause changed the session state to paused at 156 seconds.

Build 8 preserves non-Latin letters and combining marks during search. Story cards export at 1080 × 1920 and square posts at 1080 × 1080 when the preview has its normal dimensions. Playlist links carry title and artist metadata so another device can open the list. Local file quality labels use the container or codec name and omit unmeasured bit depth and sample rate.
