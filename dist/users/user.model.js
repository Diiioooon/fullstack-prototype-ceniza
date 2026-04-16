"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
exports.default = default_1;
const sequelize_1 = require("sequelize");
// 3. The actual Sequelize model class
class User extends sequelize_1.Model {
}
exports.User = User;
// 4. Initialize the model (connects it to the database)
function default_1(sequelize) {
    User.init({
        id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        email: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
        passwordHash: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        firstName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        lastName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        role: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        defaultScope: {
            attributes: { exclude: ['passwordHash'] }, // hides password by default
        },
        scopes: {
            withHash: { attributes: { include: ['passwordHash'] } },
        },
    });
    return User;
}
