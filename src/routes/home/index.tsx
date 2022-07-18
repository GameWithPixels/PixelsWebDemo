import { FunctionalComponent, h } from "preact";
import style from "./style.css";
import {
  MessageOrType,
  Pixel,
  RollState,
  Color,
  EditDataSet,
  EditAnimationRainbow,
  EditAnimationSimple,
} from "@systemic-games/pixels-library";
import { useState } from "preact/hooks";

const log = console.log;

const Home: FunctionalComponent = () => {
  const [pixel, setPixel] = useState<Pixel | undefined>();

  const connect = async (): Promise<void> => {
    // Ask user to select a Pixel
    const pixel = await Pixel.requestPixel();
    log("Connecting...");
    await pixel.connect();
    setPixel(pixel);

    // Get some info
    const rollState = await pixel.getRollState();
    log(`=> roll state: ${rollState.state}, face ${rollState.faceIndex}`);
    const battery = await pixel.getBatteryLevel();
    log(`=> battery: ${battery.level}, ${battery.voltage}v`);
    const rssi = await pixel.getRssi();
    log(`=> rssi: ${rssi}`);

    // Add listener to get notified when the Pixel roll state changes
    pixel.addEventListener(
      "messageRollState",
      (ev: CustomEvent<MessageOrType>) => {
        // Or: pixel.addMessageListener(MessageTypeValues.RollState, (ev: CustomEvent<MessageOrType>) => {
        const msg = ev.detail as RollState;
        log(`=> roll state: ${msg.state}, face ${msg.faceIndex}`);
      }
    );
  };

  const blink = async (): Promise<void> => {
    await pixel?.blink(Color.red, 3);
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
    pixel?.playTestAnimation(editDataSet.toDataSet());
  };

  const instant = async (): Promise<void> => {
    const editDataSet = new EditDataSet();
    editDataSet.animations.push(
      new EditAnimationRainbow({
        duration: 3,
        count: 2,
        fade: 0.5,
      })
    );
    editDataSet.animations.push(
      new EditAnimationSimple({
        duration: 3,
        color: Color.magenta,
        count: 2,
        fade: 0.5,
      })
    );
    await pixel?.transferInstantAnimations(editDataSet.toDataSet());
  };

  const playInstant = async (animIndex: number): Promise<void> => {
    await pixel?.playInstantAnimation(animIndex);
  };

  return (
    <div class={style.home}>
      <h1>Home</h1>
      <p>Connected to {pixel?.name}</p>
      <button onClick={connect}>Connect</button>
      <p />
      <button onClick={blink}>Blink</button>
      <p />
      <button onClick={rainbow}>Rainbow</button>
      <p />
      <button onClick={instant}>Instant</button>
      <button onClick={(): Promise<void> => playInstant(0)}>Play #0</button>
      <button onClick={(): Promise<void> => playInstant(1)}>Play #1</button>
    </div>
  );
};

export default Home;
