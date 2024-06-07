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

function runVote(books: string[], votes: string[][]) {
  const voteController = new VoteController(
    books.map((name) => new VoteOption(name))
  );

  for (const vote of votes) {
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

function excludeBooks({
  books,
  votes,
  exclude,
}: {
  books: string[];
  votes: string[][];
  exclude: string[];
}) {
  const booksFiltered = books.filter((book) => !exclude.includes(book));
  const votesFiltered = votes.map((vote) =>
    vote.filter((book) => !exclude.includes(book))
  );

  if (booksFiltered.length === 0) {
    throw Error(`No books left after excluding (${exclude.join(" | ")}).`);
  }

  const checkResult = checkVotes(booksFiltered, votesFiltered);
  if (!checkResult.valid) {
    throw Error(
      `Check failed after excluding (${exclude.join(" | ")}): ${
        checkResult.message
      }`
    );
  }

  return {
    books: booksFiltered,
    votes: votesFiltered,
  };
}

function printResults(numResults: number) {
  let excludedBooks: string[] = [];
  for (let i = 0; i < numResults; i++) {
    const { books: booksFinal, votes: votesFinal } = excludeBooks({
      books,
      votes,
      exclude: excludedBooks,
    });

    const winners = runVote(booksFinal, votesFinal);

    if (winners.length > 1) {
      throw Error(`Tie: ${winners.join(", ")}`);
    }

    const winner = winners[0];

    console.log(`${i + 1}. ${winner}`);

    excludedBooks.push(winner);
  }
}

printResults(3);
