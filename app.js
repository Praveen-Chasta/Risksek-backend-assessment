const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

// Path to the SQLite database file
const databasePath = path.join(__dirname, "transaction.db");

// Create an instance of Express
const app = express();

// Parse JSON data in request bodies
app.use(express.json());

// Database instance variable
let database = null;

// Function to initialize the database and start the server
const initializeDbAndServer = async () => {
  try {
    // Open the SQLite database
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    // Start the Express server on port 3001
    app.listen(3001, () =>
      console.log("Server Running at http://localhost:3001/")
    );
  } catch (error) {
    // Handle database initialization errors
    console.error(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

// Call the function to initialize the database and start the server
initializeDbAndServer();

// Define the Book class
class Book {
  constructor(title, author, ISBN) {
    this.title = title;
    this.author = author;
    this.ISBN = ISBN;
  }

  // Method to display book information
  displayInfo() {
    return { title: this.title, author: this.author, ISBN: this.ISBN };
  }
}

// Define the EBook subclass that extends Book
class EBook extends Book {
  constructor(title, author, ISBN, fileFormat) {
    super(title, author, ISBN);
    this.fileFormat = fileFormat;
  }

  // Override the displayInfo method to include file format
  displayInfo() {
    const bookInfo = super.displayInfo();
    bookInfo.fileFormat = this.fileFormat;
    return bookInfo;
  }
}

// Define the Library class
class Library {
  constructor() {
    this.books = [];
  }

  // Method to add a book to the library
  addBook(book) {
    if (!(book instanceof Book)) {
      // Throw an error if the provided object is not a Book or its subclass
      throw new Error("Invalid book type. Must be a Book or its subclass.");
    }
    this.books.push(book);
    return { message: "Book added successfully!" };
  }

  // Method to display information of all books in the library
  displayBooks() {
    return this.books.map((book) => book.displayInfo());
  }

  // Method to search for books by title
  searchByTitle(title) {
    return this.books
      .filter((book) => book.title === title)
      .map((book) => book.displayInfo());
  }

  // Method to delete a book from the library by ISBN
  deleteBook(ISBN) {
    const index = this.books.findIndex((book) => book.ISBN === ISBN);
    if (index !== -1) {
      this.books.splice(index, 1);
      return { message: "Book deleted successfully!" };
    } else {
      // Throw an error if the book is not found
      throw new Error("Book not found!");
    }
  }
}

// Create an instance of the Library class
const library = new Library();

// API Endpoints

// Endpoint to add a book to the library
app.post("/addBook", async (req, res) => {
  try {
    // Extract title and author from the request body
    const { title, author } = req.body;
    console.log("Received data:", req.body);

    // SQL query to insert a new book into the database
    const insertQuery = `
      INSERT INTO books(title, author)
      VALUES (?, ?)
    `;

    // Execute the query with parameterized values
    await database.run(insertQuery, [title, author]);

    // Log success message and respond with a JSON message
    console.log("Book added successfully!");
    res.json({ message: "Book added successfully!" });
  } catch (error) {
    // Log and respond with an error message
    console.error("Error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Endpoint to list all books in the library
app.get("/listBooks", (req, res) => {
  // Get the book information from the library and respond with JSON
  const books = library.displayBooks();
  res.json({ books });
});

// Endpoint to delete a book from the library by ISBN
app.delete("/deleteBook", (req, res) => {
  try {
    // Extract ISBN from the request body
    const ISBN = req.body.ISBN;
    if (!ISBN) {
      // Throw an error if ISBN is not provided
      throw new Error("ISBN is required for deleting a book.");
    }

    // Delete the book from the library and respond with a JSON message
    const result = library.deleteBook(ISBN);
    res.json(result);
  } catch (error) {
    // Log and respond with an error message
    res.status(400).json({ error: error.message });
  }
});
