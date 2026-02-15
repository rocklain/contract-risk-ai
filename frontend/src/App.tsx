import { useState, useEffect, useRef } from "react";
import { Container, Stack, Title, Button } from "@mantine/core";
import axios from "axios";
import { notifications } from "@mantine/notifications";

// 分割したコンポーネントをインポート
import type { RiskItem } from "./types";
import { LoginView } from "./components/LoginView";
import { UploadCard } from "./components/UploadCard";
import { ResultTable } from "./components/ResultTable";

function App() {
  // --- State管理 ---
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [isDummyMode, setIsDummyMode] = useState(false);
  const hasNotifiedInitial = useRef(false);

  // --- 起動時チェック、handleLogin, handleLogout, handleAnalyze などのロジック ---
  // (ここは今までのコードのロジック部分をそのまま残す)
  // --- 1. ダミーデータの定義 ---
  const dummyResult: RiskItem[] = [
    {
      rank: "高",
      title: "【ダミー】損害賠償額の無制限条項",
      description:
        "賠償額に上限が設定されておらず、万が一の際に会社が倒産するリスクがあります。",
      action:
        "「直近12ヶ月の契約対価を上限とする」旨の文言を追加してください。",
    },
    {
      rank: "中",
      title: "【ダミー】自動更新条項の通知期限",
      description:
        "更新拒絶の通知期限が3ヶ月前となっており、解約のタイミングを逃す可能性があります。",
      action: "通知期限を「1ヶ月前」に変更することを推奨します。",
    },
  ];

  // --- 2. 起動時チェック (useEffect) ---
  useEffect(() => {
    // 認証とモードの初期化を一括で行う関数
    const initializeApp = () => {
      const hash = window.location.hash;
      const isDummy = hash === "#dummy";

      if (isDummy) {
        // A. ダミーモードの場合：強制的にログイン状態にしてモードをONにする
        setIsDummyMode(true);
        setIsLoggedIn(true);

        // 通知が一度も出ていない場合のみ表示（hasNotifiedInitialを使用）
        if (!hasNotifiedInitial.current) {
          notifications.show({
            title: "テストモード起動",
            message: "Gemini APIを使用せず、ダミーデータで動作します（無料）",
            color: "orange",
          });
          hasNotifiedInitial.current = true;
        }
      } else {
        const savedToken = localStorage.getItem("token");
        if (
          savedToken &&
          !isLoggedIn &&
          !window.location.hash.includes("dummy")
        ) {
          setToken(savedToken);
          setIsLoggedIn(true);
          setIsDummyMode(false);

          if (!hasNotifiedInitial.current) {
            notifications.show({
              title: "おかえりなさい",
              message: "前回のログイン情報を利用して自動接続しました。",
              color: "blue",
            });
            hasNotifiedInitial.current = true;
          }
        }
      }
    };

    // 1. ページ読み込み時に実行
    initializeApp();

    // 2. ブラウザのURLバーが書き換わったのを常に監視
    window.addEventListener("hashchange", initializeApp);

    // 3. クリーンアップ
    return () => window.removeEventListener("hashchange", initializeApp);

    // ログイン状態が変わった時に再評価するように追加
  }, [isLoggedIn]);

  // --- 3. ログイン・ログアウト処理 ---
  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:8000/login", {
        username,
        password,
      });
      const newToken = response.data.access_token;
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setIsLoggedIn(true);
      notifications.show({
        title: "ログイン成功",
        message: "ようこそ",
        color: "blue",
      });
    } catch (error: any) {
      // 1. サーバーからエラーレスポンスが返ってきた場合 (400, 500など)
      let errorMessage = "解析中に予期せぬエラーが発生しました。";

      // 2. Axiosのエラーだったらと型を特定する
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.detail || errorMessage;
        console.error("【Debug】サーバーからの応答:", error.response?.data);
      }
      notifications.show({
        title: "解析エラー",
        message: errorMessage,
        color: "red",
      });
    }
  };

  const handleLogout = () => {
    // 1. トークンの削除
    localStorage.removeItem("token");

    // 2. URLから #dummy を消す
    window.location.hash = "";

    // 3. 各種ステートのリセット
    setIsLoggedIn(false);
    setIsDummyMode(false); // ダミーモードもOFFにする
    setToken("");
    setAnalysis([]);

    notifications.show({
      title: "ログアウト",
      message: "安全にログアウトしました",
      color: "gray",
    });
  };

  // --- 4. 解析処理 ---
  const handleAnalyze = async () => {
    if (!file && !isDummyMode) {
      notifications.show({
        title: "ファイル未選択",
        message: "診断する契約書をアップロードしてください。",
        color: "red",
      });
      return;
    }
    setLoading(true);
    setAnalysis([]);

    if (isDummyMode) {
      // ダミー処理（バックエンドを通さない）
      try {
        const response = await fetch("/dummy_result.json");
        const data = await response.json(); // ここで自動的にJSONとしてパースされる
        setTimeout(() => {
          setAnalysis(data);
          setLoading(false);
          notifications.show({
            title: "診断完了",
            message: "（ダミーデータを使用）",
            color: "orange",
          });
        }, 1000);
      } catch (error) {
        console.error("ダミーJSONの読み込み失敗", error);
        setLoading(false);
      }
      return;
    }

    const formData = new FormData();
    formData.append("file", file!);

    try {
      const response = await axios.post(
        "http://localhost:8000/analyze",
        formData,
      );
      const rawData = response.data.analysis;
      const cleanedData = rawData.replace(/```json|```/g, "").trim();
      const result = JSON.parse(cleanedData);
      setAnalysis(result);
      notifications.show({
        title: "診断完了",
        message: "正常に終了しました。",
        color: "green",
      });
    } catch (error) {
      let errorMessage = "解析中に予期せぬエラーが発生しました。";

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.detail || errorMessage;
        console.error("【Debug】サーバーからの応答:", error.response?.data);
      }

      notifications.show({
        title: "解析エラー",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // 1. ログイン画面
  if (!isLoggedIn) {
    return (
      <LoginView
        username={username}
        password={password}
        setUsername={setUsername}
        setPassword={setPassword}
        onLogin={handleLogin}
      />
    );
  }

  // 2. メイン画面
  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Title order={1} ta="center" c={isDummyMode ? "orange.6" : "blue.8"}>
          {isDummyMode
            ? "AI契約書リスク診断（ダミーテスト）"
            : "AI契約書リスク診断"}
        </Title>
        {/* アップロード部分をコンポーネント化 */}
        <UploadCard
          file={file}
          setFile={setFile}
          onAnalyze={handleAnalyze}
          loading={loading}
          isDummyMode={isDummyMode}
        />
        <Button variant="subtle" color="gray" onClick={handleLogout}>
          ログアウト
        </Button>
        {/* 結果表示部分をコンポーネント化 */}
        {analysis.length > 0 && <ResultTable analysis={analysis} />}
      </Stack>
    </Container>
  );
}

export default App;
