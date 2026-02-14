import { Card, Stack, FileInput, Button, Text } from "@mantine/core";

interface Props {
  file: File | null;
  setFile: (file: File | null) => void;
  onAnalyze: () => void;
  loading: boolean;
  isDummyMode: boolean;
}

export const UploadCard = ({
  file,
  setFile,
  onAnalyze,
  loading,
  isDummyMode,
}: Props) => (
  <Card withBorder shadow="sm" p="lg" radius="md">
    <Stack>
      <FileInput
        label="契約書のファイルをアップロード"
        // 1. ダミーモード時は非活性にする
        disabled={isDummyMode}
        // 2. プレースホルダーに説明文を表示
        placeholder={
          isDummyMode
            ? "※デフォルトでdummy_contract.txtが読み込まれます"
            : "contract.pdf"
        }
        value={file}
        onChange={setFile}
        accept="application/pdf,text/plain"
      />
      {/* 3. 補足テキストを追加（より親切になります） */}
      {isDummyMode && (
        <Text size="xs" c="orange,8" fw={700} mt={-10}>
          ※テストモード：ファイルの選択は不要です。下のボタンを押してください。
        </Text>
      )}
      <Button
        onClick={onAnalyze}
        loading={loading}
        fullWidth
        size="md"
        color={isDummyMode ? "orange" : "blue"}
      >
        {isDummyMode
          ? "診断を開始する（ダミーデータによるテスト）"
          : "診断を開始する"}
      </Button>
    </Stack>
  </Card>
);
