import { describe, expect, it } from 'vitest';
import {
  Column,
  Encrypted,
  ForeignKey,
  Index,
  Table,
  Unique,
  getMetadata,
} from '../src/decorators.js';

@Table('app_users')
class User {
  @Column({ primary: true, type: 'uuid' })
  declare id: string;

  @Column({ type: 'varchar', nullable: false })
  @Index({ name: 'idx_user_email' })
  @Unique()
  declare email: string;

  @Column({ type: 'varchar' })
  @Encrypted()
  declare secretCode: string;

  @Column()
  @ForeignKey({ table: 'roles', column: 'id', onDelete: 'CASCADE' })
  declare roleId: string;
}

describe('Model Decorators', () => {
  it('should correctly build metadata for a Class', () => {
    const meta = getMetadata(User);

    expect(meta).toBeDefined();
    expect(meta.tableName).toBe('app_users');

    // Columns
    expect(meta.columns.id).toEqual({ primary: true, type: 'uuid' });
    expect(meta.columns.email).toEqual({ type: 'varchar', nullable: false });
    expect(meta.columns.secretCode).toEqual({ type: 'varchar' });
    expect(meta.columns.roleId).toEqual({});

    // Indexes & Uniques
    expect(meta.indexes.email).toEqual({ name: 'idx_user_email' });
    expect(meta.uniques).toContain('email');

    // Encryption
    expect(meta.encryptedFields).toContain('secretCode');

    // Foreign keys
    expect(meta.foreignKeys.roleId).toEqual({ table: 'roles', column: 'id', onDelete: 'CASCADE' });
  });

  it('should fallback to default table name if not provided', () => {
    class Post {
      @Column() declare title: string;
    }

    const meta = getMetadata(Post);
    // Default behavior implemented in decorators is classname + 's' lowercase
    expect(meta.tableName).toBe('posts');
    expect(meta.columns.title).toBeDefined();
  });
});
