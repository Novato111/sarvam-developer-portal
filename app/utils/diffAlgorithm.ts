export type DiffType = 'added' | 'removed' | 'unchanged';

export interface DiffToken {
  type: DiffType;
  value: string;
}

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((token) => token.length > 0);
  
}

export function computeDiff(oldText: string, newText: string): DiffToken[] {
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);

  const m = oldTokens.length;
  const n = newTokens.length;

  // Keep the full LCS table so the backtrack can label every token.
  
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldTokens[i - 1] === newTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const diffTokens: DiffToken[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (oldTokens[i - 1] === newTokens[j - 1]) {
      diffTokens.unshift({ type: 'unchanged', value: oldTokens[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      diffTokens.unshift({ type: 'removed', value: oldTokens[i - 1] });
      i--;
    } else {
      diffTokens.unshift({ type: 'added', value: newTokens[j - 1] });
      j--;
    }
  }

  while (i > 0) {
    diffTokens.unshift({ type: 'removed', value: oldTokens[i - 1] });
    i--;
  }
  while (j > 0) {
    diffTokens.unshift({ type: 'added', value: newTokens[j - 1] });
    j--;
  }

  return diffTokens;
}
