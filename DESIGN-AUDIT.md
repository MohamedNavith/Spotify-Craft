# Wavelength interface audit

Baseline: deployed GitHub Pages build from commit `83e45ff`. Inspected all 12 routes with Chromium at 1440 × 960 and 390 × 844. Findings include shared controls and states found in source. Severity describes impact on task completion or trust.

| Screen | UI | UX | UE |
| --- | --- | --- | --- |
| Home | Major · six single-column shortcuts crowd discovery below the mobile fold. | Minor · current destination is difficult to distinguish outside mobile tabs. | Minor · competing card treatments and motion. |
| Search | Major · two search fields compete on desktop and six columns compress on tablet. | Major · results briefly disappear and loading appears as a line of text. | Minor · oversized category tiles and inconsistent entrance. |
| Library | Major · multiple stacked labels and panels compete with collections. | Major · blocking download-empty alert interrupts browsing. | Minor · repeated full-strength shadows and uneven card spacing. |
| Album | Major · missing artwork leaves an empty colored square. | Minor · loading text gives no sense of the page structure. | Major · title and controls jump on load. |
| History | Minor · small, muted empty-state copy. | Minor · empty state offers no immediate way to find music. | Minor · abrupt empty view. |
| Podcasts | Minor · episode metadata competes with titles at small widths. | Major · sample shows are presented as a live catalog. | Minor · heavy card outlines separate related content. |
| Jam | Minor · wide panel padding reduces mobile text area. | Critical · sample participants and local playback are described as a live synchronized session. | Major · invite success appears even when clipboard writing fails. |
| Login | Major · logo and title duplicate hierarchy in a narrow card. | Major · labels lack explicit associations and password manager cues are missing. | Minor · errors have limited announcement support. |
| Register | Major · dense form and duplicate branding. | Major · labels and password expectations are unclear to assistive technology. | Minor · submit feedback changes the button only. |
| Settings | Major · artist cards dominate the route and push audio controls below the fold. | Minor · preference groups are hard to scan. | Minor · repeated strong elevation and animated accents. |
| Upload | Minor · oversized panel padding narrows mobile controls. | Critical · local file playback is described as server transcoding and verified hardware output. | Major · artificial delay imitates encoding activity. |
| Wrapped | Minor · wide gradient and multiple accent colors compete with figures. | Critical · example statistics look personal and Share reports success without copying. | Major · blocking alert interrupts the flow. |
| Shared shell and player | Major · inconsistent chrome, too many high-emphasis actions, and poorly visible slider thumbs. | Major · narrow desktop layout crowds controls, some icon buttons lack names and active states, and quality can show a guessed bitrate. | Major · animations ignore reduced motion, cards use broad transitions, and fixed height can clip behind mobile browser chrome. |

## Playlist and portrait findings

| Severity | Area | Finding |
| --- | --- | --- |
| Critical | UX | Playlist links opened an importer or played a chart song. List membership, opening and editing a saved collection had no consistent path. |
| Major | UX | Search returned only songs. Short queries depended on a network lookup, and the global and page search fields competed on desktop. |
| Major | UI | Artist surfaces reused unrelated photos or album images. A broken cover URL also affected the featured album. |
| Major | UE | Playback controls and saved-like state could disagree between entry points. |
| Major | UX | The file picker offered JSON but read Spotify exports as lines of song text. Public imports could substitute unrelated tracks after a lookup failure. |

## Contrast spot checks

WCAG AA targets 4.5:1 for normal text and 3:1 for large text and non-text control boundaries. Baseline white at 40% opacity on #121212 yields about 3.67:1. Baseline #b3b3b3 at 60% opacity on #181818 yields about 3.33:1, affecting credit text on track cards. The updated token pairs are checked separately. Artwork overlays, component-specific legacy colors and overlays require additional contrast review.

| Updated token pair | Contrast ratio |
| --- | --- |
| Primary text on dark surface 1 | 17.87 to 1 |
| Muted text on dark surface 4 | 6.22 to 1 |
| Primary text on light surface 1 | 16.47 to 1 |
| Muted text on light surface 4 | 6.08 to 1 |

Ratios use the WCAG relative-luminance formula on the solid tokens. Translucent layers and artwork backgrounds vary by image.

## Automated follow-up

An axe-core scan found a low-contrast Discord link, dark library surfaces behind dark text in light mode, and missing names on the album, podcast and settings controls. After correction, axe-core 4.10.3 reported zero violations of the WCAG 2 A/AA and 2.1 A/AA rules it checks on the 13 routes tested in dark desktop and light phone layouts. These 26 checks cover the displayed route states. Dialogs, other viewport combinations and assistive-technology workflows need separate evaluation.
