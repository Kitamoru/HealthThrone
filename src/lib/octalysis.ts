// lib/octalysis.ts

export interface OctalysisAnalysis {
  turbulence: boolean;
  hatBalance: string;
  dominantArchetype: string;
  needs: {
    autonomy: boolean;   // Ф1, Ф2
    competence: boolean; // Ф8, Ф2
    relatedness: boolean; // Ф3
  };
  signals: string[];
}

export function analyzeStats(stats: any): OctalysisAnalysis {
  const values = [stats.factor1, stats.factor2, stats.factor3, stats.factor4, stats.factor5, stats.factor6, stats.factor7, stats.factor8];
  const avg = values.reduce((a, b) => a + b, 0) / 8;
  const max = Math.max(...values);
  const min = Math.min(...values);

  const whiteHat = stats.factor1 + stats.factor2 + stats.factor3;
  const blackHat = stats.factor4 + stats.factor5 + stats.factor6;

  // Определение архетипа по доминирующим факторам
  let archetype = "Универсал";
  if (stats.factor8 > avg || stats.factor7 > avg) archetype = "Достигатор";
  else if (stats.factor2 > avg || stats.factor4 > avg) archetype = "Исследователь";
  else if (stats.factor3 > avg || stats.factor1 > avg) archetype = "Социализатор";
  else if (stats.factor5 > avg || stats.factor6 > avg) archetype = "Завоеватель";

  const signals = [];
  if (stats.factor3 < avg * 0.7) signals.push("риск социальной изоляции");
  if (stats.factor7 > avg * 1.4) signals.push("склонность к накопительству");

  return {
    turbulence: (max - min) > 15,
    hatBalance: blackHat > whiteHat * 1.2 ? "Black Hat (давление)" : (whiteHat > blackHat * 1.2 ? "White Hat (спокойствие)" : "Баланс"),
    dominantArchetype: archetype,
    needs: {
      autonomy: (stats.factor1 + stats.factor2) / 2 < avg,
      competence: (stats.factor8 + stats.factor2) / 2 < avg,
      relatedness: stats.factor3 < avg
    },
    signals
  };
}
