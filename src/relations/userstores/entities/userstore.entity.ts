import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { UserRole } from '../../../users/entities/user-role.enum';
import { Store } from '../../../stores/entities/store.entity';

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
    enum: UserRole,
    default: UserRole.STORE_MANAGER,
  })
  role!: UserRole;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updatedAt' })
  updatedAt!: Date;
}
