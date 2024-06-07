# ranked-choice-bookclub

Get multiple results from ranked-choice voting. Normally ranked-choice only
produces one result. This script produces multiple results by running the
algorithm on all the votes, removing the winner, running again, and repeating
for the number of results desired.

```bash
bun install
bun index.ts
```
