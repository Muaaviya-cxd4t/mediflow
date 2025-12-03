// Navigation
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".section");
  const header =
    document.querySelector("#header") || document.querySelector("header");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").replace("#", "");

      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      sections.forEach((section) => {
        section.classList.toggle("active", section.id === targetId);
      });
    });
  });

  window.addEventListener("scroll", () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 50);
  });
});

// Waste data
const wasteTypes = [
  {
    name: "Infectious Waste",
    sanitization: 15,
    dump: true,
    returnToHospital: false,
  },
  {
    name: "Sharps Waste",
    sanitization: 30,
    dump: false,
    returnToHospital: true,
  },
  {
    name: "Chemical Waste",
    sanitization: 40,
    dump: true,
    returnToHospital: false,
  },
  {
    name: "General Waste",
    sanitization: 0,
    dump: true,
    returnToHospital: false,
  },
];

let wasteEntries = [];

function generateWasteEntries() {
  const count = parseInt(document.getElementById("entryCount").value);

  if (!count || count < 1) {
    alert("Please enter a valid number");
    return;
  }

  const container = document.getElementById("wasteEntriesContainer");
  container.innerHTML = "";
  wasteEntries = [];

  for (let i = 0; i < count; i++) {
    const entryDiv = document.createElement("div");
    entryDiv.className = "waste-entry";
    entryDiv.innerHTML = `
            <h3>Waste Entry ${i + 1}</h3>
            <div class="form-group">
                <label>Waste Type</label>
                <select id="wasteType${i}" onchange="updateLogicNote(${i})">
                    <option value="">Select type</option>
                    ${wasteTypes
                      .map(
                        (w, idx) => `<option value="${idx}">${w.name}</option>`
                      )
                      .join("")}
                </select>
            </div>
            <div class="form-group">
                <label>Quantity (kg)</label>
                <input type="number" id="quantity${i}" min="1" placeholder="Enter quantity">
            </div>
            <div id="logicNote${i}" class="logic-note" style="display:none;"></div>
        `;
    container.appendChild(entryDiv);
  }

  document.getElementById("submitBtn").style.display = "block";
}

function updateLogicNote(index) {
  const select = document.getElementById(`wasteType${index}`);
  const noteDiv = document.getElementById(`logicNote${index}`);
  const typeIdx = parseInt(select.value);

  if (isNaN(typeIdx)) {
    noteDiv.style.display = "none";
    return;
  }

  const wasteType = wasteTypes[typeIdx];
  let note = "";

  if (wasteType.sanitization > 0)
    note = `${wasteType.sanitization} min sanitization → `;
  if (wasteType.dump) note += "dump = YES";
  else if (wasteType.returnToHospital) note += "dump = NO → return to hospital";

  if (wasteType.sanitization === 0) note = "direct dump";

  noteDiv.textContent = note;
  noteDiv.style.display = "block";
}

function submitWasteData() {
  wasteEntries = [];
  const count = document.querySelectorAll(".waste-entry").length;

  for (let i = 0; i < count; i++) {
    const typeIdx = parseInt(document.getElementById(`wasteType${i}`).value);
    const quantity = parseFloat(document.getElementById(`quantity${i}`).value);

    if (isNaN(typeIdx) || isNaN(quantity) || quantity <= 0) {
      alert(`Please complete entry ${i + 1}`);
      return;
    }

    wasteEntries.push({
      type: wasteTypes[typeIdx],
      quantity: quantity,
      hospital: `Hospital ${(i % 4) + 1}`,
    });
  }

  const routeData = calculateRoutes();
  displayRoutes(routeData);
  sendToBackend(routeData);

  // safer navigation trigger
  const trackerTab = document.querySelector('.nav-link[href="#tracker"]');
  if (trackerTab) trackerTab.click();
}

// Route calculation
function calculateRoutes() {
  const TRUCK_CAPACITY = 500;
  const trucks = [];
  let truckId = 1;

  wasteEntries.forEach((entry) => {
    let remainingQty = entry.quantity;

    while (remainingQty > 0) {
      const loadQty = Math.min(remainingQty, TRUCK_CAPACITY);

      const route = [{ point: entry.hospital, wait: 0 }];

      if (entry.type.sanitization > 0)
        route.push({
          point: "Sanitization Plant",
          wait: entry.type.sanitization,
        });

      if (entry.type.returnToHospital)
        route.push({ point: entry.hospital, wait: 0 });
      else if (entry.type.dump) route.push({ point: "Dump Yard", wait: 0 });

      route.push({ point: "Completed", wait: 0 });

      trucks.push({
        id: truckId++,
        wasteType: entry.type.name,
        quantity: loadQty,
        route: route,
      });

      remainingQty -= loadQty;
    }
  });

  return {
    activeTrucks: trucks.length,
    trucks: trucks,
  };
}

// Display routes
function displayRoutes(routeData) {
  const container = document.getElementById("routeDisplay");
  container.innerHTML = "";

  routeData.trucks.forEach((truck) => {
    const truckDiv = document.createElement("div");
    truckDiv.className = "route-node";

    const pathHTML = truck.route
      .map((step, i) => {
        const wait = step.wait > 0 ? ` (${step.wait}min)` : "";
        const arrow = i < truck.route.length - 1 ? "→" : "";
        return `<span class="route-step">${step.point}${wait}</span>
                    <span class="route-arrow">${arrow}</span>`;
      })
      .join("");

    truckDiv.innerHTML = `
            <h3>Truck ${truck.id}</h3>
            <div class="route-path">${pathHTML}</div>
        `;

    container.appendChild(truckDiv);
  });
}

const p = 2000;
function sendToBackend(routeData) {
  fetch(`http://localhost:${p}/receive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...routeData, timestamp: Date.now() }),
  })
    .then((r) => r.text())
    .then((msg) => (document.getElementById("serverOutput").textContent = msg))
    .catch((err) => {
      document.getElementById("serverOutput").textContent = "Error: " + err;
    });
}

function handleContactSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("contactName").value;
  alert(`Thank you, ${name}! Your message has been received.`);

  e.target.reset();
}
