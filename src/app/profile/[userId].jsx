import ProfileScreenContent from "@/components/profile/ProfileScreenContent";
import { useLocalSearchParams } from "expo-router";

export default function UserProfileScreen() {
  const params = useLocalSearchParams();
  const userId = typeof params.userId === "string" ? params.userId : "";

  return <ProfileScreenContent userId={userId} />;
}
