# Canada &amp; New England Cruise — Trip Hub

A personal trip knowledge hub for the Holland America *ms Zuiderdam* voyage,
Quebec City to Boston, 13–20 June 2026 (booking 4LMNGG).

## Live site

https://mondrianaire.github.io/Cruise/

## Contents

| File | What it is |
|------|------------|
| `index.html` | The complete knowledge hub — route map, itinerary, flights, hotels, the ship, package, Know Before You Go, and a built-in interactive **Excursion Finder**: tag / price / duration filtering, sort, and the live **Group Picks** board covering all 89 shore excursions. |
| `excursion-tags.json` | The underlying tagged dataset — 89 excursions classified with 16 theme tags plus facets. |
| `firestore-rules.txt` | The Firestore security-rules block to paste into the Firebase Console (reference; not auto-deployed). |

## Group Picks sync

The Group Picks board inside `index.html` syncs live across every traveller's
device via Firebase Firestore (project `gto-poker-qui`, collection `cruise`,
document `4LMNGG`). Each browser signs in anonymously; a checkmark on one phone
appears on all of them within about a second. Opened as a local file, sync is
unavailable and picks are stored on that device only.

Pure static site — no build step. Whatever is at the repo root is served as-is.
