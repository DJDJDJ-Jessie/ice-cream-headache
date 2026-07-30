# QQ Pet Replica Progress

Current branch: `codex/native-qq-penguin`

This is still an early reconstruction. The current build is a native Windows desktop-pet foundation, not a complete 1:1 QQ Pet recreation.

Primary planning docs:

- Product direction: `docs/product-document.md`
- Development plan: `docs/development-document.md`

## Current Status

| Area | Progress | Notes |
| --- | --- | --- |
| Native Windows desktop shell | 50% | Transparent, borderless, always-on-top, hidden from the taskbar. |
| Portable `.exe` packaging | 85% | `npm run build:exe` generates a runnable Windows exe. |
| Tray/menu basics | 35% | Usable, but visual/menu structure is not original yet. |
| SWF playback | 50% | Uses Ruffle, hides its preloader/logo, and swaps between two player layers after a short frame wait. |
| Local save | 25% | Position and simplified stats are saved locally. |
| Basic desktop interaction | 30% | Dragging, right-click menu, double-click status. Random walking is paused until action mapping is verified. |
| SWF action inventory | 40% | Action viewer exists, but labels still need visual verification. |
| Original QQ Pet UI | 5% | Not recreated yet. |
| Original gameplay rules | 10% | Current stats are placeholders. |
| Overall 1:1 restoration | 18% | Foundation is usable, accuracy work has only started. |

## Direction Lock

From now on, implementation should follow the product and development docs first. If a feature conflicts with those documents, stop and update the plan before coding.

## Fixed Since Last Progress Note

| Problem | Status |
| --- | --- |
| Invented startup/action bubble text | Fixed for normal actions. No startup bubble is shown now. |
| Invented drag/feed/clean/play/study/work text | Fixed. These actions no longer show custom text. |
| Action switch flicker | Improved. The player now preloads into a hidden Ruffle layer, then swaps visibility. It may not be perfect because Ruffle still loads SWF content internally. |
| Ruffle logo leaking behind the penguin | Improved. Ruffle preloader/logo overlays are now hidden inside each player. |
| Unknown/random background-facing actions | Improved. Default idle is restricted to one conservative SWF and random walking is paused until action mapping is verified. |

## Known Problems

| Area | Current Problem | Next Direction |
| --- | --- | --- |
| Action switching | Some flicker may remain | If Ruffle still flashes after preloader hiding, convert SWFs to frame/sprite assets or cache full action players. |
| Action mapping | Many labels are guessed | Use `npm run view:actions` to visually label every SWF. |
| Original copy | Exact original text is not confirmed | Keep bubbles quiet until original text/screenshots are collected. |
| Original menus | Current right-click menu is functional, not visual-original | Recreate the original QQ Pet context/menu/status UI after action mapping. |
| Original rules | Stats/items are placeholders | Rebuild food, daily goods, yuanbao, study, work, sick, and growth rules from reference material. |

## Current Executable

Portable exe:

```text
dist/QQ Penguin-0.1.0-x64.exe
```

Build command:

```powershell
npm run build:exe
```
