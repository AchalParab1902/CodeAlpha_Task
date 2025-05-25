document.addEventListener("DOMContentLoaded", () => {
  const bookList = document.getElementById("book-list");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const themeToggle = document.getElementById("themeToggle");
  const modal = document.getElementById("book-modal");
  const modalClose = document.getElementById("modal-close");
  const modalBody = document.getElementById("modal-body");

  // User login related elements
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const welcomeMsg = document.getElementById("welcomeMsg");
  const loginModal = document.getElementById("login-modal");
  const loginClose = document.getElementById("login-close");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");

  let currentUser = null; // logged-in user object

  // Simple users DB in localStorage key 'users'
  function getUsers() {
    return JSON.parse(localStorage.getItem("users") || "[]");
  }
  function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
  }

  // Login/Register form submit
  loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const username = loginForm.username.value.trim();
    const password = loginForm.password.value.trim();
    if (!username || !password) {
      loginMessage.textContent = "Please enter both username and password.";
      return;
    }
    let users = getUsers();
    let user = users.find(u => u.username === username);

    if (user) {
      // User exists, check password
      if (user.password === password) {
        loginSuccess(user);
      } else {
        loginMessage.textContent = "Incorrect password.";
      }
    } else {
      // Register new user
      user = { username, password, borrowedBooks: [] };
      users.push(user);
      saveUsers(users);
      loginSuccess(user);
    }
  });

  function loginSuccess(user) {
    currentUser = user;
    loginMessage.textContent = "";
    loginForm.reset();
    loginModal.classList.add("hidden");
    updateUserUI();
    alert(`Welcome, ${user.username}!`);
  }

  function logout() {
    currentUser = null;
    updateUserUI();
  }

  // Update UI for logged in/out state
  function updateUserUI() {
    if (currentUser) {
      welcomeMsg.textContent = `Hello, ${currentUser.username}`;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
    } else {
      welcomeMsg.textContent = "";
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
    }
    renderBooks();
  }

  // Borrow a book (require login)
  function borrowBook(book) {
    if (!currentUser) {
      alert("You must be logged in to borrow books.");
      loginModal.classList.remove("hidden");
      return;
    }
    if (book.isBorrowed) {
      alert("This book is already borrowed.");
      return;
    }
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 2 weeks due
    book.isBorrowed = true;
    book.borrower = currentUser.username;
    book.dueDate = dueDate.toISOString().slice(0, 10);
    book.history.push({ action: "borrowed", borrower: book.borrower, date: new Date().toISOString() });

    // Update user's borrowedBooks
    currentUser.borrowedBooks.push(book.isbn);
    updateUserInStorage();

    renderBooks();
    alert(`Book borrowed by ${book.borrower}. Due date: ${book.dueDate}`);
  }

  // Return a book (only borrower can return)
  function returnBook(book) {
    if (!currentUser) {
      alert("You must be logged in.");
      loginModal.classList.remove("hidden");
      return;
    }
    if (!book.isBorrowed) {
      alert("This book is not currently borrowed.");
      return;
    }
    if (book.borrower !== currentUser.username) {
      alert("You can only return books you borrowed.");
      return;
    }
    if (!confirm(`Return "${book.title}"?`)) return;

    book.isBorrowed = false;
    book.history.push({ action: "returned", borrower: book.borrower, date: new Date().toISOString() });
    book.borrower = null;
    book.dueDate = null;

    // Remove from user's borrowedBooks
    currentUser.borrowedBooks = currentUser.borrowedBooks.filter(isbn => isbn !== book.isbn);
    updateUserInStorage();

    renderBooks();
    alert(`Thank you for returning "${book.title}".`);
  }

  function updateUserInStorage() {
    let users = getUsers();
    const index = users.findIndex(u => u.username === currentUser.username);
    if (index !== -1) {
      users[index] = currentUser;
      saveUsers(users);
    }
  }

  // Populate categories dropdown dynamically
  function populateCategories() {
    const uniqueCategories = [...new Set(books.map(book => book.category))];
    uniqueCategories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });
  }

  // Render books according to filters
  function renderBooks() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;

    bookList.innerHTML = "";

    const filteredBooks = books.filter(book => {
      const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;
      const matchesSearch = book.title.toLowerCase().includes(searchTerm) || book.author.toLowerCase().includes(searchTerm);
      return matchesCategory && matchesSearch;
    });

    filteredBooks.forEach(book => {
      const card = document.createElement("div");
      card.className = "book-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-pressed", "false");
      card.innerHTML = `
        <div class="book-title">${book.title}</div>
        <div class="book-author">by ${book.author}</div>
        <div class="book-category">${book.category}</div>
        <div class="book-actions">
          ${
            book.isBorrowed
              ? (book.borrower === (currentUser && currentUser.username)
                  ? `<button class="return">Return</button>`
                  : `<button class="borrow" disabled title="Already borrowed by ${book.borrower}">Borrow</button>`
                )
              : `<button class="borrow">Borrow</button>`
          }
        </div>
      `;

      // Clicking the card (excluding buttons) opens modal
      card.addEventListener("click", (e) => {
        if (!e.target.closest("button")) {
          openModal(book);
        }
      });

      // Borrow/Return button events
      const borrowBtn = card.querySelector(".borrow");
      if (borrowBtn && !borrowBtn.disabled) borrowBtn.addEventListener("click", () => borrowBook(book));

      const returnBtn = card.querySelector(".return");
      if (returnBtn) returnBtn.addEventListener("click", () => returnBook(book));

      bookList.appendChild(card);
    });
  }

  // Modal functions
  function openModal(book) {
    modalBody.innerHTML = `
      <h2>${book.title}</h2>
      <p><strong>Author:</strong> ${book.author}</p>
      <p><strong>Category:</strong> ${book.category}</p>
      <p><strong>Year:</strong> ${book.year}</p>
      <p><strong>ISBN:</strong> ${book.isbn}</p>
      <p>${book.description}</p>
      <p><strong>Status:</strong> ${book.isBorrowed ? `Borrowed by ${book.borrower} until ${book.dueDate}` : "Available"}</p>
    `;
    modal.classList.remove("hidden");
  }

  modalClose.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Close modal on outside click
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  // Theme toggle
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

  // Login modal open/close
  loginBtn.addEventListener("click", () => {
    loginModal.classList.remove("hidden");
  });
  loginClose.addEventListener("click", () => {
    loginModal.classList.add("hidden");
    loginMessage.textContent = "";
  });

  logoutBtn.addEventListener("click", () => {
    logout();
  });

  // Event listeners
  searchInput.addEventListener("input", renderBooks);
  categoryFilter.addEventListener("change", renderBooks);

  // Init
  populateCategories();

  // Check if user is already logged in (localStorage)
  const savedUsername = localStorage.getItem("loggedInUser");
  if (savedUsername) {
    let users = getUsers();
    let user = users.find(u => u.username === savedUsername);
    if (user) currentUser = user;
  }
  updateUserUI();
  renderBooks();

  // Save current user to localStorage on login
  function updateUserUI() {
    if (currentUser) {
      welcomeMsg.textContent = `Hello, ${currentUser.username}`;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      localStorage.setItem("loggedInUser", currentUser.username);
    } else {
      welcomeMsg.textContent = "";
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      localStorage.removeItem("loggedInUser");
    }
    renderBooks();
  }
  function borrowBook(book) {
  if (!currentUser) {
    alert("You must be logged in to borrow books.");
    loginModal.classList.remove("hidden");  // Show login modal
    return; // Stop further processing
  }

  if (book.isBorrowed) {
    alert("This book is already borrowed.");
    return;
  }

  // Borrowing logic continues...
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14); // 2 weeks due date
  book.isBorrowed = true;
  book.borrower = currentUser.username;
  book.dueDate = dueDate.toISOString().slice(0, 10);
  book.history.push({ action: "borrowed", borrower: book.borrower, date: new Date().toISOString() });

  // Update user's borrowedBooks
  currentUser.borrowedBooks.push(book.isbn);
  updateUserInStorage();

  renderBooks();
  alert(`Book borrowed by ${book.borrower}. Due date: ${book.dueDate}`);
  // Borrow button click event
if (borrowBtn && !borrowBtn.disabled) {
  borrowBtn.addEventListener("click", () => {
    if (!currentUser) {
      // Show login modal immediately if not logged in
      loginModal.classList.remove("hidden");
      return;
    }
    borrowBook(book);
  });
}

}


});
