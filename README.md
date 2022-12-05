# PixelsWebDemo

Source code for the demo shown in the Pixel Kickstarter July [update](
    https://www.kickstarter.com/projects/pixels-dice/pixels-the-electronic-dice/posts/3568853
).

It demonstrates how to use the `Pixels Web Connect` package. See the package's
[readme](
    https://www.npmjs.com/package/@systemic-games/pixels-web-connect
) for information about supported browsers.

The game is intended to be played with at least 3 Pixels dice, but if you have less than that
you may edit `minNumDice` in `src/routes/home/OddOrEvenGame`.

To try out different win animation, search for `animWin1` and find where the animation is used.
You may replace replace it with either `animWin2` or `animWin3`.

## CLI Commands

*   `yarn`: Installs dependencies

*   `yarn dev`: Run a development, HMR server

*   `yarn serve`: Run a production-like server

*   `yarn build`: Production-ready build

*   `yarn lint`: Pass TypeScript files using ESLint

*   `yarn test`: Run Jest and Enzyme with
    [`enzyme-adapter-preact-pure`](https://github.com/preactjs/enzyme-adapter-preact-pure) for
    your tests

For detailed explanation on how things work, checkout the [CLI Readme](
    https://github.com/developit/preact-cli/blob/master/README.md
).

# Images Attributions

* clear.png: [Cross icons created by Pixelmeetup - Flaticon](
    https://www.flaticon.com/free-icons/cross"
)
* blinker.png: [Blinker Icons erstellt von Freepik - Flaticon](
    https://www.flaticon.com/de/kostenlose-icons/
)
* rainbow.png: [Rainbow icons created by Freepik - Flaticon](
    https://www.flaticon.com/free-icons/rainbow
)
* smile.png: [Smile icons created by Pixel perfect - Flaticon](
    https://www.flaticon.com/free-icons/smile
)
* angry.png: [Emoji icons created by Freepik - Flaticon](
    https://www.flaticon.com/free-icons/emoji
)
