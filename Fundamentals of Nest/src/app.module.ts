import { join } from 'path';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

import { ConfigModule } from './common/config/config.module';
import { CommonModule } from './common/common.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { DatabaseModule } from './database/database.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { DiscountsModule } from './discounts/discounts.module';
import { PaymentsModule } from './payments/payments.module';
import { GatewayKind } from './payments/payments.constants';
import { ReportsResolver } from './reporting/reports.resolver';

@Module({
  imports: [
    ConfigModule.forRoot(), // CONCEPT #3: dynamic module (global config)
    CommonModule, // CONCEPT #1/#4: custom providers + scopes
    PrismaModule, // CONCEPT #9: lifecycle
    DatabaseModule, // CONCEPT #2: async readiness provider

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: false,
      // Cast: @apollo/server ships dual CJS/ESM type declarations that clash
      // under ts-jest's stricter checking; the runtime plugin is unaffected.
      plugins: [ApolloServerPluginLandingPageLocalDefault() as any],
      // Pass the raw request into the GraphQL context so request-scoped
      // providers and the execution-context guard/interceptor can read headers.
      context: ({ req }) => ({ req }),
    }),

    ProductsModule,
    CartModule, // CONCEPT #4/#5
    OrdersModule, // CONCEPT #5
    DiscountsModule, // CONCEPT #6/#10

    // CONCEPT #3: dynamic module configured at the root. Gateway chosen from env.
    PaymentsModule.forRoot({
      gateway: (process.env.PAYMENT_GATEWAY as GatewayKind) ?? 'fake',
    }),
  ],
  providers: [
    // CONCEPT #7 consumer is registered eagerly; it lazy-loads ReportingModule.
    ReportsResolver,
    // CONCEPT #8: execution-context interceptor applied globally.
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
