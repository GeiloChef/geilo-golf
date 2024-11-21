import Phaser from 'phaser';

import { mapData as Level1 } from '@/game/levels/default/level1';
import { mapData as Level2 } from '@/game/levels/default/level2';
import { mapData as Level3 } from '@/game/levels/default/level3';
import { mapData as Level4 } from '@/game/levels/default/level4';
import { mapData as Level5 } from '@/game/levels/default/level5';
import { mapData as Level6 } from '@/game/levels/default/level6';
import { mapData as Level7 } from '@/game/levels/default/level7';
import { mapData as Level8 } from '@/game/levels/default/level8';
import { mapData as Level9 } from '@/game/levels/default/level9';
import { GoalConfig, MapDataConfig, PlatformData } from '@/models/MapInterfaces';

interface PointerPosition {
  x: number,
  y: number
}

const groundHeight = 40;

const debug: boolean = false;

const levels = [
  Level1,
  Level2,
  Level3,
  Level4,
  Level5,
  Level6,
  Level7,
  Level8,
  Level9,
];

export default class GameScene extends Phaser.Scene {
  private ball!: Phaser.Physics.Arcade.Image;
  private isAiming: boolean = false;
  private trajectoryGraphics!: Phaser.GameObjects.Graphics;
  private miniMapBackground!: Phaser.GameObjects.Graphics;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private goal!: Phaser.Physics.Arcade.Image; // The invisible sensor for the goal
  private goalArea!: Phaser.Geom.Rectangle;
  private goalTimer?: Phaser.Time.TimerEvent; // Timer to track ball in goal
  private powerBar!: Phaser.GameObjects.Graphics;
  private powerText!: Phaser.GameObjects.Text;
  private lastAimX: number = 0;
  private lastAimY: number = 0;
  private startAimX: number = 0;
  private startAimY: number = 0;
  private ballOnGround: boolean = false; // Add a flag to track ground contact

  private groundDrag: number = 200;
  private airDrag: number = 10;
  private bounceDrag: number = 500;
  private powerMultiplier: number = 1.8;
  private maxPower: number = 1000; // Adjust this value based on max power needed

  private strokeCount: number = 0; // Stroke counter
  private strokeText!: Phaser.GameObjects.Text; // Text to display the stroke counter

  private gameObjectsGroup!: Phaser.GameObjects.Group;
  private uiElementsGroup!: Phaser.GameObjects.Group;

  private currentLevelIndex: number = 0;
  private currentLevel!: MapDataConfig;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // no assets to load
  }

  init(data: { levelIndex: number }) {
    this.currentLevelIndex = data.levelIndex ?? 0; // Default to 0 if no level index is provided
  }

  create() {
    const { width, height } = this.scale;

    this.physics.world.gravity.y = 500;

    // Initialize groups
    this.gameObjectsGroup = this.add.group(); // Physics group for game objects
    this.uiElementsGroup = this.add.group(); // Standard group for UI elements
    this.platforms = this.physics.add.staticGroup();


    // Listen for the load next level event from LoadingScene
    this.events.on('loadNextLevel', () => {
      this.loadLevel(this.currentLevelIndex);
    });

    // Set a plain color for the background (light blue for a sky effect)
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Create a new camera specifically for the UI that covers the entire viewport
    this.cameras.add(0, 0, width, height, false, 'ui');

    // Create a graphics object for the trajectory preview
    this.trajectoryGraphics = this.add.graphics();
    this.gameObjectsGroup.add(this.trajectoryGraphics);

    // Power bar setup
    this.createPowerBar();

    // Store the initial scale of the stroke text
    this.createStrokeText(width);


    // Start with the first level load
    if (this.currentLevelIndex === 0) {
      this.loadLevel(this.currentLevelIndex);
    }

    // Add miniMap
    //this.createMiniMap();

    this.cameras.main.ignore(this.uiElementsGroup.getChildren());
    const uiCamera = this.cameras.getCamera('ui');
    const miniMapCamera = this.cameras.getCamera('mini-map');

    if (uiCamera) {
      uiCamera.ignore(this.gameObjectsGroup.getChildren());
    }

   if (miniMapCamera) {
      // Make the minimap camera ignore UI elements, so it only shows the game world
      miniMapCamera.ignore(this.uiElementsGroup.getChildren());
    }

    /**
     * Listener for User Interaction
     */

    // Request pointer lock when aiming starts
    this.input.on('pointerdown', this.startAiming, this);
    document.addEventListener('pointermove', this.handlePointerMoveOutside);
    document.addEventListener('mouseup', this.handlePointerUpOutside);

    this.game.events.on('blur', () => {
      this.isAiming = false; // Reset aiming state
    });

    this.game.events.on('focus', () => {
      this.isAiming = false; // Ensure aiming starts fresh on focus regain
    });

    // Set up scroll wheel zoom functionality
    this.input.on('wheel',
      (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number, deltaZ: number) => {
        // Zoom out when scrolling down, zoom in when scrolling up
        const zoomChange = deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + zoomChange, 0.5, 2); // Limit zoom between 0.5 and 2

        this.cameras.main.zoom = newZoom;
      });
  }

  loadLevel(levelIndex: number) {
    // Clear previous level objects if needed
    if (this.platforms) this.platforms.clear(true, true);

    if (this.goal) this.goal.destroy();

    if (this.ball) this.ball.destroy();

    // Load level data
    this.currentLevel = levels[levelIndex];

    if (!this.currentLevel) return; // Exit if the level doesn't exist

    // Set world bounds
    this.physics.world.setBounds(0, 0, this.currentLevel.width, this.currentLevel.height);
    // Set camera bounds to restrict it within the world
    this.cameras.main.setBounds(0, 0, this.currentLevel.width, this.currentLevel.height);

    // Add the ground as main platform
    this.currentLevel.platforms.push(
      {
        x: this.currentLevel.width / 2,
        y: this.currentLevel.height - groundHeight / 2,
        width: this.currentLevel.width,
        height: groundHeight,
        color: 0x228B22
      },  // Ground
    );

    // Add the platforms to the world
    this.createWorldData(this.currentLevel.platforms);

    // Create the U-shaped goal
    this.createGoal(this.currentLevel.goal);

    this.createMiniMap();

    const uiCamera = this.cameras.getCamera('ui');
    const miniMapCamera = this.cameras.getCamera('mini-map');

    if (uiCamera) {
      uiCamera.ignore(this.gameObjectsGroup.getChildren());
    }

    if (miniMapCamera) {
      // Make the minimap camera ignore UI elements, so it only shows the game world
      miniMapCamera.ignore(this.uiElementsGroup.getChildren());
    }
  }

  createMiniMap() {
    const miniMapCamera = this.cameras.getCamera('mini-map');

    if (miniMapCamera) {
      this.cameras.remove(miniMapCamera);
      this.miniMapBackground.destroy();
    }

    // Create a minimap camera
    // todo: calculate from the world data
    const minimapWidth = 120; // Width of the minimap in pixels
    const minimapHeight = 50; // Height of the minimap in pixels

    // Define the bounds of the game world (replace with your actual game world size if known)
    const worldWidth = this.physics.world.bounds.width;
    const worldHeight = this.physics.world.bounds.height;

    // Calculate zoom level to fit the entire game world in the minimap
    const zoomX = minimapWidth / worldWidth;
    const zoomY = minimapHeight / worldHeight;
    const minimapZoom = Math.min(zoomX, zoomY);

    // Define the position for the minimap in the top-left corner
    const minimapX = 10;
    const minimapY = 10;

    // Draw the minimap background and border
    this.miniMapBackground = this.add.graphics();

    this.miniMapBackground.lineStyle(10, 0xff0000, 1); // Red color for the border
    this.miniMapBackground.strokeRect(minimapX - 1, minimapY - 1, minimapWidth / minimapZoom - 15, minimapHeight / minimapZoom - 1); // Border around background

    // Ensure the background is rendered below the minimap camera
    this.miniMapBackground.setDepth(-1);

    // Position the minimap camera in the top-left corner
    const minimapCamera = this.cameras.add(minimapX, minimapY, minimapWidth, minimapHeight, false,'mini-map')
      .setZoom(minimapZoom);

    // Configure the minimap camera to follow the entire game world bounds
    minimapCamera.setBounds(0, 0, worldWidth, worldHeight);
    minimapCamera.startFollow(this.ball);
   // minimapCamera.ignore(minimapBackground);

    this.cameras.main.ignore(this.miniMapBackground);
    const uiCamera = this.cameras.getCamera('ui');

    if (uiCamera) {
      uiCamera.ignore(this.miniMapBackground);
    }
  }

  createWorldData(platformData: PlatformData[]) {
    // Create platforms from data
    platformData.forEach(({ x, y, width: platformWidth, height: platformHeight, color }, index) => {
      // Create regular platforms without holes
      const platform = this.add.rectangle(x, y, platformWidth, platformHeight, color);

      this.platforms.add(platform);
      this.physics.add.existing(platform, true);
    });

    // Convert all platform objects in the group to static physics bodies
    this.platforms.getChildren().forEach((platform) => {
      this.physics.add.existing(platform, true);
      this.gameObjectsGroup.add(platform);
    });

    // Add the playable ball
    this.createBall(this.currentLevel.ballSpawn.x, this.currentLevel.ballSpawn.y);
  }

  createStrokeText(gameAreaWidth: number) {
    // Create stroke counter text at the top right
    this.strokeText = this.add.text(gameAreaWidth - 20, 20, 'Strokes: 0', {
      font: '18px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 },
    }).setOrigin(1, 0); // Align to the top right

    this.uiElementsGroup.add(this.strokeText);
  }

  createBall(posX: number, posY: number) {
    // Create the ball as a filled circle
    const ballRadius = 10;
    const ballGraphics = this.add.graphics();

    ballGraphics.fillStyle(0xff4500, 1); // Orange color for the ball
    ballGraphics.fillCircle(ballRadius, ballRadius, ballRadius); // Draw a filled circle

    // Generate a texture from the graphics and use it for the ball
    ballGraphics.generateTexture('ballTexture', ballRadius * 2, ballRadius * 2);
    ballGraphics.destroy(); // Clean up graphics after generating texture

    this.ball = this.physics.add.image(posX, posY, 'ballTexture');
    this.ball.setCircle(ballRadius); // Set physics body as a circle with radius
    this.ball.setOrigin(0.5, 0.5); // Center the texture on the physics body
    this.ball.setBounce(0.4); // Make the ball bouncy
    this.ball.setCollideWorldBounds(true); // Prevent ball from going out of bounds
    this.ball.setDrag(10);

    // Adjust the ball's weight by setting its mass
    const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;

    ballBody.setGravityY(500); // Add additional downward gravity for the ball
    ballBody.setMass(1.2); // Increase the mass to make it feel "heavier"

    // Set up a collision callback to detect when the ball touches the ground
    this.physics.add.collider(this.ball, this.platforms, () => {
      this.ballOnGround = true;
    });

    // Call `preUpdate` to reset `ballOnGround` if the ball is not touching ground
    this.events.on('preupdate', () => {
      if (ballBody) {
        this.ballOnGround = ballBody.blocked?.down || ballBody.touching?.down;
      }
    });

    // Set the camera to follow the ball
    this.cameras.main.startFollow(this.ball);

    // Add ball to game objects
    this.gameObjectsGroup.add(this.ball);
  }

  createGoal(goalConfig: GoalConfig) {
    // Left wall of the U
    const leftWall = this.add.rectangle(
      goalConfig.position.x - goalConfig.base.width / 2,
      goalConfig.position.y,
      goalConfig.walls.width,
      goalConfig.walls.height,
      0xFFD700);

    this.physics.add.existing(leftWall, true);
    this.platforms.add(leftWall);
    this.gameObjectsGroup.add(leftWall);

    // Right wall of the U
    const rightWall = this.add.rectangle(
      goalConfig.position.x + goalConfig.base.width / 2,
      goalConfig.position.y,
      goalConfig.walls.width,
      goalConfig.walls.height,
      0xFFD700);

    this.physics.add.existing(rightWall, true);
    this.platforms.add(rightWall);
    this.gameObjectsGroup.add(rightWall);


    // Bottom base of the U
    const bottomBase = this.add.rectangle(
      goalConfig.position.x,
      goalConfig.position.y + goalConfig.walls.height / 2 - goalConfig.walls.width / 2,
      goalConfig.base.width,
      goalConfig.walls.width,
      0xFFD700);

    this.physics.add.existing(bottomBase, true);
    this.platforms.add(bottomBase);
    this.gameObjectsGroup.add(bottomBase);


    // Create an invisible goal sensor inside the U to detect when the ball enters
    this.goal = this.physics.add.image(goalConfig.position.x, goalConfig.position.y + goalConfig.walls.height / 4, 'goalSensor');
    this.goal.setDisplaySize(goalConfig.base.width - 10, goalConfig.walls.height / 2); // Adjust size to fit inside the U
    this.goal.setVisible(false); // Make the sensor invisible
    // @ts-ignore
    this.goal.body!.setAllowGravity(false);
    (this.goal.body as Phaser.Physics.Arcade.Body).setImmovable(true);

    // Define goalArea as a Rectangle to represent the goal boundaries
    this.goalArea = new Phaser.Geom.Rectangle(
      goalConfig.position.x - goalConfig.base.width / 2,  // Left bound of the goal area
      goalConfig.position.y - goalConfig.walls.height * 0.25,                     // Top bound of the goal area
      goalConfig.base.width,             // Width of the goal area
      goalConfig.walls.height * 0.75             // Height of the goal area
    );

    if (debug) {
      // Visualize the goal area with a semi-transparent color for debugging
      const goalAreaGraphics = this.add.graphics();

      goalAreaGraphics.fillStyle(0x00ff00, 0.3); // Green color with 30% opacity
      goalAreaGraphics.fillRectShape(this.goalArea);
    }

    // Collision detection for winning when the ball enters the U shape
    this.physics.add.overlap(this.ball, this.goal, this.startGoalStayTimer, undefined, this);
  }

  startGoalStayTimer() {
    // Only start the timer if it's not already running
    if (!this.goalTimer) {
      this.goalTimer = this.time.delayedCall(700, () => {
        this.winGame();
      });
    }
  }

  startAiming() {
    if (!this.ball || !this.ball.body || !this.input.mouse) return;

    // Check if the ball is stationary and on the ground
    const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
    const isBallStationary = Math.abs(ballBody.velocity.x) === 0;

    if (!isBallStationary || !this.ballOnGround) return; // Exit if the ball is moving or in the air

    // Request pointer lock when starting to aim
    if (!this.input.mouse.locked) {
      this.input.mouse.requestPointerLock();
    }

    this.isAiming = true;

    // Initialize aiming data based on ball position
    this.startAimX = this.ball.x;
    this.startAimY = this.ball.y;

    // Set lastAimX and lastAimY to the starting aim position
    this.lastAimX = this.startAimX;
    this.lastAimY = this.startAimY;

    // Hide the cursor for visual feedback
    this.input.setDefaultCursor('none');
  }

  getPointerPosition(event: PointerEvent):PointerPosition  {
    // Convert the document-level pointer coordinates to Phaser’s coordinate system
    return {
      x: event.clientX - this.game.canvas.getBoundingClientRect().left,
      y: event.clientY - this.game.canvas.getBoundingClientRect().top
    };
  }

  handlePointerUpOutside = () => {
    if (this.isAiming) {
      // Call shootBall with the calculated coordinates
      this.shootBall();
      this.isAiming = false;
    }
  };
  handlePointerMoveOutside = (event: PointerEvent) => {
    if (this.isAiming && this.input.mouse!.locked) {
      // Use relative movement to adjust power and angle
      this.lastAimX += event.movementX;
      this.lastAimY += event.movementY;

      // Update trajectory and power bar based on new aim position
      this.updateTrajectory();
    }
  };

  private createPowerBar() {
    const { width } = this.scale;
    const barWidth = 200;

    this.powerBar = this.add.graphics();
    this.powerText = this.add.text(width - barWidth - 15, 70, 'Power: 0%', {
      font: '16px Arial',
      color: '#000000',
    }).setOrigin(0, 0.5); // Left align within the bar

    this.drawPowerBar(0); // Initially draw the power bar with no fill
    this.uiElementsGroup.add(this.powerBar);
    this.uiElementsGroup.add(this.powerText);
  }

  private drawPowerBar(currentPower: number) {
    const { width } = this.scale;
    const barWidth = 200;
    const barHeight = 20;
    const fillWidth = (currentPower / this.maxPower) * barWidth;

    this.powerBar.clear();

    // Define color gradient based on power level
    let color = 0x00ff00; // Start with green

    if (currentPower > this.maxPower * 0.75) {
      color = 0xff0000; // Red at high power
    } else if (currentPower > this.maxPower * 0.5) {
      color = 0xffa500; // Orange at medium-high power
    } else if (currentPower > this.maxPower * 0.25) {
      color = 0xffff00; // Yellow at medium power
    }

    // Draw background and fill for power bar
    this.powerBar.fillStyle(0x000000, 1); // Background color
    this.powerBar.fillRect(width - barWidth - 20, 60, barWidth, barHeight);

    this.powerBar.fillStyle(color, 1); // Apply color gradient
    this.powerBar.fillRect(width - barWidth - 20, 60, fillWidth, barHeight);

    // Update power percentage text and position it inside the bar
    const powerPercent = Math.round((currentPower / this.maxPower) * 100);

    this.powerText.setText(`Power: ${powerPercent}%`);
    this.powerText.setPosition(width - barWidth - 15, 70); // Inside the bar, left aligned
  }

  updateTrajectory() {
    if (this.isAiming) {
      this.trajectoryGraphics.clear();

      const invertedAngle = this.calculateAngle();
      const power = this.calculatePower();

      this.drawTrajectory(invertedAngle, power);
      this.drawPowerBar(power);
    }
  }

  drawTrajectory(angle: number, power: number) {
    // Clear previous trajectory
    this.trajectoryGraphics.clear();

    // Calculate the maximum length of the line based on power
    const minLength = 5; // Minimum length for short shots
    const maxLength = Math.max(power, minLength); // Ensure minimum trajectory length
    const startX = this.ball.x;
    const startY = this.ball.y;

    // Define the distance between each dot based on power, with a lower minimum spacing
    const dotSpacing = Math.max(5, power / 10); // Lower minimum spacing for short shots

    // Calculate the unit direction vector
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);

    // Draw dots along the trajectory line
    const lengthDivider = 3; // Optional scaling factor to control length

    for (let distance = 0; distance <= maxLength; distance += dotSpacing) {
      const x = startX + (directionX * distance) / lengthDivider;
      const y = startY + (directionY * distance) / lengthDivider;

      // Draw each dot as a small circle
      this.trajectoryGraphics.fillStyle(0xff4500, 1);
      this.trajectoryGraphics.fillCircle(x, y, 2); // Dot radius of 2
    }
  }

  calculateAngle(): number {
    const angle = Phaser.Math.Angle.Between(this.ball.x, this.ball.y, this.lastAimX, this.lastAimY);
    const invertedAngle = angle + Math.PI;

    return invertedAngle;
  }

  calculatePower(): number {
    const power = Phaser.Math.Clamp(
      Phaser.Math.Distance.Between(this.ball.x, this.ball.y, this.lastAimX, this.lastAimY) * (this.powerMultiplier),
      0,
      this.maxPower
    );

    return power;
  }

  private updateStrokeText() {
    this.strokeText.setText(`Strokes: ${this.strokeCount}`);
  }

  shootBall() {
    if (this.isAiming) {

      const invertedAngle = this.calculateAngle();
      const power = this.calculatePower();

      this.ball.setVelocity(
        power * Math.cos(invertedAngle),
        power * Math.sin(invertedAngle)
      );

      // Reset aiming state and power bar
      this.trajectoryGraphics.clear();
      this.drawPowerBar(0); // Reset power bar after shooting
      this.powerText.setText('Power: 0%');
      this.isAiming = false;

      if(this.ball.body!.velocity.x !== 0 && this.ball.body!.velocity.y !== 0) {
        this.strokeCount++;
        this.updateStrokeText();
      }


      // Release pointer lock after shooting
      if (this.input.mouse!.locked) {
        this.input.mouse!.releasePointerLock();
      }

      // Restore cursor
      this.input.setDefaultCursor('auto');
    }
  }

  update() {
    const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
    const ballPosition = new Phaser.Geom.Point(this.ball.x, this.ball.y);

    if (!ballBody) return;

    // Check if the ball is outside the goal area and reset timer if necessary
    if (this.goalTimer && !Phaser.Geom.Rectangle.ContainsPoint(this.goalArea, ballPosition)) {
      this.goalTimer.remove(false); // Stop the timer
      this.goalTimer = undefined; // Reset the timer
    }

    // Check if the ball is touching the ground
    if (ballBody.touching.down) {
      if (Math.abs(ballBody.velocity.y) > 5) {
        // todo: increase bounce drag with each bounce
        ballBody.setDragX(this.bounceDrag);
      } else {
        ballBody.setDragX(this.groundDrag);
      }
    } else {
      ballBody.setDrag(this.airDrag);
    }
  }

  winGame() {
    // Disable ball movement
    // @ts-ignore
    this.ball.body!.setVelocity(0, 0);
    // @ts-ignore
    this.ball.body!.setAllowGravity(false);

    // Display the "Congratulations" popup
    const { width, height } = this.scale;
    const popup = this.add.graphics();

    popup.fillStyle(0x000000, 0.7);
    popup.fillRoundedRect(width / 2 - 150, height / 2 - 100, 300, 200, 10); // Increased height for more spacing

    const text = this.add.text(width / 2, height / 2 - 50, 'Congratulations!', {
      font: '24px Arial',
      color: '#ffffff',
    });

    text.setOrigin(0.5);

    const strokeMessage = this.add.text(width / 2, height / 2, `Strokes: ${this.strokeCount}`, {
      font: '20px Arial',
      color: '#ffff00',  // Yellow color to highlight
    });

    strokeMessage.setOrigin(0.5);

    const restartButton = this.add.text(width / 2, height / 2 + 60, 'Next Level', {
      font: '20px Arial',
      color: '#ff4500',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 5 },
    });

    restartButton.setOrigin(0.5);
    restartButton.setInteractive();

    restartButton.on('pointerdown', () => {
      this.finishLevel();
      popup.destroy();
      text.destroy();
      strokeMessage.destroy();
      restartButton.destroy();
    });

    const miniMapCamera = this.cameras.getCamera('mini-map');

    // Ensure the main camera ignores the popup elements, so they only appear on the UI camera
    this.cameras.main.ignore([popup, text, strokeMessage, restartButton]);

    if (miniMapCamera) {
      miniMapCamera.ignore([popup, text, strokeMessage, restartButton]);
    }
  }

  finishLevel() {
    this.strokeCount = 0;
    this.currentLevelIndex++;
    this.updateStrokeText();

    if (this.currentLevelIndex < levels.length) {
      this.loadLevel(this.currentLevelIndex); // Load the next level in the array
    } else {
      //console.log('All levels complete! Restarting game.');
      this.currentLevelIndex = 0; // Optionally restart from the first level
      this.loadLevel(this.currentLevelIndex);
    }
  }
}