// VARIABLES GLOBALS

let video;               // Captura de la càmera
let facemesh;            // Model FaceMesh de ml5
let prediccions = [];    // Prediccions de FaceMesh
let iniciat = false;     // Controla si la càmera i model ja estan inicialitzats
let particules = [];     // Partícules visuals
let bocaOberta = false;  // Estat de la boca detectada
let soRaspall;           // So quan es detecta la boca oberta

// Variables per la pluja
let pluja = [];
let imgCarbassa, imgCalavera;
let tipusPluja = null;   

// Variables de càrrega
let carregaAnimada = false; 
let intervalPunts;  

// Font
let fontHalloween;  // Tipografia

//Temps de la boca
let tempsBocaInici = 0;
let tempsBocaActual = 0; 

// Carreguem so, imatges i font
function preload() {
  soundFormats('mp3');
  soRaspall = loadSound('assets/brush.mp3');
  imgCarbassa = loadImage('assets/carbassas.png');
  imgCalavera = loadImage('assets/calaveres.png');
  fontHalloween = loadFont('assets/HalloweenFont.ttf');
}

// Setup
function setup() {
  let canvas = createCanvas(740, 580);
  canvas.parent('interficie');
  textFont(fontHalloween);

  // Botó d'inici
  let botoIniciar = select("#botoIniciar");
  if (botoIniciar) {
    botoIniciar.mousePressed(() => {
      iniciarCamera();
      iniciarAnimacioPunts();
    });
  } else {
    console.warn("No s'ha trobat el botó #botoIniciar al DOM.");
  }

  // Botons de la pluja
  let botoCarbasses = select("#botoCarbasses");
  let botoCalaveres = select("#botoCalaveres");
  let botoAturaPluja = select("#botoAturaPluja");

  if (botoCarbasses) botoCarbasses.mousePressed(() => { tipusPluja = "carabassa"; });
  if (botoCalaveres) botoCalaveres.mousePressed(() => { tipusPluja = "calavera"; });
  if (botoAturaPluja) botoAturaPluja.mousePressed(() => { tipusPluja = null; });
}

// Animació
function iniciarAnimacioPunts() {
  if (carregaAnimada) return;
  carregaAnimada = true;

  let punts = select("#puntsCarrega");
  let comptador = 0;

  intervalPunts = setInterval(() => {
    comptador = (comptador + 1) % 4;
    punts.html("• ".repeat(comptador));
  }, 500);
}

// Càmera i model
function iniciarCamera() {
  if (iniciat) return;

  select("#estat").html("Carregant càmera i model...");

  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  facemesh = ml5.facemesh(video, {}, modelPreparat);
  facemesh.on("predict", results => prediccions = results);
}

function modelPreparat() {
  console.log("Model FaceMesh carregat correctament");
  select("#estat").html("Model carregat! Obre la boca!");
  select("#ajuda").style("display", "block");

  clearInterval(intervalPunts);
  select("#pantallaCarrega").hide();
  select("#interficie").style("display", "block");

  iniciat = true;
}

// Draw
function draw() {
  background(0);
  if (!iniciat) return;

  // Mostrem vídeo mirall
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);

  if (bocaOberta) {
    fill(255, 120, 0, 50);
    noStroke();
    rect(0, 0, width, height);
  }
  pop();

  // Detecció de la boca
  if (prediccions.length > 0) {
    const punts = prediccions[0].scaledMesh;
    const llaviSuperior = punts[13];
    const llaviInferior = punts[14];

    const distBoca = dist(
      llaviSuperior[0], llaviSuperior[1],
      llaviInferior[0], llaviInferior[1]
    );

    let novaBocaOberta = distBoca > 25;

    // Control del temps de boca oberta
    if (novaBocaOberta && !bocaOberta) {
      tempsBocaInici = millis();
    } else if (novaBocaOberta && bocaOberta) {
      tempsBocaActual = millis() - tempsBocaInici;
    } else if (!novaBocaOberta && bocaOberta) {
      tempsBocaInici = 0;
      tempsBocaActual = 0;
    }

    bocaOberta = novaBocaOberta;

    // Intensitat segons el temps
    if (bocaOberta) {
      let intensitat = constrain(map(tempsBocaActual, 0, 4000, 3, 20), 3, 20);
      for (let i = 0; i < intensitat; i++) generarParticules();
      if (!soRaspall.isPlaying()) soRaspall.play();
    }

    actualitzarParticules();
  }

  // Gestió pluja
  if (tipusPluja) {
    if (random(1) < 0.1) {
      pluja.push(new ObjectePluja(random(width), -50, random(2, 6), tipusPluja));
    }

    for (let i = pluja.length - 1; i >= 0; i--) {
      pluja[i].moure();
      pluja[i].mostrar();
      if (pluja[i].y > height + 50) pluja.splice(i, 1);
    }
  }

  // Textos al Canvas
  noStroke();
  fill(255, 140, 0);
  textSize(48);
  textAlign(CENTER, CENTER);
  textFont(fontHalloween);
  text("Una sonrisa que da miedo!", width / 2, 40);

  // Text del temps de boca oberta
  if (bocaOberta) {
    let segons = (tempsBocaActual / 1000).toFixed(1);
    textSize(28);
    fill(255, 200, 100);
    text(`Temps de boca oberta: ${segons}s`, width / 2, 90);
  }
}

// Partícules
function generarParticules() {
  particules.push(new Particula(
    random(width / 2 - 50, width / 2 + 50),
    random(height / 2, height / 2 + 100)
  ));
}

function actualitzarParticules() {
  for (let i = particules.length - 1; i >= 0; i--) {
    particules[i].actualitzar();
    particules[i].mostrar();
    if (particules[i].acabat()) particules.splice(i, 1);
  }
}

class Particula {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-2, 2);
    this.vy = random(-3, -1);
    this.alpha = 255;
    this.color = random() > 0.5 ? color(255, 120, 0) : color(0, 255, 50);
  }

  actualitzar() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 4;
  }

  acabat() {
    return this.alpha < 0;
  }

  mostrar() {
    noStroke();
    let alphaOsc = this.alpha + random(-20, 20);
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], alphaOsc);
    ellipse(this.x, this.y, 12);
  }
}

// Pluja
class ObjectePluja {
  constructor(x, y, velocitat, tipus) {
    this.x = x;
    this.y = y;
    this.velocitat = velocitat;
    this.tipus = tipus;
    this.mida = random(40, 80);
  }

  moure() {
    this.y += this.velocitat;
    this.x += sin(frameCount * 0.05 + this.y * 0.02) * 1.5;
  }

  mostrar() {
    noStroke();
    if (this.tipus === "carabassa") {
      image(imgCarbassa, this.x, this.y, this.mida, this.mida);
    } else if (this.tipus === "calavera") {
      image(imgCalavera, this.x, this.y, this.mida, this.mida);
    }
  }
}

