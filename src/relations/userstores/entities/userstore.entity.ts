import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { Store } from '../../../stores/entities/store.entity';

export enum UserStoreRole {
  OWNER = 'owner',
  STORE_MANAGER = 'store_manager',
  CONSIGNADO = 'consignado',
  TERCERO = 'tercero',
}

@Entity({ name: 'UserStore', schema: 'public' })
export class UserStore {
  @PrimaryGeneratedColumn('uuid', {
    name: 'userStoreID',
  })
  userStoreID!: string;

  @ManyToOne(() => User, (user) => user.userStores)
  @JoinColumn({ name: 'userID' })
  user!: User;

  @ManyToOne(() => Store, (store) => store.userStores)
  @JoinColumn({ name: 'storeID' })
  store!: Store;

  @Column({
    type: 'enum',
    enum: UserStoreRole,
    default: UserStoreRole.STORE_MANAGER,
  })
  role!: UserStoreRole;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updatedAt' })
  updatedAt!: Date;
}
