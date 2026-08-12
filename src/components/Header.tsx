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
        <Group justify="space-between" wrap="wrap" py="sm" gap="sm">
          <Flex align={"center"} gap={9}>
            <Flex
              align="center"
              justify="center"
              w={26}
              h={26}
              bg="mint.5"
              c="black"
              fw={700}
              fz="xs"
              style={{ borderRadius: "var(--mantine-radius-sm)" }}
              aria-hidden
            >
              CS
            </Flex>
            <Title
              order={1}
              fz={{ base: "lg", sm: "xl" }}
              aria-label="Corpore Sano - Fitness Workout Tracker"
            >
              Corpore Sano
            </Title>
            <IconBarbell size={22} color="var(--mantine-color-dimmed)" aria-label="Barbell icon" />
          </Flex>
          <nav>
            <Group gap="xs">
              <GoogleLogin />
              <Menu>
                <Menu.Target>
                  <Button variant="default" aria-label="Open profile menu">
                    Profile
                  </Button>
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
