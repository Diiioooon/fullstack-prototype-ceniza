import config from '../../config.json';
import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';

export interface Database {
    User: any;
}

export const db: Database = {} as Database;

export async function initialize(): Promise<void> {
    const { host, port, user, password, database } = config.database;

    // 1. Connect to MySQL (without DB)
    const connection = await mysql.createConnection({ host, port, user, password });

    // 2. Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    // 3. Connect Sequelize to DB
    const sequelize = new Sequelize(database, user, password, {
        host: host,
        dialect: 'mysql'
    });

    // 4. Import models
    const { default: UserModel } = await import('../users/user.model');

    // 5. Initialize models
    db.User = UserModel(sequelize);

    // 6. Sync database
    await sequelize.sync({ alter: true });

    console.log('✅ Database connected and synced');
}