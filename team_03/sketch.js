/*
Καββαθά Αγγελική-Παυλίνα| ar20433
Στάθη Αθηνά-Φιόνα| ar19605
Ντούκου Ευτυχία|ar18909
Μπουζιάνα Περσεφόνη | ar19954
*/
// μεταβλητές για τα μενού
let showMenu;
let Daily, Weekend;
// μεταβλητές για το preload
let stations, trips;
let info = "station_information.json";
let tripD = "Wednesday_5_June_2024.json";
let tripW = "Sunday_02_June_2024.json";

let rad = 4;//αρχική ακτίνα σταθμών

// μεταβλητές ορίων
let westernBoundary, easternBoundary, southernBoundary, northernBoundary;

//μεταβλητές χρώματος
let bgColor,stColor,conColor,darkConColor,trussColor,trailR,trailG,trailB;
let colorsAltered = false;

let repulsionEnabled;
let draggingEnabled = true;

//μεταβλητές για την αποθήκευση πληροφοριών
let connections = [];
let capacities = [];
let draggingStation = [];
let originalPos = [];

//Μεταβλητές για τη μετακίνηση σημείου με το mouse
let fwd_x = 0;
let fwd_y = 0;
let draggedStationX, draggedStationY;

//Μεταβλητές για την κυκλική τροχιά
let stationMoveInterval;
let stationsParams = [];

//Μεταβλητές για τη λειτουργία του δικτυώματος
let trussButtonPressed = false; 
let recordingTrussTrail = false; //δεν γίνεται καταγραφή του δικτυώματος
let trussHistory = [];
let HistorySize = 7; //μέγιστη μνήμη για το trail του δικτυώματος

//Ορισμός των button
let circleStationsButton,drawTrussButton, moveStationsButton,dragStationsButton,reverseMovementButton;
//Ορισμός των slider
let timeSlider, speedSlider, trusslOpacitySlider;


// βήμα 1.4
function preload() {
  // Διαδρομές Τετάρτης
  if (Daily) {
    loadJSON(tripD, (tripData) => {
      trips = tripData;
      console.log("Daily trips:Wednesday:", trips);
      createConnections(); // δημιουργια συνδέσεων-διαδρομών
    });
    // Διαδρομές Κυριακής
  }
  if (Weekend) {
    loadJSON(tripW, (tripData) => {
      trips = tripData;
      console.log("Weekend trips:Sunday:", trips);
      createConnections(); // δημιουργια συνδέσεων-διαδρομών
    });
  }
  // Στάσεις
  loadJSON(info, (data) => {
    stations = data.data.stations;
    calculateBoundaries(); // υπο κλίμακα τοποθέτηση σημείων
  });
}

function setup() {
  createCanvas(windowWidth - 200, windowHeight);
  createSliders();
  createButtons();
}

function draw() {
  setupColor();
  background(bgColor);
  // Συνθήκη για τη σειρά που εμφανίζονται τα μενού
  if (!showMenu) {
    // Εμφάνιση αρχικής σελίδας
    startingPage();
  } else if (showMenu && !Daily && !Weekend) {
    // Εμφάνιση μενου επιλόγης
    menuPage();
  } else {
    if (Daily && Weekend) {
      // Εμφάνιση του έργου σύμφωνα με τη μερα ως τελικό στάδιο
      return;
    }
    drawConnections();
    drawStations();
    RepulsionForces();
  }
  let trussDensity = trussDensitySlider.value();
  // Συνθήκη για να λειτουργεί το κουμπι "draw truss"
  if (trussButtonPressed) {
    drawTruss();
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
  capacities = [];
  //Χωρητικότητα βημα 2.2
  for (let i = 0; i < stations.length; i++) {
    capacities.push(stations[i].capacity);
  }
  // ελάχιστη και μέγιστη χωρητικότητα
  let minCapacity = min(capacities);
  let maxCapacity = max(capacities);

  // Προσβαση στη πληροφορία κάθε στάσης
  for (let i = 0; i < stations.length; i++) {
    let station = stations[i];//κάθε στάση
    let x, y;
    //Δημιουργία ιδιότητας
    if (station.screenX && station.screenY) {
      x = station.screenX;
      y = station.screenY;
    }
    //Υπολογισμός του x,y ωστε η τιμή του να μετατρέπεται και να αποθηκεύεται
    else {
      //-20 κατα y ωστε να έχει περιθώριο η αναγραφή του ονόματος
      x = map(station.lon, westernBoundary, easternBoundary, 20, width - 20);
      y = map(station.lat, southernBoundary, northernBoundary, height - 20, 20);
      originalPos[i] = { x: x, y: y };//αποθήκευση αρχικών θέσεων για το reset
    }
    //Ορισμός της ιδιότητας ώστε να επαναχρησιμοποιείται
    station.screenX = x;
    station.screenY = y;
    
    // αναλογία διάμετρου με την χωρητικότητα
    let stationR = map(
      station.capacity,
      minCapacity,
      maxCapacity,
      rad / 2,
      rad * 2.5
    );
    // customization στάσεων

    fill(stColor);
    noStroke();
    circle(x, y, stationR);

    // προβολή του ονόματος  βημα 2.2

    let d = dist(x, y, mouseX, mouseY);
    if (d <= stationR) {
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
    connections.push([
      startStation,
      endStation,
      trip.started_at,
      trip.ended_at,
    ]);
  }
}
//βήμα 3.2 και βημα 5.1
function drawConnections() {
  let selectedTime = timeSlider.value(); // επιλογή ώρας απο το slider

  // πρόσβαση στο array που δημιουργησαμε στο createConnections
  for (let i = 0; i < connections.length; i++) {
    let c = connections[i];
    // id σύμφωνα με τις στάσεις
    let startStation = c[0];
    let endStation = c[1];

    // πληροφορίες για την ώρα στη θεση 3 και 4 του array που αποθηκεύσαμε τις διαδρομές
    let startedAt = new Date(c[2]);
    let endedAt = new Date(c[3]);

    // Υπολογισμός της ώρας. Σε αυτό το στάδιο συμβουλευτήκαμε το chatgpt ώστε να μάθουμε πως μπορούμε να εισάγουμε την έννοια της ώρας.

    // Διαλέγουμε την προτεινόμενη μέθοδο όπου η ώρα υπολογίζεται σε δεκαδικές ώρες
    // /60: μετατροπή λεπτών σε δεκαδική ώρα
    let startHour = startedAt.getUTCHours() + startedAt.getUTCMinutes() / 60;
    let endHour = endedAt.getUTCHours() + endedAt.getUTCMinutes() / 60;
    // χρώμα των συνολικών διαδρομών
    let currentCol = color(conColor);

    // Εμφανιση των πίο πρόσφατων διαδρομών με πιο έντονο χρώμα σύμφωνα με την επιλογή ώρας
    if (selectedTime >= startHour && selectedTime <= endHour) {
      currentCol = darkConColor; // υπογραμμίζουμε με πιο σκούρο χρώμα τις τρέχουσες διαδρομές ανά ώρα 
    }

    stroke(currentCol);
    strokeWeight(0.6);
    // Για την επίλυση κάποιων error που εμφανίζοντας χωρίς να επηρεάζεται το έργο ανατρέξαμε στο chatgpt
    //προσθηκη με τροποποίηση για την επίλυση error που εμφανίζονταν
    if (
      startStation.screenX !== undefined &&
      startStation.screenY !== undefined &&
      endStation.screenX !== undefined &&
      endStation.screenY !== undefined
    ) {
      // Τοποθέτηση στον καμβά σύμφωνα με την ιδιότητα screenX, screenY που ανανεώνει τη θέση των στάσεων
      let x1 = startStation.screenX;
      let y1 = startStation.screenY;
      let x2 = endStation.screenX;
      let y2 = endStation.screenY;

      line(x1, y1, x2, y2);
    }
  }
}
//βήμα 6.1
function mousePressed() {
  interactwithMenu();

  if (drawTrussButton.elt.contains(event.target)) {
    trussButtonPressed = !trussButtonPressed;
  }
  if (!repulsionEnabled) {
    return;
  }

  for (let i=0; i<stations.length; i++) {
    let station = stations[i];
    let x = station.screenX;
    let y = station.screenY;

    let d = dist(x, y, mouseX, mouseY);
    
    if (d <= 4) {
      draggingStation.push(station); // Αποθήκευση της ανανεωμένης θέσης των σταθμών
      x = fwd_x + mouseX;
      y = fwd_y + mouseY;
      break;
    }
  }
}

//βήμα 4.1
function mouseDragged() {
  if (!repulsionEnabled) {
    //Αν δεν υπάρχουν απωθητικές δυνάμεις τότε δεν ισχύει το dragging (αν αναγράφεται enable στο κουμπι)
    return;
  }

  if (draggingStation.length > 0) {
    // Αν το array δεν ειναι άδειο
    let station = draggingStation[0];
    // ανανέωση της θέσης κατα το dragging
    station.screenX = mouseX + fwd_x;
    station.screenY = mouseY + fwd_y;

    //Εφαρμογή ελκτικών δυνάμεων
    RepulsionForces();
  }
}
function interactDragging() {
  repulsionEnabled = !repulsionEnabled; // Σταματάει να ισχύει το dragging
  // Ενημέρωση κειμένου στο button
  if (repulsionEnabled) {
    dragStationsButton.elt.textContent = "Disable Dragging";
  } else {
    dragStationsButton.elt.textContent = "Enable Dragging";
  }
}
function mouseReleased() {
  if (!repulsionEnabled) {
    // Σταματάει να ισχύει το dragging
    return;
  }

  draggingStation = [];
}

//βήμα 4.1
function moveStations() {
  /*Η εντολή αυτή καλεί δύο άλλες εντολές υπεύθυνες για την κυκλική κίνηση των σταθμών, μια που υπολογίζει τις παραμέτρους, και μια που τις χρησιμοποιεί για να μεταβάλει την θέση τους ανά συγκεκριμένο χρονικό διάστημα*/

  //σταματάμε την απώθηση διότι εμποδίζει την σωστή κίνηση των σταθμών
  repulsionEnabled = false;
  const intervalTime = 80; 
/*σε milliseconds,χρονικό διάστημα ανα το οποίο ανανεώνεται η θέση των σταθμών κατά την κίνηση τους, όσο πιο μικρό τόσο πιο γρήγορα ανανεώνεται η θέση των κινούμενων σταθμών στην τροχιά τους*/

  /*καθαρίζει τα προηγούμενα intervals ώστε να μην αποθηκευτούν προηγούμενες παράμετροι κίνησης κάθε φορά που πατιέται, αν αφαιρεθεί αυτό το τμήμα κάθε φορά που πατιέται το κουμπί αυξάνεται όλο και πιο πολύ η ταχύτητα*/
  clearInterval(stationMoveInterval);

  /*βρίσκει νέες παραμέτρους κυκλικής κίνησης κάθε φορά που εκτελείται η εντολή, δηλαδή κάθε φορά που πατιέται το κουμπί, κάθε σταθμός ξεκινάει να κινείται σε νέα κυκλικλη πορεία*/
  circularMotionParams();

  /*δημιουργία interval, εντολή που εκτελεί ανανέωση της θέσης των σταθμών ανά συγκεκριμένο χρονικό διάστημα*/
  stationMoveInterval = setInterval(updateCircularMotion, intervalTime);

  reverseMovementButton.show(); // εμφανίζουμε το κουμπί της αντιστροφής
  
 
}
function circularMotionParams() {
  //βρίσκει τις παραμέτρους της κυκλικής πορείας

  let angVelMin = 0.05; //ελάχιστη γωνιακή ταχύτητα
  let angVelMax = 0.1; //μέγιστη γωνιακή ταχύτητα

  for (let i = 0; i < stations.length; i++) {
    let station = stations[i];
    //βρόγχος που ανατρέχει το array των σταθμών και βρίσκει τις συντεταμένες τους
    let initialX = station.screenX;
    let initialY = station.screenY;

    //υπολογίζουμε την μέγιστη δυνατή ακτίνα κίνησης ώστε οι σταθμοί να μην κινηθούν εκτός καμβά
    let height1 = initialY;
    let height2 = height - initialY
    let width1 = initialX;
    let width2 = width - initialX;
    let minHeight = min(height1, height2);
    let minWidth = min(width1,width2);
    let radiusMin = 50; //ελάχιστη ακτίνα
    let radiusMax = min(minHeight,minWidth)/2;

    //τυχαία γωνία κίνησης
    let randomAngle = random(TWO_PI);
    //τυχαία ακτίνα
    let radius = random(radiusMin, radiusMax);

    //το κέντρο του κύκλου, υπολογίζεται σύμφωνα με τη θέση του σταθμού, την τυχαία ακτίνα και γωνία
    let centerX = initialX + radius * cos(randomAngle);
    let centerY = initialY + radius * sin(randomAngle);

    // τυχαία ταχύτητα και κατεύθυνση,δεξιόστροφα ή αριστερόστροφα

    let direction;
    let d = random(1);
    if (d < 0.5) {direction = -1;} 
    else {direction = 1;}
    
    let angularVelocity =
      random(angVelMin, angVelMax) *
      direction;

    //αρχική γωνία για την έναρξη της κίνησης
    let initialAngle = atan2(initialY - centerY, initialX - centerX);

    /*αποθήκευση παραμέτρων σε ένα array που θα χρησιμοποιηθεί από την εντολή που ανανεώνει τις συντεταγμένες των σταθμών*/
    stationsParams[i] = [centerX,centerY,radius,angularVelocity,initialAngle,];
  }
}
function updateCircularMotion() {
  //εντολή που ανανεώνει την θέση των σταθμών όταν κινούνται κυκλικά

  for (let i = 0; i < stations.length; i++) {
    /*βρογχος που τρέχει το array των σταθμών και των παραμέτρων κυκλικής κίνησης και βρίσκει όλες τις παραμέτρους, κέντρο κύκλου, ακτίνα, ταχύτητα, αρχική γωνία */
    let station = stations[i];
    let p = stationsParams[i];

    //παράμετροι κυκλικής κίνησης
    let centerX = p[0];
    let centerY = p[1];
    let radius = p[2];
    let angularVelocity = p[3];
    let angle = p[4];

    //υπολογισμός νέων θέσεων χρησιμοποιώντας το ημίτονο  και συνημίτονο της αρχικής γωνίας κίνησης
    let newX = centerX + radius * cos(angle);
    let newY = centerY + radius * sin(angle);

    //αναθέτουμε τις νέες συντεταγμένες στην ιδιότητα που ελέγχει τη θέση των σταθμών
    station.screenX = newX;
    station.screenY = newY;

    /*κάθε φορά που τρέχει η εντολή προσθέτουμε την γωνιακή ταχύτητα στην γωνία, δηλαδή το ρυθμό με τον οποίο διαγράφεται το τόξο*/
    p[4] += angularVelocity;
  }
}
function reverseMovement() {
  for (let i = 0; i < stationsParams.length; i++) {
    // αντιστροφή προσήμου γωνιακής ταχύτητας
    stationsParams[i][3] *= -1;
  }
}
function circleStations() {
  //reset της θέσης των σταθμών σε περίπτωση που έχουν τεθεί σε κίνηση από το move stations
  resetStations();
  // o αριθμός των στάσεων
  let totalStations = stations.length;
  // τοποθετηση κύκλου στο κέντρο
  let centerX = width / 2;
  let centerY = height / 2;
  // υπολογισμός της ακτίνας σύμφωνα με την οθόνη
  let radius;
  if (width < height) {
    radius = width * 0.45;
  } else {
    radius = height * 0.45;
  }
  // τοποθέτηση των στάσεων κατα μια περιστροφη
  let angleStat = TWO_PI / totalStations;

  for (let i = 0; i < totalStations; i++) {
    let angle = i * angleStat;
    // θέσεις x,y για κάθε στάση
    let x = centerX + cos(angle) * radius;
    let y = centerY + sin(angle) * radius;
    // ανανέωση της θέσης των στάσεων
    stations[i].screenX = x;
    stations[i].screenY = y;
  }
}

//βήμα 4.2
function drawTruss() {
  let currentTruss = [];

  // εξωτερικό for loop που τρέχει για κάθε στάση
  for (let i = 0; i < stations.length; i++) {
    // εσωτερικό loop που τρέχει για όλα τα υπόλοιπα index του array μετά από αυτό στο οποίο βρίσκεται το iteration, δηλαδή j = i + 1
    for (let j = i + 1; j < stations.length; j++) {
      let stationA = stations[i];
      let stationB = stations[j];
      let d = dist(stationA.screenX,stationA.screenY,
                   stationB.screenX,stationB.screenY);

      // Οταν η απόσταση ανάμεσα στα σημεία ειναι μικρότερη απο την τιμή του slider
      if (d <= trussDensitySlider.value()) {
        // Αποθήκευση των συντεταγμένων των σταθμών σε σχέση με την οθόνη
        currentTruss.push([
          stationA.screenX,
          stationA.screenY,
          stationB.screenX,
          stationB.screenY,
        ]);
      }
    }
  }
  // Προσθήκη του τρέχοντος δικτυώματος στην αρχή του array για το ιστορικό
  trussHistory.unshift(currentTruss);

  // Αν το μήκος του array ξεπερνά τη μέγιστη "μνήμη"
  if (trussHistory.length > HistorySize) {
    trussHistory.pop(); //Αφαίρεση του τελευταίου index από το array του ιστορικού
  }

  //Σχεδιασμός του τρέχοντος δικτυώματος, το πρώτο index του array του ιστορικού
  if (trussHistory.length > 0) {  
    for (let i = 0; i < currentTruss.length; i++) {
      let Ax = currentTruss[i][0];
      let Ay = currentTruss[i][1];
      let Bx = currentTruss[i][2];
      let By = currentTruss[i][3];
      strokeWeight(1);
      stroke(trussColor);
      //σχεδιάζουμε γραμμές που ενώνουν τα σημεία Α με τα σημεία Β
      line(Ax, Ay, Bx, By);
    }
  }
  
  //Mapping για σταδιακό fade του trail
  let trussOpacity = trussOpacitySlider.value();
  for (let i = 1; i < trussHistory.length; i++) {
    //Όσο πιο παλιό το δικτύωμα στο ιστορικό, τόσο πιο διάφανο
    //Το μέγιστο opacity ελέγχεται από ένα slider
    let opacity = map(i, 1, trussHistory.length - 1, trussOpacity, 1);

    
    //σχεδιασμός του trail
    for (let j = 0; j < trussHistory[i].length; j++) {
      stroke(trailR, trailG, trailB, opacity);
      //κάνουμε πιο παχιά τη γραμμή του
      strokeWeight(3);
      let Ax = trussHistory[i][j][0];
      let Ay = trussHistory[i][j][1];
      let Bx = trussHistory[i][j][2];
      let By = trussHistory[i][j][3];
      line(Ax, Ay, Bx, By);
    }
  }
}

//βήμα 4.3
function RepulsionForces() {
  let minDistance = 13; // ελάχιστη απόσταση που ασκείται η δύναμη
  let F = 50; // μέγιστη τιμή της δύναμης
  let N = 0.2; // εξασθένηση της δύναμης για πιο ομαλό αποτέλεσμα

  if (!repulsionEnabled) {
    return; // Αν στο κουμπί αναγράφεται enable δεν ισχύει το dragging
  }

  for (let i = 0; i < stations.length; i++) {
    let stationA = stations[i];

    //Για να μην ασκούνται δυνάμεις στο σημείο που σέρνουμε
    if (draggingStation.length > 0 && stationA == draggingStation[0]) {
      continue;
    }
    //Για κάθε στάση
    for (let j = 0; j < stations.length; j++) {
      if (i !== j) {
        let stationB = stations[j];
        //Για να υπολογίσουμε την κατεύθυνση της δύναμης
        let dx = stationA.screenX - stationB.screenX;
        let dy = stationA.screenY - stationB.screenY;
        let d = dist(
          stationA.screenX,
          stationA.screenY,
          stationB.screenX,
          stationB.screenY
        );

        if (d < minDistance) {
          // Κατεύθυνση της δύναμης
          let forceDirectionX = dx / d;
          let forceDirectionY = dy / d;

          // Υπολογισμός τιμής της απωθητικής δύναμης
          let totalF = F * (1 - d / minDistance);

          //// Εφαρμογή της δύναμης από τον σταθμό B στον σταθμό A
          stationA.screenX = stationA.screenX + totalF * forceDirectionX * N;
          stationA.screenY = stationA.screenY + totalF * forceDirectionY * N;
        }
      }
    }
  }
}
function resetStations() {
   repulsionEnabled = false;//σταματάει τις απωθητικές δυνάμεις
  
  //σταματάει την εκτέλεση της εντολής interval που είναι υπεύθυνη για την κίνηση
  if (stationMoveInterval) {
    clearInterval(stationMoveInterval);
  }

  // ξαναεπιστρέφει τους σταθμούς στις αρχικές τους θέσεις
  for (let i = 0; i < stations.length; i++) {
    let station = stations[i];
    let original = originalPos[i];//οι αρχικές θέσεις των σταθμών
    
    station.screenX = original.x;
    station.screenY = original.y;
  }
  recordingTrussTrail = false;
  //repulsionEnabled = true;
  reverseMovementButton.hide(); //κρύβουμε το κουμπί της αντιστροφής
}

//βημα 6.1 και 6.2
function createSliders() {
  //slider χρόνου
  timeSlider = createSlider(0, 24, 12)
    .position(width + 25, 10)
    .size(150);
  //πυκνότητα δικτυώματος
  trussDensitySlider = createSlider(0, 100, 50)
    .position(width + 25, height - 150)
    .size(150);
  //διαφάνεια του trail
  trussOpacitySlider = createSlider(0, 10, 0)
    .position(width + 25, height - 125)
    .size(150);
}

function createButtons() {
  // κυκλική τροχία
  moveStationsButton = createButton("Move Stations");
  moveStationsButton.size(150, 25).position(width + 25, height - 450);
  moveStationsButton.mousePressed(moveStations);

  //αντιστροφή της κίνησης
  reverseMovementButton = createButton("Reverse Movement");
  reverseMovementButton.size(150, 25);
  reverseMovementButton.position(width + 25, height - 410);
  reverseMovementButton.mousePressed(reverseMovement);
  reverseMovementButton.hide(); //αρχικά δεν εμφανίζουμε το κουμπί

  // reset
  resetStationsButton = createButton("Reset");
  resetStationsButton.size(150, 25).position(width + 25, height - 370);
  resetStationsButton.mousePressed(resetStations);

  // για την ενεργοποιήση της διαδραστικής μεταβολής των σημείων
  dragStationsButton = createButton("Enable Dragging");
  dragStationsButton.size(150, 25).position(width + 25, height - 330);
  dragStationsButton.mousePressed(interactDragging);

  // σχεδιασμός δικτυώματος
  drawTrussButton = createButton("Draw Truss");
  drawTrussButton.size(150, 25).position(width + 25, height - 180);
  drawTrussButton.mousePressed(drawTruss);

  // τοποθέτηση σημείων σε κύκλο
  circleStationsButton = createButton("Stations in circle");
  circleStationsButton.size(150, 25).position(width + 25, height - 290);
  circleStationsButton.mousePressed(circleStations);

  //αντιστροφή χρώματος
  reverseColorButton = createButton("Reverse Color");
  reverseColorButton.size(150, 25).position(width + 25, height - 50);
  reverseColorButton.mousePressed(reverseColor);
}

function interactwithMenu() {
  if (!showMenu) {
    // Απο το αρχικό μενού στο μενού επιλογής
    showMenu = true;
  } else if (showMenu && !Daily && !Weekend) {
    // μενου επλογής, κουμπια
    let dailyButtonX = (10 * width) / 30;
    let weekendButtonX = (20 * width) / 30;
    let buttonY = (16 * height) / 30;
    let buttonWidth = 100;
    let buttonHeight = 40;

    // έλεγχει αν το ποντίκι είναι πανω στο κουμπι "daily"
    if (
      mouseX > dailyButtonX - buttonWidth / 2 &&
      mouseX < dailyButtonX + buttonWidth / 2 &&
      mouseY > buttonY - buttonHeight / 2 &&
      mouseY < buttonY + buttonHeight / 2
    ) {
      // Αν επιλεχθεί τοτε εμφανίζει την "οθόνη" για τη καθημερινή μερα
      Daily = true;
      Weekend = false; // ώστε να μην εμφανίζεται του ΣΚ
      preload(); // φόρτωση δεδομένων της ημέρας Τετάρτης
    }

    // έλεγχει αν το ποντίκι είναι πανω στο κουμπι "weekend"
    if (
      mouseX > weekendButtonX - buttonWidth / 2 &&
      mouseX < weekendButtonX + buttonWidth / 2 &&
      mouseY > buttonY - buttonHeight / 2 &&
      mouseY < buttonY + buttonHeight / 2
    ) {
      // Αν επιλεχθεί τοτε εμφανίζει την "οθόνη" για τη μερα του ΣΚ
      Weekend = true;
      Daily = false; // ώστε να μην εμφανίζεται η καθημερινή
      preload(); // φόρτωση δεδομένων της Κυριακής
    }
  }
}
function startingPage() {
  // τίτλος Oslo Bicycle Networ
  fill(0, 0, 255);
  noStroke();
  textAlign(CENTER);
  textFont("Bauhaus 93", 60);
  text("Oslo Bicycle Network", width / 2, (14 * height) / 30);
  // κείμενο (tap to continue)
  fill(135);
  noStroke();
  textAlign(CENTER);
  textFont("courier new", 15);
  text("(tap to continue)", width / 2, (16 * height) / 30);
}
function menuPage() {
  background(255);
  // κείμενο choose
  fill(135);
  noStroke();
  textAlign(CENTER);
  textFont("courier new", 20);
  text("choose", width / 2, (10 * height) / 30);
  // θέσεις κουμπιών
  let dailyX = (10 * width) / 30;
  let weekendX = (20 * width) / 30;
  let buttonY = (16 * height) / 30;
  let buttonWidth = 100;
  let buttonHeight = 40;

  // Αν επιλεχθεί τοτε εμφανίζει την "οθόνη" για τη καθημερινή μερα
  if (
    mouseX > dailyX - buttonWidth / 4 &&
    mouseX < dailyX + buttonWidth / 4 &&
    mouseY > buttonY - buttonHeight / 4 &&
    mouseY < buttonY + buttonHeight / 4
  ) {
    fill(0, 0, 255);
  } else {
    fill(135);
  }
  //κειμενο "daily"
  noStroke();
  textAlign(CENTER);
  textFont("Bauhaus 93", 30);
  text("daily", dailyX, buttonY);

  // έλεγχει αν το ποντίκι είναι πανω στο κουμπι "weekend
  if (
    mouseX > weekendX - buttonWidth / 2 &&
    mouseX < weekendX + buttonWidth / 2 &&
    mouseY > buttonY - buttonHeight / 2 &&
    mouseY < buttonY + buttonHeight / 2
  ) {
    fill(0, 0, 255); //κάνει μπλέ το κουμπι
  } else {
    fill(135); //αλλιώς γκρι
  }
  //κείμενο "weekend"
  noStroke();
  textAlign(CENTER);
  textFont("Bauhaus 93", 30);
  text("weekend", weekendX, buttonY);
}

function keyPressed() {
  if (key === "s") {
    saveGif("mySketch", 5);
  }
}

function setupColor() {
  if (colorsAltered) {
    //αντίστροφα χρώματα
    bgColor = color(0, 0, 50, 200); //υπόβαθρο
    stColor = color(150, 150, 255); //σταθμοί
    conColor = color(80, 80, 255, 20); //συνδέσεις
    darkConColor = color(150, 150, 255, 150); 
    //υπογραμμισμένες διαδρομές
    trussColor = color(255, 50); //δικτύωμα
    trailR = 150;
    trailG = 150;
    trailB = 255;
    
  } else {
    //κανονικά χρώματα
    bgColor = color(255, 200);
    stColor = color(80);
    conColor = color(80, 15);
    darkConColor = color(60);
    trussColor = color(0, 0, 255, 60);
    trailR = 0;
    trailG = 0;
    trailB = 255;
  }
}
function reverseColor() {
  colorsAltered = !colorsAltered;
}


