import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VaultService } from './vault.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    VaultService,
    {
      provide: 'VAULT_CONFIG',
      useFactory: () => ({
        endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
        token: process.env.VAULT_TOKEN,
        roleId: process.env.VAULT_ROLE_ID,
        secretId: process.env.VAULT_SECRET_ID,
        namespace: process.env.VAULT_NAMESPACE,
        cacheTTL: parseInt(process.env.VAULT_CACHE_TTL || '300000'), // 5 minutes
        retryAttempts: parseInt(process.env.VAULT_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.VAULT_RETRY_DELAY || '1000'),
      }),
    },
  ],
  exports: [VaultService],
})
export class VaultModule {}
