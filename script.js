// Sorok száma: 6, Oszlopok száma: 8
/*
       1   2   3   4   5   6   7   8
     +---+---+---+---+---+---+---+---+
  A  |   |   |   |   |   |   |   |   |
     +---+---+---+---+---+---+---+---+
  B  |   |   |   |   |   |   |   |   |
     +---+---+---+---+---+---+---+---+
  C  |   |   |   |   |   |   |   |   |
     +---+---+---+---+---+---+---+---+
  D  |   |   | F | F |   |   |   |   |
     +---+---+---+---+---+---+---+---+
  E  |   |   | F | F | F | F | F |   |
     +---+---+---+---+---+---+---+---+
  F  |   |   |   |   |   |   |   |   |
     +---+---+---+---+---+---+---+---+
*/
/*const teszt = {
    A: {
      1: "", 2: "", 3: "", 4: "", 5: "", 6: "",7: "", 8: "",
    },
    B: {
      1: "", 2: "", 3: "", 4: "", 5: "", 6: "",7: "", 8: "",
    },
    C: {
      1: "", 2: "", 3: "", 4: "", 5: "", 6: "",7: "", 8: "",
    },
    D: {
      1: "", 2: "", 3: "F", 4: "F", 5: "", 6: "",7: "", 8: "",
    },
    E: {
      1: "", 2: "", 3: "F", 4: "F", 5: "F", 6: "F",7: "F", 8: "",
    },
    F: {
      1: "", 2: "", 3: "", 4: "", 5: "", 6: "",7: "", 8: "",
    }
  }
  
  console.log(teszt);*/

// State
let movies = {};
let selectedId;
let selectedSeats = [];
let userName = "";

fetchAllMovies();

function fetchAllMovies() {
  fetch("https://kodbazis.hu/api/movies")
    .then((res) => (res.ok ? res.json() : []))
    .then((result) => {
      movies = result.reduce((acc, movie) => ({ ...acc, [movie.id]: movie }), {});
      selectedId = selectedId ? selectedId : Object.values(movies)[0].id;
      render();
    })
    .catch(console.log);
}

function render() {
  const seatMap = generateSeats(movies[selectedId].numberOfRows, movies[selectedId].numberOfSeats);

  for (let bookedSeat of movies[selectedId].bookedSeats) {
    seatMap.get(bookedSeat.row).set(bookedSeat.number, "F");
  }

  let rowsHTML = "";

  let firstRow = "<div class='row-symbol'></div>";
  seatMap.get("A").forEach((seat, seatKey) => {
    firstRow += `<div class="column-number">${seatKey}</div>`;
  });

  rowsHTML += `<div class="seat-row">${firstRow}</div>`;

  seatMap.forEach((row, rowKey) => {
    let singleRowHTML = "";

    row.forEach((seat, seatKey) => {
      const isSelected = selectedSeats.find((seat) => seat.row === rowKey && seat.number === seatKey);
      singleRowHTML += `
          <div 
            class="seat ${seat === "F" ? "occupied" : ""} ${isSelected ? "selected" : ""}" 
            data-row="${rowKey}" 
            data-seat="${seatKey}"
          >  
          </div>
         `;
    });

    rowsHTML += `
          <div class="seat-row">
            <span class="row-symbol">${rowKey}</span>  ${singleRowHTML}
          </div>
        `;
  });

  document.querySelector(".app-container").innerHTML = `
      <form id="select-movie-form" class="movie-form">
        <label class="w-100">
          Válassz filmet!
          <select name="selectedMovie">
            ${Object.values(movies)
              .map(
                (movie) => `
                <option 
                    value="${movie.id}" 
                    ${movie.id === selectedId ? 'selected="selected"' : ""}
                >
                    ${movie.name} (${movie.price} Ft)
                </option>`
              )
              .join("")}
          </select>
        </label>
      </form>
      <ul class="showcase">
        <li>
          <div class="seat-preview"></div>
          <small>Szabad</small>
        </li>
        <li>
          <div class="seat-preview occupied"></div>
          <small>Foglalt</small>
        </li>
        <li>
          <div class="seat-preview selected"></div>
          <small>Kiválasztva</small>
        </li>
      </ul>
      <div class="movie-inner-container">
        <div class="screen"> </div>
        ${rowsHTML}
      </div>

      <p class="text text-center">
        Kiválasztottál
        <span id="count">${selectedSeats.length}</span>
        széket, aminek az ára összesen:
        <span id="total">${selectedSeats.length * movies[selectedId].price}</span>
        Ft.
      </p>
      <form id="book-seats">
        <input 
            type="text" 
            class="mb-2" 
            name="name" 
            placeholder="Név" 
            required 
            value="${userName}" 
        />
        <button type="submit" class="btn btn-success btn-sm">
            Foglalás
        </button>
      </form>
      `;

  document.getElementById("select-movie-form").onchange = (e) => {
      selectedId = parseInt(e.target.value);
      selectedSeats = [];
      render();
  };

  document.querySelectorAll(".seat").forEach((seat) => {
    seat.onclick = (e) => {
      const row = e.target.dataset.row;
      const seat = parseInt(e.target.dataset.seat);

      const isBooked = seatMap.has(row) && seatMap.get(row).get(seat);

      if (isBooked) {
        return;
      }

      const i = selectedSeats.findIndex((item) => item.row == row && item.number == seat);
      if (i === -1) {
        selectedSeats.push({
          row: row,
          number: seat,
        });
      } else {
        selectedSeats.splice(i, 1);
      }
      render();
    };
  });

  document.getElementById("book-seats").addEventListener("change", (e) => {
    userName = e.currentTarget.elements.name.value;
  });

  document.getElementById("book-seats").addEventListener("submit", async (e) => {
    e.preventDefault();
    await fetch(`https://kodbazis.hu/api/book-seats/${movies[selectedId].id}`, {
      body: JSON.stringify(
        selectedSeats.map((seat) => ({
          ...seat,
          name: userName,
        }))
      ),
      method: "POST",
    });

    alert("Foglalás sikeres!");
    selectedSeats = [];
    fetchAllMovies();
  });
}

function generateSeats(numberOfRows, numberOfSeatsPerRow) {
  const rowSymbols = "abcdefghijklmnopqrstuvwxyz".toUpperCase().split("");

  let ret = new Map();

  for (let i = 0; i < numberOfRows; i++) {
    ret.set(rowSymbols[i], new Map());
    for (let j = 1; j < numberOfSeatsPerRow + 1; j++) {
      ret.get(rowSymbols[i]).set(j);
    }
  }
  return ret;
}
