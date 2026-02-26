import { describe, expect, it } from 'vitest';
import { AfterDelete, AfterSave, BeforeDelete, BeforeSave, executeHooks } from '../src/hooks.js';
import { BaseModel } from '../src/model.js';

class Document extends BaseModel {
  public status = 'draft';
  public saveCount = 0;
  public deleteLog = '';

  @BeforeSave()
  async prepareSave() {
    if (this.status === 'draft') {
      this.status = 'pending';
    }
  }

  @AfterSave()
  async finalizeSave() {
    this.saveCount++;
  }

  @BeforeDelete()
  async prepareDelete() {
    this.status = 'deleted';
    this.deleteLog += 'before';
  }

  @AfterDelete()
  async finalizeDelete() {
    this.deleteLog += '_after';
  }
}

describe('Model Hooks', () => {
  it('should fire before and after save hooks', async () => {
    const doc = new Document();
    expect(doc.status).toBe('draft');
    expect(doc.saveCount).toBe(0);

    await executeHooks(doc, 'beforeSave');
    expect(doc.status).toBe('pending');

    await executeHooks(doc, 'afterSave');
    expect(doc.saveCount).toBe(1);
  });

  it('should fire before and after delete hooks', async () => {
    const doc = new Document();
    expect(doc.status).toBe('draft');
    expect(doc.deleteLog).toBe('');

    await executeHooks(doc, 'beforeDelete');
    expect(doc.status).toBe('deleted');
    expect(doc.deleteLog).toBe('before');

    await executeHooks(doc, 'afterDelete');
    expect(doc.deleteLog).toBe('before_after');
  });
});
