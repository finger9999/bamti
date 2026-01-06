import { useState } from "react"
import bamtiImg from "./assets/bamti_image.png"
import "./App.css"

function App() {
  const [image, setImage] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [appealUsed, setAppealUsed] = useState(false)
  const [appealComment, setAppealComment] = useState("")
  const [phase, setPhase] = useState("idle")
  // idle | analyzing | result | appealing

  const handleAnalyze = async () => {
    if (!image) {
      alert("이미지를 먼저 넣어주세요")
      return
    }

    setPhase("analyzing")
    setAnalysis(null)
    setAppealUsed(false)
    setAppealComment("")

    const formData = new FormData()
    formData.append("image", image)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/analyze`, {
        method: "POST",
        body: formData,
      })
      const parsed = await res.json()
      setAnalysis(parsed)
      setPhase("result")
    } catch (err) {
      console.error(err)
      alert("판독 중 오류 발생")
      setPhase("idle")
    }
  }

  const handleAppeal = async () => {
    setPhase("appealing")

    const formData = new FormData()
    formData.append("image", image)
    formData.append("appeal", "true")
    formData.append("appeal_comment", appealComment)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/analyze`, {
        method: "POST",
        body: formData,
      })
      const parsed = await res.json()
      setAnalysis(parsed)
      setAppealUsed(true)
      setPhase("result")
    } catch (err) {
      console.error(err)
      alert("재판독 중 오류 발생")
      setPhase("result")
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>밤티판독기</h1>

      <input
        type="file"
        accept="image/*,.jpg,.jpeg,.png"
        onChange={(e) => {
          setImage(e.target.files[0])
          setPhase("idle")
          setAnalysis(null)
          setAppealUsed(false)
          setAppealComment("")
        }}
      />

      <br /><br />

      <button onClick={handleAnalyze}>판독하기</button>

      <br /><br />

      {/* 🔍 최초 판독 중 */}
      {phase === "analyzing" && (
        <p style={{ textAlign: "center", fontSize: 18 }}>
          🔍 과연 밤티일까? 아닐까…
        </p>
      )}

      {/* 🔄 재판독 중 (사진/카드 없음) */}
      {phase === "appealing" && (
        <p style={{ textAlign: "center", fontSize: 18 }}>
          🔄 다시 보고 있습니다…
        </p>
      )}

      {/* 📊 결과 */}
      {phase === "result" && analysis && (
        <div
          style={{
            border: "3px solid",
            borderColor: analysis.verdict === "밤티" ? "crimson" : "green",
            padding: 24,
            marginTop: 20,
            borderRadius: 12,
            background:
              analysis.verdict === "밤티" ? "#fff0f0" : "#f0fff4",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: 32 }}>
            {analysis.verdict === "밤티" ? "밤티입니다" : "통과"}
          </h2>

          <div
            style={{
              position: "relative",
              width: 300,
              margin: "0 auto 20px",
            }}
          >
            <img
              src={URL.createObjectURL(image)}
              alt="사용자 이미지"
              style={{ width: "100%", borderRadius: 12 }}
            />

            {analysis.verdict === "밤티" && (
              <img src={bamtiImg} alt="밤티 도장" className="bamti-stamp" />
            )}
          </div>

          <p style={{ fontSize: 20 }}>
            점수: <strong>{analysis.score ?? "?"}</strong>
          </p>

          <p>{analysis.comment ?? "설명을 불러오지 못했습니다"}</p>

          {analysis.verdict === "밤티" && !appealUsed && (
            <div style={{ marginTop: 16 }}>
              <textarea
                placeholder="억울한 이유를 적어보세요 (선택)"
                value={appealComment}
                onChange={(e) => setAppealComment(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: 300,
                  height: 80,
                  padding: 8,
                  borderRadius: 6,
                  resize: "none",
                }}
              />

              <br />

              <button
                onClick={handleAppeal}
                style={{
                  marginTop: 12,
                  background: "#222",
                  color: "#fff",
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                이의 제기
              </button>
            </div>
          )}

          {appealUsed && (
            <p style={{ marginTop: 12, fontSize: 14, color: "#666" }}>
              이미 한 번 다시 봐줬습니다.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default App
