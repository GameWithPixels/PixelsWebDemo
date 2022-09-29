import { Fragment, FunctionalComponent, h } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  MessageOrType,
  Pixel,
  RollState,
  PixelRollStateValues,
  PixelRollState,
  PixelStatus,
} from "@systemic-games/pixels-core-connect";
import style from "./style.css";

interface PixelInfoBoxProps {
  pixel: Pixel;
  onRoll?: (pixel: Pixel, face: number, state: PixelRollState) => void;
}

const PixelInfoBox: FunctionalComponent<PixelInfoBoxProps> = ({
  pixel,
  onRoll,
  children,
}) => {
  const [lastConnEv, setLastConnEv] = useState<PixelStatus>("connecting"); //TODO assume connecting by default
  const [lastRollMsg, setLastRollMsg] = useState<RollState | undefined>();

  useEffect(() => {
    const statusHandler = (status: PixelStatus) => {
      setLastConnEv(status);
      if (status === "ready") {
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

    const rollHandler = (msg: MessageOrType) => {
      const roll = msg as RollState;
      const face = roll.faceIndex + 1;
      console.log(`${pixel.name} => roll state: ${roll.state}, face ${face}`);
      setLastRollMsg(roll);
      onRoll?.(pixel, face, roll.state);
    };

    // Add listeners to get notified on connection and roll events
    pixel.addEventListener("status", statusHandler);
    pixel.addMessageListener("RollState", rollHandler);

    return () => {
      pixel.removeEventListener("status", statusHandler);
      pixel.removeMessageListener("RollState", rollHandler);
    };
  }, [pixel, onRoll]);

  const connStatusColor =
    lastConnEv === "connecting"
      ? style.colorConnecting
      : lastConnEv === "identifying"
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
