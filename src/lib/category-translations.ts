/**
 * Helper function to translate category names based on locale
 */
export function translateCategoryName(categoryName: string, t: (key: string) => string): string {
  if (!categoryName) return categoryName
  
  try {
    // Try to find translation for the category name
    const translationKey = `categories.${categoryName}`
    const translated = t(translationKey)
    
    // If translation exists and is different from the key, return it
    // Otherwise return the original name (for custom categories)
    return translated !== translationKey ? translated : categoryName
  } catch (error) {
    // If there's any error with translation, return original name
    console.warn('Error translating category:', categoryName, error)
    return categoryName
  }
}

/**
 * Transform category object to include translated name
 */
export function translateCategory(category: any, t: (key: string) => string) {
  return {
    ...category,
    name: translateCategoryName(category.name, t)
  }
}

/**
 * Transform array of categories to include translated names
 */
export function translateCategories(categories: any[], t: (key: string) => string) {
  return categories.map(category => translateCategory(category, t))
}