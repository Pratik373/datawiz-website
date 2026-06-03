import { useNavigate } from 'react-router-dom'

export default function MockTestsSection() {
  const navigate = useNavigate()

  return (
    <section className="space-y-md">
      <div className="flex justify-between items-end">
        <div className="space-y-xs">
          <h2 className="font-display text-headline-md text-on-surface">Exam-Ready Mock Tests</h2>
          <p className="text-on-surface-variant">Simulate the real exam experience with our curated sets.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="card overflow-hidden flex flex-col hover-card transition-all">
          <div className="p-md border-b border-outline-variant flex justify-between items-start">
            <span className="px-2 py-1 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded uppercase tracking-wider">
              FREE
            </span>
            <span className="material-symbols-outlined text-on-surface-variant">schedule</span>
          </div>
          <div className="p-md flex-grow space-y-sm">
            <h4 className="font-display text-headline-sm">Entrance Baseline Test</h4>
            <div className="flex items-center gap-xs text-on-surface-variant text-body-sm">
              <span className="material-symbols-outlined text-[16px]">list_alt</span>
              <span>50 Questions</span>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[0%]" />
            </div>
          </div>
          <div className="p-md">
            <button
              onClick={() => navigate('/mock-tests')}
              className="w-full py-2 bg-primary text-on-primary rounded-full font-label-md shadow-sm active:scale-95 transition-all"
            >
              Start Test
            </button>
          </div>
        </div>

        <div className="card overflow-hidden flex flex-col hover-card transition-all">
          <div className="p-md border-b border-outline-variant flex justify-between items-start">
            <span className="px-2 py-1 bg-primary text-on-primary text-[10px] font-bold rounded uppercase tracking-wider">
              PREMIUM
            </span>
            <span
              className="material-symbols-outlined text-on-surface-variant"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              lock
            </span>
          </div>
          <div className="p-md flex-grow space-y-sm">
            <h4 className="font-display text-headline-sm">PDF Practice Set A</h4>
            <p className="text-body-sm text-on-surface-variant">
              Full section coverage with detailed explanations in PDF format.
            </p>
          </div>
          <div className="p-md">
            <button
              onClick={() => navigate('/mock-tests')}
              className="w-full py-2 border border-outline text-on-surface-variant rounded-full font-label-md active:scale-95 transition-all"
            >
              Unlock Now
            </button>
          </div>
        </div>

        <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl overflow-hidden flex flex-col items-center justify-center p-xl text-center space-y-sm">
          <span className="material-symbols-outlined text-outline text-4xl">hourglass_empty</span>
          <h4 className="font-display text-headline-sm text-on-surface-variant">More Tests</h4>
          <p className="text-body-sm text-on-surface-variant">New Section B tests dropping every Monday.</p>
        </div>
      </div>
    </section>
  )
}
