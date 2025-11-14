<template>
  <div>
    <div class="page-header">
      <h2>Dashboard</h2>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Clients</h3>
        <div class="value">{{ stats.totalClients || 0 }}</div>
      </div>
      <div class="stat-card">
        <h3>Total Eggs Today</h3>
        <div class="value">{{ stats.totalEggsToday || 0 }}</div>
      </div>
      <div class="stat-card">
        <h3>Pending Issues</h3>
        <div class="value">{{ stats.pendingIssues || 0 }}</div>
      </div>
      <div class="stat-card">
        <h3>Stock Balance</h3>
        <div class="value">{{ stats.stockBalance || 0 }}</div>
      </div>
      <div class="stat-card">
        <h3>Total Eggs Sold</h3>
        <div class="value">{{ stats.totalEggsSold || 0 }}</div>
      </div>
      <div class="stat-card">
        <h3>Total Sales</h3>
        <div class="value">${{ formatCurrency(stats.totalSales || 0) }}</div>
      </div>
      <div class="stat-card">
        <h3>Sales Today</h3>
        <div class="value">${{ formatCurrency(stats.totalSalesToday || 0) }}</div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom: 1rem;">Sales Trend (Last 30 Days)</h3>
      <div style="position: relative; height: 400px; width: 100%;">
        <canvas ref="chartCanvas" id="salesChart"></canvas>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom: 1rem;">Eggs Production Trend (Last 30 Days)</h3>
      <div style="position: relative; height: 400px; width: 100%;">
        <canvas ref="productionChartCanvas" id="productionChart"></canvas>
      </div>
    </div>

    <div v-if="overdueAlerts.length > 0" class="card" style="border-left: 4px solid #dc3545;">
      <h3 style="margin-bottom: 1rem; color: #dc3545;">Overdue Alerts</h3>
      <div v-for="alert in overdueAlerts" :key="alert.issue_id" class="alert-item">
        <strong>{{ alert.client_name }}</strong> has an overdue payment of 
        <strong>${{ alert.total_price }}</strong> (Expected: {{ formatDate(alert.expected_payment_date) }})
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import api from '../services/api'
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineController
} from 'chart.js'

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineController
)

console.log('Chart.js registered successfully')

const stats = ref({
  totalClients: 0,
  totalEggsToday: 0,
  pendingIssues: 0,
  stockBalance: 0,
  totalEggsSold: 0,
  totalSales: 0,
  totalSalesToday: 0
})

const overdueAlerts = ref([])
const chartCanvas = ref(null)
const productionChartCanvas = ref(null)
let chartInstance = null
let productionChartInstance = null

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const formatCurrency = (amount) => {
  return parseFloat(amount).toFixed(2)
}

const createChart = (chartData) => {
  console.log('createChart called with data:', chartData)
  
  if (!chartCanvas.value) {
    console.error('Chart canvas not available, trying to find by ID...')
    const canvasEl = document.getElementById('salesChart')
    if (canvasEl) {
      console.log('Found canvas by ID')
      chartCanvas.value = canvasEl
    } else {
      console.error('Chart canvas not available and not found by ID')
      return
    }
  }
  
  if (!chartData || chartData.length === 0) {
    console.warn('No chart data available')
    return
  }
  
  // Destroy existing chart if it exists
  if (chartInstance) {
    console.log('Destroying existing chart')
    chartInstance.destroy()
    chartInstance = null
  }
  
  try {
    const labels = chartData.map(item => {
      // Handle date string format from API
      const dateStr = item.date
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateStr)
        return dateStr
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })
    
    const salesData = chartData.map(item => parseFloat(item.sales || 0))
    const eggsData = chartData.map(item => parseInt(item.eggs_sold || 0))
    
    console.log('Creating chart with data:', { 
      labelsCount: labels.length, 
      salesDataSample: salesData.slice(0, 5),
      eggsDataSample: eggsData.slice(0, 5),
      canvasElement: chartCanvas.value
    })
    
    chartInstance = new Chart(chartCanvas.value, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Sales ($)',
            data: salesData,
            borderColor: '#2c5f7c',
            backgroundColor: 'rgba(44, 95, 124, 0.1)',
            tension: 0.4,
            yAxisID: 'y',
            fill: true
          },
          {
            label: 'Eggs Sold',
            data: eggsData,
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            tension: 0.4,
            yAxisID: 'y1',
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (context.datasetIndex === 0) {
                  return `Sales: $${formatCurrency(context.parsed.y)}`
                } else {
                  return `Eggs Sold: ${context.parsed.y}`
                }
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Sales ($)'
            },
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Eggs Sold'
            },
            grid: {
              drawOnChartArea: false
            },
            beginAtZero: true
          }
        }
      }
    })
    
    console.log('Chart created successfully')
  } catch (error) {
    console.error('Error creating chart:', error)
  }
}

const createProductionChart = (chartData) => {
  console.log('createProductionChart called with data:', chartData)
  
  if (!productionChartCanvas.value) {
    console.error('Production chart canvas not available, trying to find by ID...')
    const canvasEl = document.getElementById('productionChart')
    if (canvasEl) {
      console.log('Found production canvas by ID')
      productionChartCanvas.value = canvasEl
    } else {
      console.error('Production chart canvas not available and not found by ID')
      return
    }
  }
  
  if (!chartData || chartData.length === 0) {
    console.warn('No production chart data available')
    return
  }
  
  // Destroy existing chart if it exists
  if (productionChartInstance) {
    console.log('Destroying existing production chart')
    productionChartInstance.destroy()
    productionChartInstance = null
  }
  
  try {
    const labels = chartData.map(item => {
      const dateStr = item.date
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateStr)
        return dateStr
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })
    
    const totalEggsData = chartData.map(item => parseInt(item.total_eggs || 0))
    const normalEggsData = chartData.map(item => parseInt(item.normal_eggs || 0))
    const pollutedEggsData = chartData.map(item => parseInt(item.polluted_eggs || 0))
    const crackedEggsData = chartData.map(item => parseInt(item.cracked_eggs || 0))
    
    console.log('Creating production chart with data:', { 
      labelsCount: labels.length, 
      totalEggsSample: totalEggsData.slice(0, 5),
      canvasElement: productionChartCanvas.value
    })
    
    productionChartInstance = new Chart(productionChartCanvas.value, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Eggs',
            data: totalEggsData,
            borderColor: '#2c5f7c',
            backgroundColor: 'rgba(44, 95, 124, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Normal Eggs',
            data: normalEggsData,
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Polluted Eggs',
            data: pollutedEggsData,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Cracked Eggs',
            data: crackedEggsData,
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y}`
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Number of Eggs'
            },
            beginAtZero: true
          }
        }
      }
    })
    
    console.log('Production chart created successfully')
  } catch (error) {
    console.error('Error creating production chart:', error)
  }
}

const loadStats = async () => {
  try {
    const response = await api.get('/dashboard/stats')
    console.log('Dashboard stats response:', response.data)
    
    stats.value = {
      totalClients: response.data.total_clients,
      totalEggsToday: response.data.total_eggs_today,
      pendingIssues: response.data.pending_issues,
      stockBalance: response.data.stock_balance,
      totalEggsSold: response.data.total_eggs_sold,
      totalSales: response.data.total_sales,
      totalSalesToday: response.data.total_sales_today
    }
    overdueAlerts.value = response.data.overdue_alerts || []
    
    // Create charts after data is loaded
    await nextTick()
    
    // Create sales chart
    if (response.data.sales_chart_data && response.data.sales_chart_data.length > 0) {
      console.log('Sales chart data received:', response.data.sales_chart_data.length, 'data points')
      setTimeout(() => {
        console.log('Attempting to create sales chart, canvas ref:', chartCanvas.value)
        if (chartCanvas.value) {
          createChart(response.data.sales_chart_data)
        } else {
          console.error('Sales canvas element not found!')
          setTimeout(() => {
            if (chartCanvas.value) {
              createChart(response.data.sales_chart_data)
            } else {
              console.error('Sales canvas still not found after retry')
            }
          }, 200)
        }
      }, 200)
    } else {
      console.warn('No sales chart data available')
    }
    
    // Create production chart
    if (response.data.production_chart_data && response.data.production_chart_data.length > 0) {
      console.log('Production chart data received:', response.data.production_chart_data.length, 'data points')
      setTimeout(() => {
        console.log('Attempting to create production chart, canvas ref:', productionChartCanvas.value)
        if (productionChartCanvas.value) {
          createProductionChart(response.data.production_chart_data)
        } else {
          console.error('Production canvas element not found!')
          setTimeout(() => {
            if (productionChartCanvas.value) {
              createProductionChart(response.data.production_chart_data)
            } else {
              console.error('Production canvas still not found after retry')
            }
          }, 200)
        }
      }, 300)
    } else {
      console.warn('No production chart data available')
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

