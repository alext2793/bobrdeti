var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * PostSubCategory Model
 * ==================
 */

var PostSubCategory = new keystone.List('PostSubCategory', {
  autokey: { from: 'name', path: 'key', unique: true },
  label: 'Подкатегории статей',
});

PostSubCategory.add({
  name: { label:'Название',type: String, required: true },
  parentCategory: { type: Types.Relationship, ref: 'PostCategory', required: true, initial: true }
});

PostSubCategory.defaultColumns = 'name';

PostSubCategory.register();
