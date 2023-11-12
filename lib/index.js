import QueryRunner from './QueryRunner.js'

let singleton = null

export default class Gamedig {
  constructor (runnerOpts) {
    this.queryRunner = new QueryRunner(runnerOpts)
  }

  async query (userOptions) {
    return await this.queryRunner.run(userOptions)
  }

  static getInstance () {
    if (!singleton) { singleton = new Gamedig() }

    return singleton
  }

  static async query (...args) {
    return await Gamedig.getInstance().query(...args)
  }
}
