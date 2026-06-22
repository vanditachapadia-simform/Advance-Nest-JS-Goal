import {
  FilterQuery,
  Model,
  QueryOptions,
  UpdateQuery,
  Types,
  ProjectionType,
} from 'mongoose';

/**
 * Generic abstract repository (Repository Pattern).
 *
 * Encapsulates Mongoose data-access so services depend on a stable, intention-
 * revealing interface rather than the ODM directly. Concrete repositories
 * extend this and inject their model.
 */
export abstract class BaseRepository<T> {
  protected constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    const created = new this.model(data as T);
    return (await created.save()) as T;
  }

  async findById(id: string | Types.ObjectId, projection?: ProjectionType<T>): Promise<T | null> {
    return this.model.findById(id, projection).exec();
  }

  async findOne(filter: FilterQuery<T>, projection?: ProjectionType<T>): Promise<T | null> {
    return this.model.findOne(filter, projection).exec();
  }

  async find(
    filter: FilterQuery<T> = {},
    options: QueryOptions = {},
    projection?: ProjectionType<T>,
  ): Promise<T[]> {
    return this.model.find(filter, projection, options).exec();
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  /** Paginated query returning items + total in one round of work. */
  async paginate(
    filter: FilterQuery<T>,
    { skip, limit, sort }: { skip: number; limit: number; sort?: Record<string, 1 | -1> },
  ): Promise<{ items: T[]; total: number }> {
    const [items, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async update(
    id: string | Types.ObjectId,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true },
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, options).exec();
  }

  async delete(id: string | Types.ObjectId): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  /** Expose the raw model for advanced queries (aggregations, transactions). */
  getModel(): Model<T> {
    return this.model;
  }
}
