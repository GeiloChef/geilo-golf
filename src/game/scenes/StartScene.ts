import Phaser from 'phaser';

export default class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' });
  }

  preload() {
    // Preload the background image
    this.load.image('background', 'assets/bg-title-screen.webp'); // Replace with your actual file path
  }

  create() {
    const { width, height } = this.scale;

    // Add the background image
    const background = this.add.image(0, 0, 'background').setOrigin(0, 0);

    // Scale the background to fit the game screen, if necessary
    background.setDisplaySize(width, height);


    // Add title text
    this.add.text(width / 2, height / 3, 'Geilo Golf', {
      font: '68px Arial',
      color: '#000000',
    }).setOrigin(0.5);

    // Add start button
    const startButton = this.add.text(width / 2, height / 2, 'Start Game', {
      font: '32px Arial',
      color: '#ff4500',
      backgroundColor: '#ffffff',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);

    // Make the button interactive
    startButton.setInteractive();

    startButton.on('pointerover', () => {
      startButton.setStyle({ backgroundColor: '#ffcc00' }); // Change color on hover
    });

    startButton.on('pointerout', () => {
      startButton.setStyle({ backgroundColor: '#ffffff' }); // Reset color
    });

    startButton.on('pointerdown', () => {
      this.scene.start('GameScene'); // Transition to the game scene
    });
  }
}