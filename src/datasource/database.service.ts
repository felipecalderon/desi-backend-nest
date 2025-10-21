import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.PGHOST,
        port: Number(process.env.PGPORT || 3306),
        username: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true, // Desactivar en producción
      });

      return dataSource.initialize();
    },
  },
];
