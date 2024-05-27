import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";
import {
  Title,
  Stack,
  Group,
  Container,
  Flex,
  Text,
  Button,
  Menu,
  Modal,
  ModalProps,
  SegmentedControl,
} from "@mantine/core";
import { GoogleLogin } from "./components/GoogleLogin";
import { WorkoutTool } from "./components/WorkoutTool";
import { IconBarbell } from "@tabler/icons-react";
import { Dashboard } from "./components/Dashboard";
import { useDisclosure } from "@mantine/hooks";
import { createContext, useContext, useState } from "react";
import { UserProfile } from "./types";
import { useAppSelector } from "./hooks";

interface UserPreferencesModalProps extends ModalProps {
  userProfileSetterCallback: (userProfile: UserProfile) => void;
}

function UserPreferencesModal(props: UserPreferencesModalProps) {
  const userProfile = useContext(UserProfileContext);
  const [weightUnit, setWeightUnit] = useState<"lbs" | "kg">("lbs");
  function handleChange(value: string) {
    if (value === "lbs" || value === "kg") {
      setWeightUnit(value);
      props.userProfileSetterCallback({
        ...userProfile,
        weightUnit: weightUnit,
      });
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
function Header(props: {
  userProfileSetterCallback: (userProfile: UserProfile) => void;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <UserPreferencesModal
        userProfileSetterCallback={props.userProfileSetterCallback}
        opened={opened}
        onClose={close}
        title="User Preferences"
        centered
      />
      <Group justify="space-between">
        <Flex align={"center"} gap="sm" pt={"sm"}>
          <Title>Corpore Sano</Title>
          <IconBarbell size={36} />
        </Flex>
        <Group>
          <GoogleLogin />
          <Menu>
            <Menu.Target>
              <Button>Profile</Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={open}>User Preferences</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </>
  );
}
const UserProfileContext = createContext<UserProfile | undefined>(undefined);
function App() {
  const displayName = useAppSelector((state) => state.auth.displayName);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: displayName,
    weightUnit: "lbs",
    colorScheme: "dark",
  });

  return (
    <Container>
      <Stack p={{ sm: "sm", md: "lg" }}>
        <UserProfileContext.Provider value={userProfile}>
          <Header userProfileSetterCallback={setUserProfile} />
        </UserProfileContext.Provider>
        <Stack p={{ sm: "sm", md: "lg" }}>
          <Text>Welcome {displayName}!</Text>
          <Dashboard />
          <WorkoutTool />
        </Stack>
      </Stack>
    </Container>
  );
}

export default App;
