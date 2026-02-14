from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
# Vertex AI 版（移行後）
from vertexai.generative_models import GenerativeModel
import vertexai
import os
from dotenv import load_dotenv
import fitz  # PyMuPDF
import io
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

app = FastAPI()

# 【重要】CORS設定：フロントエンド（React）からのアクセスを許可する
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 本番では特定のURLに絞るが、開発時は一旦全て許可
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. セキュリティ設定（秘密鍵は本来 .env へ）
SECRET_KEY = "your-secret-key-for-teatimeninja" # 独自の秘密の文字列
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# パスワードハッシュ化の道具
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_schema = OAuth2PasswordBearer(tokenUrl="token")

# .envファイルから設定を読み込む
load_dotenv()

# 1. Vertex AI
vertexai.init(
  project=os.getenv("GOOGLE_CLOUD_PROJECT"),
  location="asia-northeast1"
)

# 2.モデルの作成方法をVertexAI流に変更
from vertexai.generative_models import GenerationConfig

model = GenerativeModel("gemini-2.5-flash")
config = GenerationConfig(response_mime_type="application/json")

# --- ユーティリティ関数 ---
def create_access_token(data: dict):
  to_encode = data.copy()
  expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  to_encode.update({"exp":expire})
  return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_password_hash(password):
  return pwd_context.hash(password)

# --- エンドポイント ---
@app.post("/login")
async def login(data: dict):
  # 【注意】本来はDBと照合しますが、今回は簡易的に固定値で。
  # 青木さんの名前を借りてテスト用ユーザーを作成
  if data.get("username") == "ryoma" and data.get("password") == "teatime":
    access_token = create_access_token(data={"sub": "ryoma"})
    return {"access_token": access_token, "token_type": "bearer"}
  raise HTTPException(status_code=400, detail="ユーザー名かパスワードが違います")

@app.post("/analyze")
async def analyze_contract(file: UploadFile = File(...)):
    # 1. アップロードされたファイルの内容を読み込む（バイトデータ）
    content = await file.read()
    
    # 2. バイトデータをテキストに変換（今回は簡易的にutf-8でデコード）
    # ※ 本格的なPDF解析は後でライブラリを追加しましょう
    text_content = ""
    if file.filename.endswith(".pdf"):
      # メモリ上のバイトデータからPDFを開く
      pdf_document = fitz.open(stream=io.BytesIO(content), filetype="pdf")
      for page in pdf_document:
        text_content += page.get_text()
      pdf_document.close()
    else:
      # テキストファイルの場合はそのままデコード
      text_content = content.decode("utf-8")

    # 3. Geminiに投げる指示（プロンプト）を作成
    prompt = f"""
    あなたは法務のスペシャリストです。
    以下の契約書を分析し、リスク項目を必ず以下のJSON形式のみで出力してください。余計な解説は不要です。
    
    [
      {{
        "rank": "高" または "中" または "低",
        "title": "リスク項目のタイトル",
        "description": "具体的なリスクの内容",
        "action": "推奨される修正案"
      }}
    ]

    【契約書内容】
    {text_content}
    """

    # 4. Gemini APIを叩く
    response = model.generate_content(
      prompt,
      generation_config=config
      )
    
    # 5. 結果をフロントエンドに返す
    return {"analysis": response.text}