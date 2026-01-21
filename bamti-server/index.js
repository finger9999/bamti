import express from "express"
import cors from "cors"
import multer from "multer"
import fs from "fs"
import OpenAI from "openai"

const app = express()
app.use(cors())

const upload = multer({ dest: "uploads/" })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    // ✅ 이의 제기 정보는 여기서 읽어야 함
    const isAppeal = req.body?.appeal === "true"
    const appealComment =
      typeof req.body?.appeal_comment === "string"
        ? req.body.appeal_comment.slice(0, 200)
        : ""

    const imageBase64 = fs.readFileSync(req.file.path, {
      encoding: "base64",
    })

    /* =======================
       프롬프트 구성
    ======================= */

    const basePrompt = `
너는 '밤티판독기'다.
이 서비스는 놀이용이며, 평가가 다소 까칠할 수 있다.

먼저 이미지가 무엇인지 판단한다.
- 사람 얼굴 / 셀카
- 동물
- 캐릭터
- 풍경 / 공간
- 디자인 결과물 (포스터, 화면, 그래픽 등)

이미지 유형에 따라 평가 기준과 말투를 조절한다.

[전체 톤]
- 까칠하고 반말을 쓴다.
- 직설적이고 상처를 줄 수 있다.
- 밤티여도 웃기게 말한다.
- 감정 표현은 솔직한 편이다.

[사람 얼굴 / 셀카 평가 기준]
- 외모 비하가 있어도 된다.
- 분위기, 인상, 느낌을 솔직하게 말한다.
- 잘 나온 부분이 있으면 인정한다.
- 어색한 점이 보이면 돌려 말하지 않는다.

- 연예인이나 유명 인물이 떠오를 경우:
  → 정말 자연스럽게 연상이 될 때만 언급한다.
  → 억지 비교는 절대 하지 않는다.
  → 없으면 언급하지 않는다.

[동물]
- 기본적으로 호의적
- 그래도 사진이 애매하면 밤티 가능

[풍경 / 공간]
- 구도, 시선 흐름 위주
- 색감 과하면 바로 지적

[디자인]
- 요소 간 충돌
- 의도와 인상 위주

[점수]
0점부터 시작
- 평범: 50~65
- 좋음: 70 전후
- 매우 좋음: 80 이상은 드묾

[밤티 판정]
70 미만: 밤티
70 이상: 통과
`

    const appealPrompt = isAppeal
      ? `
[이의 제기]
사용자가 판정에 이의를 제기했다.
사용자 주장:
"${appealComment}"

- 주장은 읽었다는 티는 낸다
- 끌려가지는 마라
- 타당하면 최대 5~8점까지만 상향 가능
`
      : ""

    const finalPrompt =
      basePrompt +
      appealPrompt +
      `
[출력]
아래 JSON만 출력한다.
{
  "verdict": "밤티" | "통과",
  "score": number,
  "comment": string
}
JSON 외 텍스트 금지.
`

    /* =======================
       OpenAI 호출
    ======================= */

    const response = await openai.chat.completions.create({
  model: "gpt-4o-mini", // 모델명 수정
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: finalPrompt },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
          },
        },
      ],
    },
  ],
  response_format: { type: "json_object" }, // JSON 출력 강제 (더 안전함)
  temperature: 0.5, // 너무 낮으면 답변이 단조로우니 0.5 정도로 추천
});

    fs.unlinkSync(req.file.path)

    const message = response.choices[0].message.content.find(
      (c) => c.type === "text"
    )

    if (!message?.text) {
      throw new Error("모델 응답 텍스트 없음")
    }

    const rawText = message.text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)

    let parsed = {}
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch {}
    }

    /* =======================
       점수 보정
    ======================= */

    function normalizeScore(raw) {
      if (typeof raw !== "number" || isNaN(raw)) return null
      const clamped = Math.max(20, Math.min(raw, 85))
      return Math.round(((clamped - 20) / 65) * 100)
    }

    let finalScore = normalizeScore(parsed.score)
    if (finalScore === null) {
      finalScore = Math.floor(Math.random() * 40) + 30
    }

    const finalVerdict = finalScore >= 70 ? "통과" : "밤티"

    res.json({
      verdict: finalVerdict,
      score: finalScore,
      comment:
        typeof parsed.comment === "string" && parsed.comment.length > 0
          ? parsed.comment
          : finalVerdict === "밤티"
          ? "굳이 이 컷을 고른 이유는 잘 모르겠다."
          : "무난하게 볼 수는 있다.",
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ result: "서버 에러" })
  }
})

app.listen(3001, () => {
  console.log("🧠 미감판독기 서버 실행 중 (3001)")
})
