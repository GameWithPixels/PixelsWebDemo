import { FunctionalComponent, h } from "preact";
import style from "./style.css";
import {
  loadAppDataSet,
  AppDataSet,
} from "@systemic-games/pixels-edit-animation";
import { useEffect, useState } from "preact/hooks";
import OddOrEvenGame from "./OddOrEvenGame";

async function loadAppDataSetFromJson(jsonFilename: string) {
  const res = await fetch(`./assets/${jsonFilename}`);
  const data = await res.json();
  console.log("Loaded profiles:", data);
  return loadAppDataSet(data);
}

// <div class={style.animSelectionBox}>
//   {pixels.map((_, i) => (
//     <div key={i}>
//       <text>{`Animation for rank #${i + 1}: `}</text>
//       <SelectAnimation
//         animations={defaultAppDataSet.animations}
//         onAnimationChange={(a) => onAnimationChange(i, a)}
//       />
//       <button onClick={() => testAnimation(i)}>Test</button>
//     </div>
//   ))}
// </div>
// <button
//   class={style.buttonHighlighted}
//   onClick={() => program(defaultAppDataSet)}
// >
//   {`Program Dice (${pixels.length})`}
// </button>

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
      {defaultAppDataSet ? (
        <OddOrEvenGame defaultAppDataSet={defaultAppDataSet} />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Home;
