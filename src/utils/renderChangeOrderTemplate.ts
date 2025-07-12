import Mustache from 'mustache';
import { formatCurrency, formatDate } from './formatters';

export interface ChangeItem {
  description: string;
  cost: number;
  formattedCost: string; // auto generated - leave blank
}

export interface CompanyInfo {
  name: string;
  address: string[];
  phone: string;
  email: string;
  contact: string;
}

export interface ClientInfo {
  name: string;
  address: string[];
}

export interface ChangeOrderData {
  company: CompanyInfo;
  client: ClientInfo;
  changeItems: ChangeItem[];
  project: string;
  date: string;
  formattedTotal: string;
  changeSummary: string; // A brief description of the change order
}

/**
 * Renders a Mustache template with the provided proposal data.
 * @param template - The HTML string containing Mustache syntax.
 * @param data - The dynamic data to inject into the template.
 * @returns The final HTML string with injected data.
 */
export function renderChangeOrderTemplate(template: string, data: ChangeOrderData): string {
  const total = data.changeItems.reduce((sum, s) => sum + s.cost, 0);

  // Inject computed + formatted properties
  const view: ChangeOrderData = {
    ...data,
    changeSummary: data.changeSummary || 'No change summary provided.',
    project: data.project || 'No project specified',
    // Format addresses by joining non-empty lines with <br>
    company: {
      ...data.company,
      address: data.company.address ? data.company.address.filter((line) => line.trim() !== '') : [],
    },
    client: {
      ...data.client,
      address: data.client.address ? data.client.address.filter((line) => line.trim() !== '') : [],
    },
    date: data.date,
    changeItems: data.changeItems.map((s) => ({
      ...s,
      formattedCost: formatCurrency(s.cost, true, false),
    })),
    formattedTotal: formatCurrency(total, true, false),
  };
  console.log('data ready to apply to template');
  return Mustache.render(template, view);
}
