import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface StepperProps {
  currentStep: number
  completedSteps: number[]
}

const stepLabels = [
  { id: 1, title: 'Configuration' },
  { id: 2, title: 'Voyageurs' },
  { id: 3, title: 'Services' },
  { id: 4, title: 'Rendez-vous' },
]

export function Stepper({ currentStep, completedSteps }: StepperProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">Flux Capago guide</Badge>
        <span className="text-sm text-muted-foreground">
          Etape {currentStep} sur 4
        </span>
      </div>
      <Progress value={(currentStep / 4) * 100} />
      <div className="grid gap-2 md:grid-cols-4">
        {stepLabels.map((step) => {
          const isActive = step.id === currentStep
          const isCompleted = completedSteps.includes(step.id)

          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                isActive
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border/70 bg-white',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  isCompleted || isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {step.id}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground">
                  {isCompleted ? 'Valide' : isActive ? 'En cours' : 'En attente'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
