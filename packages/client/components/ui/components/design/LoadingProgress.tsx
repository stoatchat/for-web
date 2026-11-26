import "mdui/components/circular-progress.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

/**
 * Progress indicators express an unspecified wait time or display the duration of a process
 *
 * @library MDUI
 * @specification https://m3.material.io/components/progress-indicators
 */
export function CircularProgress() {
  return (
    <Base>
      <mdui-circular-progress class={loader()} />
    </Base>
  );
}

const Base = styled("div", {
  base: {
    position: "relative",
    width: "100%",
    height: "100%",
    minWidth: "40px",
    minHeight: "40px",
  },
});

const loader = cva({
  base: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
  },
});
