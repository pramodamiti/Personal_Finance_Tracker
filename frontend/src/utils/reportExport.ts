import { jsPDF } from 'jspdf';
import { formatCurrency } from './ui';

type GenericRow = Record<string, any>;

type ReportChartCapture = {
  title: string;
  description: string;
  details: string[];
  element: HTMLElement | null;
};

type ReportsPdfOptions = {
  from: string;
  to: string;
  categoryData: GenericRow[];
  trendData: GenericRow[];
  advancedTrendData: GenericRow[];
  netWorthData: GenericRow[];
  charts: ReportChartCapture[];
};

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const PAGE_MARGIN = 32;
const CHART_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const CHART_HEIGHT = 310;

function formatRangeLabel(date: string) {
  if (!date) {
    return '';
  }

  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, (month || 1) - 1, day || 1);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(parsed);
}

function formatPeriodLabel(period: string) {
  if (!period) {
    return '';
  }

  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-').map(Number);
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      year: 'numeric'
    }).format(new Date(year, month - 1, 1));
  }

  return period;
}

function formatPercent(value: unknown) {
  const numericValue = Number(value ?? 0);
  return `${Number.isFinite(numericValue) ? numericValue.toFixed(1) : '0.0'}%`;
}

function summarizeData(options: ReportsPdfOptions) {
  const totalCategorySpend = options.categoryData.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const topCategory = [...options.categoryData]
    .sort((left, right) => Number(right.amount ?? 0) - Number(left.amount ?? 0))[0];
  const latestTrend = options.trendData[options.trendData.length - 1];
  const latestSavings = options.advancedTrendData[options.advancedTrendData.length - 1];
  const latestNetWorth = options.netWorthData[options.netWorthData.length - 1];

  return [
    {
      label: 'Total spend',
      value: formatCurrency(totalCategorySpend),
      note: topCategory ? `Top category: ${topCategory.category} (${formatCurrency(topCategory.amount)})` : 'No category spend data'
    },
    {
      label: 'Latest month',
      value: latestTrend ? formatPeriodLabel(String(latestTrend.month ?? '')) : 'Unavailable',
      note: latestTrend
        ? `Income ${formatCurrency(latestTrend.income)} | Expense ${formatCurrency(latestTrend.expense)}`
        : 'No income vs expense data'
    },
    {
      label: 'Savings rate',
      value: latestSavings ? formatPercent(latestSavings.savingsRate) : 'Unavailable',
      note: latestSavings?.topCategory ? `Top spend: ${latestSavings.topCategory}` : 'No savings trend data'
    },
    {
      label: 'Net worth',
      value: latestNetWorth ? formatCurrency(latestNetWorth.netWorth) : 'Unavailable',
      note: latestNetWorth ? `As of ${formatPeriodLabel(String(latestNetWorth.month ?? ''))}` : 'No net worth data'
    }
  ];
}

async function svgElementToPngDataUrl(container: HTMLElement | null, darkMode: boolean) {
  if (!container) {
    return null;
  }

  const svg = container.querySelector('svg');
  if (!svg) {
    return null;
  }

  const bounds = container.getBoundingClientRect();
  const width = Math.max(Math.round(bounds.width), 960);
  const height = Math.max(Math.round(bounds.height), 380);
  const cloned = svg.cloneNode(true) as SVGSVGElement;

  cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  cloned.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  cloned.setAttribute('width', String(width));
  cloned.setAttribute('height', String(height));

  if (!cloned.getAttribute('viewBox')) {
    cloned.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(cloned);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(svgBlob);
  const image = new Image();

  return await new Promise<string | null>((resolve) => {
    image.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const context = canvas.getContext('2d');

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
        return;
      }

      context.scale(scale, scale);
      context.fillStyle = darkMode ? '#0f172a' : '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/png', 1));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    image.src = objectUrl;
  });
}

export async function downloadReportsPdf(options: ReportsPdfOptions) {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  const darkMode = document.documentElement.classList.contains('dark');
  const summaryCards = summarizeData(options);

  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
  pdf.setTextColor(248, 250, 252);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text('Financial Report', PAGE_MARGIN, 52);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Period: ${formatRangeLabel(options.from)} to ${formatRangeLabel(options.to)}`, PAGE_MARGIN, 74);
  pdf.text(`Generated on ${formatRangeLabel(new Date().toISOString().slice(0, 10))}`, PAGE_MARGIN, 92);

  summaryCards.forEach((card, index) => {
    const cardWidth = 180;
    const cardHeight = 82;
    const x = PAGE_MARGIN + index * (cardWidth + 14);
    const y = 122;

    pdf.setFillColor(19, 29, 54);
    pdf.roundedRect(x, y, cardWidth, cardHeight, 16, 16, 'F');
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(9);
    pdf.text(card.label.toUpperCase(), x + 14, y + 18);
    pdf.setTextColor(248, 250, 252);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(card.value, x + 14, y + 44);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184);
    pdf.text(pdf.splitTextToSize(card.note, cardWidth - 28), x + 14, y + 62);
  });

  let yCursor = 240;
  pdf.setTextColor(226, 232, 240);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text('Included charts', PAGE_MARGIN, yCursor);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(148, 163, 184);

  options.charts.forEach((chart, index) => {
    yCursor += 22;
    pdf.text(`${index + 1}. ${chart.title}: ${chart.description}`, PAGE_MARGIN, yCursor);
  });

  for (const chart of options.charts) {
    pdf.addPage('a4', 'landscape');
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
    pdf.setTextColor(248, 250, 252);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text(chart.title, PAGE_MARGIN, 42);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(148, 163, 184);
    pdf.text(chart.description, PAGE_MARGIN, 62);

    const chartImage = await svgElementToPngDataUrl(chart.element, darkMode);
    if (chartImage) {
      pdf.addImage(chartImage, 'PNG', PAGE_MARGIN, 86, CHART_WIDTH, CHART_HEIGHT, undefined, 'FAST');
    }

    pdf.setTextColor(226, 232, 240);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Details', PAGE_MARGIN, 430);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184);

    chart.details.forEach((detail, index) => {
      const lines = pdf.splitTextToSize(`- ${detail}`, CHART_WIDTH);
      pdf.text(lines, PAGE_MARGIN, 450 + index * 28);
    });
  }

  pdf.save(`financial-report-${options.from}-to-${options.to}.pdf`);
}
