import { UserVotes, VoteOption, VoteController } from "ranked-voting";
import { books, votes } from "./collections/bookclub-2";

function checkVotes(books: string[], votes: string[][]) {
  for (const vote of votes) {
    for (const book of vote) {
      if (!books.includes(book)) {
        return {
          valid: false,
          message: `Voted book not found: ${book}`,
        };
      }
    }
  }

  return {
    valid: true,
  };
}

function runVote({
  books,
  votes,
  exclude = [],
}: {
  books: string[];
  votes: string[][];
  exclude?: string[];
}) {
  const booksFinal = books.filter((book) => !exclude.includes(book));
  const votesFinal = votes.map((vote) =>
    vote.filter((book) => !exclude.includes(book))
  );

  const checkResult = checkVotes(booksFinal, votesFinal);
  if (!checkResult.valid) {
    throw Error(
      `Check failed after excluding (${exclude.join(" | ")}): ${
        checkResult.message
      }`
    );
  }

  const voteController = new VoteController(
    booksFinal.map((name) => new VoteOption(name))
  );

  for (const vote of votesFinal) {
    voteController.acceptUserVotes(new UserVotes(vote));
  }

  const result = voteController.getFinalResult();

  if (result.winner !== null) {
    return [result.winner];
  } else if (!result.tieOptions || result.tieOptions.length === 0) {
    throw Error("No tie options.");
  } else {
    return result.tieOptions;
  }
}

function getResults() {
  const NUM_RESULTS = 3;

  let booksToExclude: string[] = [];
  for (let i = 0; i < NUM_RESULTS; i++) {
    const winners = runVote({ books, votes, exclude: booksToExclude });

    if (winners.length > 1) {
      console.log(`Tie: ${winners.join(", ")}`);
      throw Error("Tie");
    }

    const winner = winners[0];

    console.log(`${i + 1}. ${winner}`);

    booksToExclude.push(winner);
  }
}

getResults();
