import { createContext, useContext } from 'react'
export const FieldContext = createContext<{
  id: string
  labelId: string
  descriptionId?: string
  invalid: boolean
} | null>(null)
export const useFieldContext = () => useContext(FieldContext)
