/** Mirrors private.job_cost_catalog_key in the catalog migration. */
export function normalizeJobCostCatalogKey(value: string): string {
  return value.trim().toLocaleLowerCase('fr-FR').replace(/\s+/g, ' ')
    .replace(/(^| )de /g, '$1')
    .replace(/([0-9]) (kg|g|ml|l|mm|cm|m)([0-9]*)( |$)/g, '$1$2$3$4');
}
