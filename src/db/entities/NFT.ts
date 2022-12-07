import { Transaction } from "@/db/entities";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import type { Relation } from "typeorm";

@Entity()
export class NFT {
  @PrimaryColumn()
  id: string;

  @Column()
  address: string;

  @Column()
  tokenId: string;

  @Column()
  listed: boolean;

  @ManyToOne(() => Transaction, tx => tx.nfts)
  @JoinColumn()
  tx: Relation<Transaction>;
}
