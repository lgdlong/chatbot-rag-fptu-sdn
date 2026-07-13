import { Stack, Skeleton, Box } from "@mantine/core";

export default function TeacherLoading() {
  return (
    <Box p="lg">
      <Stack gap="lg">
        <Skeleton height={32} width="40%" radius={0} />
        <Skeleton height={20} width="60%" radius={0} />
        <Stack gap="sm" mt="xl">
          <Skeleton height={100} radius={0} />
          <Skeleton height={100} radius={0} />
          <Skeleton height={100} radius={0} />
        </Stack>
      </Stack>
    </Box>
  );
}
