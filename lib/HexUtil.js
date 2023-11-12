/** @param {Buffer} buffer */
export const debugDump = (buffer) => {
  let hexLine = ''
  let chrLine = ''
  let out = ''
  out += 'Buffer length: ' + buffer.length + ' bytes\n'
  for (let i = 0; i < buffer.length; i++) {
    const sliced = buffer.slice(i, i + 1)
    hexLine += sliced.toString('hex') + ' '
    let chr = sliced.toString()
    if (chr < ' ' || chr > '~') chr = ' '
    chrLine += chr + '  '
    if (hexLine.length > 60 || i === buffer.length - 1) {
      out += hexLine + '\n'
      out += chrLine + '\n'
      hexLine = chrLine = ''
    }
  }
  return out
}
