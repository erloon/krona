export type IncomeSourceMetadata = Readonly<{
  label: string;
  description: string;
  clientName: string;
  invoiceNumber: string;
}>;

export function createIncomeSourceMetadata(params: {
  label: string;
  description?: string;
  clientName?: string;
  invoiceNumber?: string;
}): IncomeSourceMetadata {
  const label = params.label.trim();

  if (!label) {
    throw new Error('Income label is required.');
  }

  return Object.freeze({
    label,
    description: params.description?.trim() ?? '',
    clientName: params.clientName?.trim() ?? '',
    invoiceNumber: params.invoiceNumber?.trim() ?? '',
  });
}
