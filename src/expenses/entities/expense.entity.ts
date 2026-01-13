import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

export enum ExpenseType {
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  ADMINISTRATIVE = 'administrative',
}

@Entity({ name: 'Expense', schema: 'public' })
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'timestamp with time zone', name: 'deductibleDate' })
  deductibleDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ExpenseType,
  })
  type: ExpenseType;

  @ManyToOne(() => Store, (store) => store.expenses)
  @JoinColumn({ name: 'storeID' })
  store: Store;

  @Column()
  storeID: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updatedAt' })
  updatedAt: Date;
}
