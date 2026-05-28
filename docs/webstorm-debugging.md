# WebStorm Next.js Debugging And Dev Accounts

Source: ChatGPT shared conversation `https://chatgpt.com/share/6a17e8b3-b374-832c-bea7-221132c2e542`, titled `Polkadot dev accounts explained`, read on 2026-05-28.

Use this guide when working with Polkadot/Substrate dev accounts, importing Alice/Bob into wallet extensions, or debugging this Next.js app in WebStorm.

## Polkadot/Substrate dev accounts

- `//Alice`, `//Bob`, `//Charlie`, etc. are public development accounts only. They are not safe for mainnet, real testnet funds, or anything private.
- The public development mnemonic is `bottom drive obey lake curtain smoke basket hold race lonely fit walk`.
- The account names are derivation paths from that same mnemonic, not separate mnemonics. Example: `bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice`.
- `//Alice` is a shorthand SURI derivation path that many Substrate tools expand using the public development phrase.
- For wallet import, use the mnemonic plus advanced derivation path `//Alice` or `//Bob`, and crypto type `sr25519`. If only the mnemonic is imported without a path, the wallet may create the root dev account instead of Alice.

## WebStorm Next.js debugging

- For Next.js server-side debugging in this repo, prefer a debug script using `NODE_OPTIONS='--inspect' next dev`; the older direct `next dev --inspect` flag is deprecated.
- In WebStorm, server debugging should attach to Node/Next.js inspector ports. An example run exposed `9229` and then printed that the Next.js router server should be inspected at `9230`; use `9230` for the router server when that message appears.
- Client-side React debugging is not done by attaching to `9229` or `9230`. For files with `'use client'`, create a WebStorm `JavaScript Debug` configuration pointed at `http://localhost:3000` and let WebStorm launch/debug Chrome.
- If client breakpoints do not hit, temporarily add `debugger;` inside a browser-executed place such as a `useEffect` and refresh the WebStorm-launched Chrome tab.
- For more predictable debugging, avoid Turbopack initially. The repo's normal dev script uses `next dev --hostname 0.0.0.0 --turbopack`, but a debug script without Turbopack is easier to reason about.

## WebStorm Chrome profile with extensions

- WebStorm's JavaScript Debug opens a separate Chrome debugging profile, which can look like a fresh/incognito-like browser and lack extensions.
- To keep wallet extensions such as Polkadot.js, configure WebStorm Chrome settings with a custom user data directory: `Settings / Preferences -> Tools -> Web Browsers and Preview -> Chrome -> Edit -> Use custom user data directory`.
- A good path used in the conversation was `/Users/archilphanchulidze/chrome-webstorm-debug-profile`.
- Install extensions and import dev accounts once inside that debug Chrome profile; future WebStorm JavaScript Debug sessions should reuse them.
- Do not point WebStorm directly at the normal daily Chrome profile as the first choice, because Chrome profile locking can interfere when the normal browser is already open.
