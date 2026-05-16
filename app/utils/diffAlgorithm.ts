// src/utils/diffAlgorithm.ts

export type DiffType = 'added' | 'removed' | 'unchanged';

export interface DiffToken {
  type: DiffType;
  value: string;
}

/**
 * Tokenizes text by splitting on whitespace but KEEPING the whitespace as distinct tokens.
 * This ensures that when we reconstruct the text in the UI, the spacing remains perfectly intact.
 */
function tokenize(text: string): string[] {
  // The regex /(\s+)/ splits by whitespace but keeps the whitespace in the resulting array
  return text.split(/(\s+)/).filter((token) => token.length > 0);
}

/**
 * Compares two strings and returns an array of token-level differences 
 * using the Longest Common Subsequence (Dynamic Programming) algorithm.
 */
export function computeDiff(oldText: string, newText: string): DiffToken[] {
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);

  const m = oldTokens.length;
  const n = newTokens.length;

  // Step 1: Initialize the 2D DP matrix with zeros
  // dp[i][j] will store the length of the LCS for oldTokens[0...i-1] and newTokens[0...j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  // Step 2: Fill the DP matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldTokens[i - 1] === newTokens[j - 1]) {
        // Tokens match: take diagonal value and add 1
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        // Tokens differ: take the max value from the cell above or the cell to the left
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Step 3: Backtrack through the matrix to find the exact changes
  const diffTokens: DiffToken[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (oldTokens[i - 1] === newTokens[j - 1]) {
      // It's a match, meaning it's unchanged
      diffTokens.unshift({ type: 'unchanged', value: oldTokens[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      // Value came from above, meaning a token was removed from the old text
      diffTokens.unshift({ type: 'removed', value: oldTokens[i - 1] });
      i--;
    } else {
      // Value came from the left, meaning a token was added to the new text
      diffTokens.unshift({ type: 'added', value: newTokens[j - 1] });
      j--;
    }
  }

  // Step 4: Handle any remaining tokens if we hit the edge of the matrix early
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