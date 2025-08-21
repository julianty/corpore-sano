import { Title, Group, Flex, Button, Menu } from "@mantine/core";
import { GoogleLogin } from "./Auth/GoogleLogin";
import { IconBarbell } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { UserPreferencesModal } from "./UserPreferencesModal";

export function Header() {
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
