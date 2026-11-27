import { menu } from './config.js';

export const productFields = {
  name_ru: ['Название · русский', 250, true],
  name_it: ['Название · italiano', 250, true],
  subtitle_ru: ['Подзаголовок · русский', 250],
  subtitle_it: ['Подзаголовок · italiano', 250],
  desc_ru: ['Описание · русский', 5000],
  desc_it: ['Описание · italiano', 5000],
  usage_ru: ['Применение · русский', 5000],
  usage_it: ['Применение · italiano', 5000],
  producer: ['Производитель', 250],
  format: ['Фасовка', 250],
  pack: ['Упаковка', 250],
  spec: ['Характеристики', 500],
  storage: ['Хранение', 500],
};

export function findProduct(categoryId, slug) {
  return menu.categories.find((category) => category.id === categoryId)
    ?.products.find((product) => product.slug === slug);
}

export function editableProducts(repo) {
  const edits = new Map(repo.catalogEdits().map((edit) => [`${edit.category}/${edit.slug}`, edit]));
  return {
    fields: productFields,
    categories: menu.categories.filter((category) => category.products.length).map((category) => ({
      id: category.id,
      name: category.name_ru,
      products: category.products.map((product) => {
        const edit = edits.get(`${category.id}/${product.slug}`);
        const values = edit?.values ?? product;
        return {
          slug: product.slug,
          image: product.image,
          url: `/catalog/${category.slug}/${product.slug}/`,
          revision: edit?.revision ?? 0,
          values: Object.fromEntries(Object.keys(productFields).map((field) => [field, values[field] ?? ''])),
        };
      }),
    })),
  };
}

export function validateProductEdit(body) {
  const values = {};
  const errors = {};
  for (const [field, [, limit, required]] of Object.entries(productFields)) {
    const value = body?.values?.[field];
    if (typeof value !== 'string' || value.length > limit || (required && !value.trim())) {
      errors[field] = 'Проверьте значение поля';
    } else {
      values[field] = value.trim();
    }
  }
  return { values, errors };
}
