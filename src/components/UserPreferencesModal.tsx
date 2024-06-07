import { Modal, SegmentedControl, useMantineColorScheme } from "@mantine/core";
import { useContext } from "react";
import { UserPreferencesModalProps } from "../types";
import { useAppSelector } from "../hooks";
import { FirestoreActions } from "../helperFunctions/FirestoreActions";
import { UserProfileContext } from "../App";

export function UserPreferencesModal(props: UserPreferencesModalProps) {
  const { setColorScheme } = useMantineColorScheme();
  const { userProfileSetterCallback, ...modalProps } = props;
  const userProfile = useContext(UserProfileContext);
  const userId = useAppSelector((state) => state.auth.userId);

  function handleChange(value: string) {
    const newUserProfile = { ...userProfile };
    if (value === "lbs" || value === "kg") {
      newUserProfile.weightUnit = value;
    } else if (value === "light" || value === "dark") {
      newUserProfile.colorScheme = value;
      setColorScheme(value);
    }
    userProfileSetterCallback(newUserProfile);
    FirestoreActions.updateUserProfile(userId, newUserProfile);
  }

  return (
    <Modal {...modalProps}>
      <SegmentedControl
        value={userProfile?.weightUnit}
        onChange={handleChange}
        data={["lbs", "kg"]}
      />
      <SegmentedControl
        value={userProfile?.colorScheme}
        onChange={handleChange}
        data={["light", "dark"]}
      />
    </Modal>
  );
}
