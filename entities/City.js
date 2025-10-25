import { DecorativeEntity } from './DecorativeEntity.js';
import { Constants } from '../config/Constants.js';

/**
 * City entity class - cityscape background element for level 2
 */
export class City extends DecorativeEntity {
  constructor(assetManager, x = Constants.CITY.DEFAULT_X_OFFSET, y = Constants.CITY.DEFAULT_Y_OFFSET) {
    super(assetManager, x, y, Constants.CITY.WIDTH, Constants.CITY.HEIGHT);
    this.setupAnimation(assetManager.getCitySprites());
  }
}
