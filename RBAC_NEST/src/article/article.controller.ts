import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { CaslAbilityFactory } from 'src/casl/casl.factory';
import { ArticlesService } from './article.service';
import { PolicyGuard } from 'src/common/guards/policy.guard';
import { ForbiddenError, subject } from '@casl/ability';
import { checkAbilities } from 'src/common/decorator/policy.decorator';
import { Article } from '@prisma/client';

@Controller('articles')
@UseGuards(PolicyGuard)
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Post()
  @checkAbilities({ action: 'create', subject: 'article' })
  async createArticle(@Body() body: Article, @Request() req) {
    const ability = this.caslAbilityFactory.createAbility(
      req?.user?.role?.permission,
    );
    console.log(ability.rules);
    ForbiddenError.from(ability)
      .setMessage('Not Allowed')
      .throwUnlessCan('create', 'article');
    return this.articlesService.create({ ...body, owner_id: req.user.user_id });
  }

  @checkAbilities({ action: 'read', subject: 'article' })
  @Get(':id')
  async getArticle(@Param('id') id: string, @Request() req) {
    const article = await this.articlesService.findOne(+id);
    const ability = this.caslAbilityFactory.createAbility(
      req.user.role.permission,
    );

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    ForbiddenError.from(ability)
      .setMessage('Not Allowed')
      .throwUnlessCan('read', subject('article', article));

    return article;
  }

  @checkAbilities({ action: 'update', subject: 'article' })
  @Patch(':id')
  async updateArticle(@Param('id') id: string, @Body() body, @Request() req) {
    const article = await this.articlesService.findOne(+id);
    const ability = this.caslAbilityFactory.createAbility(
      req.user.role.permission,
    );

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    ForbiddenError.from(ability)
      .setMessage('Not Allowed')
      .throwUnlessCan('update', subject('article', article));

    return this.articlesService.update(+id, body);
  }

  @checkAbilities({ action: 'delete', subject: 'article' })
  @Delete(':id')
  async deleteArticle(@Param('id') id: string, @Request() req) {
    const article = await this.articlesService.findOne(+id);
    const ability = this.caslAbilityFactory.createAbility(
      req.user.role.permission,
    );

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    ForbiddenError.from(ability)
      .setMessage('Not Allowed')
      .throwUnlessCan('delete', subject('article', article));

    return this.articlesService.delete(+id);
  }

  @checkAbilities({ action: 'read', subject: 'article' })
  @Get()
  async findAll() {
    return this.articlesService.findAll();
  }
}
