# react-native-enriched-markdown: finished views re-measure on every list layout (Android)

On Android, each finished `EnrichedMarkdownText` in a list is measured again when another row changes height. While one reply streams, every finished message is parsed and laid out again.

This app has 20 finished messages and one reply that grows every 100 ms. The finished rows are wrapped in `memo`, so React never re-renders them. Every extra measure comes from layout.

## Versions

- react-native-enriched-markdown 1.0.2 (the same code is on `main`)
- React Native 0.86.3, Expo 57, New Architecture

## Result

Pixel 7 emulator (Android 16), release build, one reply of 60 chunks:

| `measure()` calls | 1.0.2 | 1.0.2 with `fix/remeasure-fix.patch` |
| --- | ---: | ---: |
| Each finished message (20) | 60 | 0 |
| The streaming message | 60 | 60 |
| Total | 1260 | 60 |

## Reproduce

The patch in `patches/` adds one `Log.d` line to `EnrichedMarkdownManager.measure`. It changes nothing else.

1. Install the dependencies:

   ```sh
   pnpm install
   ```

2. Build and install the app on an Android emulator or device:

   ```sh
   pnpm exec expo run:android --variant release
   ```

3. Count the `measure()` calls during one streamed reply:

   ```sh
   ANDROID_SERIAL=emulator-5554 ./scripts/count-measures.sh
   ```

## Test the change

`fix/remeasure-fix.patch` changes `MarkdownContainerShadowNode` only:

- It overrides `shouldNewRevisionDirtyMeasurement` to return `fragment.props != nullptr`, as React Native's `ParagraphShadowNode` does. A clone then keeps its measurement unless its props changed.
- The clone constructor copies `forceHeightRecalculationCounter_` from the source node, so a clone does not call `dirtyLayout()` for a state counter the source already handled.

To apply it, append the patch to the logging patch and reinstall:

```sh
cat fix/remeasure-fix.patch >> patches/react-native-enriched-markdown@1.0.2.patch
pnpm install
rm -rf android
pnpm exec expo run:android --variant release
ANDROID_SERIAL=emulator-5554 ./scripts/count-measures.sh
```

Delete `android/` before the build. Otherwise Gradle can keep compiling the old, unpatched package directory from its autolinking cache.
