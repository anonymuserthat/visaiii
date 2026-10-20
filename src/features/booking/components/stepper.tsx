import { Check, LockKeyhole, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
interface StepperProps {
  currentStep: number
  completedSteps: number[]
  onStepChange?: (step: 1 | 2 | 3 | 4) => void
}
const steps = [
  {
    title: 'Centre & formule',
    description: 'Le point de départ',
    short: 'Configuration',
  },
  {
    title: 'Vos voyageurs',
    description: 'Identité et projet de voyage',
    short: 'Voyageurs',
  },
  {
    title: 'Les services',
    description: 'Un parcours à votre mesure',
    short: 'Services',
  },
  {
    title: 'Le rendez-vous',
    description: 'La dernière étape',
    short: 'Rendez-vous',
  },
]
export function Stepper({
  currentStep,
  completedSteps,
  onStepChange,
}: StepperProps) {
  return (
    <aside className="booking-progress">
      <p className="booking-progress-label">VOTRE PARCOURS</p>
      <ol className="booking-stepper" aria-label="Progression de la demande">
        {steps.map((step, index) => {
          const id = (index + 1) as 1 | 2 | 3 | 4
          const active = currentStep === id
          const completed = completedSteps.includes(id)
          return (
            <li
              key={id}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'booking-step',
                active && 'is-current',
                completed && 'is-complete',
              )}
            >
              <button
                type="button"
                onClick={() => onStepChange?.(id)}
                disabled={!onStepChange || (id > currentStep && !completed)}
                aria-label={`${step.short}${completed ? ', étape validée' : ''}`}
              >
                <span className="step-number">
                  {completed && !active ? (
                    <Check size={16} />
                  ) : (
                    String(id).padStart(2, '0')
                  )}
                </span>
                <span>
                  <strong>{step.title}</strong>
                  <small>
                    {active
                      ? 'En cours'
                      : completed
                        ? 'Complété'
                        : step.description}
                  </small>
                </span>
                {active ? <ArrowUpRight size={16} /> : null}
              </button>
            </li>
          )
        })}
      </ol>
      <div className="booking-progress-help">
        <LockKeyhole size={18} />
        <p>Votre brouillon reste disponible quand vous quittez le parcours.</p>
      </div>
    </aside>
  )
}
