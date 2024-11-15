import Phaser from 'phaser';
import { createApp } from 'vue';

import App from './App.vue';
import GameScene from './game/scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1200,
  height: 500,
  parent: 'game-container',  // Attach Phaser game to #game-container
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: false,
    },
  },
  scene: [GameScene],
};

// Initialize Phaser game
new Phaser.Game(config);

// Mount Vue app
createApp(App).mount('#app');
