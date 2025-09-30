import { State } from "..";

import { AbstractStore } from ".";

/**
 * Union type of available experiments.
 */
export type Experiment = "gif_picker" | "plugins";

/**
 * Currently active experiments.
 */
export const AVAILABLE_EXPERIMENTS: Experiment[] = ["gif_picker", "plugins"];

/**
 * Experiments enabled by default.
 */
export const DEFAULT_EXPERIMENTS: Experiment[] = [];

/**
 * Always-on development-mode experiments.
 */
export const ALWAYS_ON_DEVELOPMENT_EXPERIMENTS: Experiment[] = [];

/**
 * Definitions for experiments listed by {@link Experiment}.
 */
export const EXPERIMENTS: {
  [key in Experiment]: { title: string; description: string };
} = {
  gif_picker: {
    title: "GIF Picker Placeholder",
    description: "Not available yet.",
  },
  plugins: {
    title: "Plugins v2 Placeholder",
    description: "Not available yet.",
  },
};

export interface TypeExperiments {
  /**
   * List of enabled experiments
   */
  enabled: Experiment[];

  /**
   * Safe mode
   */
  safeMode: boolean;
}

/**
 * Handles enabling and disabling client experiments.
 */
export class Experiments extends AbstractStore<"experiments", TypeExperiments> {
  /**
   * Construct store
   * @param state State
   */
  constructor(state: State) {
    super(state, "experiments");

    this.toggleSafeMode = this.toggleSafeMode.bind(this);
  }

  /**
   * Hydrate external context
   */
  hydrate(): void {
    /** nothing needs to be done */
  }

  /**
   * Generate default values
   */
  default(): TypeExperiments {
    return {
      enabled: DEFAULT_EXPERIMENTS,
      safeMode: false,
    };
  }

  /**
   * Validate the given data to see if it is compliant and return a compliant object
   */
  clean(input: Partial<TypeExperiments>): TypeExperiments {
    const enabled: Set<Experiment> = new Set();

    if (input.enabled) {
      for (const entry of input.enabled) {
        if (AVAILABLE_EXPERIMENTS.includes(entry)) {
          enabled.add(entry);
        }
      }
    }

    return {
      enabled: [...enabled],
      safeMode: false,
    };
  }

  /**
   * Check if an experiment is enabled.
   * @param experiment Experiment
   */
  isEnabled(experiment: Experiment) {
    return (
      !this.get().safeMode &&
      ((import.meta.env.DEV &&
        ALWAYS_ON_DEVELOPMENT_EXPERIMENTS.includes(experiment)) ||
        this.get().enabled.includes(experiment))
    );
  }

  /**
   * Enable an experiment.
   * @param experiment Experiment
   */
  enable(experiment: Experiment) {
    if (!this.isEnabled(experiment)) {
      this.set("enabled", (enabled) => [...enabled, experiment]);
    }
  }

  /**
   * Disable an experiment.
   * @param experiment Experiment
   */
  disable(experiment: Experiment) {
    if (this.isEnabled(experiment)) {
      this.set("enabled", (enabled) =>
        enabled.filter((entry) => entry !== experiment),
      );
    }
  }

  /**
   * Set the state of an experiment.
   * @param key Experiment
   * @param enabled Whether this experiment is enabled.
   */
  setEnabled(key: Experiment, enabled: boolean): void {
    if (enabled) {
      this.enable(key);
    } else {
      this.disable(key);
    }
  }

  /**
   * Toggle safe mode.
   */
  toggleSafeMode() {
    this.set("safeMode", (safeMode) => !safeMode);
  }

  /**
   * Reset and disable all experiments.
   */
  reset() {
    this.set("enabled", []);
  }
}
