import { Fragment, FunctionalComponent, h } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import {
  requestPixel,
  Color,
  Pixel,
  repeatConnect,
  PixelRollState,
} from "@systemic-games/pixels-web-connect";
import {
  AppDataSet,
  EditAnimationRainbow,
  EditAnimationGradientPattern,
  EditRgbGradient,
  EditAnimationGradient,
  EditAnimationSimple,
  EditDataSet,
  createDataSetForAnimations,
} from "@systemic-games/pixels-edit-animation";
import PixelInfoBox from "./PixelInfoBox";
import style from "./style.css";
import { usePixelStatus } from "@systemic-games/pixels-react";

type PlayMode = "setup" | "transfer" | "play";
type OddOrEven = "odd" | "even";

const minNumDice = 3;
const delayBeforeAnimResults = 100;
const delayBetweenAnimResults = 2000;

interface ControlsProps {
  readyCount: number;
  playMode: PlayMode;
  setPlayMode: (playMode: PlayMode) => void;
  oddOrEven: OddOrEven;
  setOddOrEven: (oddOrEven: OddOrEven) => void;
  allDiceRolled: boolean;
  connect: () => Promise<void>;
}

const Controls: FunctionalComponent<ControlsProps> = ({
  readyCount,
  playMode,
  setPlayMode,
  oddOrEven,
  setOddOrEven,
  allDiceRolled,
  connect,
}) => {
  const onChangeValue = useCallback(
    (event: h.JSX.TargetedEvent<HTMLDivElement>) => {
      if ((event.target as HTMLInputElement).value === "odd") {
        setOddOrEven("odd");
      } else {
        setOddOrEven("even");
      }
    },
    [setOddOrEven]
  );
  const setTransferMode = useCallback(
    () => setPlayMode("transfer"),
    [setPlayMode]
  );
  const setSetupMode = useCallback(() => setPlayMode("setup"), [setPlayMode]);
  return (
    <div>
      {playMode === "setup" ? (
        <>
          <p>
            {readyCount < minNumDice
              ? `Click on the button to connect to at least ${minNumDice} Pixel dice.`
              : "Click on Start when you have connected all your dice."}
          </p>
          <button class={style.buttonHighlighted} onClick={connect}>
            Connect To Pixels
          </button>
          {readyCount >= minNumDice ? (
            <button class={style.buttonHighlighted} onClick={setTransferMode}>
              Start
            </button>
          ) : (
            <></>
          )}
        </>
      ) : playMode === "transfer" ? (
        <>
          <p>{`Transferring animations, please wait...`}</p>
          {/* TODO <button
            class={style.buttonHighlighted}
            onClick={() => setPlayMode("setup")}
          >
            Cancel Transfer
          </button> */}
        </>
      ) : (
        <>
          <p>
            {allDiceRolled
              ? "Results are in! Roll your dice to play again."
              : `Betting on ${oddOrEven} numbers, change your choice or roll your dice!`}
          </p>
          <div class={style.controlsButtons}>
            <div onChange={onChangeValue}>
              <input
                type="radio"
                name="oddOrEven"
                value="odd"
                checked={oddOrEven === "odd"}
              />
              <text class={style.controlsText}>Odd</text>
              <input
                type="radio"
                name="oddOrEven"
                value="even"
                checked={oddOrEven === "even"}
              />
              <text class={style.controlsText}>Even</text>
            </div>
            <button class={style.buttonHighlighted} onClick={setSetupMode}>
              Stop Game
            </button>
          </div>
        </>
      )}
    </div>
  );
};

interface PixelControlsProps {
  pixel: Pixel;
  disconnect: (pixel: Pixel) => void;
}

const PixelControls: FunctionalComponent<PixelControlsProps> = ({
  pixel,
  disconnect,
}) => {
  const status = usePixelStatus(pixel);

  const reconnect = async (pixel: Pixel) => {
    try {
      await repeatConnect(pixel);
    } catch (error) {
      console.error(error);
    }
  };

  const blink = async (pixel: Pixel) => {
    await pixel.blink(Color.dimYellow, { count: 3, fade: 0.5 });
  };

  const rainbow = async (pixel: Pixel) => {
    const editDataSet = new EditDataSet();
    editDataSet.animations.push(
      new EditAnimationRainbow({
        duration: 3,
        count: 2,
        fade: 0.5,
      })
    );
    await pixel.playTestAnimation(editDataSet.toDataSet());
  };

  return (
    <div class={style.containerButtons}>
      {status === "disconnected" ? (
        <button
          class={style.buttonHighlighted}
          onClick={() => reconnect(pixel)}
        >
          Re-connect
        </button>
      ) : (
        <>
          <input
            class={style.buttonSmallImage}
            type="image"
            src="/assets/images/blinker.png"
            alt="blink"
            onClick={() => blink(pixel)}
          />
          <input
            class={style.buttonSmallImage}
            type="image"
            src="/assets/images/rainbow.png"
            onClick={() => rainbow(pixel)}
          />
          <input
            class={style.buttonSmallImage}
            type="image"
            src="/assets/images/clear.png"
            alt="remove"
            onClick={() => disconnect(pixel)}
          />
        </>
      )}
    </div>
  );
};

interface OddOrEvenGameProps {
  defaultAppDataSet: AppDataSet;
}

const OddOrEvenGame: FunctionalComponent<OddOrEvenGameProps> = ({
  defaultAppDataSet,
}) => {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [playMode, setPlayModeRaw] = useState<PlayMode>("setup");
  const [oddOrEven, setOddOrEven] = useState<OddOrEven>("odd");
  const [transferProgresses, setTransferProgresses] = useState<number[]>([]);
  const [rolls] = useState<number[]>([]);
  const [results, setResults] = useState<OddOrEven[]>([]);
  const [allDiceRolled, setAllDiceRolled] = useState(false);
  const [, setRollAnimTimeoutId] = useState<ReturnType<typeof setTimeout>>();

  // Store our animations
  const animDataSet = useMemo(() => {
    // Loose animation: blink red twice, with some fading.
    const animLoose = new EditAnimationSimple({
      duration: 1.5,
      color: Color.red,
      count: 2,
      fade: 0.4,
    });

    // Win animation #1: play rainbow twice during 2 seconds,
    // with some fading between colors.
    const animWin1 = new EditAnimationRainbow({
      duration: 2,
      count: 2,
      fade: 0.5,
    });

    // Win animation #2: animate color from green to dark blue,
    // over 2 seconds.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const animWin2 = new EditAnimationGradient({
      duration: 2,
      gradient: EditRgbGradient.createFromKeyFrames([
        { time: 0.2, color: Color.green },
        { time: 0.8, color: Color.dimBlue },
      ]),
    });

    // Win animation #3: use pattern to drive LEDs brightness while
    // animating colors from red to orange to green.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const animWin3 = new EditAnimationGradientPattern({
      duration: 2,
      pattern: defaultAppDataSet.findPattern("Rotating Wide Ring"),
      gradient: EditRgbGradient.createFromKeyFrames([
        { time: 0.15, color: Color.red },
        { time: 0.2, color: Color.orange },
        { time: 0.5, color: Color.yellow },
        { time: 0.7, color: Color.brightGreen },
        { time: 0.85, color: Color.green },
      ]),
    });

    // Build the above animations so they can be uploaded to the dice
    return createDataSetForAnimations([animWin1, animLoose]).toDataSet();
  }, [defaultAppDataSet]);

  const clearRolls = useCallback(() => {
    console.log("Clearing rolls");
    rolls.length = 0;
    setResults([]);
    setAllDiceRolled(false);
    setRollAnimTimeoutId((rollAnimTimeoutId) => {
      if (rollAnimTimeoutId) {
        console.log("Cancelling playing roll animation");
        clearTimeout(rollAnimTimeoutId);
      }
      return undefined;
    });
    // State "rolls" never changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Change play mode and clear roll results
  const setPlayMode = useCallback(
    (newPlayMode: PlayMode) => {
      setPlayModeRaw((playMode) => {
        if (newPlayMode !== playMode) {
          clearRolls();
          console.log(`Play mode changed to: ${newPlayMode}`);
          if (newPlayMode === "transfer") {
            setTransferProgresses([]);
            Promise.allSettled(
              pixels.map((pixel, i) => {
                console.log(`Transferring animations to ${pixel.name}`);
                return pixel.transferInstantAnimations(
                  animDataSet,
                  (progress) =>
                    setTransferProgresses((transferProgresses) => {
                      const progresses = [...transferProgresses];
                      progresses[i] = progress;
                      return progresses;
                    })
                );
              })
            )
              .then(() => {
                console.log("Animations transferred to all dice");
                setPlayMode("play");
              })
              .catch((error) => console.error(error)); //TODO handle fail transfer
          }
        }
        return newPlayMode;
      });
    },
    [animDataSet, clearRolls, pixels]
  );

  const connect = useCallback(async () => {
    // Ask user to select a Pixel
    try {
      clearRolls();
      const pixel = await requestPixel();
      setPixels((pixels) => {
        if (!pixels.includes(pixel)) {
          return [...pixels, pixel];
        }
        return pixels;
      });
      await repeatConnect(pixel);
    } catch (error) {
      console.error(error);
    }
  }, [clearRolls]);

  const disconnect = useCallback(
    async (pixel: Pixel) => {
      clearRolls();
      setPixels((pixels) => {
        if (pixels.includes(pixel)) {
          return pixels.filter((p) => p !== pixel);
        }
        return pixels;
      });
      pixel.disconnect();
    },
    [clearRolls]
  );

  // Stopping animations on dismount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => clearRolls, []);

  // const playAnimation = (pixel: Pixel, winOrLoose: "win" | "lose") => {
  //   // Play Rainbow for winners and blink magenta for the others
  //   const editDataSet = new EditDataSet();
  //   editDataSet.animations.push(
  //     winOrLoose === "win"
  //       ? new EditAnimationRainbow({
  //           duration: 3,
  //           count: 2,
  //           fade: 0.5,
  //         })
  //       : new EditAnimationSimple({
  //           duration: 1,
  //           color: Color.darkMagenta,
  //           count: 2,
  //           fade: 128,
  //         })
  //   );
  //   pixel.playTestAnimation(editDataSet.toDataSet());
  // };

  const onRoll = useCallback(
    (pixel: Pixel, face: number, state: PixelRollState) => {
      if (playMode === "play") {
        const index = pixels.indexOf(pixel);
        if (index >= 0) {
          rolls[index] = state === "onFace" ? face : 0;
          const validRollsCount = rolls.filter((f) => !!f).length;
          setAllDiceRolled((allDiceRolled) => {
            const allRolled = pixels.length === validRollsCount;
            if (allDiceRolled !== allRolled) {
              if (!allRolled) {
                setResults([]);
              }
              return allRolled;
            }
            return allDiceRolled;
          });
        } else {
          console.error(`Got rolled on unknown die: ${pixel.name}`);
        }
      }
    },
    [playMode, pixels, rolls]
  );

  useEffect(() => {
    if (playMode === "play" && allDiceRolled) {
      console.log(
        `All dice rolled: ${pixels
          .map((p, i) => `${p.name} => ${rolls[i]}`)
          .join(", ")}`
      );
      const oddOrEvenRolls = rolls.map((f) => (f % 2 === 1 ? "odd" : "even"));
      setRollAnimTimeoutId((rollAnimTimeoutId) => {
        if (rollAnimTimeoutId) {
          clearTimeout(rollAnimTimeoutId);
        }
        return setTimeout(() => {
          Promise.allSettled(pixels.map((pixel) => pixel.stopAllAnimations()))
            .then(() => {
              setResults(oddOrEvenRolls);
              pixels.forEach((pixel, i) =>
                setTimeout(() => {
                  //TODO register timeout with setRollAnimTimeoutId so it's cancelled by clearRolls
                  const win = oddOrEvenRolls[i] === oddOrEven;
                  console.log(
                    `Playing ${win ? "win" : "loose"} animation on ${
                      pixel.name
                    }`
                  );
                  pixel
                    .playInstantAnimation(win ? 0 : 1)
                    .catch((error) => console.error(error));
                }, delayBetweenAnimResults * i)
              );
            })
            .catch((error) => console.error(error));
        }, delayBeforeAnimResults);
      });
    }
  }, [allDiceRolled, oddOrEven, pixels, playMode, rolls]);

  const oddRolls = results.filter((r) => r === "odd").length;
  const evenRolls = results.filter((r) => r === "even").length;
  const gameWinOrLoose = !results.length
    ? undefined
    : (oddOrEven === "odd" && oddRolls >= evenRolls) ||
      (oddOrEven === "even" && evenRolls >= oddRolls)
    ? "win"
    : "lose";

  return (
    <div>
      <p />
      <Controls
        readyCount={pixels.length} //TODO .filter((p) => p.ready).length}
        playMode={playMode}
        setPlayMode={setPlayMode}
        oddOrEven={oddOrEven}
        setOddOrEven={setOddOrEven}
        connect={connect}
        allDiceRolled={!!gameWinOrLoose}
      />
      <p />
      <p />
      {pixels.length ? (
        <div>
          <ul>
            {pixels.map((pixel, i) => (
              <li key={pixel}>
                <div>
                  <PixelInfoBox pixel={pixel} onRoll={onRoll}>
                    {playMode === "setup" ? (
                      <PixelControls pixel={pixel} disconnect={disconnect} />
                    ) : (
                      <></>
                    )}
                  </PixelInfoBox>
                  {playMode === "play" && gameWinOrLoose ? (
                    <div
                      class={[
                        style.resultBox,
                        results[i] === oddOrEven
                          ? style.animVFlip
                          : style.animHFlip,
                      ].join(" ")}
                    >
                      <img
                        src={
                          results[i] === oddOrEven
                            ? "/assets/images/smile.png"
                            : "/assets/images/angry.png"
                        }
                        alt={results[i]}
                      />
                      <text>{results[i]}</text>
                    </div>
                  ) : playMode === "transfer" ? (
                    <div class={style.resultBox}>
                      <text>{`Transfer: ${
                        transferProgresses[i] !== undefined
                          ? `${transferProgresses[i]}%`
                          : "-"
                      }`}</text>
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div>
            <p />
            {gameWinOrLoose ? (
              <div class={style.animVFlip}>
                <text class={style.gameResult}>{`There are ${
                  oddRolls ? oddRolls : "no"
                } odd roll${oddRolls > 1 ? "s" : ""} and ${
                  evenRolls ? evenRolls : "no"
                } even roll${evenRolls > 1 ? "s" : ""}, you've ${
                  gameWinOrLoose === "win" ? "won" : "lost"
                } your bet!`}</text>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default OddOrEvenGame;
