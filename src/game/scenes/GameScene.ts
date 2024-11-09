import Phaser from 'phaser';
interface PlatformData {
  x: number,
  y: number,
  width: number,
  height: number,
  color: number
}

interface PointerPosition {
  x: number,
  y: number
}

const groundHeight = 40;

const platforms: PlatformData[] = [
  { x: 400 + 77, y: 500, width: 400, height: groundHeight, color: 0x228B22 },
  { x: 400, y: 500, width: 155, height: groundHeight, color: 0x228B22 },
];

export default class GameScene extends Phaser.Scene {
  private ball!: Phaser.Physics.Arcade.Image;
  private isAiming: boolean = false;
  private isBouncing: boolean = false;
  private trajectoryGraphics!: Phaser.GameObjects.Graphics;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private goal!: Phaser.Physics.Arcade.Image; // The invisible sensor for the goal
  private goalArea!: Phaser.Geom.Rectangle;
  private goalTimer?: Phaser.Time.TimerEvent; // Timer to track ball in goal
  private powerBar!: Phaser.GameObjects.Graphics;
  private powerText!: Phaser.GameObjects.Text;

  private groundDrag: number = 200;
  private airDrag: number = 10;
  private bounceDrag: number = 500;
  private powerMultiplier: number = 1.8;
  private maxPower: number = 1000; // Adjust this value based on max power needed

  private strokeCount: number = 0; // Stroke counter
  private strokeText!: Phaser.GameObjects.Text; // Text to display the stroke counter


  private gameObjectsGroup!: Phaser.GameObjects.Group;
  private uiElementsGroup!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // No assets to preload, using graphics only
  }

  create() {
    const { width, height } = this.scale;

    const worldWidth = width * 2;  // Twice the width of the visible area
    const worldHeight = height * 2; // Twice the height of the visible area

    this.physics.world.gravity.y = 500;

    // Set world bounds
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    // Set camera bounds to restrict it within the world
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Set a plain color for the background (light blue for a sky effect)
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Create a new camera specifically for the UI that covers the entire viewport
    this.cameras.add(0, 0, width, height, false, 'ui');

    this.physics.world.gravity.y = 500; // Adjust gravity to suit natural ball drop
    this.platforms = this.physics.add.staticGroup();

    // Initialize groups
    this.gameObjectsGroup = this.add.group(); // Physics group for game objects
    this.uiElementsGroup = this.add.group(); // Standard group for UI elements

    // Add the ground as main platform
    platforms.push(
        { x: worldWidth / 2, y: worldHeight - groundHeight / 2, width: worldWidth, height: groundHeight, color: 0x228B22 },  // Ground
    );

    // Add the platforms to the world
    this.createWorldData(platforms);

    // Add the playable ball
    this.createBall(height);

    // Create the U-shaped goal
    this.createGoal(worldWidth - 100, worldHeight - 200);

    // Create a graphics object for the trajectory preview
    this.trajectoryGraphics = this.add.graphics();
    this.gameObjectsGroup.add(this.trajectoryGraphics);

    // Power bar setup
    this.createPowerBar();

    // Store the initial scale of the stroke text
    this.createStrokeText(width);

    // Add miniMap
    this.createMiniMap();

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

    // Set up input for aiming and shooting
    this.input.on('pointerdown', this.startAiming, this);
    this.input.on('pointermove', this.updateTrajectory, this); // Update trajectory while aiming
    this.input.on('pointerup', this.shootBall, this);

    // Set up scroll wheel zoom functionality
    this.input.on('wheel',
      (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number, deltaZ: number) => {
        // Zoom out when scrolling down, zoom in when scrolling up
        const zoomChange = deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + zoomChange, 0.5, 2); // Limit zoom between 0.5 and 2

        this.cameras.main.zoom = newZoom;
      });
  }

  createMiniMap() {
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
    const minimapBackground = this.add.graphics();

    minimapBackground.lineStyle(10, 0xff0000, 1); // Red color for the border
    minimapBackground.strokeRect(minimapX - 1, minimapY - 1, minimapWidth / minimapZoom - 15, minimapHeight / minimapZoom - 1); // Border around background

    // Ensure the background is rendered below the minimap camera
    minimapBackground.setDepth(-1);

    // Position the minimap camera in the top-left corner
    const minimapCamera = this.cameras.add(minimapX, minimapY, minimapWidth, minimapHeight, false,'mini-map')
      .setZoom(minimapZoom);

    // Configure the minimap camera to follow the entire game world bounds
    minimapCamera.setBounds(0, 0, worldWidth, worldHeight);
    minimapCamera.startFollow(this.ball);
   // minimapCamera.ignore(minimapBackground);

    this.cameras.main.ignore(minimapBackground);
    const uiCamera = this.cameras.getCamera('ui');

    if (uiCamera) {
      uiCamera.ignore(minimapBackground);
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

  createBall(height: number) {
    // Create the ball as a filled circle
    const ballRadius = 10;
    const ballGraphics = this.add.graphics();

    ballGraphics.fillStyle(0xff4500, 1); // Orange color for the ball
    ballGraphics.fillCircle(ballRadius, ballRadius, ballRadius); // Draw a filled circle

    // Generate a texture from the graphics and use it for the ball
    ballGraphics.generateTexture('ballTexture', ballRadius * 2, ballRadius * 2);
    ballGraphics.destroy(); // Clean up graphics after generating texture

    this.ball = this.physics.add.image(50, height - 50 - groundHeight, 'ballTexture');
    this.ball.setCircle(ballRadius); // Set physics body as a circle with radius
    this.ball.setOrigin(0.5, 0.5); // Center the texture on the physics body
    this.ball.setBounce(0.5); // Make the ball bouncy
    this.ball.setCollideWorldBounds(true); // Prevent ball from going out of bounds
    this.ball.setDrag(10);

    // Add collision between the ball and all platforms in the group
    this.physics.add.collider(this.ball, this.platforms);

    // Set the camera to follow the ball
    this.cameras.main.startFollow(this.ball);

    // Add ball to game objects
    this.gameObjectsGroup.add(this.ball);
  }

  createGoal(x: number, y: number) {
    const wallHeight = 40;
    const wallWidth = 5;
    const baseWidth = 40;

    // Left wall of the U
    const leftWall = this.add.rectangle(x - baseWidth / 2, y, wallWidth, wallHeight, 0xFFD700);

    this.physics.add.existing(leftWall, true);
    this.platforms.add(leftWall);

    // Right wall of the U
    const rightWall = this.add.rectangle(x + baseWidth / 2, y, wallWidth, wallHeight, 0xFFD700);

    this.physics.add.existing(rightWall, true);
    this.platforms.add(rightWall);

    // Bottom base of the U
    const bottomBase = this.add.rectangle(x, y + wallHeight / 2 - wallWidth / 2, baseWidth, wallWidth, 0xFFD700);

    this.physics.add.existing(bottomBase, true);
    this.platforms.add(bottomBase);

    // Create an invisible goal sensor inside the U to detect when the ball enters
    this.goal = this.physics.add.image(x, y + wallHeight / 4, 'goalSensor');
    this.goal.setDisplaySize(baseWidth - 10, wallHeight / 2); // Adjust size to fit inside the U
    this.goal.setVisible(false); // Make the sensor invisible
    // @ts-ignore
    this.goal.body!.setAllowGravity(false);
    (this.goal.body as Phaser.Physics.Arcade.Body).setImmovable(true);

    // Define goalArea as a Rectangle to represent the goal boundaries
    this.goalArea = new Phaser.Geom.Rectangle(
      x - baseWidth / 2,  // Left bound of the goal area
      y,                     // Top bound of the goal area
      baseWidth,             // Width of the goal area
      wallHeight             // Height of the goal area
    );

    // Collision detection for winning when the ball enters the U shape
    this.physics.add.overlap(this.ball, this.goal, this.startGoalStayTimer, undefined, this);
  }

  startGoalStayTimer() {
    // Only start the timer if it's not already running
    if (!this.goalTimer) {
      this.goalTimer = this.time.delayedCall(1000, () => {
        this.winGame();
      });
    }
  }

  startAiming(pointer: Phaser.Input.Pointer) {
    // todo: hide mouse and only track the movement of the mouse
    if (!this.ball || !this.ball.body) return;

    // Convert pointer coordinates to world coordinates
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    // Check if the pointer is within the bounds of the ball
    const distanceToBall = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, this.ball.x, this.ball.y);
    const ballRadius = this.ball.displayWidth / 2;

    // Only enable aiming if the pointer is on the ball
    if (distanceToBall <= ballRadius) {
      this.isAiming = true;

      // Add a global pointerup event listener on the window to detect releases outside the game area
      document.addEventListener('pointerup', this.handlePointerUpOutside);
      document.addEventListener('pointermove', this.handlePointerMoveOutside);

      // Set up the trajectory update and shoot event listeners within the game screen
      this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.updateTrajectory(p.x, p.y), this);
      this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.shootBall(p.x, p.y), this);
    }
  }

  getPointerPosition(event: PointerEvent):PointerPosition  {
    // Convert the document-level pointer coordinates to Phaser’s coordinate system
    return {
      x: event.clientX - this.game.canvas.getBoundingClientRect().left,
      y: event.clientY - this.game.canvas.getBoundingClientRect().top
    };
  }

  handlePointerUpOutside = (event: PointerEvent) => {
    if (this.isAiming) {
      const { x: pointerX, y: pointerY } = this.getPointerPosition(event);

      // Call shootBall with the calculated coordinates
      this.shootBall(pointerX, pointerY);

      // Remove global listeners after firing
      document.removeEventListener('pointerup', this.handlePointerUpOutside);
      document.removeEventListener('pointermove', this.handlePointerMoveOutside);

      this.input.off('pointermove', this.updateTrajectory, this);
      this.input.off('pointerup', this.shootBall, this);
    }
  };
  handlePointerMoveOutside = (event: PointerEvent) => {
    if (this.isAiming) {
      const { x: pointerX, y: pointerY } = this.getPointerPosition(event);

      // Update the trajectory using the calculated pointer coordinates
      this.updateTrajectory(pointerX, pointerY);
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

  updateTrajectory(pointerX: number, pointerY: number) {
    if (this.isAiming) {
      const worldPoint = this.cameras.main.getWorldPoint(pointerX, pointerY);

      this.trajectoryGraphics.clear();

      const invertedAngle = this.calculateAngle(worldPoint);
      const power = this.calculatePower(worldPoint);

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

  calculateAngle(worldPoint: Phaser.Math.Vector2): number {
    const angle = Phaser.Math.Angle.Between(this.ball.x, this.ball.y, worldPoint.x, worldPoint.y);
    const invertedAngle = angle + Math.PI;

    return invertedAngle;
  }

  calculatePower(worldPoint: Phaser.Math.Vector2): number {
    const power = Phaser.Math.Clamp(
      Phaser.Math.Distance.Between(this.ball.x, this.ball.y, worldPoint.x, worldPoint.y) * (this.powerMultiplier),
      0,
      this.maxPower
    );

    return power;
  }

  shootBall(pointerX: number, pointerY: number) {
    if (this.isAiming) {
      // Convert screen coordinates to world coordinates
      const worldPoint = this.cameras.main.getWorldPoint(pointerX, pointerY);

      const invertedAngle = this.calculateAngle(worldPoint);
      const power = this.calculatePower(worldPoint);

      this.ball.setVelocity(
        power * Math.cos(invertedAngle),
        power * Math.sin(invertedAngle)
      );

      this.trajectoryGraphics.clear();
      this.isAiming = false;
      this.drawPowerBar(0);

      // Increment stroke count and update display
      this.strokeCount++;
      this.strokeText.setText(`Strokes: ${this.strokeCount}`);

      // Remove global listeners to avoid memory leaks
      document.removeEventListener('pointerup', this.handlePointerUpOutside);
      document.removeEventListener('pointermove', this.handlePointerMoveOutside);

      this.input.off('pointermove', this.updateTrajectory, this);
      this.input.off('pointerup', this.shootBall, this);
    }
  }

  update() {
    const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
    const ballPosition = new Phaser.Geom.Point(this.ball.x, this.ball.y);

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

    const restartButton = this.add.text(width / 2, height / 2 + 60, 'Restart', {
      font: '20px Arial',
      color: '#ff4500',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 5 },
    });

    restartButton.setOrigin(0.5);
    restartButton.setInteractive();

    restartButton.on('pointerdown', () => {
      this.resetLevel();
      this.scene.restart(); // Restart the level
    });

    const miniMapCamera = this.cameras.getCamera('mini-map');

    // Ensure the main camera ignores the popup elements, so they only appear on the UI camera
    this.cameras.main.ignore([popup, text, strokeMessage, restartButton]);

    if (miniMapCamera) {
      miniMapCamera.ignore([popup, text, strokeMessage, restartButton]);
    }
  }

  resetLevel() {
    this.strokeCount = 0;
  }
}