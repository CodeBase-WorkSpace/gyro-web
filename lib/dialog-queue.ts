export const DIALOG_QUEUE_IDS = [
  "dashboard-goal-wizard",
  "dashboard-first-meal-guidance",
  "dashboard-notification-permission",
  "pwa-install",
] as const;

export type DialogQueueId = (typeof DIALOG_QUEUE_IDS)[number];
export type DialogQueueEntry = {
  id: DialogQueueId;
  priority: number;
  order: number;
};
export type DialogQueueState = {
  entries: DialogQueueEntry[];
  completed: Set<DialogQueueId>;
  activeId?: DialogQueueId;
  waitingForNavigation: boolean;
  nextOrder: number;
};
export type DialogQueueAction =
  | { type: "register"; id: DialogQueueId; priority: number }
  | { type: "unregister"; id: DialogQueueId }
  | { type: "complete"; id: DialogQueueId }
  | { type: "navigation-stable" }
  | { type: "activate-next" };

export function createDialogQueueState(): DialogQueueState {
  return {
    entries: [],
    completed: new Set(),
    waitingForNavigation: false,
    nextOrder: 0,
  };
}

export function dialogQueueReducer(
  state: DialogQueueState,
  action: DialogQueueAction,
): DialogQueueState {
  switch (action.type) {
    case "register":
      if (state.entries.some((entry) => entry.id === action.id)) return state;
      return {
        ...state,
        entries: [
          ...state.entries,
          {
            id: action.id,
            priority: action.priority,
            order: state.nextOrder,
          },
        ],
        nextOrder: state.nextOrder + 1,
      };
    case "unregister":
      return {
        ...state,
        entries: state.entries.filter((entry) => entry.id !== action.id),
        activeId: state.activeId === action.id ? undefined : state.activeId,
        waitingForNavigation:
          state.activeId === action.id ? true : state.waitingForNavigation,
      };
    case "complete":
      if (state.completed.has(action.id) && state.activeId !== action.id) {
        return state;
      }
      return {
        ...state,
        activeId: state.activeId === action.id ? undefined : state.activeId,
        waitingForNavigation:
          state.activeId === action.id ? true : state.waitingForNavigation,
        completed: new Set(state.completed).add(action.id),
      };
    case "navigation-stable":
      return state.waitingForNavigation
        ? { ...state, waitingForNavigation: false }
        : state;
    case "activate-next": {
      if (state.activeId || state.waitingForNavigation) return state;
      const activeId = selectNextDialogId(state.entries, state.completed);
      return activeId ? { ...state, activeId } : state;
    }
  }
}

export function selectNextDialogId(
  entries: DialogQueueEntry[],
  completed: ReadonlySet<DialogQueueId>,
) {
  return entries
    .filter((entry) => !completed.has(entry.id))
    .sort(
      (left, right) => left.priority - right.priority || left.order - right.order,
    )[0]?.id;
}
