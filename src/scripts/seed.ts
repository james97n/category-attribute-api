// src/seeds/seed.ts
import { DataSource } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Attribute, AttributeType } from '../entities/attribute.entity';
import { Product } from '../entities/product.entity';
import { AttributeValue } from '../entities/attribute-value.entity';

async function seed() {
  console.log('Starting database seeding...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'productapp',
    password: process.env.DATABASE_PASSWORD || 'productapp123',
    database: process.env.DATABASE_NAME || 'productapp',
    entities: [Category, Attribute, Product, AttributeValue],
    synchronize: true, // This will create tables if they don't exist
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    // Clear existing data
    console.log('Clearing existing data...');
    await dataSource
      .getRepository(AttributeValue)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(Product)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(Attribute)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(Category)
      .createQueryBuilder()
      .delete()
      .execute();

    // Create categories
    console.log('Creating categories...');

    // Root categories
    const beauty = await dataSource
      .getRepository(Category)
      .save({ name: 'Beauty' });
    await dataSource.getRepository(Category).save({ name: 'Children & Toys' });
    await dataSource.getRepository(Category).save({ name: 'Fashion' });
    const foodGrocery = await dataSource
      .getRepository(Category)
      .save({ name: 'Food & Grocery' });

    // Subcategories for Food & Grocery
    const beverages = await dataSource.getRepository(Category).save({
      name: 'Beverages',
      parent: foodGrocery,
    });
    const noodles = await dataSource.getRepository(Category).save({
      name: 'Noodles',
      parent: foodGrocery,
    });
    const facialCleanser = await dataSource.getRepository(Category).save({
      name: 'Facial Cleanser',
      parent: beauty,
    });

    // Subcategories for Beverages
    await dataSource.getRepository(Category).save({
      name: 'Carbonated Drinks',
      parent: beverages,
    });
    await dataSource.getRepository(Category).save({
      name: 'Cocoa & Malted Drinks',
      parent: beverages,
    });
    await dataSource.getRepository(Category).save({
      name: 'Coffee',
      parent: beverages,
    });
    const flavouredDrinks = await dataSource.getRepository(Category).save({
      name: 'Flavoured Drinks',
      parent: beverages,
    });
    const healthEnergyDrinks = await dataSource.getRepository(Category).save({
      name: 'Health & Energy Drinks',
      parent: beverages,
    });

    console.log('Categories created successfully');

    // Create attributes
    console.log('Creating attributes...');

    const attributeRepo = dataSource.getRepository(Attribute);

    // Global attributes
    await attributeRepo.save({
      name: 'ASIN',
      type: AttributeType.SHORT_TEXT,
    });
    await attributeRepo.save({
      name: 'Allow Reviews',
      type: AttributeType.DROPDOWN,
    });
    await attributeRepo.save({
      name: 'Backorders',
      type: AttributeType.DROPDOWN,
    });
    const brandAttr = await attributeRepo.save({
      name: 'Brand',
      type: AttributeType.SHORT_TEXT,
    });
    await attributeRepo.save({
      name: 'Collection',
      type: AttributeType.MULTI_SELECT,
    });

    // Category-specific attributes
    await attributeRepo.save({
      name: 'Organic Flavour',
      type: AttributeType.DROPDOWN,
      directCategories: [flavouredDrinks],
    });

    const flavourAttr = await attributeRepo.save({
      name: 'Flavour',
      type: AttributeType.DROPDOWN,
      directCategories: [noodles, flavouredDrinks],
    });

    const colorAttr = await attributeRepo.save({
      name: 'Color',
      type: AttributeType.SHORT_TEXT,
      directCategories: [noodles, flavouredDrinks],
    });

    const productBenefitsAttr = await attributeRepo.save({
      name: 'Product Benefits',
      type: AttributeType.SHORT_TEXT,
      directCategories: [facialCleanser, foodGrocery],
    });

    const caffeineContentAttr = await attributeRepo.save({
      name: 'Caffeine Content',
      type: AttributeType.SHORT_TEXT,
      directCategories: [beverages],
    });

    const sugarContentAttr = await attributeRepo.save({
      name: 'Sugar Content',
      type: AttributeType.SHORT_TEXT,
      directCategories: [beverages],
    });

    // Additional common attributes
    await attributeRepo.save({
      name: 'Pocket Number',
      type: AttributeType.SHORT_TEXT,
    });
    await attributeRepo.save({
      name: 'Product Dimensions',
      type: AttributeType.SHORT_TEXT,
    });
    await attributeRepo.save({
      name: 'Tags',
      type: AttributeType.MULTI_SELECT,
    });
    await attributeRepo.save({
      name: 'Usage Instructions',
      type: AttributeType.LONG_TEXT,
    });
    await attributeRepo.save({
      name: 'Preferred URL',
      type: AttributeType.URL,
    });

    console.log('Attributes created successfully');

    // Create products
    console.log('Creating products...');

    const productRepo = dataSource.getRepository(Product);
    const attributeValueRepo = dataSource.getRepository(AttributeValue);

    // Product 1: XiangPiaoPiao Milk Tea
    const milkTea = await productRepo.save({
      name: 'XiangPiaoPiao Milk Tea',
      description: 'Original flavor milk tea powder',
      category: flavouredDrinks,
      categoryId: flavouredDrinks.id,
    });

    await attributeValueRepo.save([
      { value: 'Original', productId: milkTea.id, attributeId: flavourAttr.id },
      { value: 'Brown', productId: milkTea.id, attributeId: colorAttr.id },
      {
        value: 'XiangPiaoPiao',
        productId: milkTea.id,
        attributeId: brandAttr.id,
      },
      {
        value: 'Instant preparation, great taste',
        productId: milkTea.id,
        attributeId: productBenefitsAttr.id,
      },
      {
        value: 'Medium',
        productId: milkTea.id,
        attributeId: sugarContentAttr.id,
      },
    ]);

    // Product 2: Strawberry Flavoured Drink
    const strawberryDrink = await productRepo.save({
      name: 'Strawberry Flavoured Drink',
      description: 'Refreshing strawberry flavored beverage',
      category: flavouredDrinks,
      categoryId: flavouredDrinks.id,
    });

    await attributeValueRepo.save([
      {
        value: 'Strawberry',
        productId: strawberryDrink.id,
        attributeId: flavourAttr.id,
      },
      {
        value: 'Pink',
        productId: strawberryDrink.id,
        attributeId: colorAttr.id,
      },
      {
        value: 'RefreshCo',
        productId: strawberryDrink.id,
        attributeId: brandAttr.id,
      },
      {
        value: 'High',
        productId: strawberryDrink.id,
        attributeId: sugarContentAttr.id,
      },
    ]);

    // Product 3: Energy Boost Drink
    const energyDrink = await productRepo.save({
      name: 'Energy Boost Drink',
      description: 'Energy drink with vitamins',
      category: healthEnergyDrinks,
      categoryId: healthEnergyDrinks.id,
    });

    await attributeValueRepo.save([
      {
        value: 'Berry',
        productId: energyDrink.id,
        attributeId: flavourAttr.id,
      },
      {
        value: 'EnergyMax',
        productId: energyDrink.id,
        attributeId: brandAttr.id,
      },
      {
        value: '80mg',
        productId: energyDrink.id,
        attributeId: caffeineContentAttr.id,
      },
      {
        value: 'Energy boost, vitamin enriched',
        productId: energyDrink.id,
        attributeId: productBenefitsAttr.id,
      },
    ]);

    console.log('Products created successfully');
    console.log('Database seeded successfully! 🎉');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Run the seed
seed().catch((error) => {
  console.error('Fatal error during seeding:', error);
  process.exit(1);
});
