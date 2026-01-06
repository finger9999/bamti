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
    const imageBase64 = fs.readFileSync(req.file.path, {
      encoding: "base64",
    })

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.1,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
너는 '밤티판독기'다.
이 서비스는 놀이용이며, 사용자를 불쾌하게 하지 않는 것이 가장 중요하다.

먼저 이미지가 무엇인지 판단한다.
- 사람 얼굴 / 셀카
- 동물
- 풍경 / 공간
- 디자인 결과물 (포스터, 화면, 그래픽 등)

이미지 유형에 따라 평가 기준을 다르게 적용한다.

[공통 원칙]
- 너무 진지해지지 않는다.
- 친구가 옆에서 농담 섞어 말해주는 느낌이다.
- 외모, 신체, 개인을 비하하는 표현은 절대 사용하지 않는다.
- 결과가 밤티여도 웃기고 가볍게 말한다.

[평가 기준 – 사람 얼굴 / 동물]
- 전체적인 분위기와 인상이 좋은지
- 표정이나 포즈가 자연스러운지
- 보고 나서 기분이 나빠지지 않는지
※ 색 조합, 구도, 완성도 같은 전문적인 미술 기준은 거의 보지 않는다.

[평가 기준 – 풍경 / 공간]
- 화면이 안정적으로 보이는지
- 어디를 보게 되는지 명확한지
- 색감이 과하지 않은지

[평가 기준 – 디자인 / 화면]
- 요소들이 서로 싸우지 않는지
- 한눈에 이해되는지
- 의도가 느껴지는지

[점수 산정]
- 총점은 0~100점
- 기준은 엄격하지 않으며, 분위기 점수가 크다.

[밤티 판정 기준]
- 총점이 70점 미만이면 "밤티"
- 70점 이상이면 "통과"

[출력 형식]
반드시 아래 JSON 형식으로만 출력한다.
다른 설명, 코드블록, 문장은 절대 포함하지 마라.

{
  "verdict": "밤티" | "통과",
  "score": number,
  "comment": string
}

- verdict, score, comment는 반드시 포함한다.
- 하나라도 빠지면 실패다.
- JSON 이외의 텍스트는 절대 출력하지 않는다.
              `,
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${imageBase64}`,
            },
          ],
        },
      ],
    })

    fs.unlinkSync(req.file.path)

    const message = response.output[0].content.find(
      (c) => c.type === "output_text"
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
      } catch { }
    }

    const safeResult = {
      verdict:
        parsed.verdict === "밤티" || parsed.verdict === "통과"
          ? parsed.verdict
          : "통과",

      score:
        typeof parsed.score === "number"
          ? parsed.score
          : Math.floor(Math.random() * 15) + 75,

      comment:
        typeof parsed.comment === "string" && parsed.comment.length > 0
          ? parsed.comment
          : "귀여움이 모든 미적 결함을 덮었습니다.",
    }

    res.json(safeResult)
  } catch (err) {
    console.error(err)
    res.status(500).json({ result: "서버 에러" })
  }
})

app.listen(3001, () => {
  console.log("🧠 미감판독기 서버 실행 중 (3001)")
})
