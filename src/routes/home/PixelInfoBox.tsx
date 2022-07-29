import { Fragment, FunctionalComponent, h } from "preact";
import style from "./style.css";
import {
  MessageOrType,
  Pixel,
  ConnectionEvent,
  ConnectionEventValues,
  ConnectionEventData,
  RollState,
  PixelRollStateValues,
  PixelRollState,
} from "@systemic-games/pixels-library";
import { useEffect, useState } from "preact/hooks";

interface PixelInfoBoxProps {
  pixel: Pixel;
  onRoll?: (pixel: Pixel, face: number, state: PixelRollState) => void;
}

const PixelInfoBox: FunctionalComponent<PixelInfoBoxProps> = ({
  pixel,
  onRoll,
  children,
}) => {
  const [lastConnEv, setLastConnEv] = useState<ConnectionEvent>(
    ConnectionEventValues.Connecting //TODO assume connecting by default
  );
  const [lastRollMsg, setLastRollMsg] = useState<RollState | undefined>();

  useEffect(() => {
    const connectionHandler = (ev: CustomEvent<ConnectionEventData>) => {
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
          setLastRollMsg(rollState);
        };

        update().catch((error) => {
          console.error(error);
        });
      }
    };

    const rollHandler = (ev: CustomEvent<MessageOrType>) => {
      const msg = ev.detail as RollState;
      const face = msg.faceIndex + 1;
      console.log(`${pixel.name} => roll state: ${msg.state}, face ${face}`);
      setLastRollMsg(msg);
      onRoll?.(pixel, face, msg.state);
    };

    // Add listeners to get notified on connection and roll events
    pixel.addEventListener("connectionEvent", connectionHandler);
    pixel.addEventListener("messageRollState", rollHandler);

    return () => {
      pixel.removeEventListener("connectionEvent", connectionHandler);
      pixel.removeEventListener("messageRollState", rollHandler);
    };
  }, [pixel, onRoll]);

  const connStatusColor =
    lastConnEv === "connecting"
      ? style.colorConnecting
      : lastConnEv === "connected"
      ? style.colorConnected
      : lastConnEv === "ready"
      ? style.colorReady
      : style.colorDisconnected;
  return (
    <div class={style.pixelInfoBox}>
      <div class={style.pixelInfoBoxContent}>
        {/* <text>{pixel.name}</text> */}
        <span class={[style.connectionStatusDisc, connStatusColor].join(" ")} />
        <div class={style.containerRelative}>
          <img class={style.dieImage} src="/assets/images/D20.png" />
          <div class={style.dieRollValue}>
            {lastRollMsg?.state === PixelRollStateValues.OnFace ? (
              <div class={style.animScaleBounce}>
                <text>{lastRollMsg.faceIndex + 1}</text>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default PixelInfoBox;
