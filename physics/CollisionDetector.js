/**
 * Collision detection utilities
 */
export class CollisionDetector {
  /**
   * Check if two rectangular entities are colliding
   * @param {Object} entityA - First entity with x, y, width, height
   * @param {Object} entityB - Second entity with x, y, width, height
   * @returns {boolean} True if colliding
   */
  static checkAABBCollision(entityA, entityB) {
    return Math.abs(entityA.x - entityB.x) < (entityA.width + entityB.width) / 2 &&
           Math.abs(entityA.y - entityB.y) < (entityA.height + entityB.height) / 2;
  }

  /**
   * Get detailed collision information between two entities
   * @param {Object} entityA - First entity
   * @param {Object} entityB - Second entity
   * @returns {Object} Collision information
   */
  static getCollisionInfo(entityA, entityB) {
    const dx = entityB.x - entityA.x;
    const dy = entityB.y - entityA.y;
    const overlapX = (entityB.width + entityA.width) / 2 - Math.abs(dx);
    const overlapY = (entityB.height + entityA.height) / 2 - Math.abs(dy);
    const isTopCollision = (overlapY <= overlapX) && (dy < 0);
    
    return {
      dx,
      dy,
      overlapX,
      overlapY,
      isTopCollision
    };
  }

  /**
   * Check if entity is within bounds
   * @param {Object} entity - Entity to check
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   * @returns {boolean} True if within bounds
   */
  static isWithinBounds(entity, maxWidth, maxHeight) {
    const halfW = entity.width / 2;
    const halfH = entity.height / 2;
    return entity.x >= halfW && 
           entity.x <= maxWidth - halfW &&
           entity.y >= halfH && 
           entity.y <= maxHeight - halfH;
  }

  /**
   * Clamp entity position to bounds
   * @param {Object} entity - Entity to clamp
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   */
  static clampToBounds(entity, maxWidth, maxHeight) {
    const halfW = entity.width / 2;
    const halfH = entity.height / 2;
    entity.x = Math.max(halfW, Math.min(maxWidth - halfW, entity.x));
    entity.y = Math.max(halfH, Math.min(maxHeight - halfH, entity.y));
  }
}
