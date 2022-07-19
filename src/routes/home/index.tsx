import { Fragment, FunctionalComponent, h } from "preact";
import style from "./style.css";
import {
  MessageOrType,
  Pixel,
  ConnectionEvent,
  ConnectionEventValues,
  ConnectionEventData,
  RollState,
  Color,
  loadAppDataSet,
  AppDataSet,
  EditAnimation,
  EditProfile,
  EditRule,
  EditConditionIdle,
  EditActionPlayAnimation,
  EditAnimationSimple,
  PixelRollStateValues,
} from "@systemic-games/pixels-library";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

async function loadAppDataSetFromJson(jsonFilename: string) {
  const res = await fetch(`./assets/${jsonFilename}`);
  const data = await res.json();
  console.log("Loaded profiles:", data);
  return loadAppDataSet(data);
}

interface PixelInfoBoxProps {
  pixel: Pixel;
  onRolled?: (pixel: Pixel, face: number) => void;
  onRemove?: (pixel: Pixel) => void;
}

const PixelInfoBox: FunctionalComponent<PixelInfoBoxProps> = ({
  pixel,
  onRolled,
  onRemove,
}) => {
  const [lastConnEv, setLastConnEv] = useState<ConnectionEvent>(
    ConnectionEventValues.Connecting //TODO assume connecting by default
  );
  const [lastRoll, setLastRoll] = useState(0);

  useEffect(() => {
    const onConnectionEvent = (ev: CustomEvent<ConnectionEventData>) => {
      const connEv = (ev.detail as ConnectionEventData).event;
      setLastConnEv(connEv);
      if (connEv === "ready") {
        const update = async () => {
          // Get some info
          const battery = await pixel.getBatteryLevel();
          console.log(
            `${pixel.name} => battery: ${battery.level}, ${battery.voltage}v`
          );
          const rssi = await pixel.getRssi();
          console.log(`${pixel.name} => rssi: ${rssi}`);
          const rollState = await pixel.getRollState();
          const face = rollState.faceIndex + 1;
          console.log(
            `${pixel.name} => initial roll state: ${rollState.state}, face ${face}`
          );
          setLastRoll(face);
        };

        update().catch((error) => {
          console.log(error);
        });
      }
    };

    const onRollEvent = (ev: CustomEvent<MessageOrType>) => {
      const msg = ev.detail as RollState;
      if (msg.state === PixelRollStateValues.OnFace) {
        const face = msg.faceIndex + 1;
        console.log(`${pixel.name} => roll state: ${msg.state}, face ${face}`);
        setLastRoll(face);
        onRolled?.(pixel, face);
      }
    };

    // Add listeners to get notified on connection and roll events
    pixel.addEventListener("connectionEvent", onConnectionEvent);
    pixel.addEventListener("messageRollState", onRollEvent);

    return () => {
      pixel.removeEventListener("connectionEvent", onConnectionEvent);
      pixel.removeEventListener("messageRollState", onRollEvent);
    };
  }, [pixel, onRolled]);

  const blink = async () => {
    await pixel.blink(Color.red, 3);
  };

  // const rainbow = async () => {
  //   const editDataSet = new EditDataSet();
  //   editDataSet.animations.push(
  //     new EditAnimationRainbow({
  //       duration: 3,
  //       count: 2,
  //       fade: 0.5,
  //     })
  //   );
  //   pixel.playTestAnimation(editDataSet.toDataSet());
  // };

  return (
    <p>
      <text class={style.boldText}>Die: {pixel.name}</text>
      <br />
      <text>Status: {lastConnEv}</text>
      <br />
      <text>Last roll: {lastRoll}</text>
      <p />
      <button onClick={blink}>Blink</button>
      {/* <button onClick={rainbow}>Rainbow</button> */}
      {onRemove ? (
        <button onClick={() => onRemove(pixel)}>Remove</button>
      ) : (
        <></>
      )}
    </p>
  );
};

interface SelectAnimationProps {
  animations: EditAnimation[];
  onAnimationChange: (value?: EditAnimation) => void;
}

const SelectAnimation: FunctionalComponent<SelectAnimationProps> = ({
  animations,
  onAnimationChange,
}) => {
  const [index, setIndex] = useState(-1);
  return (
    <select
      value={index}
      onChange={(e) => {
        const i = Number(e.currentTarget.value);
        setIndex(i);
        onAnimationChange(animations[i]);
      }}
    >
      {animations.map((p, i) => (
        <option key={i} value={i}>
          {p.name}
        </option>
      ))}
    </select>
  );
};

interface DemoProps {
  defaultAppDataSet: AppDataSet;
}

const Demo: FunctionalComponent<DemoProps> = ({ defaultAppDataSet }) => {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const selectedAnimationsRef = useRef<(EditAnimation | undefined)[]>([]);
  const rollsRef = useRef<(number | undefined)[]>([]);

  const connect = async () => {
    // Ask user to select a Pixel
    try {
      resetRolls();
      const pixel = await Pixel.requestPixel();
      setPixels((pixels) => {
        if (!pixels.includes(pixel)) {
          return [...pixels, pixel];
        }
        return pixels;
      });
      await pixel.connect(true);
    } catch (error) {
      console.log(error);
    }
  };

  const disconnect = async (pixel: Pixel) => {
    resetRolls();
    setPixels((pixels) => {
      if (pixels.includes(pixel)) {
        return pixels.filter((p) => p !== pixel);
      }
      return pixels;
    });
    pixel.disconnect();
  };

  const resetRolls = () => {
    rollsRef.current.length = 0;
  };

  const onRolled = useCallback(
    (pixel: Pixel, face: number) => {
      console.log(pixels);
      const index = pixels.indexOf(pixel);
      if (index >= 0) {
        rollsRef.current[index] = face;
        const rolls = rollsRef.current.filter((f) => !!f) as number[];
        console.log(rolls);
        if (pixels.length === rolls.length) {
          const sortedDice = [...pixels];
          sortedDice.sort((p0, p1) => {
            const i0 = pixels.indexOf(p0);
            const i1 = pixels.indexOf(p1);
            return rolls[i1] - rolls[i0];
          });
          console.log(rolls);
          console.log(
            `All dice rolled: ${sortedDice.map((p) => p.name).join(", ")}`
          );
          resetRolls();
          Promise.allSettled(
            sortedDice.map((pixel, i) => {
              console.log(`Playing ${i} on ${pixel.name}`);
              return pixel.playInstantAnimation(i, true);
            })
          ).catch((error) => console.error(error));
        }
      } else {
        console.error(`Got rolled on unknown die: ${pixel.name}`);
      }
    },
    [pixels]
  );

  const program = async (defaultAppDataSet: AppDataSet): Promise<boolean> => {
    if (pixels.length) {
      const animations = pixels.map((_, i) => {
        const anim = selectedAnimationsRef.current[i];
        return (
          anim ??
          //TODO use Color.dimmedRed
          new EditAnimationSimple({
            duration: 1,
            color: Color.fromBytes(100, 0, 0),
            count: 2,
          })
        );
      });
      const profile = new EditProfile();
      profile.rules.push(
        new EditRule(
          new EditConditionIdle(),
          animations.map((a) => {
            return new EditActionPlayAnimation(a);
          })
        )
      );
      //TODO add extractAnimations() so to not create a dummy profile
      const dataSet = new AppDataSet({
        patterns: [...defaultAppDataSet.patterns],
        animations,
        profiles: [profile],
      })
        .extractForProfile(profile)
        .toDataSet();
      const results = await Promise.allSettled(
        pixels.map(async (pixel) => {
          try {
            await pixel.transferInstantAnimations(dataSet);
          } catch (error) {
            console.error(error);
            throw error;
          }
        })
      );
      resetRolls();
      return results.every((r) => r.status === "fulfilled");
    }
    console.log("No dice to program");
    return true;
  };

  const onAnimationChange = (slotIndex: number, animation?: EditAnimation) => {
    selectedAnimationsRef.current[slotIndex] = animation;
  };

  const testAnimation = async (slotIndex: number) => {
    await Promise.allSettled(
      pixels.map((pixel) => pixel.playInstantAnimation(slotIndex, true))
    );
  };

  return (
    <>
      <button onClick={connect}>Connect To Pixel</button>
      <p>
        {pixels.length
          ? `Pixels: ${pixels.map((p) => p.name).join(", ")}`
          : "Click on the button to connect to a Pixel die"}
      </p>
      {pixels.map((_, i) => (
        <p key={i}>
          <text>{`Rank #${i + 1}: `}</text>
          <SelectAnimation
            animations={defaultAppDataSet.animations}
            onAnimationChange={(a) => onAnimationChange(i, a)}
          />
          <button onClick={() => testAnimation(i)}>Test</button>
        </p>
      ))}
      {pixels.length ? (
        <>
          <p />
          <button onClick={() => program(defaultAppDataSet)}>
            {`Program Dice (${pixels.length})`}
          </button>
          <p />
          <p />
          <text class={style.boldText}>Dice List:</text>
          {pixels.map((pixel) => (
            <PixelInfoBox
              key={pixel}
              pixel={pixel}
              onRolled={onRolled}
              onRemove={disconnect}
            />
          ))}
        </>
      ) : (
        <></>
      )}
    </>
  );
};

const Home: FunctionalComponent = () => {
  const [defaultAppDataSet, setDefaultAppDataSet] = useState<
    AppDataSet | undefined
  >();
  // const [niceProfileDataSet, setNiceProfileDataSet] = useState<
  //   DataSet | undefined
  // >();

  useEffect(() => {
    async function loadProfiles() {
      setDefaultAppDataSet(
        await loadAppDataSetFromJson("default-profiles.json")
      );
      // const niceProfileAppDataSet = await loadAppDataSetFromJson(
      //   "nice-profile.json"
      // );
      // setNiceProfileDataSet(
      //   niceProfileAppDataSet
      //     .extractForProfile(niceProfileAppDataSet.profiles[0])
      //     .toDataSet()
      // );
    }
    loadProfiles().catch((error) => console.error(error));
  }, []);

  return (
    <div class={style.home}>
      <h1>Home</h1>
      {defaultAppDataSet ? (
        <Demo defaultAppDataSet={defaultAppDataSet} />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Home;
