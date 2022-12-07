import { NFT } from "@/db/entities/NFT";
import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import type { Relation } from "typeorm";

@Entity()
export class Transaction {
  @PrimaryColumn()
  id: string;

  @Column()
  hash: string;

  @Column()
  chainId: number;

  @OneToMany(() => NFT, nft => nft.tx)
  nfts: Relation<NFT>[];
}
