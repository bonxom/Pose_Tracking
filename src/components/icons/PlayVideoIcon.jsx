import colors from "@/constants/colors";
import Svg, { Path } from "react-native-svg";

export default function PlayVideoIcon({
  size = 36,
  color = colors.white,
  opacity = 0.95,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Path
        d="M256,0C114.616,0,0,114.616,0,256s114.616,256,256,256c141.394,0,256-114.616,256-256S397.394,0,256,0z M256,460.8 c-112.927,0-204.8-91.873-204.8-204.8S143.073,51.2,256,51.2S460.8,143.073,460.8,256S368.927,460.8,256,460.8z"
        fill={color}
        opacity={opacity}
      />
      <Path
        d="M349.112,238.08l-124.15-71.68c-17.07-9.851-31.037-1.792-31.037,17.92v143.36c0,19.712,13.967,27.781,31.037,17.92 l124.15-71.68C366.182,264.069,366.182,247.931,349.112,238.08z"
        fill={color}
        opacity={opacity}
      />
    </Svg>
  );
}
