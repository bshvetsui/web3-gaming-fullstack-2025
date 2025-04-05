import Phaser from 'phaser';

/**
 * Base Phaser game configuration
 * Used for 2D game scenes
 */
export const createPhaserConfig = (parent: string): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.AUTO,
    parent,
    width: 1920,
    height: 1080,
    backgroundColor: '#000000',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: process.env.NODE_ENV === 'development',
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
  };
};

/**
 * Base game scene that all game scenes should extend
 */
export class BaseGameScene extends Phaser.Scene {
  protected gameState: any;
  protected playerSprites: Map<string, Phaser.GameObjects.Sprite>;

  constructor(key: string) {
    super({ key });
    this.playerSprites = new Map();
  }

  preload() {
    // Load common assets
    this.loadCommonAssets();
  }

  protected loadCommonAssets() {
    // Override in child classes to load specific assets
  }

  create() {
    // Setup common scene elements
    this.setupCamera();
    this.setupInput();
  }

  protected setupCamera() {
    this.cameras.main.setZoom(1);
    this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
  }

  protected setupInput() {
    // Setup keyboard controls
    const cursors = this.input.keyboard?.createCursorKeys();

    // Setup WASD keys
    if (this.input.keyboard) {
      this.input.keyboard.addKeys({
        w: Phaser.Input.Keyboard.KeyCodes.W,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        s: Phaser.Input.Keyboard.KeyCodes.S,
        d: Phaser.Input.Keyboard.KeyCodes.D,
      });
    }
  }

  update(time: number, delta: number) {
    // Update game state
  }

  /**
   * Update player position from server state
   */
  updatePlayerPosition(playerId: string, x: number, y: number) {
    const sprite = this.playerSprites.get(playerId);
    if (sprite) {
      // Smooth movement using tweens
      this.tweens.add({
        targets: sprite,
        x,
        y,
        duration: 100,
        ease: 'Linear',
      });
    }
  }

  /**
   * Add a new player to the scene
   */
  addPlayer(playerId: string, x: number, y: number, texture: string = 'player') {
    const sprite = this.add.sprite(x, y, texture);
    this.playerSprites.set(playerId, sprite);
    return sprite;
  }

  /**
   * Remove player from scene
   */
  removePlayer(playerId: string) {
    const sprite = this.playerSprites.get(playerId);
    if (sprite) {
      sprite.destroy();
      this.playerSprites.delete(playerId);
    }
  }
}
