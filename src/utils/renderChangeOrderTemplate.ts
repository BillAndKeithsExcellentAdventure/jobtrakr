import Mustache from 'mustache';
import { formatCurrency, formatDate } from './formatters';

interface ChangeItem {
  description: string;
  cost: number;
  formattedCost: string;
}

interface CompanyInfo {
  name: string;
  address: string[];
  formattedAddress: string; // street/po box number<br>City, State ZIP<br>
  phone: string;
  email: string;
  contact: string;
}

interface ClientInfo {
  name: string;
  address: string[];
  formattedAddress: string; // street/po box number<br>City, State ZIP<br>
}

export interface ProposalData {
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
export function renderChangeOrderTemplate(template: string, data: ProposalData): string {
  const total = data.changeItems.reduce((sum, s) => sum + s.cost, 0);

  // Inject computed + formatted properties
  const view: ProposalData = {
    company: {
      ...data.company,
      formattedAddress: data.company.address.filter((line) => line.trim() !== '').join('<br>'),
    },
    client: {
      ...data.client,
      formattedAddress: data.client.address.filter((line) => line.trim() !== '').join('<br>'),
    },
    date: formatDate(data.date),
    changeItems: data.changeItems.map((s) => ({
      ...s,
      formattedCost: formatCurrency(s.cost, true, false),
    })),
    formattedTotal: formatCurrency(total, true, false),
  };
  return Mustache.render(template, view);
}
