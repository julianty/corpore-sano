import { Modal, SegmentedControl, useMantineColorScheme } from "@mantine/core";
import { useContext } from "react";
import { UserPreferencesModalProps } from "../types";
import { useAppSelector } from "../hooks";
import { FirestoreActions } from "../helperFunctions/FirestoreActions";
import { UserProfileContext } from "../App";

export function UserPreferencesModal(props: UserPreferencesModalProps) {
  const { setColorScheme } = useMantineColorScheme();
  const { ...modalProps } = props;
  // Load user profile from context
  const userProfileContext = useContext(UserProfileContext);
  if (!userProfileContext)
    throw new Error("Could not load user profile in Modal");
  const { userProfile, setUserProfile } = userProfileContext;

  const userId = useAppSelector((state) => state.auth.userId);

  const handleWeightUnitChange = (weightUnit: string) => {
    if (!userProfile) return;
    const newUserProfile = {
      ...userProfile,
      weightUnit: weightUnit as "lbs" | "kg",
    };
    setUserProfile(newUserProfile);
    FirestoreActions.updateUserProfile(userId, newUserProfile);
  };
  const handleColorSchemeChange = (colorScheme: string) => {
    if (!userProfile) return;
    const newUserProfile = {
      ...userProfile,
      colorScheme: colorScheme as "light" | "dark",
    };
    setColorScheme(colorScheme as "light" | "dark");
    setUserProfile(newUserProfile);
    FirestoreActions.updateUserProfile(userId, newUserProfile);
  };

  return (
    <Modal {...modalProps}>
      <SegmentedControl
        value={userProfile?.weightUnit}
        onChange={handleWeightUnitChange}
        data={["lbs", "kg"]}
      />
      <SegmentedControl
        value={userProfile?.colorScheme}
        onChange={handleColorSchemeChange}
        data={["light", "dark"]}
      />
    </Modal>
  );
}
