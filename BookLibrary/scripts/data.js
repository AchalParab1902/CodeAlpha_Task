// Generate 100 sample books with categories
const categories = ["Fiction", "Non-Fiction", "Science", "History", "Fantasy", "Biography", "Self-Help", "Technology"];

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate fake book titles and authors for demo
const sampleTitles = [
  "The Silent Dawn", "Echoes of Eternity", "Quantum Leap", "Shadows of the Past",
  "The Last Kingdom", "Mindset Mastery", "Code of the Ancients", "Infinite Loop",
  "Beyond the Horizon", "The Art of War", "Unseen Realities", "Journey to the Stars",
  "The Forgotten Tales", "Rise of the Phoenix", "Legacy of the Brave", "Fragments of Time"
];

const sampleAuthors = [
  "John Smith", "Alice Johnson", "Robert Brown", "Emily Davis",
  "Michael Miller", "Sarah Wilson", "David Moore", "Laura Taylor",
  "James Anderson", "Linda Thomas"
];

const books = Array.from({length: 100}, (_, i) => {
  const title = sampleTitles[Math.floor(Math.random() * sampleTitles.length)] + " " + (i+1);
  const author = randomFromArray(sampleAuthors);
  const category = randomFromArray(categories);
  return {
    id: i+1,
    title,
    author,
    category,
    year: 1990 + Math.floor(Math.random() * 30),
    isbn: `978-1-23${Math.floor(100000 + Math.random()*899999)}`,
    description: `A fascinating book titled "${title}" by ${author} in the genre ${category}. A must-read!`,
    isBorrowed: false,
    borrower: null,
    dueDate: null,
    history: []
  }
});
