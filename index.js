#!/usr/bin/env node

const fs = require('fs')
const dotenv = require('dotenv')
const request = require('request')
dotenv.config()
const { Input } = require('enquirer')
const units = 'metric'// Displayed in Celsius

const weatherDescription = (data) => data.weather[0].description
const humidity = (data) => data.main.humidity
const temperature = (data) => data.main.temp.toFixed(1)
const feelsLike = (data) => data.main.feels_like.toFixed(1)

function displayInCommon (data, time) {
  return `${time.padEnd(5, ' ')} 気温:${temperature(data).padEnd(4, ' ')} 体感温度:${feelsLike(data).padEnd(5, ' ')} 湿度:${humidity(data)}% 天気:${weatherDescription(data).padEnd(5, '　')}`
}

function fiveDayPerThreeHourForecast (location, key) {
  const URL = 'http://api.openweathermap.org/data/2.5/forecast?q=' + location + '&lang=ja&units=' + units + '&appid=' + key

  request(URL, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const forecastData = JSON.parse(body)
      forecastData.list.forEach(function (data) {
        const dateTime = new Date((data.dt) * 1000)
        const date = dateTime.toLocaleDateString().slice(5)
        const time = dateTime.toLocaleTimeString().slice(0, -3)
        const precipitationProbability = Math.floor(data.pop * 100)
        if (time === '0:00') {
          console.log('---------------------------------------------------------------------------------')
          console.log(date)
        }

        let dataToBeDisplayed = displayInCommon(data, time)
        dataToBeDisplayed += `降水確率:${precipitationProbability}% `
        if (data.rain) {
          dataToBeDisplayed += `降水量:${data.rain['3h']}mm`
        }
        if (data.snow) {
          dataToBeDisplayed += `降雪量:${data.snow['3h']}mm`
        }
        console.log(dataToBeDisplayed)
      })
    } else {
      console.log('error: ' + 'Not a valid city name')
    }
  })
}

function currentWeatherData (location, key) {
  const URLcurrent = 'http://api.openweathermap.org/data/2.5/weather?q=' + location + '&lang=ja&units=' + units + '&appid=' + key

  request(URLcurrent, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const currentData = JSON.parse(body)
      const dateTime = new Date((currentData.dt) * 1000)
      const date = dateTime.toLocaleDateString().slice(5)
      const time = dateTime.toLocaleTimeString().slice(0, -3).padEnd(5, ' ')
      let dataToBeDisplayed = displayInCommon(currentData, time)
      console.log(date)
      if (currentData.rain) {
        dataToBeDisplayed += `降水量:${currentData.rain['1h']}mm`
      }
      if (currentData.snow) {
        dataToBeDisplayed += `降雪量:${currentData.snow['1h']}mm`
      }
      console.log(dataToBeDisplayed)
    } else {
      console.log('error: ' + 'Not a valid city name')
    }
  })
}

function setkey () {
  const prompt = new Input({
    name: 'key',
    message: 'Plase enter your OPEN WEATHER MAP API KEY.'
  })
  return prompt.run()
    .then(answer => {
      fs.writeFileSync('.env', `OPEN_WEATHER_MAP_KEY = ${answer}`, { flag: 'a' })
      require('dotenv').config()
    })
}

function returnCity () {
  const prompt = new Input({
    message: 'Plase enter the city you want to know the weather',
    initial: 'Tokyo'
  })
  return prompt.run()
    .then(answer => answer)
}

function currentOrFiveDays () {
  const { Toggle } = require('enquirer')
  const prompt = new Toggle({
    message: 'Current or FiveDays?',
    enabled: 'Five_days',
    disabled: 'Current'
  })
  return prompt.run()
    .then(answer => answer)
}

async function main () {
  if (process.env.OPEN_WEATHER_MAP_KEY === undefined) {
    await setkey()
  }
  const key = process.env.OPEN_WEATHER_MAP_KEY
  const location = await returnCity()
  const fivedays = await currentOrFiveDays()
  if (fivedays) {
    fiveDayPerThreeHourForecast(location, key)
  } else {
    currentWeatherData(location, key)
  }
  console.log(location)
}

main()
