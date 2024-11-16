import Phaser from 'phaser';

export default class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Add loading text and progress bar immediately in create
    const loadingText = this.add.text(width / 2, height / 2 - 20, 'Loading...', {
      font: '20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();

    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2, 320, 50);

    // Simulate a loading progress bar (since assets might already be cached)
    this.tweens.add({
      targets: progressBar,
      scaleX: 1,
      duration: 500, // Duration of the fake loading animation
      onUpdate: (tween, target) => {
        const progress = tween.progress;

        progressBar.clear();
        progressBar.fillStyle(0xffffff, 1);
        progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * progress, 30);
      },
      onComplete: () => {
        // Clean up loading visuals
        progressBar.destroy();
        progressBox.destroy();
        loadingText.destroy();

        // Delay before starting GameScene to ensure visuals are shown
        this.time.delayedCall(100, () => {
          // Signal GameScene to load the next level
          this.scene.launch('GameScene');
          this.scene.get('GameScene').events.emit('loadNextLevel');
          this.scene.stop();
        });
      }
    });
  }
}