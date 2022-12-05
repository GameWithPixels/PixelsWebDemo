import { Fragment, FunctionalComponent, h } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  Pixel,
  PixelRollStateValues,
  PixelStatus,
} from "@systemic-games/pixels-web-connect";
import style from "./style.css";

interface PixelInfoBoxProps {
  pixel: Pixel;
  onRoll?: (
    pixel: Pixel,
    face: number,
    state: keyof typeof PixelRollStateValues
  ) => void;
}

const PixelInfoBox: FunctionalComponent<PixelInfoBoxProps> = ({
  pixel,
  onRoll,
  children,
}) => {
  const [lastConnEv, setLastConnEv] = useState<PixelStatus>("connecting"); //TODO assume connecting by default
  const [lastRoll, setLastRoll] = useState<number>();

  useEffect(() => {
    const statusHandler = (status: PixelStatus) => {
      setLastConnEv(status);
      if (status === "ready") {
        const update = async () => {
          // Get some info
          const battery = await pixel.queryBattery();
          console.log(
            `${pixel.name} => battery: ${battery.level}, isCharging: ${battery.isCharging}`
          );
          const rssi = await pixel.queryRssi();
          console.log(`${pixel.name} => rssi: ${rssi}`);
          console.log(
            `${pixel.name} => initial roll state: ${pixel.rollState}, face ${pixel.currentFace}`
          );
          setLastRoll(pixel.rollState === "onFace" ? pixel.currentFace : 0);
        };

        update().catch((error) => {
          console.error(error);
        });
      }
    };

    const rollHandler = (rollState: {
      face: number;
      state: keyof typeof PixelRollStateValues;
    }) => {
      console.log(
        `${pixel.name} => roll state: ${rollState.state}, face ${rollState.face}`
      );
      setLastRoll(rollState.state === "onFace" ? rollState.face : 0);
      onRoll?.(pixel, rollState.face, rollState.state);
    };

    // Add listeners to get notified on connection and roll events
    pixel.addEventListener("status", statusHandler);
    pixel.addEventListener("rollState", rollHandler);

    return () => {
      pixel.removeEventListener("status", statusHandler);
      pixel.removeEventListener("rollState", rollHandler);
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
            {lastRoll ? (
              <div class={style.animScaleBounce}>
                <text>{lastRoll}</text>
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
