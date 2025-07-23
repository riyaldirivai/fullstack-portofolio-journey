/**
 * ProgressCharts Component
 * 
 * Advanced data visualization component with multiple chart types,
 * interactive features, and comprehensive analytics
 */

interface ProgressChartsProps {
  userId: string;
  dateRange?: 'week' | 'month' | 'quarter' | 'year';
  chartType?: 'line' | 'bar' | 'doughnut' | 'area';
  onChartTypeChange?: (type: string) => void;
  onDataPointClick?: (data: ChartDataPoint) => void;
  className?: string;
  showLegend?: boolean;
  showTooltips?: boolean;
  animationEnabled?: boolean;
}

interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
  category: string;
  metadata?: any;
}

interface ChartDataset {
  label: string;
  data: ChartDataPoint[];
  color: string;
  fillColor?: string;
  borderWidth?: number;
  tension?: number;
}

interface ChartConfig {
  type: 'line' | 'bar' | 'doughnut' | 'area';
  datasets: ChartDataset[];
  labels: string[];
  options: {
    responsive: boolean;
    maintainAspectRatio: boolean;
    showGrid: boolean;
    showAxes: boolean;
    animations: boolean;
  };
}

interface AnalyticsMetrics {
  totalGoalsProgress: number;
  averageDailyFocus: number;
  productivityTrend: 'up' | 'down' | 'stable';
  peakPerformanceDay: string;
  improvementAreas: string[];
  achievements: number;
}

/**
 * ProgressCharts - Advanced data visualization with multiple chart types
 */
class ProgressCharts {
  private props: ProgressChartsProps;
  private chartData: ChartConfig | null;
  private analyticsData: AnalyticsMetrics | null;
  private isLoading: boolean;
  private error: string | null;
  private selectedChart: string;
  private hoveredDataPoint: ChartDataPoint | null;

  constructor(props: ProgressChartsProps) {
    this.props = {
      dateRange: 'month',
      chartType: 'line',
      className: '',
      showLegend: true,
      showTooltips: true,
      animationEnabled: true,
      ...props
    };
    
    this.chartData = null;
    this.analyticsData = null;
    this.isLoading = false;
    this.error = null;
    this.selectedChart = this.props.chartType || 'line';
    this.hoveredDataPoint = null;

    this.loadChartData();
  }

  private async loadChartData(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.rerender();

    try {
      // Simulate API call
      const response = await fetch(`/api/dashboard/charts?userId=${this.props.userId}&range=${this.props.dateRange}&type=${this.selectedChart}`);
      if (!response.ok) {
        throw new Error('Failed to load chart data');
      }
      
      const data = await response.json();
      this.chartData = data.chartConfig;
      this.analyticsData = data.analytics;
      this.isLoading = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Unknown error occurred';
      this.isLoading = false;
      this.loadMockData();
    }
    
    this.rerender();
  }

  private loadMockData(): void {
    const labels = this.generateDateLabels();
    
    this.chartData = {
      type: this.selectedChart as any,
      labels,
      datasets: [
        {
          label: 'Goals Progress',
          data: labels.map((date, index) => ({
            date,
            value: Math.floor(Math.random() * 40) + 60 + (index * 2),
            label: 'Goals Progress',
            category: 'goals'
          })),
          color: '#3b82f6',
          fillColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          tension: 0.4
        },
        {
          label: 'Focus Time (hours)',
          data: labels.map((date, index) => ({
            date,
            value: Math.floor(Math.random() * 4) + 3 + (index * 0.2),
            label: 'Focus Time',
            category: 'timer'
          })),
          color: '#ef4444',
          fillColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 3,
          tension: 0.4
        },
        {
          label: 'Productivity Score',
          data: labels.map((date, index) => ({
            date,
            value: Math.floor(Math.random() * 30) + 70 + (index * 1.5),
            label: 'Productivity Score',
            category: 'productivity'
          })),
          color: '#10b981',
          fillColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          tension: 0.4
        }
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        showGrid: true,
        showAxes: true,
        animations: this.props.animationEnabled || true
      }
    };

    this.analyticsData = {
      totalGoalsProgress: 78.5,
      averageDailyFocus: 4.2,
      productivityTrend: 'up',
      peakPerformanceDay: 'Wednesday',
      improvementAreas: ['Morning focus', 'Weekend consistency'],
      achievements: 12
    };
  }

  private generateDateLabels(): string[] {
    const labels: string[] = [];
    const now = new Date();
    
    switch (this.props.dateRange) {
      case 'week':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        break;
      case 'month':
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.getDate().toString());
        }
        break;
      case 'quarter':
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - (i * 7));
          labels.push(`W${Math.floor(i / 7) + 1}`);
        }
        break;
      case 'year':
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        }
        break;
    }
    
    return labels;
  }

  private handleChartTypeChange(type: string): void {
    this.selectedChart = type;
    if (this.props.onChartTypeChange) {
      this.props.onChartTypeChange(type);
    }
    this.loadChartData();
  }

  private handleDateRangeChange(range: string): void {
    this.props.dateRange = range as any;
    this.loadChartData();
  }

  private handleDataPointHover(dataPoint: ChartDataPoint | null): void {
    this.hoveredDataPoint = dataPoint;
    this.rerender();
  }

  private handleDataPointClick(dataPoint: ChartDataPoint): void {
    if (this.props.onDataPointClick) {
      this.props.onDataPointClick(dataPoint);
    }
  }

  private getMaxValue(datasets: ChartDataset[]): number {
    let max = 0;
    datasets.forEach(dataset => {
      dataset.data.forEach(point => {
        if (point.value > max) max = point.value;
      });
    });
    return Math.ceil(max * 1.1);
  }

  private renderChartControls(): string {
    return `
      <div class="flex flex-wrap items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <!-- Chart Type Selector -->
        <div class="flex items-center space-x-2 mb-2 md:mb-0">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Chart Type:</span>
          <div class="flex space-x-1 bg-white dark:bg-gray-600 rounded-lg p-1">
            ${['line', 'bar', 'area', 'doughnut'].map(type => `
              <button onclick="progressCharts.handleChartTypeChange('${type}')"
                      class="px-3 py-1 text-sm rounded ${this.selectedChart === type ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'} transition-colors">
                ${type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Date Range Selector -->
        <div class="flex items-center space-x-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</span>
          <select onchange="progressCharts.handleDateRangeChange(this.value)"
                  class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white">
            <option value="week" ${this.props.dateRange === 'week' ? 'selected' : ''}>Last 7 Days</option>
            <option value="month" ${this.props.dateRange === 'month' ? 'selected' : ''}>Last 30 Days</option>
            <option value="quarter" ${this.props.dateRange === 'quarter' ? 'selected' : ''}>Last Quarter</option>
            <option value="year" ${this.props.dateRange === 'year' ? 'selected' : ''}>Last Year</option>
          </select>
        </div>
      </div>
    `;
  }

  private renderLineChart(): string {
    if (!this.chartData) return '';

    const maxValue = this.getMaxValue(this.chartData.datasets);
    const chartHeight = 300;
    const chartWidth = 600;
    const padding = 60;

    return `
      <div class="relative bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Progress Trends</h3>
        
        <div class="relative" style="height: ${chartHeight}px;">
          <svg width="100%" height="100%" viewBox="0 0 ${chartWidth} ${chartHeight}" class="overflow-visible">
            <!-- Grid lines -->
            ${Array.from({ length: 6 }, (_, i) => {
              const y = padding + (i * (chartHeight - 2 * padding)) / 5;
              return `<line x1="${padding}" y1="${y}" x2="${chartWidth - padding}" y2="${y}" stroke="#e5e7eb" stroke-width="1" opacity="0.5" />`;
            }).join('')}
            
            <!-- Y-axis labels -->
            ${Array.from({ length: 6 }, (_, i) => {
              const y = padding + (i * (chartHeight - 2 * padding)) / 5;
              const value = Math.round(maxValue - (i * maxValue) / 5);
              return `<text x="${padding - 10}" y="${y + 5}" text-anchor="end" class="text-xs fill-gray-500 dark:fill-gray-400">${value}</text>`;
            }).join('')}

            <!-- Dataset lines -->
            ${this.chartData.datasets.map((dataset, datasetIndex) => {
              const points = dataset.data.map((point, index) => {
                const x = padding + (index * (chartWidth - 2 * padding)) / (dataset.data.length - 1);
                const y = padding + ((maxValue - point.value) * (chartHeight - 2 * padding)) / maxValue;
                return `${x},${y}`;
              }).join(' ');

              const areaPoints = dataset.data.map((point, index) => {
                const x = padding + (index * (chartWidth - 2 * padding)) / (dataset.data.length - 1);
                const y = padding + ((maxValue - point.value) * (chartHeight - 2 * padding)) / maxValue;
                return `${x},${y}`;
              });
              areaPoints.push(`${chartWidth - padding},${chartHeight - padding}`);
              areaPoints.unshift(`${padding},${chartHeight - padding}`);

              return `
                <!-- Area fill -->
                ${this.selectedChart === 'area' ? `
                  <polygon points="${areaPoints.join(' ')}" fill="${dataset.fillColor}" opacity="0.3" />
                ` : ''}
                
                <!-- Line -->
                <polyline
                  fill="none"
                  stroke="${dataset.color}"
                  stroke-width="${dataset.borderWidth}"
                  points="${points}"
                  style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));"
                />
                
                <!-- Data points -->
                ${dataset.data.map((point, index) => {
                  const x = padding + (index * (chartWidth - 2 * padding)) / (dataset.data.length - 1);
                  const y = padding + ((maxValue - point.value) * (chartHeight - 2 * padding)) / maxValue;
                  return `
                    <circle cx="${x}" cy="${y}" r="4" fill="${dataset.color}" class="cursor-pointer hover:r-6 transition-all"
                            onmouseover="progressCharts.handleDataPointHover(${JSON.stringify(point).replace(/"/g, '&quot;')})"
                            onmouseout="progressCharts.handleDataPointHover(null)"
                            onclick="progressCharts.handleDataPointClick(${JSON.stringify(point).replace(/"/g, '&quot;')})">
                      <title>${point.label}: ${point.value}</title>
                    </circle>
                  `;
                }).join('')}
              `;
            }).join('')}

            <!-- X-axis labels -->
            ${this.chartData.labels.map((label, index) => {
              const x = padding + (index * (chartWidth - 2 * padding)) / (this.chartData!.labels.length - 1);
              return `<text x="${x}" y="${chartHeight - padding + 20}" text-anchor="middle" class="text-xs fill-gray-500 dark:fill-gray-400">${label}</text>`;
            }).join('')}
          </svg>
          
          <!-- Tooltip -->
          ${this.hoveredDataPoint ? `
            <div class="absolute top-4 right-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-2 rounded-lg shadow-lg text-sm">
              <div class="font-medium">${this.hoveredDataPoint.label}</div>
              <div>Value: ${this.hoveredDataPoint.value}</div>
              <div>Date: ${this.hoveredDataPoint.date}</div>
            </div>
          ` : ''}
        </div>

        <!-- Legend -->
        ${this.props.showLegend ? `
          <div class="flex flex-wrap items-center justify-center mt-4 space-x-6">
            ${this.chartData.datasets.map(dataset => `
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-full" style="background-color: ${dataset.color}"></div>
                <span class="text-sm text-gray-600 dark:text-gray-400">${dataset.label}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderBarChart(): string {
    if (!this.chartData) return '';

    const maxValue = this.getMaxValue(this.chartData.datasets);
    const chartHeight = 300;
    const chartWidth = 600;
    const padding = 60;
    const barWidth = (chartWidth - 2 * padding) / (this.chartData.labels.length * this.chartData.datasets.length + this.chartData.labels.length);

    return `
      <div class="relative bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Progress Comparison</h3>
        
        <div class="relative" style="height: ${chartHeight}px;">
          <svg width="100%" height="100%" viewBox="0 0 ${chartWidth} ${chartHeight}">
            <!-- Grid lines -->
            ${Array.from({ length: 6 }, (_, i) => {
              const y = padding + (i * (chartHeight - 2 * padding)) / 5;
              return `<line x1="${padding}" y1="${y}" x2="${chartWidth - padding}" y2="${y}" stroke="#e5e7eb" stroke-width="1" opacity="0.5" />`;
            }).join('')}
            
            <!-- Y-axis labels -->
            ${Array.from({ length: 6 }, (_, i) => {
              const y = padding + (i * (chartHeight - 2 * padding)) / 5;
              const value = Math.round(maxValue - (i * maxValue) / 5);
              return `<text x="${padding - 10}" y="${y + 5}" text-anchor="end" class="text-xs fill-gray-500 dark:fill-gray-400">${value}</text>`;
            }).join('')}

            <!-- Bars -->
            ${this.chartData.datasets.map((dataset, datasetIndex) => 
              dataset.data.map((point, pointIndex) => {
                const x = padding + (pointIndex * (chartWidth - 2 * padding)) / this.chartData!.labels.length + (datasetIndex * barWidth);
                const height = (point.value * (chartHeight - 2 * padding)) / maxValue;
                const y = chartHeight - padding - height;
                
                return `
                  <rect x="${x}" y="${y}" width="${barWidth * 0.8}" height="${height}" 
                        fill="${dataset.color}" opacity="0.8" class="cursor-pointer hover:opacity-100 transition-opacity"
                        onmouseover="progressCharts.handleDataPointHover(${JSON.stringify(point).replace(/"/g, '&quot;')})"
                        onmouseout="progressCharts.handleDataPointHover(null)"
                        onclick="progressCharts.handleDataPointClick(${JSON.stringify(point).replace(/"/g, '&quot;')})">
                    <title>${point.label}: ${point.value}</title>
                  </rect>
                `;
              }).join('')
            ).join('')}

            <!-- X-axis labels -->
            ${this.chartData.labels.map((label, index) => {
              const x = padding + (index * (chartWidth - 2 * padding)) / this.chartData!.labels.length + (barWidth * this.chartData!.datasets.length) / 2;
              return `<text x="${x}" y="${chartHeight - padding + 20}" text-anchor="middle" class="text-xs fill-gray-500 dark:fill-gray-400">${label}</text>`;
            }).join('')}
          </svg>
        </div>

        <!-- Legend -->
        ${this.props.showLegend ? `
          <div class="flex flex-wrap items-center justify-center mt-4 space-x-6">
            ${this.chartData.datasets.map(dataset => `
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-sm" style="background-color: ${dataset.color}"></div>
                <span class="text-sm text-gray-600 dark:text-gray-400">${dataset.label}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderDoughnutChart(): string {
    if (!this.chartData) return '';

    // Calculate total for percentage
    const totalValue = this.chartData.datasets[0].data.reduce((sum, point) => sum + point.value, 0);
    const centerX = 150;
    const centerY = 150;
    const radius = 80;
    let currentAngle = -90; // Start from top

    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Progress Distribution</h3>
        
        <div class="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-8">
          <!-- Chart -->
          <div class="relative">
            <svg width="300" height="300" viewBox="0 0 300 300">
              <!-- Doughnut segments -->
              ${this.chartData.datasets[0].data.map((point, index) => {
                const percentage = (point.value / totalValue) * 100;
                const angle = (percentage / 100) * 360;
                const startAngle = (currentAngle * Math.PI) / 180;
                const endAngle = ((currentAngle + angle) * Math.PI) / 180;
                
                const x1 = centerX + radius * Math.cos(startAngle);
                const y1 = centerY + radius * Math.sin(startAngle);
                const x2 = centerX + radius * Math.cos(endAngle);
                const y2 = centerY + radius * Math.sin(endAngle);
                
                const largeArc = angle > 180 ? 1 : 0;
                const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                
                currentAngle += angle;
                
                const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
                const color = colors[index % colors.length];
                
                return `
                  <path d="${pathData}" fill="${color}" opacity="0.8" class="cursor-pointer hover:opacity-100 transition-opacity"
                        onmouseover="progressCharts.handleDataPointHover(${JSON.stringify(point).replace(/"/g, '&quot;')})"
                        onmouseout="progressCharts.handleDataPointHover(null)"
                        onclick="progressCharts.handleDataPointClick(${JSON.stringify(point).replace(/"/g, '&quot;')})">
                    <title>${point.label}: ${point.value} (${percentage.toFixed(1)}%)</title>
                  </path>
                `;
              }).join('')}
              
              <!-- Center hole -->
              <circle cx="${centerX}" cy="${centerY}" r="40" fill="white" class="dark:fill-gray-800" />
              
              <!-- Center text -->
              <text x="${centerX}" y="${centerY - 5}" text-anchor="middle" class="text-lg font-bold fill-gray-900 dark:fill-white">
                ${totalValue}
              </text>
              <text x="${centerX}" y="${centerY + 15}" text-anchor="middle" class="text-sm fill-gray-600 dark:fill-gray-400">
                Total
              </text>
            </svg>
          </div>
          
          <!-- Legend -->
          <div class="space-y-3">
            ${this.chartData.datasets[0].data.map((point, index) => {
              const percentage = (point.value / totalValue) * 100;
              const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
              const color = colors[index % colors.length];
              
              return `
                <div class="flex items-center space-x-3">
                  <div class="w-4 h-4 rounded-sm" style="background-color: ${color}"></div>
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">${point.label}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">${point.value} (${percentage.toFixed(1)}%)</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  private renderAnalytics(): string {
    if (!this.analyticsData) return '';

    const { analyticsData } = this;
    
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Analytics Insights</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${analyticsData.totalGoalsProgress}%</div>
            <div class="text-sm text-blue-800 dark:text-blue-300">Avg Goal Progress</div>
          </div>
          <div class="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">${analyticsData.averageDailyFocus}h</div>
            <div class="text-sm text-green-800 dark:text-green-300">Daily Focus Time</div>
          </div>
          <div class="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">${analyticsData.achievements}</div>
            <div class="text-sm text-purple-800 dark:text-purple-300">Achievements</div>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span class="text-sm font-medium text-gray-900 dark:text-white">Productivity Trend</span>
            <span class="text-sm ${analyticsData.productivityTrend === 'up' ? 'text-green-600 dark:text-green-400' : 
                                  analyticsData.productivityTrend === 'down' ? 'text-red-600 dark:text-red-400' : 
                                  'text-yellow-600 dark:text-yellow-400'}">
              ${analyticsData.productivityTrend === 'up' ? '↗️ Improving' : 
                analyticsData.productivityTrend === 'down' ? '↘️ Declining' : '➡️ Stable'}
            </span>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span class="text-sm font-medium text-gray-900 dark:text-white">Peak Performance Day</span>
            <span class="text-sm text-gray-600 dark:text-gray-400">${analyticsData.peakPerformanceDay}</span>
          </div>
          
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="text-sm font-medium text-gray-900 dark:text-white mb-2">Areas for Improvement</div>
            <div class="space-y-1">
              ${analyticsData.improvementAreas.map(area => `
                <div class="text-sm text-gray-600 dark:text-gray-400">• ${area}</div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderChart(): string {
    if (!this.chartData) return '';

    switch (this.selectedChart) {
      case 'line':
      case 'area':
        return this.renderLineChart();
      case 'bar':
        return this.renderBarChart();
      case 'doughnut':
        return this.renderDoughnutChart();
      default:
        return this.renderLineChart();
    }
  }

  private renderLoading(): string {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div class="animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div class="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div class="flex space-x-4">
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        </div>
      </div>
    `;
  }

  private rerender(): void {
    const container = document.getElementById('progressChartsContainer');
    if (container) {
      container.innerHTML = this.render();
    }
  }

  public render(): string {
    // Store instance globally for event handlers
    (window as any).progressCharts = this;

    return `
      <div id="progressChartsContainer" class="progress-charts ${this.props.className}">
        ${this.renderChartControls()}
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            ${this.isLoading ? this.renderLoading() : this.renderChart()}
          </div>
          
          <div>
            ${this.isLoading ? this.renderLoading() : this.renderAnalytics()}
          </div>
        </div>
      </div>
    `;
  }

  public updateDateRange(range: string): void {
    this.props.dateRange = range as any;
    this.loadChartData();
  }

  public static create(props: ProgressChartsProps): ProgressCharts {
    return new ProgressCharts(props);
  }
}

// Export for use in other components
export { ProgressCharts };
export type { ProgressChartsProps, ChartDataPoint, ChartDataset, ChartConfig, AnalyticsMetrics };
