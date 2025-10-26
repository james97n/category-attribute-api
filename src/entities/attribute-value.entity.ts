import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from './product.entity';
import { Attribute } from './attribute.entity';

@Entity()
export class AttributeValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value: string;

  @ManyToOne(() => Product, (product) => product.attributeValues)
  product: Product;

  @Column()
  productId: number;

  @ManyToOne(() => Attribute, (attribute) => attribute.attributeValues)
  attribute: Attribute;

  @Column()
  attributeId: number;
}
