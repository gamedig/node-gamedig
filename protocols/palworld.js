import Core from './core.js'

export default class palworld extends Core {
  async run (state) {
    const url = `http://${this.options.host}:${this.options.port}/v1/api/info`
    const headers = {
      Authorization: `Basic ${Buffer.from(`${this.options.username}:${this.options.password}`).toString('base64')}`,
      Accept: 'application/json'
    }

    const response = await this.request({ url, headers, method: 'GET' })

    console.log(response)
  }
}
