# MIDNIGHT EXPRESS — Steal the Brass Key

![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)
![rank](https://make.fun/badge/best-stealth-game-20261121-1759/iwan0494/midnight-express-stealth/rank.svg)
![reward](https://make.fun/badge/best-stealth-game-20261121-1759/iwan0494/midnight-express-stealth/reward.svg)

A top-down stealth game aboard a luxury sleeper train at night, built for the
[make.fun bounty "Make the best stealth game"](https://make.fun/bounty/best-stealth-game-20261121-1759).

You are a stowaway on the midnight express. Slip through three carriages —
the Sleeper Car, the Dining Car and the Luggage Car — past patrolling
conductors with raycast vision cones, sweeping lantern arcs and pulsing alarm
wires. Hide in shadowed berths and hatched blind spots, douse the carriage
lamps, throw pebbles and steam bursts to distract the crew, steal the Brass
Key from the conductor's safe, and slip out the rear door unseen.

## How to play

- **WASD / arrows** — move · **SHIFT** — sneak (slower, quieter, harder to see)
- **Mouse aim, CLICK** — throw a pebble (noise draws a conductor to investigate)
- **Q** — steam burst (blocks vision for a few seconds)
- **E** — pick up loot / the Brass Key, open the rear door, douse a lamp switch
- **H** — field notes · **M** — mute · **ESC** — pause · **R** — restart carriage

## Stealth systems

- 5-state conductor AI: CALM → SUSPICIOUS → ALERTED → CHASE → SEARCH
- State-coloured vision cones (amber / orange / red) with real line-of-sight
- Detection meter that fills while seen and drains faster when well hidden
- Alarm wires with visible timing gaps, rotating lantern arcs, lamp switches
- Dashed patrol routes with waypoint wait timers, hatched blind-spot zones
- Moonlight pools (seen from afar) vs shadow (hard to spot)

## Run it

Open `game/index.html` in a desktop browser, or serve the `game/` folder
with any static server. `main.ts` (Node 22, standard library only) copies
`game/` and `screenshots/` to `$MAKEFUN_OUTPUT_DIR` and writes
`dossier.json`.
