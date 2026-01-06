import { useState } from "react"
import bamtiImg from "./assets/bamti_image.png"
import "./App.css" // bamti-stamp 애니메이션용

function App() {
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)

  const handleAnalyze = async () => {
    if (!image) {
      alert("이미지를 먼저 넣어주세요")
      return
    }

    setLoading(true)
    setAnalysis(null)

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

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>밤티판독기</h1>

      <input
        type="file"
        accept="image/*,.jpg,.jpeg,.png"
        onChange={(e) => {
          setImage(e.target.files[0])
          setAnalysis(null)
          setLoading(false)
        }}
      />

      <br /><br />

      <button onClick={handleAnalyze}>판독하기</button>

      <br /><br />

      {loading && <p>🔍 과연 밤티일까? 아닐까.. </p>}

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

          {/* 📸 사용자 사진 + 도장 */}
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
              style={{
                width: "100%",
                borderRadius: 12,
                display: "block",
              }}
            />

            {analysis.verdict === "밤티" && (
              <img
                src={bamtiImg}
                alt="밤티 도장"
                className="bamti-stamp"
              />
            )}
          </div>

          {/* 📊 결과 텍스트 */}
          <p style={{ fontSize: 20, color: "#111" }}>
            점수: <strong>{analysis.score}</strong>
          </p>

          <p style={{ marginTop: 12, color: "#333" }}>{analysis.comment}</p>
        </div>
      )}
    </div>
  )
}

export default App
