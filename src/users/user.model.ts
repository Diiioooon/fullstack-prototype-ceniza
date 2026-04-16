
import { DataTypes, Model, Optional } from 'sequelize';
import type { Sequelize } from 'sequelize';

// 1. Define the shape of a user
export interface UserAttributes {
  id: number;
  email: string;
  passwordHash: string;
  title: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// 2. id, createdAt, updatedAt are auto-generated — not required when creating
export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// 3. The actual Sequelize model class
export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {

  public id!: number;
  public email!: string;
  public passwordHash!: string;
  public title!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 4. Initialize the model (connects it to the database)
export default function (sequelize: Sequelize): typeof User {
  User.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      firstName: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
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
    }
  );

  return User;
}