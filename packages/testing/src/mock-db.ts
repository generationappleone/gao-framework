import { ConnectionManager, SQLiteDriver } from '@gao/orm';

export class MockDatabase {
    private _connectionManager: ConnectionManager;

    constructor() {
        this._connectionManager = new ConnectionManager({
            driver: 'sqlite',
            options: { filename: ':memory:' },
        });

        // Force sqlite driver with in-memory database
        const driver = new SQLiteDriver({ filename: ':memory:' });
        this._connectionManager.setDriver(driver);
    }

    async setup() {
        await this._connectionManager.connect();
    }

    async teardown() {
        await this._connectionManager.disconnect();
    }

    /**
     * Helper to truncate a specific table
     */
    async truncate(tableName: string) {
        const driver = this._connectionManager.getDriver();
        await driver.query(`DELETE FROM "${tableName}"`);
    }

    /**
     * Helper to begin a transaction
     */
    async beginTransaction() {
        const driver = this._connectionManager.getDriver();
        await driver.query('BEGIN TRANSACTION');
    }

    /**
     * Helper to rollback a transaction (useful between tests)
     */
    async rollbackTransaction() {
        const driver = this._connectionManager.getDriver();
        await driver.query('ROLLBACK');
    }

    /**
     * Retrieve the active connection manager
     */
    getConnectionManager() {
        return this._connectionManager;
    }
}
