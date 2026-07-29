# Penguin SWF Action Map

This is the working map for the desktop penguin recreation. File names alone are not enough to guarantee the original QQ Pet meaning, so every entry starts as a best-effort label and should be verified visually.

## Currently Wired

| Behavior | Files |
| --- | --- |
| Idle | `Penguin/GG/chang/1.swf`, `2.swf`, `3.swf`, `4.swf` |
| Walk | `Penguin/GG/chang/5.swf`, `6.swf`, `7.swf`, `8.swf` |
| Feed | `Penguin/GG/e/chi1.swf`, `chi2.swf`, `chi3.swf` |
| Clean | `Penguin/GG/e/xizao.swf` |
| Play | `Penguin/GG/other/lai0.swf`, `lai1.swf`, `lai2.swf` |
| Sick | `Penguin/GG/bing/1.swf`, `2.swf`, `3.swf` |

## Available But Not Yet Wired

| Folder | Files | Likely Meaning |
| --- | --- | --- |
| `Penguin/GG/chang` | `9.swf`, `10.swf`, `11.swf`, `12.swf`, `drag.swf`, `drag0.swf`, `drop.swf`, `land.swf`, `ok.swf` | movement, drag, drop, land, confirm |
| `Penguin/GG/e` | `he1.swf`, `he2.swf`, `he3.swf`, `study.swf`, `work.swf` | drink, study, work |
| `Penguin/GG/other` | `lai3.swf`, `qu0.swf`, `qu1.swf`, `shengji.swf`, `si0.swf`, `si1.swf` | come/go, level up, death |
| `Penguin/GG/xinqing` | `a-fix.swf` | mood |
| `Penguin/GG/zt` | `a-fix.swf`, `e.swf`, `yang.swf` | status variants |

## Next Verification Pass

1. Build a small action viewer that plays every SWF with a label.
2. Compare each animation against old QQ Pet screenshots or videos.
3. Rename behavior keys in code only after visual confirmation.
