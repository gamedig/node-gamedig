import QueryRunner from './QueryRunner.js'

let singleton = null

export class GameDig {
  constructor (runnerOpts) {
    this.queryRunner = new QueryRunner(runnerOpts)
  }

  async query (userOptions) {
    return await this.queryRunner.run(userOptions)
  }

  static getInstance () {
    if (!singleton) { singleton = new GameDig() }

    return singleton
  }

  static async query (...args) {
    return await GameDig.getInstance().query(...args)
  }
}
