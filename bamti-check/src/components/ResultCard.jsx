import bamtiImg from "../assets/bamti_image.png"

export default function ResultCard({
  image,
  analysis,
  appealUsed,
  appealComment,
  onChangeAppealComment,
  onAppeal,
}) {
  if (!analysis) return null

  return (
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

      <div style={{ position: "relative", width: 300, margin: "0 auto 20px" }}>
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
        점수: <strong>{analysis.score}</strong>
      </p>

      <p>{analysis.comment}</p>

      {analysis.verdict === "밤티" && !appealUsed && (
        <div style={{ marginTop: 16 }}>
          <textarea
            placeholder="억울한 이유를 적어보세요 (선택)"
            value={appealComment}
            onChange={(e) => onChangeAppealComment(e.target.value)}
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
            onClick={onAppeal}
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
  )
}