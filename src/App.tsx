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

function UserPreferencesModal(props: ModalProps) {
  const userProfile = useContext(UserProfileContext);
  return (
    <Modal {...props}>
      <SegmentedControl data={["lbs", "kg"]} />
      <Text>{userProfile?.username}</Text>
    </Modal>
  );
}

function Header() {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <UserPreferencesModal
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
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: "Demo User",
    weightUnit: "lbs",
    colorScheme: "dark",
  });
  return (
    <Container>
      <Stack p={{ sm: "sm", md: "lg" }}>
        <UserProfileContext.Provider value={userProfile}>
          <Header />
        </UserProfileContext.Provider>
        <Stack p={{ sm: "sm", md: "lg" }}>
          {/* TODO: Make it so "Guest" changes into username when logged in */}
          <Text>
            Welcome Guest, you are currently viewing a Demo User, Please log in
            to track your own workouts.
          </Text>
          <Dashboard />
          <WorkoutTool />
        </Stack>
      </Stack>
    </Container>
  );
}

export default App;
