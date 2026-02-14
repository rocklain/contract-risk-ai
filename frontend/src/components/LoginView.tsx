import { Container, Card, Title, Stack, TextInput, PasswordInput, Button } from "@mantine/core";

interface Props {
  onLogin: () => void;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
}

export const LoginView = ({ onLogin, username, setUsername, password, setPassword }: Props) => (
  <Container size="xs" py="xl">
    <Card withBorder shadow="md" p="xl" radius="md">
      <Title order={2} ta="center" mb="lg">Security Login</Title>
      <Stack>
        <TextInput label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <PasswordInput label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button onClick={onLogin} fullWidth mt="md">Login</Button>
      </Stack>
    </Card>
  </Container>
);