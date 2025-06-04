function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
}
// Constantes do jogo
const ROBOT_SIZE = 40; // Tamanho do robô em pixels
const VEGETABLE_SIZE = 30; // Tamanho da verdura em pixels
const ROBOT_SPEED = 3; // Velocidade de movimento do robô
const ROBOT_ROTATION_SPEED = 0.08; // Velocidade de rotação do robô (em radianos)
const NUM_VEGETABLES = 15; // Número inicial de verduras
// Distância para o robô colher a verdura (ajustada para p5.js)
const HARVEST_DISTANCE = ROBOT_SIZE / 2 + VEGETABLE_SIZE / 2 - 10;
const FADE_OUT_DURATION = 30; // Duração do efeito de desaparecimento em frames

// Tipos de verduras com suas cores e formas simplificadas
const VEGETABLE_TYPES = [
  { name: 'alface', color: [50, 150, 50], shape: 'circle' }, // Verde
  { name: 'cenoura', color: [255, 140, 0], shape: 'triangle' }, // Laranja
  { name: 'tomate', color: [200, 50, 50], shape: 'circle' }, // Vermelho
];

let robo; // Objeto do robô
let verduras = []; // Array de objetos de verduras

// Variáveis para controlar o estado das teclas pressionadas
let keysPressed = {};

// Classe para representar uma única Verdura
class Verdura {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // Objeto do tipo de verdura (do VEGETABLE_TYPES)
    this.collected = false; // Estado de colhido
    this.alpha = 255; // Opacidade para o efeito de desaparecimento
    this.scale = 1; // Escala para o efeito de encolhimento
  }

  // Método para exibir a verdura
  mostrar() {
    if (this.collected) {
      // Animação de desaparecimento e encolhimento
      this.alpha -= (255 / FADE_OUT_DURATION);
      this.scale -= (1 / FADE_OUT_DURATION);
      this.alpha = max(0, this.alpha);
      this.scale = max(0, this.scale);
    }

    if (this.alpha > 0) { // Só desenha se ainda estiver visível
      fill(this.type.color[0], this.type.color[1], this.type.color[2], this.alpha);
      noStroke();

      // Ajusta a posição para que o encolhimento seja centralizado
      let currentSize = VEGETABLE_SIZE * this.scale;
      let offsetX = (VEGETABLE_SIZE - currentSize) / 2;
      let offsetY = (VEGETABLE_SIZE - currentSize) / 2;

      // Desenha a verdura com base no seu tipo de forma
      if (this.type.shape === 'circle') {
        ellipse(this.x + VEGETABLE_SIZE / 2, this.y + VEGETABLE_SIZE / 2, currentSize, currentSize);
      } else if (this.type.shape === 'triangle') {
        // Desenha um triângulo para simular uma cenoura
        triangle(
          this.x + VEGETABLE_SIZE / 2, this.y + offsetY,
          this.x + offsetX, this.y + VEGETABLE_SIZE - offsetY,
          this.x + VEGETABLE_SIZE - offsetX, this.y + VEGETABLE_SIZE - offsetY
        );
      }
    }
  }
}

// Classe para representar o Robô
class Robo {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0; // Ângulo de rotação do robô
  }

  // Método para exibir o robô
  mostrar() {
    push(); // Salva as configurações de transformação atuais
    // Move a origem para a posição do robô e rotaciona
    translate(this.x + ROBOT_SIZE / 2, this.y + ROBOT_SIZE / 2);
    rotate(this.angle + PI / 2); // Ajusta a rotação para o robô "olhar" para cima quando o ângulo é 0

    // Efeito de propulsor quando se move para frente ou para trás
    if (keysPressed['w'] || keysPressed['s']) {
      fill(255, 150, 0, random(100, 200)); // Laranja/Amarelo com opacidade variável
      noStroke();
      ellipse(0, ROBOT_SIZE * 0.7, ROBOT_SIZE * 0.4, ROBOT_SIZE * 0.8); // Chama de fogo/propulsor
    }

    // Corpo do robô
    fill(150); // Cinza
    rectMode(CENTER);
    rect(0, 0, ROBOT_SIZE, ROBOT_SIZE * 1.2, 5); // Corpo retangular com cantos arredondados

    // Cabeça/Sensor
    fill(100); // Cinza mais escuro
    ellipse(0, -ROBOT_SIZE * 0.4, ROBOT_SIZE * 0.6, ROBOT_SIZE * 0.6); // Cabeça circular

    // Olhos
    fill(0); // Preto
    ellipse(-ROBOT_SIZE * 0.15, -ROBOT_SIZE * 0.5, ROBOT_SIZE * 0.1, ROBOT_SIZE * 0.1);
    ellipse(ROBOT_SIZE * 0.15, -ROBOT_SIZE * 0.5, ROBOT_SIZE * 0.1, ROBOT_SIZE * 0.1);

    // Pinça/Braço de coleta (simplificado)
    stroke(50); // Cinza bem escuro
    strokeWeight(3);
    line(0, ROBOT_SIZE * 0.3, 0, ROBOT_SIZE * 0.6);
    line(-ROBOT_SIZE * 0.1, ROBOT_SIZE * 0.6, ROBOT_SIZE * 0.1, ROBOT_SIZE * 0.6);

    pop(); // Restaura as configurações de transformação
  }

  // Método para atualizar a posição e rotação do robô
  atualizar() {
    // Rotação
    if (keysPressed['a']) {
      this.angle -= ROBOT_ROTATION_SPEED;
    }
    if (keysPressed['d']) {
      this.angle += ROBOT_ROTATION_SPEED;
    }

    // Movimento
    if (keysPressed['w']) {
      this.x += cos(this.angle) * ROBOT_SPEED;
      this.y += sin(this.angle) * ROBOT_SPEED;
    }
    if (keysPressed['s']) {
      this.x -= cos(this.angle) * ROBOT_SPEED;
      this.y -= sin(this.angle) * ROBOT_SPEED;
    }

    // Limita o robô dentro dos limites da tela
    this.x = constrain(this.x, 0, width - ROBOT_SIZE);
    this.y = constrain(this.y, 0, height - ROBOT_SIZE);

    // Lógica de colheita
    this.colherVerdura();
  }

  // Método para verificar e colher verduras próximas
  colherVerdura() {
    for (let i = 0; i < verduras.length; i++) {
      let veg = verduras[i];
      if (!veg.collected && veg.alpha > 0) { // Verifica se não foi colhida e ainda está visível
        // Calcula a distância do centro do robô ao centro da verdura
        let distance = dist(
          this.x + ROBOT_SIZE / 2, this.y + ROBOT_SIZE / 2,
          veg.x + VEGETABLE_SIZE / 2, veg.y + VEGETABLE_SIZE / 2
        );

        if (distance < HARVEST_DISTANCE) {
          veg.collected = true;
          console.log(`Robô colheu: ${veg.type.name}`);
        }
      }
    }
  }
}

// Função de configuração do p5.js, chamada uma vez no início
function setup() {
  createCanvas(800, 600); // Cria a área de desenho
  robo = new Robo(width / 2 - ROBOT_SIZE / 2, height / 2 - ROBOT_SIZE / 2); // Centraliza o robô

  // Inicializa as verduras aleatoriamente
  initializeVegetables();
}

// Função para inicializar/reiniciar as verduras
function initializeVegetables() {
  verduras = []; // Limpa o array de verduras
  for (let i = 0; i < NUM_VEGETABLES; i++) {
    const type = VEGETABLE_TYPES[floor(random(VEGETABLE_TYPES.length))];
    verduras.push(new Verdura(
      random(0, width - VEGETABLE_SIZE),
      random(0, height - VEGETABLE_SIZE),
      type
    ));
  }
}

// Função de desenho do p5.js, chamada repetidamente
function draw() {
  background(139, 69, 19); // Fundo marrom (cor de terra)

  // Desenha um grid para simular a horta
  stroke(100, 50, 0, 50); // Cor marrom clara e transparente
  for (let x = 0; x < width; x += VEGETABLE_SIZE * 2) {
    line(x, 0, x, height);
  }
  for (let y = 0; y < height; y += VEGETABLE_SIZE * 2) {
    line(0, y, width, y);
  }

  // Exibe todas as verduras
  // Filtra as verduras que já desapareceram completamente
  verduras = verduras.filter(veg => veg.alpha > 0 || !veg.collected);
  for (let veg of verduras) {
    veg.mostrar();
  }

  // Atualiza e exibe o robô
  robo.atualizar();
  robo.mostrar();

  // Exibe a contagem de verduras colhidas
  let collectedCount = NUM_VEGETABLES - verduras.filter(v => !v.collected).length; // Conta as que não estão mais na lista de visíveis e não colhidas
  fill(255); // Cor do texto branca
  textSize(18);
  textAlign(LEFT, TOP);
  text(`Verduras Colhidas: ${collectedCount} / ${NUM_VEGETABLES}`, 10, 10);

  // Verifica se o jogo terminou
  if (collectedCount === NUM_VEGETABLES) {
    fill(0, 150, 0); // Verde vibrante
    textSize(40);
    textAlign(CENTER, CENTER);
    text('Horta Limpa! Missão Concluída!', width / 2, height / 2);

    // Botão de jogar novamente
    fill(50, 100, 200); // Azul
    rectMode(CENTER);
    rect(width / 2, height / 2 + 70, 200, 50, 10); // Botão arredondado
    fill(255); // Texto branco
    textSize(20);
    text('Jogar Novamente', width / 2, height / 2 + 70);
  }
}

// Função chamada quando uma tecla é pressionada
function keyPressed() {
  keysPressed[key.toLowerCase()] = true; // Marca a tecla como pressionada
  // Se o jogo terminou e a tecla for pressionada sobre o botão "Jogar Novamente"
  let collectedCount = NUM_VEGETABLES - verduras.filter(v => !v.collected).length;
  if (collectedCount === NUM_VEGETABLES) {
    // Verifica se o clique foi dentro da área do botão
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 &&
        mouseY > height / 2 + 70 - 25 && mouseY < height / 2 + 70 + 25) {
      initializeVegetables(); // Reinicia as verduras
      robo = new Robo(width / 2 - ROBOT_SIZE / 2, height / 2 - ROBOT_SIZE / 2); // Reinicia a posição do robô
      keysPressed = {}; // Limpa as teclas pressionadas
    }
  }
}

// Função chamada quando uma tecla é liberada
function keyReleased() {
  keysPressed[key.toLowerCase()] = false; // Marca a tecla como não pressionada
}

// Função chamada quando o mouse é pressionado (para o botão "Jogar Novamente")
function mousePressed() {
  let collectedCount = NUM_VEGETABLES - verduras.filter(v => !v.collected).length;
  if (collectedCount === NUM_VEGETABLES) {
    // Verifica se o clique foi dentro da área do botão
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 &&
        mouseY > height / 2 + 70 - 25 && mouseY < height / 2 + 70 + 25) {
      initializeVegetables(); // Reinicia as verduras
      robo = new Robo(width / 2 - ROBOT_SIZE / 2, height / 2 - ROBOT_SIZE / 2); // Reinicia a posição do robô
      keysPressed = {}; // Limpa as teclas pressionadas
    }
  }
}
