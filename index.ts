import {
  UserVotes,
  VoteOption,
  VoteController,
  FinalResult,
} from "ranked-voting";
import { books, votes } from "./collections/bookclub-3";

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

// scores a book based on its position in a single user's vote
function getBreakTieScoreForVote(book: string, vote: string[]) {
  const position = vote.indexOf(book);

  if (position === -1) {
    return 0;
  }

  const numBooks = vote.length;

  // first position (0) with 10 books would produce a (10/10)
  // second position (1) with 10 books would produce a (9/10)
  // last position (9) with 10 books would produce a (1/10)
  return (numBooks - position) / numBooks;
}

// scores a book based on its position in each user's vote
function getBreakTieScoreForBook(book: string, votes: string[][]) {
  const totalScore = votes.reduce((totalScore, vote) => {
    const score = getBreakTieScoreForVote(book, vote);

    return score + totalScore;
  }, 0);

  return totalScore / votes.length;
}

// break the tie by considering where each book was positioned in each user's vote
function breakTie(tieOptions: string[], votes: string[][]) {
  const winningBook = tieOptions
    .map((book) => ({
      book,
      score: getBreakTieScoreForBook(book, votes),
    }))
    .toSorted((a, b) => b.score - a.score)
    .at(0)?.book;

  if (!winningBook) {
    throw Error("No winning book found in tiebreaker.");
  }

  return winningBook;
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
    return result.winner;
  } else if (!result.tieOptions || result.tieOptions.length === 0) {
    throw Error("No tie options.");
  } else {
    return breakTie(result.tieOptions, votes);
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

    const winner = runVote(booksFinal, votesFinal);

    console.log(`${i + 1}. ${winner}`);

    excludedBooks.push(winner);
  }
}

printResults(3);
