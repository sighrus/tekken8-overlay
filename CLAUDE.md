# Tekken 8 Overlay

A desktop overlay for Tekken 8 with three independent features: (1) a combo
creator/overlay so the user can name, save, and share combos per character,
(2) an input overlay that shows the user's real-time inputs alongside frame
data (startup/block/hit, and specifically **i-frames** — invincibility
frames) for the move being performed, and (3) an execution trainer that
visualizes frame-perfect timing windows for hard techs (wavedash, crouch
dash, EWGF). This file is the persistent memory for the project — read it
fully before making changes, and keep it updated as decisions get made and
features land, since conversation history may not carry over between
sessions.

## Current state

- **Built:** a minimal Electron app (`package.json`, `main.js`,
  `renderer/`) that opens a frameless, transparent, always-on-top overlay
  window and renders a live raw controller/pad input viewer — a grid of
  button boxes (highlight when pressed) and axis bars, built dynamically
  from `navigator.getGamepads()` in the renderer (`renderer/renderer.js`).
  No native modules — this uses the browser Gamepad API, which Electron's
  Chromium renderer supports out of the box on both macOS and Windows, so
  it's testable on this Mac with the real controller plugged in.
- Click-through (`win.setIgnoreMouseEvents`) is deliberately commented out
  in `main.js` for now so the window can be inspected/moved during dev —
  flip it on once this is actually used over the game.
- **Not built yet:** combo overlay/creator (feature 1), frame-data
  cross-reference on top of the raw input viewer (feature 2), the
  execution-trainer frame-window bar (feature 3), and the Tekken-specific
  button/notation mapping for the leverless controller (right now it just
  shows raw button/axis indices — next step once the user confirms which
  index corresponds to which real input).
- Run with `npm start` (from this directory) once dependencies are
  installed.

## Dev environment gotcha (this Mac, this Claude Code sandbox)

`npm install` pulled `electron`, but its postinstall script
(`node_modules/electron/install.js`) silently failed to extract the
downloaded zip into `node_modules/electron/dist` when run through this
session's Bash tool — no error, just an empty `dist/` and no `path.txt`.
The zip itself downloaded fine and extracts fine with the plain `unzip`
CLI; only the postinstall's own `extract-zip`-based extraction (invoked
from Node) failed here, cause unconfirmed (possibly a sandbox restriction
on symlink creation performed *by a Node process* specifically). Worked
around by extracting manually:

```bash
unzip -q -o ~/Library/Caches/electron/<hash>/electron-v<version>-darwin-<arch>.zip \
  -d node_modules/electron/dist
printf 'Electron.app/Contents/MacOS/Electron' > node_modules/electron/path.txt
```

If `npm start` / `npm install` misbehaves again after a fresh
`node_modules`, check `node_modules/electron/dist` actually has
`Electron.app` in it before assuming something else is wrong. This is a
local sandbox quirk, not expected to reproduce on the Windows PC.

## Target platform / dev environment

- The overlay must run on the user's **Windows PC** — that's where Tekken 8
  and the controller are. This is a hard constraint on the tech stack
  (Windows-only APIs for the overlay window and input capture are fine to
  use).
- This project's planning has been done from a Claude Code session running
  on **macOS**, which cannot capture controller input or run/test a live
  Windows overlay. Plugging the controller into the Mac would not help —
  the app has to run on the same machine as the game to read input and
  render an overlay over it in real time, so testing has to happen on the
  Windows PC either way.
- **Decided workflow:** build with a cross-platform-friendly stack so most
  of the work can actually be developed and verified from this Mac
  session, and only the final "overlay sitting on top of the live game"
  check needs the Windows PC:
  - **UI** (combo list, input viewer, frame-box bar) — plain
    web UI/Electron-renderer code, previewable on Mac.
  - **Controller input capture** — the pad is a generic USB/HID gamepad;
    a cross-platform input layer (e.g. SDL2 GameController API, or a
    cross-platform HID library) can read it identically on macOS and
    Windows, so this can be built and tested on Mac with the controller
    plugged into it.
  - **Overlay window** (transparent/click-through/always-on-top) is
    OS-specific under the hood (Win32 layered-window flags vs. macOS
    NSWindow APIs), but a framework like Electron abstracts most of this
    behind one API with per-OS flags rather than a full rewrite.
  - **Hard limit:** Tekken 8 itself has no native Mac release and doesn't
    run reliably (if at all, given its anti-cheat) under
    Wine/CrossOver/Parallels — so "does the overlay actually sit correctly
    on top of the running game" can only be verified on the Windows PC.
    Everything else can be iterated on here first.
  - **Working stack default: Electron.** Not fully locked in, but it's the
    reasonable default given the cross-platform-preview goal above —
    revisit if it proves limiting for the overlay's click-through/topmost
    behavior on Windows.

## The three features

### 1. Combo overlay (creator + display)

- An area/UI where the user can create and name combos, saved **per
  character**.
- Combos need to be shareable in at least one of these forms (exact format
  TBD):
  - A file per character (or per combo) that can be handed to someone else.
  - A copy/paste text blob, in the spirit of Valorant's crosshair-code
    sharing — paste a code/string in, and the app regenerates the combo
    list from it. This is the preferred direction if feasible, since it
    needs no file transfer.
- Displayed as an on-screen overlay while the game is running so the user
  can reference saved combos mid-session.

### 2. Input + frame data overlay

- Shows the user's real-time inputs (like a fight-stick/input viewer).
- Cross-references the move being performed against frame data and
  surfaces it live, with **i-frames specifically called out** (not just
  startup/on-block/on-hit, which most frame data displays default to).
- **Decided:** the current move is derived from the tracked controller/pad
  input sequence (notation matching against each character's move list),
  not from reading Tekken 8's process memory. User confirmed — no memory
  reading/injection, ever. This keeps the tool in "input viewer + local
  lookup" territory rather than the kind of live-state read anti-cheat
  treats as a cheat tool.

### 3. Execution trainer (wavedash / crouch dash / EWGF frame-window visualizer)

- Inspired by Super Smash Bros. Melee's **UnclePunch Training Mode
  (Community Edition)** —
  https://github.com/UnclePunch/Training-Mode ,
  https://www.reddit.com/r/SSBM/comments/1gkj981/announcing_training_mode_community_edition/
  — which gives visual feedback for landing hard/frame-tight techs (there,
  L-cancelling and wavedashing). The Tekken equivalent techs are things
  like wavedashes, crouch dashes, and EWGF (Electric Wind God Fist, for
  Mishima characters).
- **Explicitly scoped as visualization only** — the user does not want
  game files or memory touched, only feedback built from tracked
  controller input timed against known frame windows (same "no memory
  reads" boundary as feature 2).
- UI concept: a horizontal bar of boxes, one per frame, for the move/tech
  being practiced (e.g. a 20-frame move renders as 20 red/yellow boxes),
  with the box(es) marking the valid window to buffer the next input
  (e.g. box 21) highlighted green. Purpose is purely to help the user see
  and internalize correct timing, not an in-game modification.
- **Data gap to resolve:** general frame data (startup/block/hit, from the
  sources below) does not usually document tech-specific cancel/buffer
  windows like a wavedash's chain window or EWGF's just-frame window.
  This will likely need hand-curated data from community tech knowledge
  rather than a lookup against the same frame-data source as feature 2.
- Since this reads controller input only (never game memory/state), it
  visualizes whether input *timing* matches the known correct window — it
  approximates rather than directly confirms the game registered the tech,
  which is an accepted tradeoff given the no-memory-reading constraint.

## Data sources

- **EWGF API** — https://ewgf.gg/api-docs#get-battles — battle/match data.
  No account/auth token created yet; the user flagged this as a TODO for
  themselves. The `GET /battles` endpoint needs an authorization token once
  an account exists.
- **Frame data** — two candidate sources, not yet compared in detail:
  - https://okizeme.gg/database
  - https://tekkendocs.com/t8/framedata
  - Open question from the user: unclear whether Okizeme's data is
    downstream of/synced with TekkenDocs, or independently maintained.
    Verify before picking one as the source of truth (or scrape/reconcile
    both) — don't assume TekkenDocs is authoritative without checking.
- Neither frame-data site is known to expose a public API as of this
  writing — expect scraping or a manually-maintained dataset rather than a
  clean API integration, unless research turns up otherwise.

## Decisions needed before implementation

These block real implementation work and should be resolved (with the user,
where the tradeoff is non-obvious) before writing app code:

- **Platform/tech stack.** Tekken 8 on PC is the assumed target (overlay
  concept implies PC, not console). Not yet chosen: native Windows overlay
  (e.g. C#/WPF or C++ with a transparent always-on-top click-through
  window) vs. Electron vs. something else. Whatever is chosen needs to
  render as a transparent, click-through, always-on-top layer above a
  fullscreen/borderless game window.
- **Input capture method — decided:** read raw controller/pad input (e.g.
  XInput/DirectInput/raw-input on Windows), never Tekken 8's process
  memory. Must support **any Xbox or PlayStation pad**, plus the user's
  actual controller: a **Sehawei Haute42 T16 leverless arcade controller**
  (all-button/"Hitbox-style" layout, no stick, custom RGB) —
  https://www.amazon.com/dp/B0CN6M44F4 . Leverless controllers like this
  typically expose a mode switch (Xbox/PS/Switch/PC), which changes
  whether Windows sees it as an XInput device or a generic
  DirectInput/HID gamepad — confirm which mode the user runs it in, since
  XInput alone won't cover PlayStation-mode or generic-HID pads and the
  capture layer needs to handle both.
- **Frame data storage.** Local structured dataset (JSON/SQLite) populated
  from whichever source is chosen above, refreshed manually or via a
  scraper — needs a decision once the Okizeme-vs-TekkenDocs question is
  answered.
- **Combo share-code format.** Whether to build a Valorant-style encoded
  string (compact, opaque) or a simpler readable format (e.g. JSON/YAML
  per character) — encoding/decoding logic doesn't exist yet either way.
- **EWGF API's role.** Not yet clear how battle data (match history/stats)
  ties into either overlay feature — may be a later addition once the
  account/token exists, not a launch-blocking dependency.

## Conventions

- No code, stack, or architecture exists yet — don't assume any of the
  above decisions have been made; confirm with the user before scaffolding
  a specific framework.
