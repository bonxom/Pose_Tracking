import colors from "@/constants/colors";
import Svg, { Circle, Path } from "react-native-svg";

export default function CameraIcon({ color = colors.text, size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <Circle cx="256" cy="272" r="81.1" fill={color} />
      <Path
        d="M432,128h-44.2c-6.1,0-11.6-3.4-14.3-8.8l-14.3-28.6c-8.1-16.3-24.7-26.6-42.9-26.5H195.8c-18.2-0.1-34.9,10.2-42.9,26.5  l-14.4,28.6c-2.7,5.4-8.2,8.8-14.2,8.8H80c-26.5,0-48,21.5-48,48v224c0,26.5,21.5,48,48,48h352c26.5,0,48-21.5,48-48V176  C480,149.5,458.5,128,432,128z M256,384c-61.9,0-112-50.1-112-112s50.1-112,112-112s112,50.1,112,112  C367.9,333.8,317.8,383.9,256,384z"
        fill={color}
      />
    </Svg>
  );
}
