import { Check } from 'lucide-react'

const steps = ['Configuration', 'Voyageurs', 'Services', 'Rendez-vous']
export function Stepper({
  currentStep,
  completedSteps,
  onStepSelect,
}: {
  currentStep: number
  completedSteps: number[]
  onStepSelect?: (step: 1 | 2 | 3 | 4) => void
}) {
  return (
    <nav className="workflow-stepper" aria-label="Étapes de la demande">
      <ol>
        {steps.map((title, index) => {
          const id = (index + 1) as 1 | 2 | 3 | 4
          const complete = completedSteps.includes(id)
          return (
            <li key={title}>
              <button
                type="button"
                aria-current={id === currentStep ? 'step' : undefined}
                disabled={id > currentStep && !complete}
                onClick={() => onStepSelect?.(id)}
              >
                <span className="step-number">
                  {complete && id !== currentStep ? <Check size={14} /> : id}
                </span>
                <span>
                  {title}
                  <small>
                    {id === currentStep
                      ? 'En cours'
                      : complete
                        ? 'Validé'
                        : 'À venir'}
                  </small>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
