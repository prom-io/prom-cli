import { NFT, Transaction } from "@/db/entities";
import path from "path";
import { DataSourceOptions, DataSource } from "typeorm";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userDir = process.env.APPDATA || process.env.HOME || __dirname;
export const dbPath =
  // path.join(__dirname, "nft.sqlite") ||
  path.join(userDir, ".prom", "nft.sqlite");

const options: DataSourceOptions = {
  type: "sqlite",
  database: dbPath,
  entities: [NFT, Transaction],
  synchronize: true,
};

export const AppDataSource = new DataSource(options);
