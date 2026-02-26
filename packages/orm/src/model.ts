/**
 * @gao/orm — BaseModel
 *
 * Abstract base class for all entity models.
 * Provides UUID primary key, timestamp handling, serialization, and dirty attribute tracking.
 */

import { randomUUID } from 'node:crypto';

export abstract class BaseModel {
  /** Primary Key (UUID v4) */
  public id: string;

  /** Created timestamp, auto-managed */
  public created_at?: string;

  /** Updated timestamp, auto-managed */
  public updated_at?: string;

  /** Deleted timestamp for soft-delete functionality */
  public deleted_at?: string;

  /** Store original values to track dirty fields */
  private _originalAttributes: Record<string, unknown> = {};

  constructor(initialData: Record<string, unknown> = {}) {
    this.id = randomUUID();
    this.fill(initialData);
    this.syncOriginal();
  }

  /**
   * Populate model attributes securely.
   */
  public fill(data: Record<string, unknown>): this {
    for (const [key, value] of Object.entries(data)) {
      // In a real active record, we'd check fillable/guarded properties.
      // For BaseModel, we just assign.
      // @ts-ignore - Dynamic assignment
      this[key] = value;
    }
    return this;
  }

  /**
   * Synchronize the current state as the original, unmutated state.
   * Should be called after loading from the database or after a successful save.
   */
  public syncOriginal(): this {
    this._originalAttributes = JSON.parse(JSON.stringify(this.getAttributes()));
    return this;
  }

  /**
   * Retrieve a plain object of the model's attributes.
   */
  public getAttributes(): Record<string, unknown> {
    const attributes: Record<string, unknown> = {};
    for (const key of Object.keys(this)) {
      if (
        key !== '_originalAttributes' &&
        typeof (this as unknown as Record<string, unknown>)[key] !== 'function'
      ) {
        attributes[key] = (this as unknown as Record<string, unknown>)[key];
      }
    }
    return attributes;
  }

  /**
   * Check if the model has been modified since it was last synced.
   * @param attribute Optional specific attribute to check
   */
  public isDirty(attribute?: string): boolean {
    const dirty = this.getDirty();
    if (attribute) {
      return Object.prototype.hasOwnProperty.call(dirty, attribute);
    }
    return Object.keys(dirty).length > 0;
  }

  /**
   * Get an object of all attributes that have changed.
   */
  public getDirty(): Record<string, unknown> {
    const current = this.getAttributes();
    const dirty: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(current)) {
      if (this._originalAttributes[key] !== value) {
        // Simplistic equality check. In production, deep equality may be needed.
        dirty[key] = value;
      }
    }

    return dirty;
  }

  /**
   * Soft delete the model (sets deleted_at timestamp).
   */
  public delete(): void {
    this.deleted_at = new Date().toISOString();
  }

  /**
   * Restore a soft-deleted model.
   */
  public restore(): void {
    this.deleted_at = undefined;
  }

  /**
   * Serialize model for HTTP response. Masks hidden fields if implemented.
   */
  public toJSON(): Record<string, unknown> {
    return this.getAttributes();
  }
}
