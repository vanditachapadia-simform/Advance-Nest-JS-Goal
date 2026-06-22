import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Article } from '@prisma/client';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async create(data: Article): Promise<Article> {
    return this.prisma.article.create({
      data,
    });
  }

  async findOne(id: number): Promise<Article> {
    return this.prisma.article.findUnique({
      where: { id },
    });
  }

  async update(
    id: number,
    data: { title?: string; content?: string; published?: boolean },
  ): Promise<Article> {
    return this.prisma.article.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Article> {
    return this.prisma.article.delete({
      where: { id },
    });
  }

  async findAll(): Promise<Article[]> {
    return this.prisma.article.findMany({ where: { published: true } });
  }
}
