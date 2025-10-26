import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Tree,
  TreeChildren,
  TreeParent,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Product } from './product.entity';
import { Attribute } from './attribute.entity';

@Entity()
@Tree('closure-table')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @TreeChildren()
  children: Category[];

  @TreeParent()
  parent: Category;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @ManyToMany(() => Attribute, (attribute) => attribute.directCategories)
  @JoinTable()
  directAttributes: Attribute[];

  // Virtual property for associated attributes count
  associatedAttributesCount?: number;
  productsCount?: number;
}
