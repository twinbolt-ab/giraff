import { createContext, useContext, useReducer, useCallback, useMemo, type ReactNode } from 'react'

// State type
interface ReorderState {
  activeSection: string | null
  selectedKeys: Set<string>
}

// Actions
type ReorderAction =
  | { type: 'ENTER_REORDER'; section: string }
  | { type: 'EXIT_REORDER' }
  | { type: 'TOGGLE_SELECTION'; key: string }

// Reducer
function reorderReducer(state: ReorderState, action: ReorderAction): ReorderState {
  switch (action.type) {
    case 'ENTER_REORDER':
      return { activeSection: action.section, selectedKeys: new Set() }

    case 'EXIT_REORDER':
      return { activeSection: null, selectedKeys: new Set() }

    case 'TOGGLE_SELECTION': {
      const newKeys = new Set(state.selectedKeys)
      if (newKeys.has(action.key)) {
        newKeys.delete(action.key)
      } else {
        newKeys.add(action.key)
      }
      return { ...state, selectedKeys: newKeys }
    }

    default:
      return state
  }
}

// Context value type
interface ReorderContextValue {
  activeSection: string | null
  selectedKeys: Set<string>
  isReordering: boolean
  isSectionReordering: (section: string) => boolean
  enterReorder: (section: string) => void
  exitReorder: () => void
  toggleSelection: (key: string) => void
}

const ReorderContext = createContext<ReorderContextValue | null>(null)

// Stable empty set to avoid unnecessary re-renders
const EMPTY_SET = new Set<string>()

// Initial state
const initialState: ReorderState = {
  activeSection: null,
  selectedKeys: EMPTY_SET,
}

// Provider component
interface ReorderProviderProps {
  children: ReactNode
}

export function ReorderProvider({ children }: ReorderProviderProps) {
  const [state, dispatch] = useReducer(reorderReducer, initialState)

  // Derived state
  const isReordering = state.activeSection !== null

  const isSectionReordering = useCallback(
    (section: string) => state.activeSection === section,
    [state.activeSection]
  )

  // Actions
  const enterReorder = useCallback((section: string) => {
    dispatch({ type: 'ENTER_REORDER', section })
  }, [])

  const exitReorder = useCallback(() => {
    dispatch({ type: 'EXIT_REORDER' })
  }, [])

  const toggleSelection = useCallback((key: string) => {
    dispatch({ type: 'TOGGLE_SELECTION', key })
  }, [])

  const value = useMemo<ReorderContextValue>(
    () => ({
      activeSection: state.activeSection,
      selectedKeys: state.selectedKeys,
      isReordering,
      isSectionReordering,
      enterReorder,
      exitReorder,
      toggleSelection,
    }),
    [
      state.activeSection,
      state.selectedKeys,
      isReordering,
      isSectionReordering,
      enterReorder,
      exitReorder,
      toggleSelection,
    ]
  )

  return <ReorderContext.Provider value={value}>{children}</ReorderContext.Provider>
}

// Hook to use the context
export function useReorder(): ReorderContextValue {
  const context = useContext(ReorderContext)
  if (!context) {
    throw new Error('useReorder must be used within a ReorderProvider')
  }
  return context
}
