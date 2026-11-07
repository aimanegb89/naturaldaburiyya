# New-order sound picker

## What you get
In Manager Settings → «تنبيهات الطلبات ووقت التحضير», below the sound switch, a list of sounds to choose from. Each has a small play button to hear it, and tapping one selects it. The choice is saved for the store, so every manager device uses the same sound.

Presets (about 10, all generated in the app, no files to download):
1. Classic chime (current, default)
2. Gentle bell
3. Cash register (ka-ching)
4. Digital ping
5. Double beep
6. Rising arpeggio
7. Doorbell (ding-dong)
8. Marimba
9. Alarm (loud, repeating 3x, for busy kitchens)
10. Soft pop

Also a volume option: Normal / Loud, and "repeat until opened" is NOT included (keeps it simple).

## Technical details
- Migration: add `store_settings.chime_sound text not null default 'classic'` and `chime_volume text not null default 'normal'`.
- New `src/lib/chimes.ts`: Web Audio synth definitions per preset (oscillator type, note sequence, envelope), `playChime(id, volume)`; keep vibration.
- `OrdersBoard.tsx`: load `chime_sound`/`chime_volume` (and refresh via existing settings load) and call `playChime`; `chime()` export kept as wrapper.
- `SettingsPage.tsx`: preset list with preview buttons (Arabic labels via `useTx`), save on select.
