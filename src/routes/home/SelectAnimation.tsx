import { FunctionalComponent, h } from "preact";
import { EditAnimation } from "@systemic-games/pixels-edit-animation";
import { useState } from "preact/hooks";

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

export default SelectAnimation;
