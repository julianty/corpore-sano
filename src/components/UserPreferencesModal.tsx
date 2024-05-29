import { Text, Modal, SegmentedControl } from "@mantine/core";
import { useContext, useState } from "react";
import { UserPreferencesModalProps } from "../types";
import { useAppSelector } from "../hooks";
import { FirestoreActions } from "../helperFunctions/FirestoreActions";
import { UserProfileContext } from "../App";

// TODO: Move functions to new files for cleanliness
export function UserPreferencesModal(props: UserPreferencesModalProps) {
  const userProfile = useContext(UserProfileContext);
  const [weightUnit, setWeightUnit] = useState<"lbs" | "kg">("lbs");
  const userId = useAppSelector((state) => state.auth.userId);
  function handleChange(value: string) {
    if (value === "lbs" || value === "kg") {
      setWeightUnit(value);
      const newUserProfile = { ...userProfile, weightUnit: weightUnit };
      props.userProfileSetterCallback(newUserProfile);
      FirestoreActions.updateUserPreferences(userId, newUserProfile);
    }
  }
  return (
    <Modal {...props}>
      <SegmentedControl
        value={userProfile?.weightUnit}
        onChange={handleChange}
        data={["lbs", "kg"]}
      />
      <Text>{userProfile?.username}</Text>
    </Modal>
  );
}
