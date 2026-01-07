export default function ProgressBar({ progress }) {
  return (
    <div className="progress-wrap">
      <div className="progress-fill" style={{ width: `${progress}%` }} />
    </div>
  )
}
