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
  EditDataSet,
  EditAnimationRainbow,
  AppDataSet,
  loadAppDataSet,
} from "@systemic-games/pixels-library";
import { useEffect, useState } from "preact/hooks";

const log = console.log;

let niceProfileAppDataSet: AppDataSet;
fetch("./assets/nice-profile.json")
  .then((res) => res.json())
  .then((data) => {
    log("data:", data);
    niceProfileAppDataSet = loadAppDataSet(data);
  });

interface PixelInfoBoxParams {
  pixel: Pixel;
}

const PixelInfoBox: FunctionalComponent<PixelInfoBoxParams> = ({ pixel }) => {
  const [lastConnEv, setLastConnEv] = useState<ConnectionEvent>(
    ConnectionEventValues.Disconnected
  );
  const [lastRoll, setLastRoll] = useState(0);

  useEffect(() => {
    pixel.addEventListener(
      "connectionEvent",
      (ev: CustomEvent<ConnectionEventData>) => {
        const connEv = (ev.detail as ConnectionEventData).event;
        setLastConnEv(connEv);
        if (connEv === "ready") {
          const update = async (): Promise<void> => {
            // Get some info
            const rollState = await pixel.getRollState();
            log(
              `=> roll state: ${rollState.state}, ` +
                `face ${rollState.faceIndex + 1}`
            );
            const battery = await pixel.getBatteryLevel();
            log(`=> battery: ${battery.level}, ${battery.voltage}v`);
            const rssi = await pixel.getRssi();
            log(`=> rssi: ${rssi}`);

            // Add listener to get notified when the Pixel roll state changes
            pixel.addEventListener(
              "messageRollState",
              (ev: CustomEvent<MessageOrType>) => {
                const msg = ev.detail as RollState;
                log(`=> roll state: ${msg.state}, face ${msg.faceIndex + 1}`);
                setLastRoll(msg.faceIndex + 1);
              }
            );
          };

          update().catch((error) => {
            log(error);
          });
        }
      }
    );
  }, [pixel]);

  const blink = async (): Promise<void> => {
    await pixel.blink(Color.red, 3);
  };

  const rainbow = async (): Promise<void> => {
    const editDataSet = new EditDataSet();
    editDataSet.animations.push(
      new EditAnimationRainbow({
        duration: 3,
        count: 2,
        fade: 0.5,
      })
    );
    pixel.playTestAnimation(editDataSet.toDataSet());
  };

  const instant = async (): Promise<void> => {
    // const editDataSet = new EditDataSet();
    // editDataSet.animations.push(
    //   new EditAnimationRainbow({
    //     duration: 3,
    //     count: 2,
    //     fade: 0.5,
    //   })
    // );
    // editDataSet.animations.push(
    //   new EditAnimationSimple({
    //     duration: 3,
    //     color: Color.magenta,
    //     count: 2,
    //     fade: 0.5,
    //   })
    // );
    await pixel.transferInstantAnimations(
      niceProfileAppDataSet
        .extractForProfile(niceProfileAppDataSet.profiles[0])
        .toDataSet()
    );
  };

  const playInstant = async (animIndex: number): Promise<void> => {
    await pixel.playInstantAnimation(animIndex);
  };

  return (
    <>
      <p>Die: {pixel.name}</p>
      <p>Last conn ev: {lastConnEv}</p>
      <p>Last roll: {lastRoll}</p>
      <p>Pixel Id: 0x{pixel.pixelId.toString(16).toLocaleUpperCase()}</p>
      <button onClick={blink}>Blink</button>
      <p />
      <button onClick={rainbow}>Rainbow</button>
      <p />
      <button onClick={instant}>Instant</button>
      <button onClick={(): Promise<void> => playInstant(0)}>Play #0</button>
      <button onClick={(): Promise<void> => playInstant(1)}>Play #1</button>
      <button onClick={(): Promise<void> => playInstant(2)}>Play #2</button>
    </>
  );
};

const Home: FunctionalComponent = () => {
  const [pixels, setPixels] = useState<Pixel[]>([]);

  const connect = async (): Promise<void> => {
    // Ask user to select a Pixel
    const pixel = await Pixel.requestPixel();
    setPixels((pixels) => {
      if (!pixels.includes(pixel)) {
        return [...pixels, pixel];
      }
      return pixels;
    });
    log("Connecting...");
    await pixel.connect();
  };

  return (
    <div class={style.home}>
      <h1>Home</h1>
      <p>Connected to {pixels.map((p) => p.name).join(", ")}</p>
      <button onClick={connect}>Connect</button>
      <p />
      {pixels.map((pixel) => (
        <PixelInfoBox key={pixel} pixel={pixel} />
      ))}
    </div>
  );
};

export default Home;
