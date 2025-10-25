import { DecorativeEntity } from './DecorativeEntity.js';
import { Constants } from '../config/Constants.js';

/**
 * Moon entity class - decorative animated background element
 */
export class Moon extends DecorativeEntity {
  constructor(assetManager, x = Constants.MOON.OFFSET_X, y = Constants.MOON.OFFSET_Y) {
    super(assetManager, x, y, Constants.MOON.WIDTH, Constants.MOON.HEIGHT);
    this.setupAnimation(assetManager.getMoonSprites());
  }
}