import { useState } from "react"
import bamtiImg from "./assets/bamti_image.png"
import "./App.css"

function App() {
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [appealUsed, setAppealUsed] = useState(false)
  const [appealComment, setAppealComment] = useState("") // ✅ 추가됨

  const handleAnalyze = async () => {
    if (!image) {
      alert("이미지를 먼저 넣어주세요")
      return
    }

    setLoading(true)
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
    } catch (err) {
      console.error(err)
      alert("판독 중 오류 발생")
    } finally {
      setLoading(false)
    }
  }

  const handleAppeal = async () => {
    setLoading(true)

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
    } catch (err) {
      console.error(err)
      alert("재판독 중 오류 발생")
    } finally {
      setLoading(false)
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
          setAnalysis(null)
          setAppealUsed(false)
          setAppealComment("")
          setLoading(false)
        }}
      />

      <br /><br />

      <button onClick={handleAnalyze}>판독하기</button>

      <br /><br />

      {loading && (
        <p>
          {appealUsed
            ? "다시 보고 있습니다…"
            : "🔍 과연 밤티일까? 아닐까…"}
        </p>
      )}

      {analysis && (
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

          {analysis.verdict === "밤티" && !appealUsed && !loading && (
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
