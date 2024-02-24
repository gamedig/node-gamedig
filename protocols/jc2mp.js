import gamespy3 from './gamespy3.js'

// supposedly, gamespy3 is the "official" query protocol for jcmp,
// but it's broken (requires useOnlySingleSplit), and may not include some player names
export default class jc2mp extends gamespy3 {
  constructor () {
    super()
    this.useOnlySingleSplit = true
    this.isJc2mp = true
    this.encoding = 'utf8'
  }

  async run (state) {
    await super.run(state)

    state.version = state.raw.version
  }
}
