let showMenu = false;
let Daily; 
let Weekend ; 
let connectionsLoaded = false;
let stations,trips;
let info = 'station_information.json';
let tripD = 'Wednesday_5_June_2024.json';
let tripW= 'Sunday_02_June_2024.json'
let westernBoundary, easternBoundary, southernBoundary, northernBoundary;
let offset = 20;
let repulsionEnabled = false;
let dragStationsButton;
const rad = 4;
let connections = [];
let draggingStation = [];
let dragOffset = { x: 0, y: 0 };
let timeSlider; 
let speedSlider;
let draggedStationX = [];
let draggedStationY = [];
let moveStationsButton;
let stationMoveInterval;
let drawTrussButton;
let trussVertices = [];
let trussButtonPressed = false;
let trussHistory = []
let trussDensitySlider; 
let trailOpacitySlider; 
let circleStationsButton; 
let recordingTrussTrail = false; 
let MAX_HISTORY_SIZE = 7;

// βήμα 1.4
function preload() {
// Διαδρομές Τετάρτης
if (Daily) {
    loadJSON(tripD, (tripData) => {
      trips = tripData;
      console.log("Daily trips:Wednesday:", trips);
      createConnections();// δημιουργια συνδέσεων-διαδρομών
    });
// Διαδρομές Κυριακής
  } if (Weekend) {
    loadJSON(tripW, (tripData) => {
      trips = tripData;
      console.log("Weekend trips:Sunday:", trips);
      createConnections();// δημιουργια συνδέσεων-διαδρομών
    });
  }
// Στάσεις
  loadJSON(info, (data) => {
    stations = data.data.stations;
    calculateBoundaries();// υπο κλίμακα τοποθέτηση σημείων 
  })
}

function setup() {
createCanvas(windowWidth - 200, windowHeight);
createSliders();
createButtons();
}

function draw() {
  background(255);
  // Check if starting page should be shown
  if (!showMenu) {
    startingPage();
  } else if (showMenu && !Daily && !Weekend) {
    menuPage();
  } else {
    // Check if neither starting page nor menu page is shown
    if (!Daily && !Weekend) {
      // Exit draw() if on starting page or menu page
      return;
    }
  let trussDensity = trussDensitySlider.value();
  // Check if the truss button is pressed and draw the truss accordingly
  if (trussButtonPressed) {
    drawTrussTrail();
    
  }
  drawConnections();
  drawStations();
  applyRepulsionForces();

}
}
//βήμα 2.1
function calculateBoundaries() {
//array που αποθηκεύουν την κάθε συντεταγμένη lat,lot των στάσεων
  let lats = [];
  let lons = [];
// Πρόσβαση στις συντεταγμένες για κάθε στάση
   for (let i = 0; i < stations.length; i++) {
    let station = stations[i];
    lats.push(station.lat);
    lons.push(station.lon);
  } 
  //Επιλογή ελάχιστης και μέγιστης τιμής κατά x,y
  westernBoundary = min(lons);
  easternBoundary = max(lons);
  southernBoundary = min(lats);
  northernBoundary = max(lats);
}
function drawStations() {

//Εφαρμόζουμε παρόμοια λογική με το παραπάνω function
let capacities = [];
//Χωρητικότητα βημα 2.2
  for (let i = 0; i < stations.length; i++) {
    capacities.push(stations[i].capacity);
  }
// ελάχιστη και μέγιστη χωρητικότητα
  let minCapacity = min(capacities);
  let maxCapacity = max(capacities);
// Προσβαση στη πληροφορία κάθε στάσης
  for (let i = 0; i < stations.length; i++) {
    let station = stations[i];
    let x, y;
//Δημιουργία ιδιότητας
if (station.screenX && station.screenY) { 
  x = station.screenX;
  y = station.screenY;
} 
    //Υυπολογισμός του x,y ωστε η τιμή του να μετατρέπεται και να αποθηκεύεται
    else {
      //-20 κατα y ωστε να έχει περιθώριο η αναγραφή του ονόματος
  x = map(station.lon, westernBoundary, easternBoundary, 20, width - 20);
  y = map(station.lat, southernBoundary, northernBoundary, height - 20, 20);
}
    //Ορισμός της ιδιόητας ώστε να επαναχρησιμοποιείται
    station.screenX = x;
    station.screenY = y;

  // αναλογία διάμετρου με την χωρητικότητα
    let stationR = map(station.capacity, minCapacity, maxCapacity, rad/2, rad * 2.5);
// customization στάσεων
    fill(80);
    noStroke();
    circle(x, y, stationR);
// προβολή του ονόματος  βημα 2.2
    let d = dist(x, y, mouseX, mouseY);
    if (d <= stationR ) { 
      fill(0, 0, 255);
      textFont("courier new", 10);
      textAlign(CENTER, CENTER);
      // απο τις ισιότητες των στάσεων
      text(station.name, x, y - 20);
    }
  }
}
//βήμα 3.1
function createConnections() {
// πρόσβαση στην κάθε διαδρομή
    for (let i = 0; i < trips.length; i++) {
      let trip = trips[i];
// Το id κάθε αρχικου και τελικού σταθμού που ορίζει διαδρομές
      let startStationId = trip.start_station_id;
      let endStationId = trip.end_station_id;

      let startStation = {};
      let endStation = {};
// πρόσβαση στον κάθε σταθμό
      for (let j = 0; j < stations.length; j++) {
//Το id κάθε στάσης
        let station = stations[j];
// τα id ωστε να συσχετίζονται τα δεδομένα των αρχέιων
        if (station.station_id == startStationId) {
          startStation = station;
        }
        if (station.station_id == endStationId) {
          endStation = station;
        }
      }
//array απο objects
        connections.push([startStation, endStation, trip.started_at, trip.ended_at]);
    }
}
//βήμα 3.2
function drawConnections() {
  let selectedTime = timeSlider.value();
// πρόσβαση στο array που δημιουργησαμε στο createConnections
  for (let i = 0; i < connections.length; i++) {
    let c = connections[i];
  // id σύμφωνα με τις στάσεις
    let startStation = c[0];
    let endStation = c[1];
 // πληροφορίες για την ώρα   
    let startedAt = new Date(c[2]);
    let endedAt = new Date(c[3]);

    let startHour = startedAt.getUTCHours() + startedAt.getUTCMinutes() / 60;
    let endHour = endedAt.getUTCHours() + endedAt.getUTCMinutes() / 60;
// χρώμα διαδρομών συβολικά
    let currentCol = color(80, 20); // Default color for non-matching connections

    // Check if the connection was active during the selected time
    if (selectedTime >= startHour && selectedTime <= endHour) {
      currentCol = 80; // Darker color for current connections
    }

    stroke(currentCol);
    strokeWeight(0.6);

    //προσθηκη απο το chatgpt με τροποποίηση για την επίλυση error που εμφανίζονταν
    if (startStation.screenX !== undefined && startStation.screenY !== undefined &&
        endStation.screenX !== undefined && endStation.screenY !== undefined) {
  // Τοποθέτηση στον καμβά σύμφωνα με την ιδιότητα κατα x,y
      let x1 = startStation.screenX;
      let y1 = startStation.screenY;
      let x2 = endStation.screenX;
      let y2 = endStation.screenY;

      line(x1, y1, x2, y2);
    }
  }
}

function mousePressed() {
  
  interactwithMenu()
  
   if (drawTrussButton.elt.contains(event.target)) {
    // Toggle trussButtonPressed only when the "Draw Truss" button is clicked
    trussButtonPressed = !trussButtonPressed;
  }
  if (!repulsionEnabled) {
    // Skip dragging if repulsion forces are disabled
    return;
  }

  for (let station of stations) {
    let x = station.screenX;
    let y = station.screenY;

    let d = dist(x, y, mouseX, mouseY);
    let minCapacity = Math.min(...stations.map(station => station.capacity));
    let maxCapacity = Math.max(...stations.map(station => station.capacity));
    let capacityRatio = (station.capacity - minCapacity) / (maxCapacity - minCapacity);
    let stationRadius = rad + capacityRatio * (rad * 2);

    if (d <= stationRadius / 2) {
      draggingStation = [station]; // Store the dragging station in an array
      dragOffset.x = x - mouseX;
      dragOffset.y = y - mouseY;
      break;
    }
  }
}

function mouseDragged() {
  if (!repulsionEnabled) {
    // Skip dragging if repulsion forces are disabled
    return;
  }

  if (draggingStation.length > 0) { // Check if draggingStation array is not empty
    let station = draggingStation[0]; // Get the station being dragged
    // Update the position of the dragging station
    station.screenX = mouseX + dragOffset.x;
    station.screenY = mouseY + dragOffset.y;

    // Apply repulsion force from other stations to nearby stations
    applyRepulsionForces();
  }
}

function mouseReleased() {
  if (!repulsionEnabled) {
    // Skip dragging if repulsion forces are disabled
    return;
  }

  draggingStation = [];
}

function applyRepulsionForces() {
  const MIN_DISTANCE_MULTIPLIER = 4;
  const MAX_FORCE = 50;
  const DAMPING = 0.1;
  
  if (!repulsionEnabled) {
    return; // Skip applying repulsion forces if disabled
  }

  for (let i = 0; i < stations.length; i++) {
    let stationA = stations[i];
    
    // Skip applying forces to the dragging station
    if (draggingStation.length > 0 && stationA === draggingStation[0]) {
      continue;
    }
    
    for (let j = 0; j < stations.length; j++) {
      if (i !== j) {
        let stationB = stations[j];
        let dx = stationA.screenX - stationB.screenX;
        let dy = stationA.screenY - stationB.screenY;
        let distance = dist(stationA.screenX, stationA.screenY, stationB.screenX, stationB.screenY);
        let minDistance = rad * MIN_DISTANCE_MULTIPLIER; // Minimum distance at which repulsion starts

        if (distance < minDistance) {
          // Calculate repulsion force direction
          let forceDirectionX = dx / distance;
          let forceDirectionY = dy / distance;

          // Calculate repulsion force magnitude
          let forceMagnitude = MAX_FORCE * (1 - distance / minDistance);

          // Apply force in the direction away from stationB to stationA
          stationA.screenX += forceMagnitude * forceDirectionX * DAMPING;
          stationA.screenY += forceMagnitude * forceDirectionY * DAMPING;
        }
      }
    }
  }
}

function moveStations() {
  const radiusMin = 50; // Minimum radius of the circular path
  const angularVelocityMin = 0.05; // Minimum angular velocity (radians per frame)
  const angularVelocityMax = 0.01; // Maximum angular velocity (radians per frame)
  const intervalTime = 100; // Interval time for updating station positions

  // Toggle the direction for each station
  for (let station of stations) {
    if (station.circularMotionParams) {
      station.circularMotionParams.angularVelocity *= -1; // Reverse the direction
    } else {
      // Initialize circular motion parameters if not already initialized
      const initialX = station.screenX;
      const initialY = station.screenY;

      // Calculate maximum radius based on the distance to the edges of the canvas
      const maxRadiusX = min(initialX, initialX - 40);
      const maxRadiusY = min(initialY, height - initialY);
      const radiusMax = min(maxRadiusX, maxRadiusY, (height - initialY) / 2);

      // Generate a random angle for the center of the circle
      const randomAngle = random(TWO_PI);
      const randomRadius = random(radiusMin, radiusMax);

      // Calculate the center coordinates of the circle based on the initial position
      const centerX = initialX + randomRadius * cos(randomAngle);
      const centerY = initialY + randomRadius * sin(randomAngle);

      // Calculate the radius from the station to the center of the circle
      const radius = dist(initialX, initialY, centerX, centerY);

      // Generate random angular velocity with a random sign for clockwise or counterclockwise
      const angularVelocity = random(angularVelocityMin, angularVelocityMax) * random([-1, 1]);

      // Calculate initial angle based on the initial position of the station and the center of the circle
      const initialAngle = atan2(initialY - centerY, initialX - centerX);

      station.circularMotionParams = {
        centerX,
        centerY,
        radius,
        angularVelocity,
        angle: initialAngle
      };
    }
  }

  // Clear previous intervals
  if (stationMoveInterval) {
    clearInterval(stationMoveInterval);
  }

  // Loop continuously to move stations
  stationMoveInterval = setInterval(() => {
    for (let station of stations) {
      // Get circular motion parameters for the current station
      const { centerX, centerY, radius, angularVelocity, angle } = station.circularMotionParams;

      // Calculate new position based on circular motion equations
      const x = centerX + radius * cos(angle);
      const y = centerY + radius * sin(angle);

      // Ensure stations stay within the canvas bounds
      station.screenX = constrain(x, 0, width);
      station.screenY = constrain(y, 0, height);

      // Update angle for circular motion
      station.circularMotionParams.angle += angularVelocity;
    }

    // If truss button is pressed, draw the truss trail
    if (trussButtonPressed) {
      drawTrussTrail();
    }

  }, intervalTime); // Adjust the interval for smoother or faster movement
}

function resetStations() {
  // Stop the moving interval
  if (stationMoveInterval) {
    clearInterval(stationMoveInterval);
  }

  // Reset each station to its original position
  for (let station of stations) {
    station.screenX = station.originalX;
    station.screenY = station.originalY;
  }
 recordingTrussTrail = false;
  // Re-enable repulsion forces if necessary
  repulsionEnabled = true;
}

function drawTrussTrail() {
  // Create an array to store the vertices of the current truss
  let currentTruss = [];

  // Loop through stations to find nearby stations
  for (let i = 0; i < stations.length; i++) {
    for (let j = i + 1; j < stations.length; j++) {
      let stationA = stations[i];
      let stationB = stations[j];
      let distance = dist(stationA.screenX, stationA.screenY, stationB.screenX, stationB.screenY);

      // Check if stations are nearby
      if (distance <= trussDensitySlider.value()) {
        // Store station coordinates as vertices of the truss
        currentTruss.push([stationA.screenX, stationA.screenY, stationB.screenX, stationB.screenY]);
      }
    }
  }

  // Add the current truss to the beginning of the history
  trussHistory.unshift(currentTruss);

  // Limit the size of the truss history
  if (trussHistory.length > MAX_HISTORY_SIZE) {
    trussHistory.pop(); // Remove the oldest truss from the history
  }

  // Draw the current truss
  if (trussHistory.length > 0) {
    for (let vertices of trussHistory[0]) {
      strokeWeight(1);
      stroke(0, 0, 255, 60);
      line(vertices[0], vertices[1], vertices[2], vertices[3]);
    }
  }

  let trailOpacity = trailOpacitySlider.value();
  // Draw the truss trail
  // Start from index 1 to skip current truss
  for (let i = 1; i < trussHistory.length; i++) {
    // Calculate opacity based on index
    let opacity = map(i, 1, trussHistory.length - 1, trailOpacity, 1); 
    

    for (let vertices of trussHistory[i]) {
      stroke(0, 0, 255, opacity);
      strokeWeight(3);
      line(vertices[0], vertices[1], vertices[2], vertices[3]);
    }
  }
}

function circleStations() {
  // o αριθμός των στάσεων
  let totalStations = stations.length;
  // τοποθετηση κύκλου στο κέντρο
  let centerX = width / 2;
  let centerY = height / 2;
  // υπολογισμός της ακτίνας σύμφωνα με την οθόνη
  let radius 
  if (width < height) {
  radius = width* 0.45;
} else {
  radius = height* 0.45;
}

  let angleStat = TWO_PI/totalStations;

  for (let i = 0; i < totalStations; i++) {
    let angle = i * angleStat;
    let x = centerX + cos(angle) * radius;
    let y = centerY + sin(angle) * radius;
// ανανέωση της θέσης τ
    stations[i].screenX = x;
    stations[i].screenY = y;
  }
  
  
}

function createSliders(){
//slider χρόνου
  timeSlider = createSlider(0, 24, 12).position(width + 25, 10).size(150)
  trussDensitySlider = createSlider(0, 100, 50).position(width + 25, height - 100).size(150);
  trailOpacitySlider = createSlider(0, 10, 0).position(width + 25, 300).size(150);
} 
function createButtons(){ 
  // Create move stations button
  moveStationsButton = createButton('Move Stations');
  moveStationsButton.size(150, 25).position(width + 25, 70)
  moveStationsButton.mousePressed(moveStations);

  // Create reset stations button
  resetStationsButton = createButton('Reset Stations');
  resetStationsButton.size(150, 25).position(width + 25, 150);
  resetStationsButton.mousePressed(resetStations);

  // Create drag stations button
  dragStationsButton = createButton('Enable Dragging');
  dragStationsButton.size(150, 25).position(width + 25, 200);
  dragStationsButton.mousePressed(toggleDragging);

  // Create draw truss button
  drawTrussButton = createButton('Draw Truss');
  drawTrussButton.size(150, 25).position(width + 25, height - 150);
  drawTrussButton.mousePressed(drawTrussTrail);
  
  // Create circle stations button
  circleStationsButton = createButton('Stations in circle');
  circleStationsButton.size(150, 25).position(width+25, 250);
  circleStationsButton.mousePressed(circleStations);
}
function toggleDragging() {
  repulsionEnabled = !repulsionEnabled; // Toggle the repulsionEnabled flag
  
  if (repulsionEnabled) {
    dragStationsButton.elt.textContent = 'Disable Dragging'; // Update button text
  } else {
    dragStationsButton.elt.textContent = 'Enable Dragging'; // Update button text
  }
}

function interactwithMenu(){
  if (!showMenu) {
    // Move from starting page to menu page
    showMenu = true;
  } else if (showMenu && !Daily && !Weekend) {
    // Only check button clicks on the menu page
    let dailyButtonX = (10 * width) / 30;
    let weekendButtonX = (20 * width) / 30;
    let buttonY = (16 * height) / 30;
    let buttonWidth = 100;
    let buttonHeight = 40;

    // Check if mouse click is on the daily button
    if (
      mouseX > dailyButtonX - buttonWidth / 2 &&
      mouseX < dailyButtonX + buttonWidth / 2 &&
      mouseY > buttonY - buttonHeight / 2 &&
      mouseY < buttonY + buttonHeight / 2
    ) {
      // Set showDailyStationsPage to true to switch to daily stations page
      Daily = true;
      Weekend= false; // Ensure weekend page is not shown
      preload(); // Reload data based on selection
    }

    // Check if mouse click is on the weekend button
    if (
      mouseX > weekendButtonX - buttonWidth / 2 &&
      mouseX < weekendButtonX + buttonWidth / 2 &&
      mouseY > buttonY - buttonHeight / 2 &&
      mouseY < buttonY + buttonHeight / 2
    ) {
      // Set showWeekendStationsPage to true to switch to weekend stations page
      Weekend = true;
      Daily = false; // Ensure daily page is not shown
      preload(); // Reload data based on selection
    }
  }
}
function startingPage() {
  fill(0, 0, 255); // Blue color
  noStroke();
  textAlign(CENTER);
  textFont('Bauhaus 93', 60);
  text("Oslo Bicycle Network", width / 2, (14 * height) / 30);
  
  fill(135); // Darker color
  noStroke();
  textAlign(CENTER);
  textFont('courier new', 15);
  text("(tap to continue)", width / 2, (16 * height) / 30);
}
function menuPage() {
  background(255);

  fill(135); 
  noStroke();
  textAlign(CENTER);
  textFont('courier new', 20);
  text("choose", width / 2, (10 * height) / 30);

  let dailyX = (10 * width) / 30;
  let weekendX = (20 * width) / 30;
  let buttonY = (16 * height) / 30;
  let buttonWidth = 100;
  let buttonHeight = 40;

  // Check if the mouse is over the daily button
  if (
    mouseX > dailyX - buttonWidth/4  &&
    mouseX < dailyX + buttonWidth/4 &&
    mouseY > buttonY - buttonHeight/4 &&
    mouseY < buttonY + buttonHeight/4
  ) {
    fill(0, 0, 255); // Blue color when hovered
  } else {
    fill(135); // Darker color
  }
  noStroke();
  textAlign(CENTER);
  textFont("Bauhaus 93", 30);
  text("daily", dailyX, buttonY);

  // Check if the mouse is over the weekend button
  if (
    mouseX > weekendX - buttonWidth / 2 &&
    mouseX < weekendX + buttonWidth / 2 &&
    mouseY > buttonY - buttonHeight / 2 &&
    mouseY < buttonY + buttonHeight / 2
  ) {
    fill(0, 0,255); // Blue color when hovered
  } else {
    fill(135); // Darker color
  }
  noStroke();
  textAlign(CENTER);
  textFont("Bauhaus 93", 30);
  text("weekend", weekendX, buttonY);
}
