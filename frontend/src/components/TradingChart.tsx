import ReactApexChart from 'react-apexcharts'
import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'

interface ChartData {
  x: Date
  y: [number, number, number, number]
}

interface TradingChartProps {
  data: { time: number; value: number }[];
  height: number;
  digits: number;
  symbol: string;
  isExpanded: boolean;
}

const TradingChart = ({ symbol, isExpanded, digits }: TradingChartProps) => {
  const [timeframe, setTimeframe] = useState('D1')
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick')
  const [series, setSeries] = useState<{ name: string; data: ChartData[] }[]>([])
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const { data } = await apiClient.get(`/historical-data/${symbol}?timeframe=${timeframe}`)
        
        const chartData = data.data.map((d: number[]) => ({
          x: new Date(d[0] * 1000).getTime(), // Convertir en timestamp
          y: [d[1], d[2], d[3], d[4]]
        }))

        setSeries([{ 
          name: 'Price',
          data: chartData 
        }])

      } catch (error) {
        console.error('Error fetching historical data:', error)
      }
    }

    fetchHistoricalData()
  }, [symbol, timeframe])

  useEffect(() => {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    setTheme(currentTheme)
  }, [])

  // Configuration dynamique de l'axe X en fonction du timeframe
  const getXAxisConfig = () => {
    const commonConfig = {
      type: 'datetime' as const,
      labels: {
        show: isExpanded,
        formatter: (value: string, timestamp?: number) => {
          const date = new Date(value)
          
          switch(timeframe) {
            case 'M1': 
              return date.toLocaleTimeString('fr', { minute: '2-digit', second: '2-digit' })
            case 'H1':
              return date.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })
            case 'D1':
              return date.toLocaleDateString('fr', { day: '2-digit', month: 'short' })
            case 'W1':
              return date.toLocaleDateString('fr', { month: 'short', year: '2-digit' })
            default:
              return value.toString()
          }
        }
      }
    }

    return commonConfig
  }

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: chartType,
      height: '100%',
      animations: {
        enabled: false
      },
      zoom: { // Configuration du zoom dynamique
        autoScaleYaxis: false,
        enabled: isExpanded
      },
      background: theme === 'dark' ? '#1e293b' : '#ffffff',
      foreColor: theme === 'dark' ? '#cbd5e1' : '#1e293b'
    },
    xaxis: getXAxisConfig(),
    yaxis: {
      opposite: true,
      tooltip: {
        enabled: true
      },
      labels: {
        formatter: (value: number) => value.toFixed(digits)
      }
    },
    plotOptions: {
      candlestick: {
        wick: {
          useFillColor: false
        },
        colors: {
          upward: '#089981', // Couleur haussière
          downward: '#F23645' // Couleur baissière
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      theme: theme,
      x: {
        formatter: (value: number) => {
          const date = new Date(value)
          return date.toLocaleString('fr', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      }
    }
  }

  return (
    <div className="trading-chart-wrapper p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
      <div className="chart-controls flex justify-between items-center mb-4">
        <select 
          onChange={(e) => setTimeframe(e.target.value)} 
          value={timeframe}
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-300"
        >
          <option value="M1">1 Minute</option>
          <option value="H1">1 Heure</option>
          <option value="D1">1 Jour</option>
          <option value="W1">1 Semaine</option>
        </select>
        
        <button 
          onClick={() => setChartType(prev => prev === 'candlestick' ? 'line' : 'candlestick')}
          className="ml-4 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200"
        >
          {chartType === 'candlestick' ? 'Vue Ligne' : 'Vue Chandeliers'}
        </button>
      </div>
      
      <ReactApexChart
        options={options}
        series={series}
        type={chartType}
        height="100%"
      />
    </div>
  )
}

export default TradingChart
