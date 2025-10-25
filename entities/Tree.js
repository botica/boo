import { DecorativeEntity } from './DecorativeEntity.js';
import { Constants } from '../config/Constants.js';

/**
 * Tree entity class - decorative animated background element
 */
export class Tree extends DecorativeEntity {
  constructor(assetManager, x = window.innerWidth / 2 + Constants.TREE.DEFAULT_X_OFFSET, y = window.innerHeight - Constants.TREE.DEFAULT_Y_OFFSET) {
    super(assetManager, x, y, Constants.TREE.WIDTH, Constants.TREE.HEIGHT);
    this.setupAnimation(assetManager.getTreeSprites());
  }
}