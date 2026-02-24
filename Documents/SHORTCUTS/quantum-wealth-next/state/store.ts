import { create } from "zustand";
import type { ConnectorType, ExpenseCategory, Goal, Scenario, UIState } from "@/types/domain";
import type { RangeKey } from "@/types/pulse";
import { accounts, baselineScenario, connectors, expenseCategories, goals, holdings, insights, monthlyExpenses, monthlyIncome, transactions } from "@/state/mockData";

interface EntitiesState {
  connectors: typeof connectors;
  accounts: typeof accounts;
  holdings: typeof holdings;
  transactions: typeof transactions;
  insights: typeof insights;
  goals: Goal[];
  expenseCategories: ExpenseCategory[];
  monthlyIncome: number;
  monthlyExpenses: number;
}

interface FilterState {
  logSource: "all" | ConnectorType;
  logQuery: string;
  frontierTab: "exchanges" | "wallets" | "defi";
  alphaSort: "value" | "change" | "name";
  cashflowWindow: "week" | "month";
  pulseRange: RangeKey;
  setLogSource: (source: "all" | ConnectorType) => void;
  setLogQuery: (query: string) => void;
  setFrontierTab: (tab: "exchanges" | "wallets" | "defi") => void;
  setAlphaSort: (sort: "value" | "change" | "name") => void;
  setCashflowWindow: (window: "week" | "month") => void;
  setPulseRange: (range: RangeKey) => void;
}

interface UIStore {
  screenState: UIState;
  privacyMode: boolean;
  pulseScrub: { active: boolean; index: number | null };
  togglePrivacyMode: () => void;
  setScreenState: (state: UIState) => void;
  setPulseScrub: (active: boolean, index: number | null) => void;
}

interface ScenarioStore {
  scenarios: Scenario[];
  activeScenarioId: string;
  updateActiveScenario: (patch: Partial<Scenario>) => void;
  saveScenario: (name: string) => void;
  duplicateScenario: () => void;
  setActiveScenario: (id: string) => void;
}

interface StructuredState {
  filters: {
    pulseRange: RangeKey;
  };
  ui: {
    pulseScrub: { active: boolean; index: number | null };
  };
}

export type QuantumStore = EntitiesState & FilterState & UIStore & ScenarioStore & StructuredState;

export const useQuantumStore = create<QuantumStore>((set, get) => ({
  connectors,
  accounts,
  holdings,
  transactions,
  insights,
  goals,
  expenseCategories,
  monthlyIncome,
  monthlyExpenses,
  screenState: "data",
  privacyMode: false,
  pulseScrub: { active: false, index: null },
  ui: {
    pulseScrub: { active: false, index: null }
  },
  togglePrivacyMode: () => set((state) => ({ privacyMode: !state.privacyMode })),
  setScreenState: (screenState) => set({ screenState }),
  setPulseScrub: (active, index) =>
    set({
      pulseScrub: { active, index },
      ui: {
        ...get().ui,
        pulseScrub: { active, index }
      }
    }),
  logSource: "all",
  logQuery: "",
  frontierTab: "exchanges",
  alphaSort: "value",
  cashflowWindow: "week",
  pulseRange: "1W",
  filters: {
    pulseRange: "1W"
  },
  setLogSource: (logSource) => set({ logSource }),
  setLogQuery: (logQuery) => set({ logQuery }),
  setFrontierTab: (frontierTab) => set({ frontierTab }),
  setAlphaSort: (alphaSort) => set({ alphaSort }),
  setCashflowWindow: (cashflowWindow) => set({ cashflowWindow }),
  setPulseRange: (pulseRange) =>
    set({
      pulseRange,
      filters: {
        ...get().filters,
        pulseRange
      }
    }),
  scenarios: [baselineScenario],
  activeScenarioId: baselineScenario.id,
  updateActiveScenario: (patch) =>
    set((state) => ({
      scenarios: state.scenarios.map((scenario) =>
        scenario.id === state.activeScenarioId ? { ...scenario, ...patch } : scenario
      )
    })),
  saveScenario: (name) =>
    set((state) => {
      const active = state.scenarios.find((scenario) => scenario.id === state.activeScenarioId);
      if (!active) return state;
      const saved: Scenario = {
        ...active,
        id: `scenario-${Date.now()}`,
        name
      };
      return { scenarios: [saved, ...state.scenarios], activeScenarioId: saved.id };
    }),
  duplicateScenario: () => {
    const state = get();
    const active = state.scenarios.find((scenario) => scenario.id === state.activeScenarioId);
    if (!active) return;
    const duplicate: Scenario = {
      ...active,
      id: `scenario-${Date.now()}`,
      name: `${active.name} Copia`
    };
    set({ scenarios: [duplicate, ...state.scenarios], activeScenarioId: duplicate.id });
  },
  setActiveScenario: (activeScenarioId) => set({ activeScenarioId })
}));
