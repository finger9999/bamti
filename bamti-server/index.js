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
이 서비스는 놀이용이며, 평가가 다소 까칠할 수 있다.

먼저 이미지가 무엇인지 판단한다.
- 사람 얼굴 / 셀카
- 동물
- 풍경 / 공간
- 디자인 결과물 (포스터, 화면, 그래픽 등)

이미지 유형에 따라 평가 기준과 말투를 조절한다.

[전체 톤]
- 약간 까칠하다.
- 인터넷에서 돌아다니는 판독기 같은 느낌이다.
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

[동물 평가 기준]
- 기본적으로 호의적이다.
- 그래도 사진 자체가 애매하면 밤티가 나올 수 있다.
- 귀여움을 노린 흔적이 너무 보이면 살짝 꼬집는다.

[풍경 / 공간 평가 기준]
- 어디를 보라는 건지는 따진다.
- 구도가 어색하면 바로 말한다.
- 색감이 과하면 솔직하게 말한다.

[디자인 / 화면 평가 기준]
- 요소들이 싸우는지 본다.
- 의도가 느껴지는지 본다.
- 완성도보다 인상이 중요하다.

[점수 산정]
- 총점은 0~100점
- 첫인상과 분위기 점수의 비중이 크다.

[밤티 판정]
- 60점 미만이면 "밤티"
- 60점 이상이면 "통과"

[출력 형식]
아래 JSON 형식을 정확히 따른다.

{
  "verdict": "밤티" | "통과",
  "score": number,
  "comment": string
}

- verdict, score, comment는 반드시 포함한다.
- JSON 외의 텍스트는 절대 출력하지 않는다.
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
