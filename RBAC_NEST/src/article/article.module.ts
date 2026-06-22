import { Module } from '@nestjs/common';
import { ArticlesController } from './article.controller';
import { ArticlesService } from './article.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CaslAbilityFactory } from 'src/casl/casl.factory';

@Module({
  providers: [ArticlesService, PrismaService, CaslAbilityFactory],
  exports: [ArticlesService],
  controllers: [ArticlesController],
})
export class ArticleModule {}
