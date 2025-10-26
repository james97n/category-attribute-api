import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { AttributeValue } from './attribute-value.entity';
import { Category } from './category.entity';

export enum AttributeType {
  SHORT_TEXT = 'Short Text',
  LONG_TEXT = 'Long Text',
  DROPDOWN = 'Dropdown',
  MULTI_SELECT = 'Multi Select',
  URL = 'URL',
}

@Entity()
export class Attribute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: AttributeType,
    default: AttributeType.SHORT_TEXT,
  })
  type: AttributeType;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => AttributeValue, (attributeValue) => attributeValue.attribute)
  attributeValues: AttributeValue[];

  @ManyToMany(() => Category, (category) => category.directAttributes)
  directCategories: Category[];

  // Virtual properties for API responses
  productCategory?: string;
  productsInUse?: number;
  linkType?: 'direct' | 'inherited' | 'global';
}
