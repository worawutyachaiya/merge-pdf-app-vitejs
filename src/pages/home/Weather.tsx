import classnames from 'classnames'
import { useSettings } from '@core/hooks/useSettings'

// import '@/app/globals.css'
import { useState, useEffect } from 'react'
import './WeatherApp.css'

import humidityImg from '@/assets/images/weather/humidity.png'
import humidity_bImg from '@/assets/images/weather/humidity-b.png'

import windImg from '@/assets/images/weather/wind.png'
import wind_bImg from '@/assets/images/weather/wind-b.png'

import sunny from '@/assets/images/weather/clear.png'
import cloudy from '@/assets/images/weather/clouds.png'
import rainy from '@/assets/images/weather/rain.png'
import snowy from '@/assets/images/weather/snow.png'
import drizzle from '@/assets/images/weather/drizzle.png'
import mist from '@/assets/images/weather/mist.png'
import loadingGif from '@/assets/images/weather/loading.gif'

const WeatherApp = () => {
  // Hooks
  const { settings, updateSettings } = useSettings()
  const [data, setData] = useState({})
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  //const api_key = '0857bdfbf9822bcb5f4d0f481d5e160a'
  const api_key = 'f00c38e0279b7bc85480c3fe775d518c'
  useEffect(() => {
    const fetchDefaultWeather = async () => {
      setLoading(true)
      const defaultLocation = 'uthai'
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${defaultLocation}&units=Metric&appid=${api_key}`
      const res = await fetch(url)
      const defaultData = await res.json()
      setData(defaultData)
      setLoading(false)
    }

    fetchDefaultWeather()
  }, [])

  const handleInputChange = e => {
    setLocation(e.target.value)
  }

  const search = async () => {
    if (location.trim() !== '') {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=Metric&appid=${api_key}`
      const res = await fetch(url)
      const searchData = await res.json()
      if (searchData.cod !== 200) {
        setData({ notFound: true })
      } else {
        setData(searchData)
        setLocation('')
      }
      setLoading(false)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      search()
    }
  }

  const weatherImages = {
    Clear: sunny,
    Clouds: cloudy,
    Rain: rainy,
    Snow: snowy,
    Haze: cloudy,
    Mist: mist,
    Drizzle: drizzle
  }

  const weatherImage = data.weather ? weatherImages[data.weather[0].main] : null

  // const backgroundImages = {
  //   Clear:
  //     settings.mode === 'dark'
  //       ? 'linear-gradient(to top, var(--primary-color) , rgb(243, 176, 124))'
  //       : 'linear-gradient(to right, rgb(243, 176, 124) , var(--primary-color) )',
  //   Clouds:
  //     settings.mode === 'dark'
  //       ? 'linear-gradient(to top, var(--primary-color) , rgb(113, 238, 236))'
  //       : 'linear-gradient(to right, rgb(113, 238, 236) , var(--primary-color))',
  //   Drizzle:
  //     settings.mode === 'dark'
  //       ? 'linear-gradient(to top, var(--primary-color) , rgb(188, 201, 200))'
  //       : 'linear-gradient(to right, rgb(188, 201, 200) , var(--primary-color))',
  //   Rain:
  //     settings.mode === 'dark'
  //       ? 'linear-gradient(to top, var(--primary-color) , rgb(128, 234, 255))'
  //       : 'linear-gradient(to right, rgb(128, 234, 255)  , var(--primary-color) ) ',
  //   Snow:
  //     settings.mode === 'dark'
  //       ? 'linear-gradient(to top, var(--primary-color) , rgb(255, 255, 255))'
  //       : 'linear-gradient(to right, rgb(255, 255, 255) , var(--primary-color))',
  //   Haze:
  //     settings.mode === 'dark'
  //       ? 'linear-gradient(to top, var(--primary-color) , rgb(113, 238, 236))'
  //       : 'linear-gradient(to right, rgb(113, 238, 236) , var(--primary-color))',
  //   Mist:
  //     settings.mode === 'dark'
  //       ? 'linear-gradient(to top, var(--primary-color) , rgb(113, 238, 236))'
  //       : 'linear-gradient(to right, rgb(113, 238, 236) , var(--primary-color))'
  // }

  // const backgroundImages = {
  //   Clear: 'linear-gradient(to right, #f3b07c, #fcd283)',
  //   Clouds: 'linear-gradient(to right, #57d6d4, #71eeec)',
  //   Drizzle: 'linear-gradient(to right, #57d6d4, #d3fcfb)',
  //   Rain: 'linear-gradient(to right, #5bc8fb, #80eaff)',
  //   Snow: 'linear-gradient(to right, #aff2ff, #fff)',
  //   Haze: 'linear-gradient(to right, #57d6d4, #71eeec)',
  //   Mist: 'linear-gradient(to right, #57d6d4, #71eeec)'
  // }

  // const backgroundImage = data.weather
  //   ? backgroundImages[data.weather[0].main]
  //   : 'linear-gradient(to right, rgb(113,238,238,0.5), rgb(248, 248, 248))'
  const backgroundImage =
    settings.mode === 'dark'
      ? ' linear-gradient(120deg ,rgba(0, 0, 0, 0.2) ,var(--primary-color)  ) '
      : ' linear-gradient(120deg, var(--primary-color), rgba(255, 255, 255, 0.5)) '

  const currentDate = new Date()

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const dayOfWeek = daysOfWeek[currentDate.getDay()].toUpperCase()
  const month = months[currentDate.getMonth()].toUpperCase()
  const dayOfMonth = currentDate.getDate()

  const formattedDate = `${dayOfWeek}, ${dayOfMonth} ${month}`

  return (
    <div
      className='weather-app'
      style={{
        backgroundImage: backgroundImage
      }}
    >
      <div className='search'>
        <div className='search-top mt-[-20px]'>
          <i className='tabler-map-pin-filled'></i>
          <div className='location text-sm'>
            {data.name} , {data?.sys?.country}
          </div>
        </div>
        <div className={classnames(settings.mode === 'dark' ? 'dark search-bar' : 'search-bar')}>
          <input
            type='text'
            placeholder='Enter Location'
            value={location}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <i className='tabler-search' onClick={search}></i>
          {/* <i className='fa-solid fa-magnifying-glass' onClick={search}></i> */}
        </div>
      </div>
      {loading ? null : data.notFound ? (
        <div className='not-found'>DATA NOT FOUND!</div>
      ) : (
        <>
          <div className='weather w-[90%] mt-[-20px] ml-[50px]'>
            <img className='icon-temp' src={weatherImage} alt='sunny' />
            <div className='weather-data'>
              <div className='temp'>{data.main ? `${Math.floor(data.main.temp)}°` : null}</div>
            </div>
          </div>
          <div className='details'>
            <div className='row'>
              {settings.mode === 'dark' ? <img src={humidityImg} /> : <img src={humidity_bImg} />}

              <div>
                <p className='data-name'>{data.main ? data.main.humidity : null}%</p>
                <p className='data'>Humidity</p>
              </div>
            </div>
            <div className='row'>
              {settings.mode === 'dark' ? <img src={windImg} /> : <img src={wind_bImg} />}
              <div>
                <p className='data-name'>{data.wind ? data.wind.speed : null}km/h</p>
                <p className='data'>Wind speed</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default WeatherApp
