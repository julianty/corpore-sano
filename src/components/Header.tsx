import { Title, Group, Flex, Button, Menu } from "@mantine/core";
import { GoogleLogin } from "./Auth/GoogleLogin";
import { IconBarbell } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { UserPreferencesModal } from "./UserPreferencesModal";

export function Header() {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <a
        href="#main-content"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
        onFocus={(e) => {
          e.currentTarget.style.position = "static";
          e.currentTarget.style.width = "auto";
          e.currentTarget.style.height = "auto";
        }}
        onBlur={(e) => {
          e.currentTarget.style.position = "absolute";
          e.currentTarget.style.left = "-9999px";
          e.currentTarget.style.width = "1px";
          e.currentTarget.style.height = "1px";
        }}
      >
        Skip to main content
      </a>
      <UserPreferencesModal
        opened={opened}
        onClose={close}
        title="User Preferences"
        centered
      />
      <header>
        <Group justify="space-between">
          <Flex align={"center"} gap="sm" pt={"sm"}>
            <Title aria-label="Corpore Sano - Fitness Workout Tracker">
              Corpore Sano
            </Title>
            <IconBarbell size={36} aria-label="Barbell icon" />
          </Flex>
          <nav>
            <Group>
              <GoogleLogin />
              <Menu>
                <Menu.Target>
                  <Button aria-label="Open profile menu">Profile</Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={open}>User Preferences</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </nav>
        </Group>
      </header>
    </>
  );
}
