import { useState } from "react"
import ProgressBar from "./components/ProgressBar"
import ResultCard from "./components/ResultCard"
import "./App.css"

/* =====================
   Phase 정의
===================== */
const PHASE = {
  IDLE: "idle",
  ANALYZING: "analyzing",
  APPEALING: "appealing",
  RESULT: "result",
}

function App() {
  const [image, setImage] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [appealUsed, setAppealUsed] = useState(false)
  const [appealComment, setAppealComment] = useState("")
  const [phase, setPhase] = useState(PHASE.IDLE)

  const handleAnalyze = async () => {
    if (!image) {
      alert("이미지를 먼저 넣어주세요")
      return
    }

    setPhase(PHASE.ANALYZING)
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
      setPhase(PHASE.RESULT)
    } catch (err) {
      console.error(err)
      alert("판독 중 오류 발생")
      setPhase("idle")
    }
  }

  const handleAppeal = async () => {
    setPhase(PHASE.APPEALING)

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
      setPhase(PHASE.RESULT)
    } catch (err) {
      console.error(err)
      alert("재판독 중 오류 발생")
      setPhase(PHASE.RESULT)
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
          setPhase(PHASE.IDLE)
          setAnalysis(null)
          setAppealUsed(false)
          setAppealComment("")
        }}
      />

      <br /><br />

      <button onClick={handleAnalyze}>판독하기</button>

      <br /><br />

      {/* 🔍 최초 판독 중 */}
      {phase === PHASE.ANALYZING && (
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <p className='gradient-text'>
            🔍 과연 밤티일까? 아닐까…
          </p>
          <ProgressBar />
        </div>
      )}

      {/* 🔄 재판독 중 (사진/카드 없음) */}
      {phase === PHASE.APPEALING && (
        <p style={{ textAlign: "center", fontSize: 18 }}>
          🔄 다시 보고 있습니다…
        </p>
      )}

      {/* 📊 결과 */}
      {phase === PHASE.RESULT && analysis && (
        <ResultCard
          image={image}
          analysis={analysis}
          appealUsed={appealUsed}
          appealComment={appealComment}
          onChangeAppealComment={setAppealComment}
          onAppeal={handleAppeal}
        />
      )}
    </div>
  )
}

export default App
