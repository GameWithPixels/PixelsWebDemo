import { FunctionalComponent, h } from "preact";
import { useEffect } from "preact/hooks";
import {
  Pixel,
  PixelRollStateValues,
} from "@systemic-games/pixels-web-connect";
import style from "./style.css";
import { usePixelStatus, usePixelValue } from "@systemic-games/pixels-react";

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
  const status = usePixelStatus(pixel);
  const [rollState] = usePixelValue(pixel, "rollState");
  const [rollResult] = usePixelValue(pixel, "roll");

  useEffect(() => {
    if (status === "ready") {
      const getInfo = async () => {
        // Log battery state
        console.log(
          `${pixel.name} => battery: ${pixel.batteryLevel}, isCharging: ${pixel.isCharging}`
        );
        // Log RSSI
        console.log(`${pixel.name} => rssi: ${await pixel.queryRssi()}`);
        // Log roll state
        console.log(
          `${pixel.name} => initial roll state: ${pixel.rollState}, face ${pixel.currentFace}`
        );
      };

      getInfo().catch(console.error);
    }
  }, [pixel, status]);

  useEffect(() => {
    if (rollState) {
      // Notify roll state change
      onRoll?.(pixel, rollState.face, rollState.state);
    }
  }, [onRoll, pixel, rollState]);

  useEffect(() => {
    if (rollResult) {
      // We log the result of each roll just for demonstration purposes
      console.log(`Pixel ${pixel.name} rolled a ${rollResult.face}`);
    }
  }, [rollResult, pixel]);

  const connStatusColor =
    status === "connecting"
      ? style.colorConnecting
      : status === "identifying"
      ? style.colorConnected
      : status === "ready"
      ? style.colorReady
      : style.colorDisconnected;
  return (
    <div class={style.pixelInfoBox}>
      <div class={style.pixelInfoBoxContent}>
        <span class={[style.connectionStatusDisc, connStatusColor].join(" ")} />
        <div class={style.containerRelative}>
          <img class={style.dieImage} src="/assets/images/D20.png" />
          <div class={style.dieRollValue}>
            {pixel.rollState === "onFace" && (
              <div class={style.animScaleBounce}>
                <text>{pixel.currentFace}</text>
              </div>
            )}
          </div>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default PixelInfoBox;
