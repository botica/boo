/**
 * Math utility functions
 */
export class MathUtils {
  /**
   * Clamp a value between min and max
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Clamped value
   */
  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Linear interpolation
   * @param {number} a - Start value
   * @param {number} b - End value
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated value
   */
  static lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Normalize a vector
   * @param {number} x - X component
   * @param {number} y - Y component
   * @returns {Object} Normalized vector {x, y}
   */
  static normalize(x, y) {
    const length = Math.hypot(x, y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: x / length, y: y / length };
  }

  /**
   * Random number between min and max
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random number
   */
  static random(min, max) {
    return min + Math.random() * (max - min);
  }

  /**
   * Random integer between min and max (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random integer
   */
  static randomInt(min, max) {
    return Math.floor(this.random(min, max + 1));
  }
}
