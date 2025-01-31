import { UserVotes, VoteOption, VoteController } from "ranked-voting";
import { books, votes } from "./collections/bookclub-5";

type Brand<K, T> = K & { __brand: T };

type Book = Brand<string, "book">;
type Vote = Brand<Book[], "vote">;

function stringsToBooks(xs: string[]): Book[] {
  return xs as Book[];
}

function stringToBook(x: string): Book {
  return x as Book;
}

function stringArraysToVotes(xss: string[][]): Vote[] {
  return xss as Vote[];
}

function bookArrayToVote(xs: Book[]): Vote {
  return xs as Vote;
}

function checkVotes(books: Book[], votes: Vote[]) {
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
function getBreakTieScoreForVote(book: Book, vote: Vote) {
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
function getBreakTieScoreForBook(book: Book, votes: Vote[]) {
  const totalScore = votes.reduce((totalScore, vote) => {
    const score = getBreakTieScoreForVote(book, vote);

    return score + totalScore;
  }, 0);

  return totalScore / votes.length;
}

// break the tie by considering where each book was positioned in each user's vote
function breakTie(tieOptions: Book[], votes: Vote[]): Book {
  const booksSortedByScore = tieOptions
    .map((book) => ({
      book,
      score: getBreakTieScoreForBook(book, votes),
    }))
    .toSorted((a, b) => b.score - a.score);

  const maybeWinner = booksSortedByScore[0];

  if (!maybeWinner) {
    throw Error("No winning book found in tiebreaker.");
  }

  if (
    // toFixed so we can compare without any weird JS floating point issues
    maybeWinner.score.toFixed(5) === booksSortedByScore[1]?.score.toFixed(5)
  ) {
    throw Error("Tiebreaker did not break the tie.");
  }

  return maybeWinner.book;
}

function runVote(books: Book[], votes: Vote[]) {
  const voteController = new VoteController(
    books.map((name) => new VoteOption(name))
  );

  for (const vote of votes) {
    voteController.acceptUserVotes(new UserVotes(vote));
  }

  const result = voteController.getFinalResult();

  if (result.winner !== null) {
    return stringToBook(result.winner);
  } else if (!result.tieOptions || result.tieOptions.length === 0) {
    throw Error("No tie options.");
  } else {
    return breakTie(stringsToBooks(result.tieOptions), votes);
  }
}

function excludeBooks({
  books,
  votes,
  exclude,
}: {
  books: Book[];
  votes: Vote[];
  exclude: Book[];
}) {
  const booksFiltered = books.filter((book) => !exclude.includes(book));
  const votesFiltered = votes.map((vote) =>
    bookArrayToVote(vote.filter((book) => !exclude.includes(book)))
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
  let excludedBooks: Book[] = [];

  for (let i = 0; i < numResults; i++) {
    const { books: booksFinal, votes: votesFinal } = excludeBooks({
      books: stringsToBooks(books),
      votes: stringArraysToVotes(votes),
      exclude: excludedBooks,
    });

    const winner = runVote(booksFinal, votesFinal);

    console.log(`${i + 1}. ${winner}`);

    excludedBooks.push(winner);
  }
}

printResults(3);
