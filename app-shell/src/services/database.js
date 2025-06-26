// Database.js
const { Client } = require('pg');
const config = require('../../../backend/src/db/db.config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

class Database {
    constructor() {
        this.client = new Client({
            user: dbConfig.username,
            password: dbConfig.password,
            database: dbConfig.database,
            host: dbConfig.host,
            port: dbConfig.port
        });

        // Connect once, reuse the client
        this.client.connect().catch(err => {
            console.error('Error connecting to the database:', err);
            throw err;
        });
    }

    async executeSQL(query) {
        try {
            const result = await this.client.query(query);
            return {
                success: true,
                rows: result.rows
            };
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        }
    }

    // Method to fetch simple table/column info from 'information_schema'
    // (You can expand this to handle constraints, indexes, etc.)
    async getDBSchema(schemaName = 'public') {
        try {
            const tableQuery = `
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = $1
                  AND table_type = 'BASE TABLE'
                ORDER BY table_name
              `;

            const columnQuery = `
                SELECT table_name, column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = $1
                ORDER BY table_name, ordinal_position
              `;

            const [tablesResult, columnsResult] = await Promise.all([
                this.client.query(tableQuery, [schemaName]),
                this.client.query(columnQuery, [schemaName]),
            ]);

            // Build a simple schema object:
            const tables = tablesResult.rows.map(row => row.table_name);
            const columnsByTable = {};

            columnsResult.rows.forEach(row => {
                const { table_name, column_name, data_type, is_nullable } = row;
                if (!columnsByTable[table_name]) columnsByTable[table_name] = [];
                columnsByTable[table_name].push({ column_name, data_type, is_nullable });
            });

            // Combine tables with their columns
            return tables.map(table => ({
                table,
                columns: columnsByTable[table] || [],
            }));
        } catch (error) {
            console.error('Error fetching schema:', error);
            throw error;
        }
    }

    async close() {
        await this.client.end();
    }
}

module.exports = new Database();
