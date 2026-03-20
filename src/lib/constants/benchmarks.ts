// EDH heuristic benchmarks by bracket for scoring

export interface BracketBenchmarks {
  ramp: { low: number; high: number };
  draw: { low: number; high: number };
  removal: { low: number; high: number };
  tutors: { low: number; high: number };
  avgCmc: { low: number; high: number };
  gameChangers: { low: number; high: number };
}

// Per-bracket benchmarks: values below "low" score bracket 1, above "high" score bracket 4
export const BENCHMARKS: BracketBenchmarks = {
  ramp: { low: 6, high: 12 }, // # of ramp pieces
  draw: { low: 5, high: 12 }, // # of card draw pieces
  removal: { low: 5, high: 10 }, // # of removal pieces
  tutors: { low: 1, high: 5 }, // # of non-land tutors
  avgCmc: { low: 3.5, high: 2.2 }, // inverse: lower avg cmc = higher bracket
  gameChangers: { low: 0, high: 4 }, // # of game changers
};
