# Wavelength player update

## Playlists and search

- Playlists have a dedicated page with a track list, play and pause controls, saved-library actions and an explicit empty state. Home shortcuts, daily mixes, Liked Songs, search suggestions and library entries open their corresponding collection.
- Search across songs and playlists from the first letters of a name. Exact title matches rank first. The local index also matches artists, album names, accents and common single-letter mistakes. Public Jamendo playlists appear alongside local collections after the user pauses typing.
- Save a copy of a curated or public playlist, add songs, remove songs and reopen the result after a reload. The player, library and song cards share the saved Liked Songs collection.
- The Spotify importer previews available track metadata. JSON account exports preserve collection boundaries and offer a playlist picker. CSV imports recognize common headers, quoted fields and column order. Public links with unavailable track lists show an import alternative.
- Track action menus support queueing, liking and adding to a saved playlist.

## Artist photography and interface

- Added 14 credited performer portraits as local WebP assets. Home, artist radio, library, sidebar and settings use the same portraits. Each photograph has its own credit, source and license in `frontend/public/artists/CREDITS.txt`.
- Added light and dark design tokens, four surface layers, a 12–48 px type scale, spacing and radius tokens, focus rings, elevation and reduced-motion handling. Album artwork supplies the player background tint when the image allows color sampling.
- Updated the navigation, mobile tabs and player controls. The desktop library can collapse. Long titles scroll on focus or hover, the equalizer follows play state, and search and playlist loading use skeletons.
- Replaced misleading progress and success feedback on the local upload, Jam preview and sample listening recap. Updated form labels, empty states, photos and gallery captions.

## Verification

- Built the Next.js production static export under the GitHub Pages base path. Checked the 12 original routes at desktop and phone widths. Exercised the added playlist route at both widths.
- Opened a live public Jamendo playlist with 35 tracks and verified that the audio clock advanced and the pause control responded. Created a playlist, found it using a three-letter prefix, added and removed a track, reloaded it and verified the result. Decoded the 12 artist portraits used in mobile settings.
- Built the Android debug APK, verified its manifest, and checked the embedded home, search and playlist bundles plus all 14 portraits. Native interaction with this APK remains unverified on an Android device.
- Used the released Windows v2.0.0 executable in an isolated desktop to search the candidate web build, save a playlist and add a song.
- A regression check exercises local search and editing with external catalog requests blocked. Set `WAVELENGTH_URL` to the running player’s root URL, including any deployment prefix, and run `node scripts/test-playlists.js` from the repository root.

## Release considerations

Playlists and profiles persist in the local browser or app. Cross-device library sync requires a separate integration. Public catalog results, link imports and playable audio depend on upstream availability. The web checks establish functional behavior at the tested sizes. Peak traffic, whole-product accessibility conformance and device-specific frame rates need separate measurements. Native release assets have their own build and signing process.
