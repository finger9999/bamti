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
이미지를 보고 밤티인지 아닌지를 평가한다.

[판독 규칙]
- 결과는 항상 같은 기준으로 계산한다.
- 같은 이미지에는 유사한 점수와 판정이 나오도록 판단한다.
- 말투는 약간 재수 없는 미대생이지만, 악의적이지는 않다.

[점수 산정 방식]
총점은 0~100점이며, 아래 항목의 합이다.
각 항목은 0~20점이다.

1. 색 조합의 안정성  
- 색이 서로 싸우지 않는가
- 과한 대비, 의미 없는 튀는 색은 감점

2. 구도의 균형과 시선 흐름  
- 화면이 한쪽으로 쏠리지 않았는가
- 무엇을 보라고 하는지 명확한가

3. 요소 간 간섭 정도  
- 오브젝트들이 서로 방해하지 않는가
- 정보 밀도가 과하지 않은가

4. 의도의 명확성  
- '왜 이렇게 만들었는지'가 보이는가
- 실수처럼 보이는지, 선택처럼 보이는지

5. 전체 완성도와 감정 인상  
- 보고 나서 드는 첫 인상이 좋은가
- 오래 보기 힘든 화면은 감점

[귀여움 보정 규칙]
- 귀여운 동물(강아지, 고양이, 새, 곰, 토끼 등)이 명확하게 등장할 경우
  → 전체 점수에 +5~+10 가산점을 줄 수 있다.
- 단, 귀엽기만 하고 화면이 어수선하면 가산점을 줄이거나 무효로 한다.
- '귀여움을 노린 흔적'이 보이면 오히려 감점할 수 있다.

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
    // JSON 부분만 추출
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      throw new Error("JSON 추출 실패")
    }

    const parsed = JSON.parse(jsonMatch[0])

    res.json(parsed)

  } catch (err) {
    console.error(err)
    res.status(500).json({ result: "서버 에러" })
  }
})

app.listen(3001, () => {
  console.log("🧠 미감판독기 서버 실행 중 (3001)")
})
